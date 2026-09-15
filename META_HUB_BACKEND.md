# Kelo Associates — Meta Hub backend contract

## Objetivo
Meta Hub permite conectar varias identidades/autorizaciones de Facebook y administrar desde Kelo Associates los activos a los que cada una tiene acceso: Business portfolios, Facebook Pages, Instagram business accounts y múltiples Meta Ads Manager / Ad Accounts.

La PWA pública nunca debe almacenar access tokens, refresh material, app secret, system-user tokens ni credenciales de Meta. El navegador conserva únicamente metadatos no secretos para funcionamiento offline.

## Estado del frontend
`meta-hub.js` implementa:
- múltiples conexiones de Facebook;
- selector/listado de Business portfolios;
- listado de Pages;
- listado de Ad Accounts;
- consulta de campañas por Ad Account;
- métricas opcionales por campaña;
- activar/pausar campañas;
- desconectar una autorización;
- sincronización manual global o por conexión;
- configuración de una URL HTTPS para el backend.

## Flujo OAuth
1. PWA abre `GET /v1/meta/oauth/start?return_url=<url>`.
2. Backend crea `state` criptográficamente aleatorio y lo vincula a la sesión Kelo.
3. Backend redirige al flujo oficial de Meta Login for Business / Facebook Login correspondiente a la configuración vigente de la app.
4. Meta devuelve el `code` al callback del backend.
5. Backend valida `state`, intercambia el `code`, obtiene la identidad y permisos concedidos y guarda el token cifrado en servidor.
6. Backend descubre los activos accesibles y los asocia a `connection_id`.
7. Backend redirige de vuelta a `return_url` con `meta_status=connected` o `meta_status=error`.

## Permisos objetivo
Solicitar solo los necesarios según las funciones activadas. Para Ads Manager normalmente:
- `ads_read` para reportes/lectura;
- `ads_management` para crear/editar/activar/pausar anuncios y campañas;
- `business_management` para Business Manager / activos empresariales cuando corresponda.

Para Pages, según funciones:
- `pages_show_list` para listar Pages administradas;
- `pages_read_engagement` para lectura de datos de Page;
- permisos adicionales de Pages únicamente si después se habilita publicación, mensajes u otras acciones.

Si Kelo Associates administra cuentas publicitarias de terceros/clientes, preparar App Review y Advanced Access según los requisitos vigentes de Meta.

## API que espera el frontend
Todos los endpoints deben exigir una sesión autenticada de Kelo Associates. Para despliegue cross-origin desde GitHub Pages, configurar CORS únicamente para el dominio de Kelo Associates y cookies seguras `HttpOnly; Secure; SameSite=None`, o migrar la PWA y API al mismo dominio.

### POST /v1/meta/sync
Sincroniza todas las conexiones activas y devuelve:
```json
{
  "connections": [{"id":"mc_1","name":"Kelo Facebook","externalUserId":"123","status":"connected","updatedAt":"..."}],
  "businesses": [{"id":"biz_1","name":"Kelo LLC","verificationStatus":"verified","connectionId":"mc_1"}],
  "pages": [{"id":"page_1","name":"Kelo","tasks":["..."],"connectionId":"mc_1","connectionName":"Kelo Facebook"}],
  "adAccounts": [{"id":"act_123","name":"Kelo Watches","currency":"USD","status":"ACTIVE","businessName":"Kelo LLC","connectionId":"mc_1"}]
}
```

### GET /v1/meta/connections
Devuelve conexiones Meta del usuario autenticado. Nunca devuelve tokens.

### GET /v1/meta/assets
Puede usarse para lecturas sin forzar sincronización. Devuelve `businesses`, `pages`, `adAccounts`.

### POST /v1/meta/connections/:connectionId/sync
Renueva metadatos/permisos y vuelve a descubrir activos para una conexión concreta.

### DELETE /v1/meta/connections/:connectionId
Revoca/elimina la conexión del vault del servidor y deja de usar sus tokens.

### GET /v1/meta/ad-accounts/:adAccountId/campaigns
Query opcional: `include_insights=1`.
Respuesta:
```json
{
  "campaigns": [
    {"id":"1200...","name":"Bathroom Leads","status":"ACTIVE","effectiveStatus":"ACTIVE","spend":123.45,"results":8}
  ]
}
```
El backend debe verificar que ese Ad Account pertenece a un activo autorizado para la sesión actual; nunca aceptar IDs arbitrarios sin control de acceso.

### POST /v1/meta/campaigns/:campaignId/status
Body:
```json
{"status":"ACTIVE"}
```
o
```json
{"status":"PAUSED"}
```
Solo permitir estados explícitamente soportados. Verificar propiedad/acceso antes de llamar a Meta.

## Modelo mínimo de datos
### meta_connections
- `id` UUID
- `owner_user_id`
- `meta_user_id`
- `display_name`
- `token_ciphertext`
- `token_expires_at`
- `granted_scopes[]`
- `status`
- `created_at`
- `updated_at`

### meta_assets
- `id` UUID
- `connection_id`
- `external_id`
- `asset_type` (`business`, `page`, `instagram`, `ad_account`)
- `name`
- `metadata jsonb`
- `last_synced_at`

Agregar índice único por `(connection_id, asset_type, external_id)`.

## Seguridad obligatoria
- Nunca publicar Meta App Secret.
- Nunca guardar access tokens en localStorage/IndexedDB/GitHub.
- Cifrar tokens en reposo con una clave fuera de la base de datos.
- Validar OAuth `state` y retorno permitido.
- Aplicar control de acceso por usuario/organización en cada endpoint.
- Registrar auditoría de acciones sensibles, especialmente cambios de campañas.
- Rate-limit de mutaciones.
- No permitir que el cliente envíe un access token arbitrario.
- La UI debe mostrar qué conexión y qué Ad Account están activos antes de una mutación.

## Próximos módulos posibles
- Ad Sets y Ads.
- Presupuesto y spend limits.
- Insights por día/campaña/ad set/ad.
- Leads de Lead Ads hacia Kelo CRM.
- Conexión Instagram profesional ligada a la Page.
- Inbox de comentarios/mensajería solo después de obtener permisos específicos.
- Alertas de gasto y campañas pausadas/rechazadas.
