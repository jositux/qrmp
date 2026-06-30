# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (Next.js with Turbopack) on :3000
npm run build     # Production build
npm run lint      # ESLint
npm run test      # Vitest watch mode
npm run test:run  # Vitest single run
```

> The dev server must be running for previews. The project uses `.claude/launch.json` configured for `npm run dev` on port 3000.

## Architecture

**QRPago** — MercadoPago QR/payment-link generator built with Next.js 15 App Router + Supabase.

### Auth & routing

- `middleware.ts`: all `/api/*` routes are public; everything else under `/panel/*` requires a Supabase session (cookie-based). Unauthenticated users are redirected to `/auth/login`.
- `lib/supabase/client.ts` — browser client, `lib/supabase/server.ts` — server/RSC client, `lib/supabase/admin.ts` — service-role client that bypasses RLS (used only in webhook and external API).

### Database (Supabase + RLS)

Key tables: `payments`, `categories`, `api_keys`. All have RLS policies — users only see their own rows.

- Migrations in `scripts/` (run manually via Supabase SQL editor).
- `payments` columns: `id`, `user_id`, `nombre`, `telefono`, `monto`, `descripcion`, `payment_url`, `preference_id`, `external_reference`, `category_id`, `status` (default `pending`), `mp_payment_id`, `paid_at`, `payment_method`.
- `api_keys` columns: `id`, `user_id`, `name`, `key_prefix`, `key_hash` (sha256, unique), `last_used_at`, `revoked`, `created_at`.

### Payment flow

**Internal (dashboard UI):**
1. `PaymentForm` or `BulkPaymentForm` → `POST /api/create-payment` (no auth, creates MP preference only)
2. On success → `POST /api/save-payment` (requires session cookie, inserts row into `payments`)

**External (REST API):**
- `POST /api/v1/payments` — single call, authenticated via `Authorization: Bearer <api_key>`.  
  Validates with Zod, resolves `user_id` from `api_keys` table (admin client), creates MP preference, inserts into `payments`, enforces 100 req/min rate limit.

**Webhook:** `POST /api/webhooks/mercadopago` — called by MercadoPago on payment approval, uses admin client to update `payments.status = 'approved'`. Matches by `external_reference` then `preference_id`.

### API key lifecycle

- Keys generated server-side in `lib/api-keys.ts` (crypto `randomBytes` + sha256 hash).
- `POST /api/keys` — session-auth, generates key, stores hash+prefix, returns raw key **once**.
- `DELETE /api/keys?id=` — revokes (soft delete via `revoked = true`).
- Raw key never stored — only sha256 hash in DB. After page refresh only prefix is shown.

### Layout & navigation

- Desktop: `components/app-sidebar.tsx` — fixed left sidebar with nav links.
- Mobile: `components/mobile-header.tsx` (fixed top bar, logo + logout) + `components/mobile-nav.tsx` (fixed bottom bar).
- Panel layout: `app/panel/layout.tsx` — wraps content with `pt-14 pb-16 md:pt-0 md:pb-0 md:pl-64` to accommodate both mobile and desktop chrome.
- Nav labels: **Métricas** (`/panel`), **Cobrar** (`/panel/cobros`), **Pagados** (`/panel/pagos-recibidos`), **Configuración**, **Integraciones**.

### Real-time notifications

`hooks/use-payment-notifications.ts` — subscribes to Supabase Realtime on the `payments` table, listens for `UPDATE` events where `status` changes to `approved`, fires a Sonner toast and increments `localStorage` badge counter. `MobileNav` and `NotificationBell` consume `usePaymentNotifications()`.

### Bulk payment generation

`BulkPaymentForm` (Excel/CSV upload) uses `GenerationContext` (`contexts/generation-context.tsx`) to expose `isGenerating` state. Both the mobile nav and cobros tab switcher check `isGenerating` before navigating away, showing a confirmation dialog if a bulk run is in progress.

### Category selector

`CategorySelector` uses a Popover + Command (cmdk) list. Creating a new category opens a `Dialog` with name input + color picker. On mobile, footer buttons are hidden and a ✓ icon button is inlined next to the input to avoid keyboard obstruction.

### Excel export

Both `PaymentsDashboard` and `PagosRecibidosPage` export via `xlsx` (SheetJS). Helper `exportToExcel()` defined locally in each component — not shared.

### Theming

`next-themes` with `defaultTheme="light"`. Theme toggle in desktop sidebar footer. `ThemeProvider` is in `app/layout.tsx`.

## Environment variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=       # required for webhook + external API
MERCADOPAGO_ACCESS_TOKEN=
NEXT_PUBLIC_APP_URL=             # used for MP notification_url in preferences
```

## Key conventions

- **Search debounce**: `payments-dashboard.tsx` uses `debouncedSearch` state + 200ms `useEffect` + `opacity` transition on the list container for smooth filtering.
- **Copy button pattern**: `CopyButton` component with `useState(copied)` + `setTimeout` 2s reset + Check icon swap + Tooltip "Copiado".
- **Mobile-first**: Tailwind `sm:` breakpoint (640px) for responsive adjustments; `md:` (768px) for desktop layout switches.
- **No `autoFocus` on mobile**: `payment-form.tsx` uses `useEffect` + `matchMedia("(min-width: 768px)")` to focus the name input only on desktop.
- **Category uniqueness**: enforced client-side (case-insensitive) before API call in both `CategorySelector` and `configuracion/page.tsx`.
