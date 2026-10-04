# Kelo Inbox — Arquitectura canónica de cuentas, canales e identidad

> ESTADO: especificación fundacional. Todo agente debe leer este documento antes de cambiar Kelo Inbox, canales, Meta Hub, clientes o conversaciones.

## 1. Problema real
El negocio puede operar varias cuentas/canales al mismo tiempo. Una cuenta puede dejar de usarse, perder autorización o ser reemplazada. Kelo Inbox NO puede depender de una sola cuenta externa ni perder clientes, notas, citas, historial o métricas cuando cambia una conexión.

## 2. Principio central
**El cliente y su historial pertenecen a Kelo Associates; las cuentas externas son conectores reemplazables.**

Jerarquía conceptual:

```text
Kelo Associates
  └─ Business / vertical
      └─ Provider connection (autorización)
          └─ Channel/account (Page, IG, WhatsApp, etc.)
              └─ Conversation
                  └─ Messages

Client / Contact Identity
  └─ puede vincular muchas conversaciones y muchos canales
```

Nunca usar el ID externo de Facebook/Instagram/WhatsApp como ID primario del cliente.

## 3. Modelo
### ProviderConnection
Representa una autorización oficial a un proveedor.
- id interno UUID
- provider: meta | whatsapp | instagram | email | web | other
- displayName
- externalOwnerId opcional
- status: connected | degraded | disconnected | revoked | needs_reauth
- capabilities[]
- connectedAt / lastSyncAt
- metadata segura sin secretos

Tokens y secretos viven solo en backend/vault.

### Channel
Un origen/destino concreto de conversaciones.
- id interno estable
- connectionId
- provider
- type: facebook_page | instagram_business | whatsapp_number | messenger | email | web_form | marketplace_reference | other
- externalChannelId
- business/vertical
- displayName
- status
- capabilities[]
- archivedAt opcional

### Conversation
- id interno estable
- channelId
- externalThreadId
- clientId opcional hasta resolver identidad
- status
- lastMessageAt
- unreadCount

### Client
Identidad global Kelo. Sobrevive a conexiones.
- id interno
- nombre
- teléfonos[]
- emails[]
- externalIdentities[]
- tags
- notes
- appointments
- opportunities
- sales
- timeline

### ExternalIdentity
Vínculo entre un Client y una identidad externa:
- provider
- externalUserId
- channelId opcional
- normalizedPhone/email cuando exista
- confidence
- verifiedAt

## 4. Reemplazar una cuenta
Flujo obligatorio:
1. La cuenta A se marca disconnected/archived; NO se borran sus conversaciones.
2. Se conecta B mediante flujo oficial.
3. Se descubren capacidades y canales de B.
4. Nuevos mensajes entran por B.
5. Identity Resolution intenta asociarlos a clientes existentes.
6. Historial de A permanece visible como histórico.
7. Métricas conservan attribution por canal original.

Nunca migrar falsamente externalThreadId de A a B.

## 5. Duplicados
El sistema debe proponer, no forzar, merges cuando dos identidades parecen ser la misma persona.

Señales fuertes: teléfono verificado, email verificado, enlace explícito del operador.
Señales débiles: mismo nombre/avatar; nunca bastan solas.

Merge:
- un Client canónico;
- conservar todos los ExternalIdentity;
- conservar conversaciones y attribution originales;
- audit event con actor, fecha, sourceClientIds y reason;
- permitir revisión/deshacer cuando backend lo soporte.

## 6. Inbox unificado
La UI trabaja contra conversaciones normalizadas, no contra una sesión concreta.

Filtros:
- Todos
- cuenta/canal
- sin responder
- interesados
- follow-up
- citas
- envíos
- archivados

Cada conversación muestra claramente su origen. Responder debe verificar que el canal tiene capacidad oficial de escritura; si no, mostrar read-only/acción externa y nunca fingir envío.

## 7. Marketplace
Marketplace debe modelarse por capacidad real del proveedor. No asumir que una API oficial permite leer/responder mensajes de perfiles personales. Si no existe acceso autorizado, Kelo puede registrar source=Facebook Marketplace y CRM/historial, pero no simular integración.

No construir automatización para evadir bloqueos, rotar cuentas prohibidas o saltarse controles de plataforma. El reemplazo de conexiones existe para continuidad legítima y autorizada.

## 8. Connection Manager
Pantalla prevista: Settings → Connections.

Funciones:
- + Conectar cuenta
- ver estado/capacidades
- sync
- reautorizar
- desconectar
- archivar
- identificar canal principal/secundario
- ver volumen e incidentes

Agregar una nueva conexión NO debe requerir cambios de código.

## 9. Contrato de adaptadores
Cada provider adapter normaliza:
- connect / oauthStart
- syncConnection
- listChannels
- ingestWebhook
- normalizeMessage
- sendMessage (solo si capability lo permite)
- disconnect

El núcleo CRM no conoce detalles de Meta/WhatsApp.

## 10. Reglas de persistencia
- IDs Kelo son fuente de verdad interna.
- IDs externos se guardan como referencias.
- desconectar != borrar.
- borrar conexión nunca debe borrar Client/Sale/Appointment.
- eventos entrantes idempotentes por provider + externalMessageId.
- auditoría de merges, desconexiones, reautorizaciones y envíos.

## 11. Criterios de aceptación
1. Pueden existir 2+ conexiones del mismo proveedor.
2. Se puede filtrar Inbox por conexión/canal o ver Todos.
3. Desconectar una cuenta no borra historial.
4. Conectar otra no exige migración manual de clientes.
5. Un cliente puede tener conversaciones de varios canales.
6. El sistema detecta posibles duplicados y permite merge controlado.
7. Cada mensaje conserva attribution.
8. La UI distingue real/mock/read-only.
9. Ningún secreto vive en frontend.
10. Ninguna integración se declara funcional sin API/backend y permisos reales.

## 12. Referencia visual
La infografía de concepto creada el 2026-10-04 define la intención visual: columna de conexiones, Inbox unificado, chat activo, etiquetas/seguimiento, herramientas de venta, métricas y acceso móvil. El archivo binario debe vivir en `docs/kelo-inbox/kelo-inbox-concept.png` cuando se cargue al repositorio; esta especificación es la fuente de verdad funcional aunque cambie el diseño.


## 13. Capa Kelo Intelligence
Las conexiones alimentan una capa de supervisión separada definida en `KELO_INTELLIGENCE.md`. Esta capa puede analizar simultáneamente múltiples cuentas Facebook/Instagram/WhatsApp autorizadas, incluso cuando las respuestas originales hayan sido generadas por Meta AI. El CRM conserva attribution por mensaje y Kelo Intelligence decide qué requiere revisión; no se acopla al proveedor ni necesita controlar su IA.
