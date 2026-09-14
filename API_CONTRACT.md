# Kelo Associates — Contrato de Backend e Integraciones

Este documento define la frontera entre el frontend Vanilla y los servicios reales. La V0.1 funciona offline/local; ninguna credencial externa debe llegar al navegador.

## Principio

```text
Browser/PWA -> Kelo REST API -> PostgreSQL/Supabase
                         \-> WhatsApp Business Platform
                         \-> SMS provider
                         \-> Email provider
```

El frontend nunca debe recibir tokens permanentes de Meta, claves privadas de proveedores, service-role keys ni secretos equivalentes.

## REST mínimo

### Clientes
- `GET /api/clients?q=&owner=&status=`
- `POST /api/clients`
- `GET /api/clients/:id`
- `PATCH /api/clients/:id`
- `GET /api/clients/:id/timeline`

### Conversaciones
- `GET /api/conversations?channel=&status=`
- `GET /api/conversations/:id/messages`
- `POST /api/conversations/:id/messages`
- `POST /api/conversations/:id/read`

### Citas
- `GET /api/appointments?from=&to=&status=`
- `POST /api/appointments`
- `PATCH /api/appointments/:id`
- `POST /api/appointments/:id/result`
- `PATCH /api/appointments/:id/items/:itemId`

### Tareas / recordatorios
- `GET /api/tasks?status=&due_before=`
- `POST /api/tasks`
- `PATCH /api/tasks/:id`
- `GET /api/reminder-rules`
- `PUT /api/reminder-rules/:key`

### Asignaciones
- `POST /api/assignments`
- `GET /api/agents`

### Oportunidades / ventas
- `GET /api/opportunities`
- `PATCH /api/opportunities/:id`
- `POST /api/sales`
- `GET /api/metrics/summary`

## WhatsApp

### Entrada

Meta webhook -> endpoint servidor `POST /webhooks/whatsapp`.

Responsabilidades del servidor:
1. validar firma/verificación de webhook;
2. identificar `phone_number_id` y mapearlo a `channels`;
3. normalizar teléfono/identidad;
4. buscar o crear cliente;
5. buscar o crear conversación;
6. insertar mensaje idempotentemente por `external_id`;
7. actualizar unread + last_message_at;
8. emitir evento realtime al frontend si existe conexión activa.

### Salida

Frontend -> `POST /api/conversations/:id/messages` -> backend -> WhatsApp Business Platform.

El backend valida:
- canal conectado;
- consentimiento/políticas aplicables;
- ventana de conversación cuando corresponda;
- template requerido cuando corresponda;
- rate limits y errores.

Los estados `sent`, `delivered`, `read`, `failed` recibidos por webhook actualizan `messages.status`.

## Automatización controlada

La primera versión de automatización debe ser explícita y auditable.

Ejemplo:

`POST /api/automation/run`

```json
{
  "client_id":"uuid",
  "action":"assignment_notify",
  "channels":["sms","email","whatsapp"],
  "dry_run":false
}
```

El servidor crea un evento de auditoría por cada intento y resultado. Una acción no debe marcarse exitosa si el proveedor falló.

## Grabación / conversaciones

Cualquier grabación de llamadas o captura de conversaciones debe cumplir consentimiento y regulación aplicable. El sistema debe guardar metadatos de origen, participantes, timestamps y políticas de retención. La arquitectura no debe asumir que todo puede grabarse automáticamente.

## Realtime

La UI debe seguir funcionando sin realtime. Cuando se incorpore, eventos sugeridos:

- `message.created`
- `message.status_changed`
- `conversation.updated`
- `appointment.created`
- `appointment.updated`
- `task.updated`
- `assignment.created`
- `sale.created`

## Migración desde V0.1

La UI actual trabaja con estructuras equivalentes a las tablas del esquema. La migración correcta es sustituir el adaptador local por llamadas REST, no reescribir las pantallas.
