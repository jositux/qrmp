# QRPago

Plataforma de cobros para negocios argentinos. Generá links de pago y códigos QR conectados a MercadoPago, tanto de forma individual como masiva desde un Excel.

---

## Características

- **Cobro individual** — ingresá nombre, monto y descripción del cliente y obtené un QR y link de pago listo para compartir por WhatsApp
- **Cobro masivo** — importá un Excel o CSV con tus clientes y generá cientos de links de pago de una sola vez
- **Pagos recibidos** — tabla automática con todos los pagos aprobados, incluyendo método de pago y fecha/hora exacta
- **Dashboard** — estadísticas y gráfico de monto acumulado filtrable por rango de fechas
- **Categorías** — organizá tus cobros por categorías con colores personalizados
- **Dark mode** — soporte completo para modo oscuro

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 16, React 19, TypeScript 5.7 |
| Estilos | TailwindCSS 4, shadcn/ui |
| Base de datos y auth | Supabase (PostgreSQL) |
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
# Clonar el repositorio
git clone https://github.com/jositux/qrmp.git
cd qrmp

# Instalar dependencias
pnpm install

# Copiar variables de entorno
cp .env.example .env.local
# (completar los valores — ver sección Variables de entorno)

# Iniciar el servidor de desarrollo
pnpm dev
```

Abrí [http://localhost:3000](http://localhost:3000) en el navegador.

---

## Variables de entorno

Creá un archivo `.env.local` en la raíz del proyecto con los siguientes valores:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=TEST-xxxx
```

### Dónde obtener cada valor

| Variable | Dónde encontrarla |
|----------|------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role (mantener privado) |
| `MERCADOPAGO_ACCESS_TOKEN` | MP Developers → Tu aplicación → Credenciales → Access Token |

---

## Base de datos (Supabase)

Ejecutá los scripts SQL en orden desde Supabase Dashboard → SQL Editor:

```
scripts/001_create_payments_table.sql   → crea la tabla payments con RLS
scripts/002_add_payment_status_fields.sql → agrega columnas para webhook MP
```

La tabla `payments` usa Row Level Security (RLS): cada usuario solo puede ver y modificar sus propios registros.

---

## Webhook de MercadoPago

El webhook recibe notificaciones automáticas de MP cuando un cliente completa un pago. Actualiza el estado del cobro a `approved` y guarda el método de pago y la fecha/hora exacta.

### Configurar el webhook en producción

1. Desplegá el proyecto en Vercel
2. En el [panel de MercadoPago Developers](https://www.mercadopago.com.ar/developers/panel), ingresá a tu aplicación
3. Andá a **Webhooks** → **Configurar notificaciones**
4. Agregá la URL: `https://tu-proyecto.vercel.app/api/webhooks/mercadopago`
5. Seleccioná el evento: **Pagos** (`payment`)
6. Guardá

Una vez configurado, cada vez que alguien pague, el estado en tu dashboard se actualizará automáticamente.

---

## Pruebas en modo sandbox (MercadoPago)

> **Importante:** en modo sandbox de MercadoPago no podés pagar con la misma cuenta que genera el cobro. MP no lo permite y muestra el error:
> _"Una de las partes con la que intentás hacer el pago es de prueba."_

### Por qué pasa esto

MercadoPago sandbox requiere simular que el vendedor y el comprador son dos personas distintas. Por eso necesitás **dos cuentas de prueba separadas**.

### Solución paso a paso

**Paso 1 — Crear dos usuarios de prueba**

Ejecutá el siguiente comando **dos veces** (primero para el vendedor, luego para el comprador). Usá tu Access Token real (de producción, no el TEST):

```bash
curl -X POST \
  "https://api.mercadopago.com/users/test" \
  -H "Authorization: Bearer TU_ACCESS_TOKEN_REAL" \
  -H "Content-Type: application/json" \
  -d '{"site_id": "MLA"}'
```

Guardá el `email`, `password` y `access_token` de cada respuesta.

**Paso 2 — Configurar el vendedor en tu app**

En `.env.local`, usá el `access_token` del **usuario test vendedor**:

```env
MERCADOPAGO_ACCESS_TOKEN=TEST-xxxx-del-vendedor
```

**Paso 3 — Pagar como comprador**

Cuando abras el link de pago generado por la app:
- No uses tu cuenta real de MP
- No uses la cuenta del vendedor test
- Iniciá sesión con el **email y password del usuario test comprador**

**Resumen de cuentas para sandbox:**

| Rol | Cuenta a usar |
|-----|--------------|
| Genera el cobro (la app) | Usuario test **vendedor** — su token va en `.env.local` |
| Paga el cobro | Usuario test **comprador** — para iniciar sesión en el checkout |

### Tarjetas de prueba

Dentro del checkout sandbox podés usar estas tarjetas:

| Tarjeta | Número | CVV | Vencimiento | Resultado |
|---------|--------|-----|-------------|-----------|
| Mastercard | `5031 7557 3453 0604` | `123` | `11/25` | Aprobado |
| Visa | `4509 9535 6623 3704` | `123` | `11/25` | Aprobado |
| Mastercard | `5031 7557 3453 0604` | `123` | `11/25` | Rechazado (usar nombre `OTHE`) |

> Las tarjetas de prueba solo funcionan estando logueado con el usuario test comprador.

### Esto solo pasa en sandbox

En **producción** con cuentas reales no existe ninguna de estas restricciones. Cualquier persona con su cuenta de MercadoPago puede pagar normalmente.

---

## Estructura del proyecto

```
qrmp/
├── app/
│   ├── api/
│   │   ├── categories/         → CRUD de categorías
│   │   ├── create-payment/     → Crea preferencia en MercadoPago y QR
│   │   ├── payments/
│   │   │   ├── route.ts        → CRUD de cobros generados
│   │   │   ├── received/       → Lista pagos aprobados (status=approved)
│   │   │   └── stats/          → Estadísticas para el dashboard
│   │   ├── save-payment/       → Guarda un cobro en Supabase
│   │   └── webhooks/
│   │       └── mercadopago/    → Recibe notificaciones de pago de MP
│   ├── auth/                   → Login, registro, callback
│   └── panel/
│       ├── page.tsx            → Dashboard con gráfico y estadísticas
│       ├── cobros/             → Generador de cobros (individual y masivo)
│       ├── pagos-recibidos/    → Tabla de pagos aprobados
│       ├── configuracion/      → Cuenta, contraseña, notificaciones
│       └── integraciones/      → API keys y documentación
├── components/
│   ├── ui/                     → Componentes shadcn/ui
│   ├── app-sidebar.tsx         → Navegación lateral
│   ├── payment-form.tsx        → Formulario de cobro individual
│   ├── bulk-payment-form.tsx   → Importación masiva desde Excel
│   └── payments-dashboard.tsx  → Componente principal del dashboard
├── lib/
│   ├── supabase/               → Clientes de Supabase (server y client)
│   ├── format.ts               → Formateo de moneda y fechas (es-AR)
│   └── utils.ts                → Utilidades de Tailwind
└── scripts/
    ├── 001_create_payments_table.sql
    └── 002_add_payment_status_fields.sql
```

---

## Flujo de un cobro

```
1. Usuario crea cobro (nombre, monto, descripción)
         ↓
2. App llama a /api/create-payment
         ↓
3. MercadoPago devuelve preference_id + payment_url
         ↓
4. App genera QR desde el payment_url
         ↓
5. Usuario comparte QR o link por WhatsApp
         ↓
6. Cliente paga desde su teléfono
         ↓
7. MercadoPago envía webhook a /api/webhooks/mercadopago
         ↓
8. App actualiza el cobro: status=approved, paid_at, payment_method
         ↓
9. Pago aparece en /panel/pagos-recibidos
```

---

## Scripts disponibles

```bash
pnpm dev          # Servidor de desarrollo en localhost:3000
pnpm build        # Build de producción
pnpm start        # Servidor de producción
pnpm test         # Tests con Vitest
pnpm lint         # ESLint
```

---

## Licencia

GNU GPL v3 — ver [LICENSE](./LICENSE)
