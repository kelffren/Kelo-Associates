# Kelo Associates — foco comercial actual

## Negocios activos
Kelo Associates prioriza ahora tres verticales operativas:

1. **Relojes**
2. **Ropa Zara**
3. **Aretes de moissanita**

Las verticales anteriores no se borran del historial/roadmap, pero dejan de ser la ruta primaria del Sales Engine.

## Arquitectura común

```text
Mensaje / llamada / lead
        ↓
Kelo Sales Agent
        ↓
Intención de compra
        ↓
Catálogo + variante
        ↓
Precio
        ↓
Stock confirmado
        ↓
Pedido
        ↓
Pago / SMS
        ↓
CRM + tareas + métricas
```

El agente nunca debe inventar precio, inventario, disponibilidad o autenticidad. Cuando falte un dato, crea una tarea humana en vez de prometerlo.

## Reglas por negocio

### Relojes
- Precio base configurado: **$200 sin caja**.
- Precio configurado con caja: **$285**.
- Preguntas mínimas: estilo/modelo, caja sí/no, pickup/delivery y urgencia.
- El inventario debe estar confirmado antes de reservar.
- Si la autenticidad de una marca no está verificada, el sistema no debe afirmar “original”, “auténtico” o equivalente.

### Zara
- Retail configurado: **$25/unidad**.
- 28–199 unidades: **$19/unidad** (tier configurado para delivery).
- 200+ unidades: **$15/unidad** mayorista.
- Talla, color y categoría se tratan como variantes de inventario, no como texto suelto.
- Antes de cerrar packs, confirmar cantidades reales por variante.

### Moissanita
- El precio no se inventa. Hasta configurarlo, Kelo crea una tarea de revisión humana.
- Preguntas mínimas: tamaño de piedra, metal/acabado, cantidad y pickup/delivery.
- La piedra debe describirse como **moissanita**, no como diamante.
- Un tester térmico convencional por sí solo no identifica de forma concluyente diamante vs. moissanita.

## Investigación aplicada al producto
La arquitectura de inventario sigue el principio de SKU/variante: talla, color, estilo, metal o tamaño deben poder tener inventario propio. Shopify documenta que el inventario se administra a nivel de variante y recomienda SKUs consistentes y conteos precisos para evitar stock fantasma.

Fuentes públicas consultadas:
- Shopify — Inventory Reporting Guide (2026): https://www.shopify.com/blog/inventory-reporting
- Shopify Help — Product variants: https://help.shopify.com/en/manual/products/variants
- Shopify Help — SKUs: https://help.shopify.com/en/manual/products/details/sku
- GIA — Synthetic Moissanite: A New Diamond Substitute: https://www.gia.edu/doc/Synthetic-Moissanite-A-New-Diamond-Substitute.pdf

## Herramientas del agente
- `get_or_create_customer`
- `qualify_retail_intent`
- `search_catalog`
- `set_inventory`
- `quote_retail`
- `reserve_inventory`
- `create_order`
- `create_payment_link`
- `send_sms`
- `create_task`
- `transfer_to_human`

Todas pasan por una allowlist. Las integraciones externas siguen bloqueadas hasta existir backend seguro.
