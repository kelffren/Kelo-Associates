# Kelo Associates

Sistema operativo comercial mobile-first de Kelo Associates. El primer piloto es el negocio de relojes, pero el núcleo está diseñado para clientes, conversaciones, citas, tareas, asignaciones, oportunidades y ventas de cualquier vertical.

## Ejecutar

No hay build ni dependencias de frontend.

```bash
python3 -m http.server 8080
```

Abrir `http://localhost:8080`.

Para QA de código/datos:

```bash
npm run check
npm test
```

## V0.1 implementado

- Vanilla HTML/CSS/JS.
- Mobile-first + safe areas de iPhone.
- PWA instalable y caché offline.
- Selector WhatsApp 1 / 2 / 3 / Todos con datos mock.
- Inbox unificado y filtros.
- Cliente global con LTV, historial, oportunidades y responsable.
- Agenda y creación de citas.
- Generación de recordatorios a partir de cada cita.
- Pantalla Hoy.
- Bolsa de salida agregada desde las citas del día.
- Tareas / follow-ups.
- Registro de resultado: vendido / follow-up / cancelado / no-show.
- Ventas y métricas por canal y representante.
- Import/export JSON.
- Persistencia local mediante `localStorage`.
- Esquema PostgreSQL/Supabase listo en `supabase/schema.sql`.
- Contrato de backend/integraciones en `API_CONTRACT.md`.

## Archivos principales

- `ROADMAP.md` — dirección del producto.
- `MEMORY.md` — memoria operativa/técnica para agentes.
- `index.html` — shell de la aplicación.
- `styles.css` — UI responsive.
- `app.js` — comportamiento del CRM.
- `data.js` — modelo/seed local.
- `integrations.js` — frontera segura de integraciones.
- `manifest.webmanifest` + `service-worker.js` — PWA.
- `supabase/schema.sql` — modelo persistente futuro.

## Límite intencional

WhatsApp/SMS/email reales no están simulados como si fueran conexiones auténticas. Para activarlos hace falta backend seguro, credenciales/proveedores y webhooks. Nunca colocar tokens de Meta o service-role keys en frontend/localStorage/repositorio.
