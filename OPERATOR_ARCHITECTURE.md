# Kelo Operator OS — Watches / Zara / Moissanite

## Objetivo

El Operator OS no reemplaza el CRM existente. Es la capa diaria que reduce memoria, revisión manual de WhatsApp y trabajo repetitivo.

Principio:

**La IA atiende → Kelo observa → el sistema detecta dinero/riesgo → el humano entra solo cuando hace falta.**

## Entrada

- WhatsApp / mensajes
- tareas rápidas
- pedidos
- inventario
- cobros
- entregas
- historial de cliente

## Vistas principales

1. **HOY** — ventas calientes, cobros, entregas, compras de stock y follow-ups.
2. **CHATS** — resumen de conversación + heat % + próximo movimiento.
3. **ORDERS** — `RESERVED → PAID → READY → DELIVERY → DELIVERED`.
4. **PRODUCTS** — stock + reservados + demanda reciente.
5. **MONEY** — cobrado + pendiente + collections.

## Negocios iniciales

### Watches
Campos operativos principales:
- modelo
- color/variant
- caja sí/no
- precio acordado
- pickup/delivery
- ubicación
- fecha/hora deseada

### Zara
- retail/wholesale
- SKU/modelo
- talla/color
- cantidad
- precio por unidad
- delivery/pickup
- stock reservado

### Moissanite
- tipo de pieza
- diseño/medida
- variante
- budget
- prueba/video solicitado
- depósito
- pickup/delivery

## Heat meter

El porcentaje es una **señal explicable**, no una predicción mágica.

Señales iniciales posibles:
- producto definido
- aceptación/interés de precio
- intención temporal (hoy/mañana)
- ubicación / logística
- lenguaje de compra
- respuesta activa
- depósito/pago

Los pesos deben recalibrarse con ventas reales. No convertir el score en criterio automático de rechazo.

## HOT Alert

Contrato conceptual:

```text
conversation_updated
  → recompute_heat
  → if heat >= threshold && alert_not_sent
  → create alert
  → push/mobile notification when backend exists
```

Payload mínimo futuro:

```json
{
  "customer_id": "...",
  "business": "watches|zara|moissanite",
  "heat": 94,
  "reasons": ["price_accepted", "location", "today"],
  "next_action": "take_over",
  "conversation_id": "..."
}
```

## Quick Tasks

Entrada natural:

- “Comprar Daytona negro para Juan el viernes a las 3 PM”
- “Llamar a Maria mañana a las 11 para confirmar”
- “Cobrar depósito a Kevin hoy a las 6”
- “Entregar pedido Zara sábado 2 PM”

Backend futuro debe normalizar:

```text
task_id
title
type
business
customer_id
related_order_id
scheduled_for
alert_before_minutes
notification_channels
status
created_by
```

## What am I forgetting?

Escaneo operativo sobre:
- HOT chats sin acción
- promesas detectadas sin resolver
- cobros pendientes
- reservas demasiado antiguas
- entregas sin confirmar
- tareas vencidas/próximas
- productos por debajo de reorder point
- stock bajo con demanda alta
- follow-ups pendientes

La salida debe ser una lista de acciones, no analytics.

## Persistencia actual

El prototipo principal usa `kelo-associates-v2` en localStorage.

Operator usa temporalmente `kelo-operator-v1` para no arriesgar regresiones sobre el estado existente. La migración futura debe unificar ambas estructuras en PostgreSQL/Supabase mediante IDs compartidos.

## Backend pendiente

Para producción:
- WhatsApp Business Platform + webhooks
- worker/event queue para recompute_heat
- scheduler para tareas/alarmas
- push notifications (Web Push/APNs vía PWA/app wrapper)
- inventory/orders/payments persistentes
- audit log
- permisos por usuario

## Regla de seguridad

Nunca guardar tokens Meta, secretos de proveedor, service-role keys o credenciales de pagos en frontend/localStorage/repositorio.

## Regla de producto

La pantalla principal debe responder siempre:

> **¿Qué debo hacer ahora para no perder dinero, tiempo o una venta?**
