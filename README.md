# QRPago

Plataforma de cobros para negocios argentinos. Generá links de pago y códigos QR conectados a MercadoPago, tanto de forma individual como masiva desde un Excel, o integrá tu propio sistema vía API REST.

---

## Características

- **Cobro individual** — ingresá nombre, monto y descripción del cliente y obtené un QR y link de pago listo para compartir por WhatsApp
- **Cobro masivo** — importá un Excel o CSV con tus clientes y generá cientos de links de pago de una sola vez
- **Pagados** — tabla automática con todos los pagos aprobados, incluyendo método de pago, ID de MercadoPago y fecha/hora exacta
- **Métricas** — estadísticas con gráfico de monto acumulado, ticket promedio y tasa de conversión, filtrables por rango de fechas
- **Categorías** — organizá tus cobros por categorías con colores personalizados
- **API REST externa** — integrá cualquier sistema externo con una API key para generar cobros y guardarlos automáticamente
- **Notificaciones en tiempo real** — toast y badge en la campanita cuando entra un pago aprobado (Supabase Realtime)
- **Exportación a Excel** — descargá el listado de métricas o pagados como `.xlsx`
- **Mobile-first** — diseño optimizado para celular con nav inferior y header superior

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 16, React 19, TypeScript 5.7 |
| Estilos | TailwindCSS 4, shadcn/ui |
| Base de datos y auth | Supabase (PostgreSQL + RLS + Realtime) |
| Pagos | MercadoPago API |
| Deploy | Vercel |

---

## Requisitos previos

- Node.js 20+
- pnpm
- Cuenta en [Supabase](https://supabase.com)
- Cuenta en [MercadoPago Developers](https://www.mercadopago.com.ar/developers)
- Cuenta en [Vercel](https://vercel.com) (para el webhook)

---

## Instalación local

```bash
git clone https://github.com/jositux/qrmp.git
cd qrmp
pnpm install
cp .env.example .env.local
# completar los valores — ver sección Variables de entorno
pnpm dev
```

Abrí [http://localhost:3000](http://localhost:3000) en el navegador.

---

## Variables de entorno

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...        # requerido para webhook y API externa
MERCADOPAGO_ACCESS_TOKEN=TEST-xxxx
NEXT_PUBLIC_APP_URL=https://tu-proyecto.vercel.app   # usado para la notification_url de MP
```

| Variable | Dónde encontrarla |
|----------|------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role (mantener privado) |
| `MERCADOPAGO_ACCESS_TOKEN` | MP Developers → Tu aplicación → Credenciales → Access Token |
| `NEXT_PUBLIC_APP_URL` | URL pública de tu deploy (sin barra final) |

---

## Base de datos (Supabase)

Ejecutá los scripts SQL en orden desde Supabase Dashboard → SQL Editor:

```
scripts/001_create_payments_table.sql      → tabla payments con RLS
scripts/002_add_payment_status_fields.sql  → columnas para webhook de MP
scripts/003_create_api_keys_table.sql      → tabla api_keys para integraciones externas
```

Todas las tablas usan Row Level Security (RLS): cada usuario solo accede a sus propios datos.

---

## Flujo de un cobro

```
[Dashboard / API externa]
        ↓
POST /api/create-payment  (UI interna)
POST /api/v1/payments     (API externa con Bearer token)
        ↓
MercadoPago devuelve preference_id + payment_url
        ↓
App genera QR y guarda el cobro en Supabase (status=pending)
        ↓
Usuario comparte QR o link por WhatsApp
        ↓
Cliente paga desde su teléfono
        ↓
MercadoPago → POST /api/webhooks/mercadopago
        ↓
App actualiza: status=approved, paid_at, mp_payment_id, payment_method
        ↓
Supabase Realtime → toast + badge en campanita
        ↓
Pago visible en /panel/pagos-recibidos
```

---

## API REST externa

Permite integrar cualquier sistema (ERP, e-commerce, app propia) para generar cobros.

### 1. Obtener una API key

En el panel, andá a **Integraciones** → **Generar clave**. La clave completa se muestra **una sola vez** — guardala. Solo se almacena el hash SHA-256 en la base de datos.

### 2. Crear un cobro

```bash
curl -X POST https://tu-proyecto.vercel.app/api/v1/payments \
  -H "Authorization: Bearer qrp_xxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1500,
    "nombre": "Juan Perez",
    "telefono": "+5491112345678",
    "descripcion": "Envio #12345",
    "external_reference": "orden-abc123"
  }'
```

**Campos:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `amount` | number | ✅ | Monto en ARS (máx. 99.999.999) |
| `nombre` | string | ✅ | Nombre del cliente (máx. 30 chars) |
| `telefono` | string | — | WhatsApp del cliente (máx. 20 chars) |
| `descripcion` | string | — | Descripción del cobro (máx. 100 chars) |
| `category_id` | string (UUID) | — | ID de categoría existente |
| `external_reference` | string | — | Tu referencia interna (máx. 100 chars) |

**Respuesta:**

```json
{
  "success": true,
  "id": "uuid-del-cobro-en-supabase",
  "payment_url": "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=...",
  "sandbox_payment_url": "https://sandbox.mercadopago.com.ar/...",
  "qr_code_url": "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=...",
  "preference_id": "...",
  "external_reference": "orden-abc123"
}
```

El cobro queda guardado en tu base de datos con `status=pending`. Cuando el cliente pague, el webhook lo actualiza a `approved` y aparece en el panel de Pagados.

**Rate limit:** 100 solicitudes por minuto por API key.

---

## Webhook de MercadoPago

### Configurar en producción

1. Desplegá el proyecto en Vercel
2. En [MP Developers](https://www.mercadopago.com.ar/developers/panel) → tu app → **Webhooks**
3. URL: `https://tu-proyecto.vercel.app/api/webhooks/mercadopago`
4. Evento: **Pagos** (`payment`)

---

## Pruebas en modo sandbox

> En sandbox no podés pagar con la misma cuenta que genera el cobro — MP lo bloquea.

Necesitás dos cuentas de prueba separadas (vendedor y comprador):

```bash
# Ejecutar dos veces con tu Access Token REAL (de producción)
curl -X POST "https://api.mercadopago.com/users/test" \
  -H "Authorization: Bearer TU_ACCESS_TOKEN_REAL" \
  -H "Content-Type: application/json" \
  -d '{"site_id": "MLA"}'
```

| Rol | Cuenta |
|-----|--------|
| Genera el cobro (la app) | Usuario test **vendedor** — su token va en `.env.local` |
| Paga el cobro | Usuario test **comprador** — para iniciar sesión en el checkout |

**Tarjetas de prueba** (estando logueado como comprador):

| Tarjeta | Número | CVV | Vencimiento | Resultado |
|---------|--------|-----|-------------|-----------|
| Mastercard | `5031 7557 3453 0604` | `123` | `11/25` | Aprobado |
| Visa | `4509 9535 6623 3704` | `123` | `11/25` | Aprobado |

---

## Scripts disponibles

```bash
pnpm dev          # Servidor de desarrollo en localhost:3000
pnpm build        # Build de producción
pnpm start        # Servidor de producción
pnpm test         # Tests con Vitest (watch)
pnpm test:run     # Tests una sola vez
pnpm lint         # ESLint
```

---

## Licencia

GNU GPL v3 — ver [LICENSE](./LICENSE)
