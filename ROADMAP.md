# Kelo Associates — Roadmap Maestro

> Estado: Fase 1 / V0.1
> Principio: construir primero una herramienta que resuelva un problema real diario y convertir esa herramienta en el núcleo operativo de Kelo Associates.

## 1. Visión

Kelo Associates no debe ser una simple app de relojes ni un clon de WhatsApp. La visión es construir un sistema operativo comercial propio que permita administrar conversaciones, clientes, citas, tareas, asignaciones, recordatorios, métricas y ventas a través de múltiples líneas de negocio.

La primera fase usará el negocio de relojes como piloto porque el problema ya existe hoy: llegan clientes por varios WhatsApp, piden modelos específicos, se acuerdan encuentros, hay que recordar qué relojes llevar y muchas veces esa información queda dispersa en conversaciones o depende de la memoria.

El objetivo inicial es resolver ese problema de forma simple, rápida y mobile-first. Si el sistema funciona en el negocio real de relojes, el mismo núcleo se reutilizará para Bathroom Remodeling, Kitchen Remodeling, Roofing, Autos y otras verticales de Kelo Associates.

---

## 2. Problema inicial

Hoy existen varios puntos de fricción:

- Administrar 3 números de WhatsApp por separado.
- Cambiar constantemente entre cuentas o teléfonos.
- No tener una vista única de los clientes.
- Olvidar citas acordadas dentro de un chat.
- Olvidar qué reloj pidió cada cliente.
- Olvidar qué relojes deben llevarse a una cita.
- No tener recordatorios previos a una entrega.
- No saber qué conversaciones siguen sin responder.
- No medir tiempos de respuesta, cierres, citas o rendimiento.
- No tener historial comercial unificado del cliente.

La aplicación debe convertir esas conversaciones dispersas en trabajo organizado y medible.

---

## 3. Producto inicial: Kelo Inbox

Kelo Inbox será la primera interfaz operativa de Kelo Associates.

### Navegación principal

- Hoy
- Chats
- Clientes
- Agenda
- Recordatorios
- Más

### Selector de canales

En la parte superior del Inbox:

- WhatsApp 1
- WhatsApp 2
- WhatsApp 3
- Todos

La intención es poder alternar entre los tres canales o trabajar desde una bandeja unificada.

> V0.1 usa datos simulados. La conexión real con WhatsApp se incorpora después mediante la plataforma oficial de WhatsApp Business y un backend seguro.

---

## 4. Flujo principal del piloto de relojes

Ejemplo:

1. Carlos escribe preguntando por un Daytona negro.
2. El chat queda asociado a un perfil único de cliente.
3. Desde el mismo cliente se registra:
   - modelo solicitado;
   - precio;
   - con caja / sin caja;
   - lugar de encuentro;
   - fecha;
   - hora;
   - relojes que deben llevarse;
   - notas.
4. Se crea una cita.
5. La aplicación genera recordatorios.
6. La cita aparece en la pantalla `Hoy`.
7. Antes de salir, la app muestra la `Bolsa de salida` con todo lo que debe llevarse.
8. Después del encuentro se marca el resultado: vendido, no vendido, seguimiento o cancelado.
9. La información queda guardada en el historial del cliente.

---

## 5. Recordatorios inteligentes

Una cita no debe ser solamente una fila en un calendario.

Cuando se crea una cita, el sistema podrá crear tareas relacionadas:

- La noche anterior: preparar los relojes.
- El mismo día por la mañana: resumen de citas del día.
- 2 horas antes: recordar cliente, lugar y artículos.
- 30 minutos antes: alerta final de salida/preparación.
- Después de la cita: registrar resultado.

Configuraciones previstas:

- 1 día antes.
- 2 horas antes.
- A la hora exacta.
- Recordatorios personalizados.

---

## 6. Pantalla HOY

Debe ser una pantalla extremadamente útil y rápida.

Ejemplo:

```text
HOY — 3 CITAS

10:00 AM
Carlos
Daytona negro
✓ Preparado

2:30 PM
Miguel
Submariner + caja
! FALTA PREPARAR

6:00 PM
José
GMT negro
✓ Preparado
```

No debe obligar al usuario a entrar a cinco pantallas para entender su día.

---

## 7. Bolsa de salida

Función crítica del piloto.

La aplicación agrega los artículos necesarios de todas las citas próximas y crea una lista operativa:

```text
RELOJES QUE DEBES LLEVAR HOY

2 × Daytona negro
1 × Submariner
1 × GMT
2 × cajas

[ MARCAR TODO PREPARADO ]
```

La meta es reducir olvidos y convertir la preparación diaria en un proceso verificable.

---

## 8. Perfil único de cliente

El cliente no pertenece a una vertical; pertenece a Kelo Associates.

Un perfil debe poder acumular interacciones históricas aunque el cliente compre productos o servicios distintos.

Ejemplo futuro:

```text
JUAN PÉREZ

2026  ✓ Daytona              $200
2027  ✓ Bathroom Remodel     $18,500
2028  ✓ Vehículo             $24,000

Lifetime Value: $42,700
```

Esto permite que Kelo Associates construya una relación continua con el cliente en vez de empezar desde cero en cada negocio.

---

## 9. Núcleo universal de datos

Estas entidades deben ser genéricas y reutilizables:

- Cliente
- Contacto
- Canal
- Conversación
- Mensaje
- Cita
- Tarea
- Recordatorio
- Nota
- Responsable
- Asignación
- Estado
- Fuente
- Oportunidad
- Valor estimado
- Venta / contrato
- Evento de historial

Los campos específicos pertenecen a cada vertical.

### Vertical Relojes

- Modelo solicitado
- Color / variante
- Precio
- Con caja / sin caja
- Artículos a llevar
- Lugar de encuentro

### Vertical Bathroom Remodeling

- Tipo de remodelación
- Presupuesto
- ZIP
- Urgencia
- Fotos
- Financiamiento
- Disponibilidad

### Vertical Autos

- Vehículo de interés
- Presupuesto
- Financiamiento
- Trade-in
- Cita
- Entrega

---

## 10. Arquitectura técnica

### Frontend

Vanilla Web, igual a la filosofía usada en Kelo World:

- HTML
- CSS
- JavaScript
- Mobile-first
- PWA en una fase posterior

No introducir React, Next u otro framework sin una razón técnica demostrable.

### Backend futuro

```text
Vanilla HTML/CSS/JS
        ↓
      REST API
        ↓
 PostgreSQL / Supabase
        ↓
WhatsApp Business Platform
```

Reglas:

- Los tokens de WhatsApp nunca van en el navegador.
- El frontend habla con nuestro backend.
- El backend habla con APIs externas.
- La UI debe poder funcionar con datos mock antes de conectar servicios reales.

---

## 11. Fases

### Fase 0 — Prototipo funcional

Objetivo: validar el flujo desde iPhone antes de integrar APIs.

Entregables:

- `index.html` mobile-first.
- Navegación funcional.
- Selector WhatsApp 1/2/3/Todos.
- Lista de chats demo.
- Vista cliente.
- Agenda demo.
- Recordatorios.
- Pantalla Hoy.
- Bolsa de salida.
- Datos simulados/locales.

Criterio de salida:

> Desde iPhone se puede recorrer el flujo completo de una operación de reloj sin depender de WhatsApp real.

### Fase 1 — Persistencia real

- Base de datos.
- Clientes persistentes.
- Citas persistentes.
- Tareas.
- Historial.
- Usuarios/agentes.
- Autenticación.

### Fase 2 — WhatsApp real

- Integración oficial WhatsApp Business Platform.
- Webhooks.
- 3 números/canales.
- Mensajes entrantes y salientes.
- Estados sent/delivered/read/failed cuando estén disponibles.
- Ventana de atención y templates gestionados correctamente.

### Fase 3 — Operación comercial

- Asignación manual de clientes a representantes.
- Estados de lead.
- Follow-ups.
- Métricas.
- Ventas/cierres.
- Auditoría de actividad.

### Fase 4 — Automatización controlada

La automatización llega después de que el flujo manual esté probado.

- Botón para ejecutar acciones automáticas.
- SMS/correo/WhatsApp según permisos y proveedores conectados.
- Recordatorios automáticos.
- Reglas de seguimiento.
- Asignación automática opcional.

### Fase 5 — Inteligencia

- Resúmenes de conversaciones.
- Detección de intención.
- HOT / WARM / COLD.
- Próxima mejor acción sugerida.
- Alertas de clientes olvidados.
- Análisis de cierres.
- Aprendizaje operativo a partir del historial autorizado.

### Fase 6 — Expansión Kelo Associates

- Bathroom Remodeling.
- Kitchen Remodeling.
- Roofing.
- Autos.
- Nuevas verticales sin reconstruir el núcleo.

---

## 12. Métricas previstas

- Chats sin responder.
- Tiempo hasta primera respuesta.
- Tiempo promedio de respuesta.
- Citas creadas.
- Citas completadas.
- No-shows.
- Follow-ups pendientes.
- Ventas cerradas.
- Tasa de cierre.
- Valor vendido.
- Producción por canal.
- Producción por representante.
- Fuente del lead.
- Valor de vida del cliente.

---

## 13. Regla de producto

Kelo Associates debe ahorrar memoria humana y pasos manuales.

Cada función nueva debe responder al menos una de estas preguntas:

1. ¿Evita que olvidemos algo?
2. ¿Reduce el tiempo para ejecutar una tarea?
3. ¿Aumenta la probabilidad de cerrar una venta?
4. ¿Nos da información útil que antes no teníamos?
5. ¿Permite escalar a más clientes o representantes sin perder control?

Si no cumple ninguna, probablemente no pertenece al núcleo.

---

## 14. Norte del proyecto

La primera victoria no será “tener un CRM grande”.

La primera victoria será mucho más concreta:

> Un cliente escribe, se agenda correctamente, la app recuerda qué llevar y a qué hora, el encuentro ocurre y el resultado queda registrado sin depender de la memoria de una persona.

Cuando eso sea sólido, construiremos encima el sistema operativo completo de Kelo Associates.

---

## 15. Operator OS — Relojes, Zara y Moissanita

La primera operación real ampliada se centra en tres líneas concretas: relojes, ropa de Zara y joyería de moissanita. Operator OS debe ser una herramienta para ejecutar el día, no un CRM genérico.

Navegación operativa:

- `HOY` — próxima mejor acción.
- `CHATS` — WhatsApp + intención + takeover humano.
- `ORDERS` — reservado, pagado, listo, delivery, entregado.
- `PRODUCTS` — inventario + demanda real.
- `MONEY` — cobrado, pendiente y por cobrar.

Funciones ya incorporadas al prototipo:

- medidor de intención/HOT por conversación;
- alertas de oportunidades calientes;
- Next Action Engine;
- `WHAT AM I FORGETTING?`;
- tareas rápidas estructuradas;
- inventario sensible a demanda;
- pedidos y cobros;
- registro separado del núcleo CRM existente.

### Tareas rápidas

La tarea debe evitar escritura siempre que sea posible. Constructor minimalista con:

- acción: Comprar, Vender, Reparar, Cambiar, Llamar, Confirmar, Cobrar, Entregar, Conseguir, Follow-up;
- negocio;
- cliente;
- producto;
- fecha/hora;
- anticipación de alerta;
- prioridad;
- nota opcional.

La meta es convertir una intención en una tarea accionable en pocos toques.

---

## 16. Fiado / Cuentas por cobrar

Problema real: se realizan ventas con saldos pendientes y el dueño puede olvidar cobrar. El sistema debe convertir cada saldo pendiente en una obligación persistente hasta que se resuelva.

### Principio

Una deuda nunca desaparece porque cambie la fecha prometida.

Cada cuenta debe preservar:

- monto original;
- monto pagado;
- balance restante;
- fecha original prometida;
- fecha actual de cobro;
- número de promesas;
- promesas incumplidas;
- lista de pagos;
- historial de reagendamientos;
- estado: open / overdue / paid / written_off.

### Acciones operativas

- `PAID` — registrar pago y cerrar saldo cuando llegue a cero.
- `REMIND` — preparar acción de cobro.
- `RESCHEDULE` — mover próxima fecha SIN borrar la fecha original ni los incumplimientos.
- `WHAT AM I FORGETTING?` debe subir las deudas vencidas y las que vencen hoy.

### Perfil de pago

Kelo puede mostrar hechos históricos observables para ayudar al dueño a recordar el comportamiento comercial del cliente, por ejemplo:

- cuánto ha comprado;
- cuánto ha pagado;
- cuántas veces pagó tarde;
- cuántas promesas incumplió;
- deuda abierta actual.

La decisión de fiar o no fiar permanece humana. El sistema no concede crédito automáticamente ni define límites automáticos de financiación.

### Audio y texto

Cuando exista backend/IA real, las conversaciones y notas de audio autorizadas podrán alimentar eventos estructurados como:

`PROMISE_TO_PAY(amount, date)`

El sistema propondrá actualizar el cobro, pero preservará todo el historial anterior.

---

## 17. Regla permanente de contexto y ejecución

A partir de esta etapa, cuando el usuario diga **“ejecuta”** respecto a una nueva función, workflow o lógica de Kelo Associates:

1. inspeccionar primero el estado real del repositorio;
2. integrar la función sin duplicar sistemas existentes;
3. mantener la distinción entre función real, mock y pendiente de backend;
4. registrar en `ROADMAP.md` la intención del producto, reglas y flujo relevante de esa ejecución;
5. si afecta estado técnico, actualizar también la documentación técnica correspondiente cuando sea necesario.

`ROADMAP.md` actúa como memoria de producto para que futuros agentes entiendan no solo qué existe, sino **por qué existe y cómo debe comportarse**.

---

## 18. Dirección visual — Apple-inspired, vanilla y espaciosa

La interfaz de Operator OS debe sentirse premium, tranquila, clara y rápida sin copiar literalmente componentes propietarios de Apple. La implementación continúa siendo 100% HTML/CSS/JavaScript vanilla.

Principios visuales:

- contenido primero; la decoración nunca compite con la tarea;
- jerarquía mediante tamaño, espacio y agrupación en lugar de exceso de bordes;
- tipografía del sistema `-apple-system` / `BlinkMacSystemFont` para sentirse natural en iPhone sin distribuir fuentes externas;
- superficies translúcidas y blur únicamente para navegación, sheets y capas funcionales;
- tarjetas amplias, radios suaves y separación generosa;
- una acción primaria clara por contexto;
- animaciones cortas y discretas, con soporte `prefers-reduced-motion`;
- safe areas de iPhone respetadas;
- soporte automático light/dark mediante `prefers-color-scheme`;
- branding discreto: la utilidad tiene prioridad sobre logos y decoración.

### Navegación móvil

En iPhone, `HOY · CHATS · ORDERS · PRODUCTS · MONEY` funciona como navegación global y debe permanecer accesible en una barra flotante inferior translúcida. La parte superior queda libre para contenido, filtros de negocio y acciones importantes.

### Sheets

TASK RÁPIDA y futuras acciones contextuales deben abrir en sheets inferiores con:

- dimming/blur de fondo;
- esquinas amplias;
- handle superior;
- controles agrupados;
- botón principal claro;
- escritura libre solo cuando aporte valor.

### Regla visual

Si un cambio hace la interfaz más llamativa pero más lenta de leer, más densa o más difícil de operar con una mano, se rechaza.

---

## 19. Madurez UI — 30 mejoras aplicadas

Operator OS incorpora una capa visual e interacción separada (`operator-mature.css` + `ui-maturity.js`) para madurar la interfaz sin contaminar la lógica comercial. Las mejoras implementadas son:

1. shell más estrecho y respirado para lectura natural;
2. escala tipográfica consistente tipo sistema;
3. encabezado con jerarquía clara y menos ruido;
4. espaciado vertical coherente entre bloques;
5. selector de negocio como segmented control;
6. active state sobrio y perceptible;
7. feedback táctil/pressed state;
8. jerarquía primaria/secundaria consistente en botones;
9. targets táctiles mínimos más cómodos;
10. foco visible para teclado/accesibilidad;
11. hero sin caja decorativa innecesaria;
12. view headers más limpios y editoriales;
13. KPIs con números tabulares y mejor lectura;
14. cards con superficie, no exceso de borders;
15. radios consistentes en toda la UI;
16. metadata secundaria con contraste controlado;
17. heat badges diferenciados sin ruido visual;
18. barras de heat más delgadas y legibles;
19. acciones contextuales agrupadas y espaciadas;
20. patrón definido para estados vacíos;
21. `WHAT AM I FORGETTING?` tratado como bloque de atención, no error;
22. alertas HOT con blur funcional y jerarquía de modal ligero;
23. toast compacto tipo pill con feedback no invasivo;
24. TASK RÁPIDA como bottom sheet maduro;
25. controles del task builder agrupados por decisión;
26. inputs/selects con superficies suaves y targets grandes;
27. preview de tarea como confirmación contextual;
28. estados de dinero con semántica visual consistente;
29. tabs de escritorio tratados como segmented navigation;
30. en iPhone, navegación principal flotante inferior con safe-area, glass discreto y alcance de una mano.

Además se añadieron mejoras de accesibilidad/interacción: roles de tab, `aria-selected`, live regions, cierre por Escape, título dinámico por vista/negocio, soporte `prefers-reduced-motion` y comportamiento de date/time picker cuando el navegador lo permite.

### Regla de madurez

Una pantalla madura debe poder responder en menos de unos segundos: qué está pasando, qué necesita atención y cuál es la siguiente acción. Si requiere interpretar demasiadas cajas, colores o textos, debe simplificarse antes de añadir funciones nuevas.

---

## 20. Daily Profit Ledger — ventas y ganancia real del día

Problema real: conocer cuánto se vendió no basta. El dueño necesita saber cuánto quedó realmente después de pagar producto y gastos directos de la operación.

Dentro de `MONEY`, cada venta puede registrar:

- negocio: relojes, Zara o moissanita;
- cliente;
- producto;
- precio final de venta;
- costo de compra del producto;
- costo de caja/empaque;
- gasolina atribuida a la operación;
- tolls/peajes;
- otros gastos directos.

Kelo calcula automáticamente:

`TOTAL_COST = PRODUCT_COST + BOX_COST + GAS + TOLLS + OTHER`

`NET_PROFIT = SALE_PRICE - TOTAL_COST`

`MARGIN = NET_PROFIT / SALE_PRICE`

La pantalla `MONEY` debe mostrar para el día:

- número de ventas;
- revenue vendido;
- costos reales;
- ganancia neta;
- desglose de cada venta y su margen.

Ejemplo:

```text
Daytona Black
Venta              $200
Reloj                $40
Caja                 $15
Gas                  $12
Tolls                  $7
------------------------
Costo real            $74
Ganancia neta        $126
Margen               63.0%
```

### Principio contable operativo

El objetivo inicial no es sustituir contabilidad fiscal ni bookkeeping profesional. Es responder rápidamente a la pregunta operativa: **¿cuánto dinero dejó realmente esta venta?**

Los costos deben permanecer separados para permitir después descubrir cuánto se está perdiendo en delivery, gasolina, cajas, descuentos u otros gastos.

### Implementación actual

- `daily-profit-ledger.js` mantiene el ledger local del prototipo;
- `daily-profit-ledger.css` aporta la UI especializada;
- `ui-maturity.js` carga el módulo dentro de Operator sin acoplarlo a la lógica principal;
- persistencia provisional mediante `localStorage` hasta que el backend real se convierta en fuente de verdad.
