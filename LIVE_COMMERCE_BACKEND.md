# Kelo Associates — Live Commerce Backend V1

## Qué deja listo

El frontend sigue funcionando local-first, pero puede conectarse a un backend central seguro para compartir CRM, inventario y pedidos entre dispositivos.

Flujo LIVE:

```text
Kelo Associates / Kelo Voice
  → Central Backend
  → PostgreSQL state + inventory + orders
  → reserva de stock atómica
  → Stripe Checkout
  → SMS / WhatsApp vía Twilio
  → webhooks de pago y mensajes
```

## Archivos

- `backend-client.js`: cliente HTTP; no contiene secretos.
- `remote-sync.js`: sincronización local-first con revisión y merge de conflictos.
- `supabase/migrations/20260917064000_live_commerce.sql`: esquema, RLS y reserva atómica.
- `supabase/functions/kelo-api/index.ts`: API autenticada para estado, inventario, mensajes y pagos.
- `supabase/functions/stripe-webhook/index.ts`: confirma pagos con firma Stripe.
- `supabase/functions/twilio-webhook/index.ts`: recibe SMS/WhatsApp verificando `X-Twilio-Signature`.

## Seguridad

- Las tablas tienen RLS activado y no tienen políticas públicas.
- Las claves privadas sólo viven como secrets del backend.
- El navegador nunca recibe `STRIPE_SECRET_KEY`, `TWILIO_AUTH_TOKEN` ni clave secreta de Supabase.
- `KELO_ADMIN_TOKEN` se introduce en la UI y se guarda sólo en `sessionStorage`.
- El webhook de Stripe valida `Stripe-Signature`.
- El webhook de Twilio valida `X-Twilio-Signature` contra la URL pública exacta.

## Secrets esperados

### `kelo-api`
- `KELO_ADMIN_TOKEN`
- `APP_BASE_URL`
- `STRIPE_SECRET_KEY` (para pagos)
- `TWILIO_ACCOUNT_SID` (para SMS/WhatsApp)
- `TWILIO_AUTH_TOKEN`
- `TWILIO_SMS_FROM`
- `TWILIO_WHATSAPP_FROM`

### `stripe-webhook`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

### `twilio-webhook`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_WEBHOOK_URL` — URL exacta configurada en Twilio
- `KELO_DEFAULT_WORKSPACE` (opcional, default `default`)

## Activación

1. Crear proyecto Supabase.
2. Aplicar migration.
3. Desplegar las tres Edge Functions.
4. Crear un `KELO_ADMIN_TOKEN` largo y aleatorio.
5. Configurar Stripe/Twilio secrets sólo en backend.
6. En Kelo Associates → Más → Central Backend: introducir endpoint, workspace y admin token.
7. Cargar inventario central real por SKU/variante.
8. Probar primero con Stripe test mode y Twilio Sandbox/test credentials.

## Comportamiento del Sales Engine

- Si no hay backend: sigue en DEMO y nunca envía/cobra realmente.
- Si hay backend pero el SKU no está trackeado: bloquea el cobro.
- Si el stock central es insuficiente: bloquea el cobro.
- Si la reserva atómica funciona: genera Stripe Checkout.
- Si se eligió SMS/WhatsApp y Twilio está configurado: envía el link real.
- El webhook de Stripe cambia la orden a `paid` sólo tras evento verificado.

## Estado actual

Código de producción preparado. Para quedar LIVE falta aprovisionar el proyecto Supabase y añadir credenciales reales de Stripe/Twilio. No se deben subir secrets al repositorio.
