# Kelo Associates — Estado de Implementación

Actualizado: 2026-09-14

Este archivo evita confundir funciones reales con mocks o scaffolding.

## Fase 0 — Prototipo funcional

**Estado: IMPLEMENTADA**

- index mobile-first
- navegación
- 3 WhatsApp mock + Todos
- inbox
- clientes
- agenda
- recordatorios
- Hoy
- Bolsa de salida
- persistencia local
- resultado de cita
- venta/follow-up
- métricas
- PWA/offline

## Fase 1 — Persistencia real

**Estado: PREPARADA, NO CONECTADA**

Implementado:
- modelo normalizado local equivalente;
- `supabase/schema.sql`;
- contrato REST;
- IDs/relaciones núcleo.

Pendiente externo:
- provisionar proyecto PostgreSQL/Supabase;
- autenticación;
- políticas/permisos;
- API/server runtime;
- migrar `localStorage` al backend.

## Fase 2 — WhatsApp real

**Estado: FRONTERA IMPLEMENTADA, PROVEEDOR NO CONECTADO**

Implementado:
- UI multi-canal;
- modelo Channel/Conversation/Message;
- estados previstos;
- `integrations.js` sin secretos;
- contrato de webhook/API documentado.

Pendiente externo:
- WhatsApp Business Platform;
- credenciales Meta;
- `phone_number_id` de los tres números;
- endpoint webhook público/seguro;
- templates/políticas aplicables.

## Fase 3 — Operación comercial

**Estado: IMPLEMENTADA LOCALMENTE**

- asignación manual;
- HOT/WARM/COLD base;
- follow-ups;
- oportunidades;
- ventas;
- métricas;
- timeline/auditoría;
- rendimiento por canal/representante.

## Fase 4 — Automatización controlada

**Estado: LÓGICA LOCAL IMPLEMENTADA / ACCIONES EXTERNAS PENDIENTES**

Implementado:
- reglas de recordatorio;
- tareas automáticas al crear cita;
- notificación web local cuando el navegador lo permite;
- frontera segura para WhatsApp/SMS/email.

Pendiente:
- proveedores y backend para SMS/email/WhatsApp;
- jobs programados server-side;
- push fiable con app cerrada;
- auditoría de intentos externos.

## Fase 5 — Inteligencia

**Estado: NO IMPLEMENTADA A PROPÓSITO**

La IA no es requisito de la V0.1 y no debe ser dependencia del inbox. Antes de scoring/resúmenes hace falta historial operativo real suficiente y reglas de privacidad/retención.

## Fase 6 — Expansión

**Estado: NÚCLEO MULTIVERTICAL PREPARADO**

- selector base Watches/Bathroom/Kitchen/Roofing/Autos;
- cliente global;
- `vertical` y `vertical_data` previstos en persistencia;
- citas/oportunidades/ventas universales.

Pendiente:
- formularios e intake específicos de cada nueva vertical;
- workflows de estimados/contratos/comisiones;
- pruebas con operación real.

## Regla de verdad

Solo marcar algo como **IMPLEMENTADO** cuando funciona dentro del producto actual. Usar **PREPARADO** cuando existe arquitectura/código base pero falta un servicio externo. Nunca afirmar que WhatsApp, email, SMS, Supabase o IA están conectados si no lo están.
