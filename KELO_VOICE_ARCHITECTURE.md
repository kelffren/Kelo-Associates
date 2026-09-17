# Kelo Voice V1

## Objetivo
Convertir llamadas en eventos accionables del CRM sin exponer secretos en GitHub Pages.

## Lo que ya corre en esta rama
- `voice.html`: dashboard mobile-first.
- `voice.js`: UI + simulación end-to-end.
- `voice-core.js`: estado, scoring, Tool Router, citas, follow-ups y auditoría.
- `tests/voice-smoke.js`: prueba del camino HOT → cita → SMS stub.
- `integrations.js`: entrada visible desde **Más → Kelo Voice**.
- `service-worker.js`: Kelo Voice incluido en el shell PWA.

La simulación escribe en el mismo `localStorage` (`kelo-associates-v2`) que el CRM, por lo que los clientes, citas, tareas, oportunidades y timeline creados por Kelo Voice aparecen en Kelo Associates.

## Regla de seguridad
GitHub Pages nunca recibe `TWILIO_AUTH_TOKEN`, API keys, claves de pago ni secretos equivalentes. Cualquier acción externa permanece como `backend-required` hasta existir un gateway seguro.

## Arquitectura de producción

```text
PSTN / phone
  ↓
Telephony provider
  ↓  bidirectional secure WebSocket
Voice Gateway (backend)
  ↓
Realtime voice model
  ↓ function/tool calls
Kelo Tool Router
  ├─ get_or_create_customer
  ├─ qualify_lead
  ├─ get_calendar_availability
  ├─ create_appointment
  ├─ create_task
  ├─ send_sms
  └─ transfer_to_human
  ↓
Kelo Associates persistent backend
```

## Contratos mínimos del gateway

### `POST /voice/incoming`
Recibe el webhook del proveedor de telefonía, valida autenticidad y responde con la instrucción para abrir el stream de audio bidireccional.

### `WS /voice/media`
Puente de audio entre telefonía y el modelo Realtime. Debe soportar interrupciones/barge-in y nunca ejecutar herramientas fuera de la allowlist.

### `POST /voice/tool`
Sólo backend-to-backend. Ejecuta una herramienta aprobada contra el CRM persistente. Cada ejecución crea un audit event.

### `POST /voice/status`
Recibe estado final de llamada y guarda duración, outcome, transcript/resumen permitido y métricas.

## Reglas V1
1. El modelo no inventa precio, inventario, citas ni disponibilidad: usa tools.
2. Preguntas legales, cliente molesto, baja confianza, precio excepcional o petición explícita → `transfer_to_human`.
3. SMS y pagos reales sólo salen desde backend.
4. Toda acción del agente deja `callId`, timestamp, tool y resultado.
5. Inglés/español son capacidades del mismo agente, no dos pipelines.
6. El frontend puede probar flujos sin teléfono real mediante el Test Harness.

## Orden de activación real
1. Persistencia backend para CRM.
2. Telephony adapter.
3. Realtime voice gateway.
4. SMS adapter.
5. Human takeover.
6. Payment links.
7. Outbound calling y lead reactivation.

## Estado
`V1 demo-safe`: funcional para probar la lógica de negocio y el UX; conexiones externas deliberadamente bloqueadas hasta backend seguro.
