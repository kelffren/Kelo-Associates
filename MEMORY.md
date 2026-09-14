# KELO ASSOCIATES — MEMORIA OPERATIVA Y TÉCNICA

> Documento obligatorio de contexto para cualquier agente o desarrollador que continúe el proyecto.

## 0. Identidad

- Repositorio: `kelffren/Kelo-Associates`
- Rama de producción: `main`
- Frontend: Vanilla HTML + CSS + JavaScript, mobile-first.
- Producto inicial: **Kelo Inbox / Kelo Associates V0.1**.
- Piloto operativo: venta de relojes.
- Tesis: el cliente pertenece a Kelo Associates; las verticales son módulos.

Kelo Associates no es una app de relojes ni un clon de WhatsApp. Es un sistema operativo comercial para recordar, coordinar y medir relaciones con clientes a través de distintas líneas de negocio.

## 1. Norte del producto

La primera victoria es concreta:

> Un cliente escribe, se identifica, se agenda, la app recuerda qué hay que llevar y cuándo, el encuentro ocurre, el resultado se registra y el historial/venta queda asociado al cliente sin depender de memoria humana.

Toda función nueva debe ayudar al menos a una de estas metas:

1. evitar un olvido;
2. reducir pasos/tiempo;
3. aumentar probabilidad de cierre;
4. producir información útil;
5. permitir escalar sin perder control.

## 2. Estado actual — 2026-09-14

La Fase 0 dejó de ser solo maqueta. `main` contiene un CRM local funcional con flujo extremo a extremo y estructura preparada para backend real.

### Implementado

- UI mobile-first con safe areas de iPhone.
- PWA (`manifest.webmanifest`, `service-worker.js`, `icon.svg`).
- Selector `WhatsApp 1 / WhatsApp 2 / WhatsApp 3 / Todos` con datos mock.
- Inbox unificado con filtros Todos / sin responder / HOT / follow-up.
- Hilo de conversación simulado y envío local de mensajes.
- Clientes globales con búsqueda, estado, fuente, intereses, responsable y LTV.
- Creación de clientes.
- Perfil único del cliente con oportunidades, citas e historial.
- Asignación manual de responsable.
- Agenda: próximas / hoy / pasadas.
- Creación de citas con fecha, hora, lugar, artículos, valor, responsable y notas.
- Generación automática de tareas al crear cita.
- Pantalla `Hoy` con KPIs, citas, prioridades y follow-ups vencidos.
- `Bolsa de salida` agregada desde artículos de las citas del día.
- Checklist de preparación y `Preparar todo`.
- Recordatorios configurables: día anterior, resumen de mañana, 2 horas, 30 minutos, resultado posterior.
- Tareas manuales.
- Notificaciones web locales cuando el navegador lo permite.
- Resultado de cita: vendido / follow-up / cancelado / no-show.
- Registro de ventas.
- Oportunidades y etapas básicas.
- Timeline/auditoría local.
- Métricas: no respondidos, ventas, cierre, valor vendido, follow-ups, citas, no-shows, clientes, producción por canal y representante.
- Import/export JSON.
- Persistencia local `localStorage`.
- Selector de vertical base: Watches / Bathroom / Kitchen / Roofing / Autos.
- Esquema PostgreSQL/Supabase en `supabase/schema.sql`.
- Contrato de backend/integraciones en `API_CONTRACT.md`.
- QA automático de sintaxis + integridad de seed mediante GitHub Actions.

### Deliberadamente NO conectado todavía

- WhatsApp Business Platform real.
- SMS real.
- Email real.
- autenticación real;
- Supabase/PostgreSQL real;
- webhooks;
- llamadas/grabaciones;
- automatización externa;
- IA de scoring/resúmenes.

No fingir que estas integraciones funcionan. Requieren backend, credenciales y proveedores autorizados.

## 3. Archivos principales

- `ROADMAP.md` — visión/fases del producto.
- `MEMORY.md` — este documento.
- `README.md` — cómo ejecutar y estado resumido.
- `index.html` — shell/markup de la SPA.
- `styles.css` — sistema visual responsive.
- `app.js` — flujo operativo, render y acciones.
- `data.js` — modelo local + datos seed.
- `integrations.js` — frontera de integraciones, sin secretos.
- `manifest.webmanifest` — instalación PWA.
- `service-worker.js` — caché offline.
- `supabase/schema.sql` — esquema persistente futuro.
- `API_CONTRACT.md` — endpoints y contrato WhatsApp/backend.
- `tests/state-smoke.js` — validaciones de integridad del estado.
- `.github/workflows/qa.yml` — QA automático.

## 4. Modelo universal

Estas entidades son núcleo, no específicas de relojes:

```text
Client
Channel
Conversation
Message
Appointment
Task
Reminder Rule
Opportunity
Assignment
Agent
Sale/Contract
Timeline Event
```

El frontend local utiliza estructuras equivalentes a estas entidades. El objetivo al conectar backend es sustituir el adaptador de persistencia, no reescribir UX.

### Cliente global

Un cliente puede acumular actividad de múltiples verticales:

```text
Juan Pérez
├─ Watches — compra
├─ Bathroom — contrato
├─ Auto — compra
└─ historial/LTV global
```

Nunca modelar el mismo humano como clientes independientes solo porque cambió de vertical.

## 5. Verticales

### Watches — piloto

Campos/operación específicos:
- modelo / variante;
- precio;
- caja / accesorios;
- artículos que llevar;
- punto de encuentro;
- resultado de cita.

### Bathroom / Kitchen / Roofing

Previstos:
- ZIP;
- homeowner;
- tipo de proyecto;
- presupuesto;
- urgencia;
- fotos;
- disponibilidad;
- financiamiento;
- representante;
- estimate/contract.

### Autos

Previstos:
- vehículo;
- presupuesto;
- financiamiento;
- trade-in;
- cita;
- entrega.

No contaminar el núcleo con campos verticales. Usar `vertical`, `vertical_data` o tablas especializadas.

## 6. Flujo crítico actual

```text
Chat
 → Cliente
 → Cita
 → Recordatorios/Tareas
 → Hoy
 → Bolsa de salida
 → Encuentro
 → Resultado
 → Venta o Follow-up
 → Timeline + Métricas + LTV
```

Este flujo debe permanecer funcional antes y después de conectar APIs externas.

## 7. Recordatorios

Al crear una cita, `app.js` usa `reminderRules` para generar tareas relativas a la hora del encuentro.

Reglas actuales:
- noche/día anterior: preparar artículos;
- mañana del día: revisar cita;
- 2 horas antes: confirmar;
- 30 min antes: salida/preparación final;
- después: registrar resultado.

Las notificaciones web no garantizan ejecución si iOS cierra completamente la PWA. Para alertas fiables con app cerrada hará falta backend/push programado. No prometer lo contrario.

## 8. Bolsa de salida

Se calcula desde `appointments` del día con `status=scheduled`.

Los artículos se agrupan por nombre y cantidad. Marcar un artículo preparado actualiza todas las coincidencias del día. `Preparar todo` marca todos los items de las citas de hoy.

Esta función es prioritaria porque resuelve el problema real inicial: olvidar relojes/accesorios que un cliente pidió ver.

## 9. Seguridad e integraciones

Arquitectura obligatoria:

```text
PWA/Browser
   ↓
Kelo REST API
   ↓
PostgreSQL/Supabase
   ↓
WhatsApp / SMS / Email / otros
```

### Prohibido

- token de Meta en frontend;
- Supabase service-role key en frontend;
- secretos en GitHub;
- automatizar WhatsApp Web con hacks como arquitectura de producción;
- marcar como enviada una acción que el proveedor rechazó.

`integrations.js` solo representa estado/capacidad local. La implementación externa debe vivir detrás del backend.

## 10. WhatsApp futuro

Meta webhook debe:

1. validar webhook/firma;
2. resolver `phone_number_id` a un `Channel`;
3. normalizar teléfono;
4. buscar/crear cliente;
5. buscar/crear conversación;
6. guardar mensaje idempotente por ID externo;
7. actualizar unread/last_message;
8. procesar estados sent/delivered/read/failed;
9. enviar evento realtime a UI cuando proceda.

La UI debe seguir abriendo y mostrando datos aunque WhatsApp temporalmente esté desconectado.

## 11. Persistencia actual y migración

Hoy: `localStorage`, clave `kelo-associates-v2`.

Backup: export JSON desde Métricas y reimportar desde Más.

Futuro: backend REST + PostgreSQL/Supabase. `supabase/schema.sql` ya define la base relacional. Mantener IDs/relaciones conceptuales compatibles.

## 12. QA

Antes de dar un cambio importante por bueno:

```bash
npm run check
npm test
```

GitHub Actions ejecuta esas verificaciones en push/PR.

Además hacer QA real en iPhone para flujos táctiles. Los tests actuales validan sintaxis JS y estructura de datos, no reemplazan prueba visual.

## 13. Reglas para futuros agentes

Antes de modificar:

1. leer `MEMORY.md`;
2. leer `ROADMAP.md`;
3. inspeccionar código existente;
4. no reconstruir funciones ya presentes;
5. preservar Vanilla/mobile-first salvo razón técnica demostrable;
6. núcleo universal separado de verticales;
7. secretos solo servidor;
8. probar flujo completo tras cambios;
9. actualizar memoria si cambia arquitectura/estado;
10. no confundir mock con integración real.

## 14. Próximos hitos de mayor valor

Orden recomendado:

1. QA visual real desde iPhone/PWA.
2. activar hosting/GitHub Pages o entorno equivalente.
3. conectar Supabase/backend y migrar persistencia local.
4. autenticación/usuarios y permisos.
5. conectar 3 canales reales de WhatsApp Business Platform.
6. realtime/webhooks.
7. assignment workflows y notificaciones externas manuales.
8. comisión/contratos para Kelo Associates.
9. intake específico de Bathroom y primer lead real.
10. IA solo después de tener historial real suficiente.

## 15. Definición actual de éxito

Desde un iPhone, sin backend externo, debe poderse:

- abrir la app;
- ver Hoy;
- filtrar 3 WhatsApp mock;
- abrir chat;
- abrir/crear cliente;
- crear cita;
- generar recordatorios;
- ver qué llevar;
- marcar preparación;
- registrar resultado;
- crear venta/follow-up;
- observar historial y métricas;
- cerrar y volver sin perder el estado local.

El siguiente salto de producto no es añadir más pantallas: es reemplazar mocks por datos reales manteniendo este flujo estable.
