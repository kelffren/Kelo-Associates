# WA_WATCHES_01 — contrato de integración

Estado actual: **frontend preparado, backend real pendiente**.

## Objetivo

Conectar el primer número real del negocio de Relojes al ecosistema Kelo Associates sin exponer secretos en GitHub Pages.

Flujo objetivo:

```text
WhatsApp Business Platform
        ↓ webhook
POST /webhooks/whatsapp
        ↓
resolve channel by phone_number_id
        ↓
WA_WATCHES_01
        ↓
resolve/create customer
        ↓
conversation + message
        ↓
AI analysis / heat / next action
        ↓
Kelo Inbox / Operator
```

Salida:

```text
Kelo / AI / human
        ↓
POST /api/whatsapp/send
        ↓
backend reads secret token
        ↓
WhatsApp Business Platform
        ↓
customer
```

## Canal piloto

```json
{
  "id": "WA_WATCHES_01",
  "business": "watches",
  "name": "Watches Main",
  "type": "whatsapp",
  "status": "not_connected",
  "phoneNumber": "",
  "phoneNumberId": "",
  "whatsappBusinessAccountId": "",
  "aiEnabled": true,
  "humanTakeover": false
}
```

## GET /webhooks/whatsapp

Debe implementar la verificación inicial del webhook del proveedor. El verify token vive exclusivamente en variables de entorno del backend.

## POST /webhooks/whatsapp

Responsabilidades obligatorias:

1. validar autenticidad/firma según el proveedor;
2. extraer `phone_number_id` receptor;
3. resolver `channel_id`;
4. normalizar teléfono del cliente;
5. resolver o crear `customer_id` propio de Kelo;
6. resolver o crear `conversation_id`;
7. persistir el mensaje antes de ejecutar IA;
8. hacer el procesamiento idempotente usando el ID externo del mensaje;
9. publicar el evento interno `MESSAGE_RECEIVED`;
10. devolver 2xx rápidamente; el análisis pesado debe ejecutarse fuera del ACK del webhook.

Evento interno normalizado:

```json
{
  "event": "MESSAGE_RECEIVED",
  "channelId": "WA_WATCHES_01",
  "business": "watches",
  "customerExternalId": "+1...",
  "externalMessageId": "provider_message_id",
  "messageType": "text|audio|image|video|document",
  "text": "...",
  "media": null,
  "receivedAt": "ISO-8601"
}
```

## POST /api/whatsapp/send

Entrada mínima:

```json
{
  "channelId": "WA_WATCHES_01",
  "customerId": "CUS_...",
  "conversationId": "CONV_...",
  "message": {
    "type": "text",
    "text": "..."
  },
  "actor": "ai|human"
}
```

El backend resuelve el número emisor y el token secreto. Nunca acepta un access token enviado por el navegador.

## Estados

`not_connected` → `metadata_ready` → `webhook_verified` → `connected` → `degraded`

La UI no debe mostrar `connected` hasta que exista una prueba real de entrada y salida por el backend.

## Prueba de aceptación del piloto

Desde otro teléfono:

> ¿Tienes Daytona negro?

Debe ocurrir:

1. mensaje real entra por WhatsApp;
2. webhook lo persiste;
3. Kelo reconoce o crea cliente;
4. conversación aparece asociada a `WA_WATCHES_01`;
5. análisis genera producto/intención/heat;
6. IA puede responder por el mismo canal;
7. humano puede hacer TAKE OVER;
8. respuesta humana sale por el mismo número.

Hasta completar esos 8 pasos, el canal se considera **PREPARED**, no conectado.
