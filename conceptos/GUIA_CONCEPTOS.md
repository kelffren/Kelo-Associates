# Kelo Associates — Conceptos

> Guía viva de conocimientos comerciales validados, hipótesis supervivientes y reglas transferibles entre verticales.
>
> Creada: 2026-09-15
> Estado: LIVING DOCUMENT — actualizar cuando nuevos datos propios confirmen, modifiquen o rechacen conceptos.

## 1. Regla maestra

Kelo Associates no optimiza actividad superficial. Optimiza resultado económico downstream.

Cadena universal:
`DEMAND → CONTACT → QUALIFY → APPOINTMENT/MEETING → OFFER/ESTIMATE → DECISION → WON/LOST → REVENUE → COMMISSION → RECOVERY`

Las métricas upstream (click, CPL, mensajes, submits) sirven, pero nunca sustituyen revenue, margen/comisión y contratos/ventas reales.

## 2. Principios aprendidos

### C-001 — CPL barato no equivale a buen negocio
Medir siempre desde origen/campaña/creative hasta venta, contract value, revenue y comisión.

### C-002 — El mejor evento de optimización no siempre es el más profundo
El evento ideal combina calidad predictiva y frecuencia suficiente. `WON` puede ser demasiado escaso; `QUALIFIED`, `SHOWED` o equivalente pueden enseñar mejor al sistema. Primero medir en shadow mode.

### C-003 — Separar contacto inválido de lead válido que no compra
No mezclar fraude/error con baja intención.
Estados recomendados: `INVALID_CONTACT`, `OUT_OF_SCOPE`, `VALID_UNRESPONSIVE`, `VALID_NOT_QUALIFIED`, `QUALIFIED_LOST`.

### C-004 — Silencio no significa automáticamente LOST
Después de estimate/oferta registrar seguimiento y decisión: `OFFER_SENT → FOLLOW_UP → DECISION → WON/LOST`. Separar `NO_DECISION` y `NOT_READY_YET`.

### C-005 — NOT READY puede ser demanda futura
No contaminar el pipeline activo, pero conservar una cohorte `NURTURE/FUTURE_DEMAND` y medir su revenue eventual.

### C-006 — No convertir benchmarks externos en leyes
Ejemplo: “contactar en 5 minutos” puede ser dirección útil, pero la magnitud real debe medirse por vertical, ticket y urgencia. Registrar tiempo de respuesta y su relación con conversiones reales.

### C-007 — Budget aislado no define calidad
Separar scope, coste esperado local, presupuesto declarado, capacidad/financiación y urgencia. Un presupuesto bajo puede ser expectativa incorrecta, no ausencia de capacidad.

### C-008 — Comportamiento de comparación no equivale a tire kicker
En high-ticket, comparar alternativas puede ser comportamiento racional. No penalizar múltiples estimates/cotizaciones sin evidencia propia downstream.

### C-009 — Project clarity puede ser señal, pero no sentencia
Scope definido, fotos opcionales, descripción y timeline pueden contener señal. Medir primero; no convertir correlaciones tempranas en reglas duras.

### C-010 — Fotos opcionales: medir, no asumir
`PHOTO_UPLOADED` puede correlacionar con engagement, pero no hay base suficiente para usarlo como penalización o requisito universal.

### C-011 — Datos propios > opiniones de internet
Reddit, contractors, media buyers y benchmarks generan hipótesis. Los datos de Kelo deciden promoción/rechazo cuando exista muestra suficiente.

### C-012 — Una teoría que sobrevive pasa a EXPERIMENTO, no a VERDAD
Estados: `SOBREVIVE`, `SOBREVIVE_CON_CAMBIOS`, `INCIERTA`, `RECHAZADA`. Cambiar preferiblemente una variable por experimento.

## 3. Motor universal de aprendizaje

Cada vertical debe conservar:
- `source`, `campaign`, `creative`
- timestamps por etapa
- motivo de descalificación/pérdida
- valor económico final
- seguimiento realizado
- estado `NOT_READY/NO_DECISION` separado de `LOST`

El sistema debe poder calcular por cohorte:
`contact rate → qualified rate → appointment/meeting rate → offer/estimate rate → close rate → revenue → margin/commission → CAC/cost per WON`.

## 4. Aplicación — Home Improvement

Pipeline recomendado:
`NEW → CONTACTED → QUALIFIED → APPOINTMENT_SET → CONFIRMED → SHOWED → ESTIMATE_PREPARING → ESTIMATE_SENT → DECISION_PENDING → WON/LOST`

Ramas: `INVALID`, `NURTURE`, `RECOVERY`, `REMATCH`.

Variables importantes: homeowner, ZIP/servicio, scope, urgency/timeline, presupuesto, financiación/capacidad, fotos opcionales, project clarity, competing estimates, response time, follow-up count, contract value y comisión.

Objetivo real: `cost per contract + commission/ad-dollar`, no CPL.

## 5. Aplicación — Watches

Traducir `lead` a comprador potencial y `estimate` a oferta concreta.

Pipeline:
`INQUIRY → VALID_CONTACT → PRODUCT_MATCH → PRICE/OFFER_SENT → MEETUP/DELIVERY_SET → CONFIRMED → SOLD/LOST → REPEAT/RECOVERY`

Medir por fuente/creative: contacto válido, respuesta, intención, modelo solicitado, caja/sin caja, meetup/delivery, show rate, venta, revenue, margen y repetición.

Reglas transferidas:
- Mensaje barato ≠ comprador rentable.
- “Lo voy a pensar” ≠ LOST; usar `NOT_READY`.
- Silencio tras precio requiere seguimiento medible antes de declararlo perdido.
- Comparar otros vendedores no debe penalizarse automáticamente.
- Optimizar campañas por ventas/margen cuando haya volumen suficiente, no solo mensajes.

## 6. Aplicación — Zara / Clothing

Pipeline:
`INQUIRY → VALID_CONTACT → RETAIL/WHOLESALE_INTENT → SIZE/QTY/PRODUCT_MATCH → OFFER → DELIVERY/PICKUP → SOLD/LOST → REPEAT`

Segmentar economics entre retail y wholesale. No mezclar CPL/mensaje de una compra de 1 unidad con un comprador de 28, 50 o 200 unidades.

Registrar cantidad, ticket, margen, repeat purchase y fuente. `WHOLESALE_NOT_READY` debe ser nurture, no basura: puede madurar cuando tenga capital/demanda.

## 7. Aplicación — Moissanite / Jewelry

Pipeline:
`INQUIRY → VALID_CONTACT → PRODUCT/STYLE_MATCH → TRUST/PROOF_STAGE → OFFER → MEETUP/DELIVERY → SOLD/LOST → REPEAT/REFERRAL`

Aquí la confianza puede ser una etapa explícita. Medir qué pruebas, fotos, video o demostraciones se asociaron con ventas sin asumir causalidad antes del experimento.

No optimizar por conversaciones si atraen curiosidad sin compra; conectar creative → producto → venta → margen.

## 8. Aplicación — Autos

Pipeline:
`INQUIRY → VALID_CONTACT → VEHICLE_MATCH → BUDGET/FINANCING → APPOINTMENT → SHOWED → OFFER/NEGOTIATION → SOLD/LOST → FOLLOW_UP`

Separar `NO_FINANCING`, `PRICE_MISMATCH`, `VEHICLE_MISMATCH`, `NO_SHOW`, `VALID_NOT_READY` y `BOUGHT_ELSEWHERE`.

Comparar otros carros/dealers es normal; medir si predice cierre antes de penalizarlo. La métrica central es margen por vehículo y cost per sale, no número de mensajes.

## 9. Action Engine transversal

Kelo debe detectar momentos donde “hay dinero cerca” y convertirlos en acciones priorizadas:
- lead nuevo sin contacto
- qualified sin appointment
- appointment sin confirmación
- no-show recuperable
- offer/estimate enviado sin follow-up
- `NOT_READY` que llega a su fecha de reactivación
- cliente ganado con oportunidad de repeat/referral

Cada alerta debe tener `NEXT_BEST_ACTION`, prioridad, deadline y resultado.

## 10. Registro acumulativo

Teorías recientes incorporadas: T-147 a T-155.

- T-147: feedback downstream a plataforma — sobrevive con cambios.
- T-148: evento óptimo puede ser QUALIFIED/SHOWED y no WON — sobrevive.
- T-149: separar invalid de low-intent — sobrevive.
- T-150: auditar seguimiento post-estimate — sobrevive.
- T-151: NOT_READY como future demand — sobrevive con cambios.
- T-152: medir curva real de response time — sobrevive.
- T-153: project clarity — sobrevive con cambios.
- T-154: fotos como señal — incierta; observar solamente.
- T-155: multi-quote buyer no es automáticamente tire kicker — sobrevive.

## 11. Protocolo de actualización

Cuando el laboratorio produzca conocimiento nuevo:
1. Asignar ID estable.
2. Guardar hipótesis y mecanismo.
3. Registrar evidencia a favor/en contra.
4. Marcar estado.
5. Si sobrevive, convertir en experimento.
6. Si datos propios contradicen internet, priorizar datos propios con control de muestra/sesgos.
7. Promover a `CONCEPTO OPERATIVO` solo tras evidencia repetida.
8. Aplicar transversalmente solo cuando el mecanismo tenga sentido para esa vertical; nunca copiar mecánicamente.

## 12. Principio final

Kelo Associates debe aprender en circuito cerrado:
`CAPTAR → OBSERVAR → CLASIFICAR → ACTUAR → MEDIR RESULTADO ECONÓMICO → APRENDER → ACTUALIZAR REGLAS`.

La plataforma no debe ser solo un CRM. Debe convertirse en un sistema operativo comercial multivertical que aprende qué señales preceden dinero real y qué acciones aumentan la probabilidad de capturarlo.