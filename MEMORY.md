# KELO ASSOCIATES — MEMORIA OPERATIVA Y TÉCNICA

Este documento existe para que cualquier agente, desarrollador o sesión futura pueda retomar el proyecto sin perder decisiones, intención ni contexto.

## 0. Identidad del proyecto

**Nombre:** Kelo Associates

**Repositorio:** `kelffren/Kelo-Associates`

**Rama principal:** `main`

**Estado actual:** inicio de Fase 0 / prototipo funcional.

**Producto inicial:** `Kelo Inbox`.

Kelo Inbox no es el producto final. Es la primera interfaz operativa de un sistema más grande para gestionar relaciones comerciales, leads, conversaciones, citas, tareas, representantes, ventas y servicios múltiples.

---

## 1. Tesis principal

Kelo Associates será una capa de confianza y coordinación entre clientes y proveedores/servicios.

La compañía no debe pensarse como una colección desconectada de negocios. El activo principal será la relación acumulada con el cliente y la capacidad de entender qué necesita, coordinar quién lo atiende, medir qué pasó y volver a servirlo en el futuro.

Por eso el **cliente es global** y las verticales son módulos.

Ejemplo conceptual:

```text
Cliente Juan Pérez
 ├─ Relojes
 ├─ Bathroom Remodeling
 ├─ Autos
 └─ futuras necesidades
```

La plataforma debe preservar ese historial en un perfil único.

---

## 2. Primera fase escogida

La primera fase será un inbox/CRM web para administrar **3 WhatsApp** y el flujo de venta de relojes.

La razón no es porque el proyecto vaya a ser solamente de relojes. Es porque el negocio de relojes ofrece un caso real, frecuente y fácil de comprobar para validar el sistema operativo.

Problemas actuales que se quieren resolver:

- varios WhatsApp;
- conversaciones dispersas;
- clientes que piden relojes y luego se olvida el modelo;
- citas pactadas dentro del chat;
- falta de una agenda central;
- olvidar llevar un reloj solicitado;
- no recordar preparar artículos el día anterior;
- falta de seguimiento;
- falta de métricas;
- falta de historial único por cliente.

---

## 3. Decisión técnica principal

El frontend se construirá en **Vanilla HTML + CSS + JavaScript**, mobile-first, siguiendo una filosofía similar a Kelo World.

### No hacer por defecto

- No React solo por moda.
- No Next.js sin necesidad demostrada.
- No introducir dependencias pesadas si el navegador puede resolverlo.
- No bloquear la UI inicial por una integración externa.

### Sí hacer

- componentes visuales claros aunque estén implementados en JS vanilla;
- módulos separados cuando el proyecto crezca;
- estado predecible;
- diseño mobile-first;
- PWA posteriormente;
- datos mock primero;
- backend después;
- APIs externas aisladas detrás de nuestro servidor.

---

## 4. Arquitectura prevista

```text
[ iPhone / Android / Desktop ]
             │
             ▼
      Kelo Associates UI
      HTML + CSS + JS
             │
             ▼
          REST API
             │
      ┌──────┴──────┐
      ▼             ▼
 PostgreSQL       Integraciones
 / Supabase       externas
                    │
                    ├─ WhatsApp
                    ├─ SMS
                    ├─ Email
                    └─ otras
```

### Seguridad obligatoria

Nunca colocar tokens secretos, claves privadas ni credenciales de WhatsApp en el frontend.

---

## 5. Filosofía del producto

La aplicación debe sentirse como un **asistente operativo**, no como una base de datos que obliga al usuario a alimentar formularios todo el día.

Debe responder de inmediato:

- ¿A quién tengo que contestar?
- ¿Qué citas tengo hoy?
- ¿Qué debo llevar?
- ¿Qué me falta preparar?
- ¿A quién tengo que dar seguimiento?
- ¿Qué se vendió?
- ¿Qué representante tiene cada cliente?

La pantalla `Hoy` tendrá prioridad alta porque resume la operación diaria.

---

## 6. Estructura inicial de navegación

### Hoy

Centro operativo del día.

Debe mostrar:

- citas de hoy;
- clientes;
- hora;
- lugar;
- artículos necesarios;
- estado de preparación;
- recordatorios críticos;
- chats sin responder;
- follow-ups vencidos.

### Chats

Selector superior:

```text
WhatsApp 1 | WhatsApp 2 | WhatsApp 3 | Todos
```

Debe permitir una bandeja unificada sin perder el canal de origen.

### Clientes

Cada cliente debe tener un perfil único con historial.

### Agenda

Citas próximas y pasadas.

### Recordatorios

Tareas temporales y alertas.

### Más

Configuración, métricas, equipo y futuros módulos.

---

## 7. Modelo mental de cliente

Un cliente no es un chat.

Un chat es una interacción que pertenece a un cliente.

Modelo conceptual:

```text
CLIENTE
 ├─ teléfonos
 ├─ canales
 ├─ conversaciones
 ├─ citas
 ├─ notas
 ├─ tareas
 ├─ oportunidades
 ├─ compras/contratos
 └─ eventos de historial
```

Si el mismo cliente aparece posteriormente en otra vertical, debe conservar su identidad e historial.

---

## 8. Entidades universales

Estas deben sobrevivir cuando el proyecto deje de ser solo relojes:

### Client
- id
- name
- phone
- email
- status
- owner/assigned_agent
- source
- created_at
- updated_at

### Channel
- id
- type
- account
- external_identifier

### Conversation
- id
- client_id
- channel_id
- status
- last_message_at

### Message
- id
- conversation_id
- direction
- body
- status
- sent_at

### Appointment
- id
- client_id
- vertical
- date_time
- location
- status
- assigned_agent
- notes

### Task
- id
- client_id
- appointment_id optional
- title
- due_at
- status
- priority

### Reminder
- id
- task/appointment relation
- trigger_at
- delivery method
- status

### Opportunity
- id
- client_id
- vertical
- estimated_value
- stage
- source

### Assignment
- id
- object type
- object id
- agent
- assigned_at

### Sale / Contract
- id
- client_id
- vertical
- amount
- commission
- closed_at

### Timeline Event
- id
- client_id
- type
- payload
- timestamp

---

## 9. Vertical Relojes — campos especiales

Estos campos no deben contaminar el núcleo global.

- modelo solicitado;
- referencia;
- variante/color;
- precio;
- con caja / sin caja;
- inventario relacionado;
- lugar de encuentro;
- lista de relojes que llevar;
- accesorios que llevar;
- resultado de la cita.

### Ejemplo de cita

```text
Carlos M.
Daytona negro
5:30 PM
Bronx

Llevar:
✓ Daytona negro
✓ Submariner
□ GMT
```

---

## 10. Bolsa de salida

Esta característica es prioritaria.

Debe sumar lo necesario para todas las citas relevantes y presentar una checklist única antes de salir.

Ejemplo:

```text
BOLSA DE SALIDA

2 × Daytona negro
1 × Submariner
1 × GMT
2 × cajas

Estado: 3/6 preparados
```

Puede evolucionar en el futuro para otras verticales como documentación, muestras, herramientas, contratos, llaves, etc.

---

## 11. Recordatorios

Al agendar una cita deben poder generarse automáticamente tareas como:

- preparar artículos la noche anterior;
- resumen del día;
- recordar cita 2 horas antes;
- recordar salida 30 minutos antes;
- pedir confirmación al cliente;
- registrar el resultado después.

El usuario debe poder activar/desactivar reglas.

No construir automatizaciones agresivas antes de validar el flujo manual.

---

## 12. WhatsApp — decisión de integración

La interfaz puede mostrar tres cuentas desde el principio usando datos simulados.

La conexión real llegará después mediante la **plataforma oficial de WhatsApp Business**, con backend y webhooks.

Principios:

- no automatizar con hacks de WhatsApp Web;
- no guardar tokens en JS del navegador;
- identificar siempre el canal/número por el que entró el mensaje;
- mantener cliente y conversación como entidades separadas;
- construir la UI de forma que funcione incluso si WhatsApp está desconectado temporalmente.

---

## 13. Métricas importantes

Primeras métricas útiles:

- chats sin responder;
- primera respuesta;
- tiempo promedio de respuesta;
- citas de hoy;
- citas completadas;
- cancelaciones;
- no-shows;
- follow-ups pendientes;
- ventas cerradas;
- tasa de cierre;
- valor vendido;
- rendimiento por número/canal;
- rendimiento por representante.

Más adelante:

- coste por lead;
- revenue por fuente;
- comisión;
- lifetime value;
- cross-sell entre verticales;
- reactivación de clientes.

---

## 14. Expansión futura

### Bathroom Remodeling

Campos previstos:

- ZIP;
- homeowner;
- full/partial remodel;
- presupuesto;
- urgencia;
- fotos;
- disponibilidad;
- financiamiento;
- representante asignado;
- estimado;
- contrato.

### Kitchen Remodeling

Reutiliza el núcleo de Bathroom con campos propios.

### Roofing

Reutiliza leads, cita, representante, estimado y contrato.

### Autos

Campos previstos:

- vehículo;
- presupuesto;
- financiamiento;
- trade-in;
- cita;
- entrega.

---

## 15. Asignaciones y representantes

La plataforma debe evolucionar hacia un sistema donde un lead se pueda asignar manualmente a una persona.

Primera etapa:

```text
Lead → seleccionar representante → Asignar
```

Después puede existir un botón de automatización que dispare acciones autorizadas como:

- SMS;
- email;
- WhatsApp;
- llamada/solicitud de llamada;
- notificación interna.

La automatización debe ser opcional y auditable.

---

## 16. Historial y aprendizaje

Cada acción importante debe dejar rastro:

- quién respondió;
- quién cambió un estado;
- quién asignó el cliente;
- cuándo se creó la cita;
- si se confirmó;
- resultado;
- venta;
- notas.

Esto permitirá mejorar calidad, entrenar procesos y eventualmente usar IA sobre información autorizada.

---

## 17. IA futura

No es necesaria para V0.1.

Cuando el sistema básico funcione, la IA puede ayudar a:

- resumir chats;
- detectar intención;
- detectar urgencia;
- sugerir respuesta;
- marcar HOT/WARM/COLD;
- encontrar clientes olvidados;
- sugerir próxima acción;
- analizar por qué se cierran o pierden ventas.

La IA no debe convertirse en una dependencia para abrir el inbox o ejecutar tareas básicas.

---

## 18. Criterios de diseño

- Mobile-first real.
- Usable con una mano.
- Targets táctiles grandes.
- Poca escritura manual.
- Información importante arriba.
- Estados y colores consistentes.
- Navegación persistente.
- No esconder acciones críticas en menús profundos.
- Velocidad percibida alta.
- Evitar loaders largos.

---

## 19. Regla de arquitectura para futuras sesiones

Antes de agregar una función, clasificarla:

### Núcleo
Sirve para todas las verticales.

Ejemplos: cliente, cita, task, assignment.

### Vertical
Sirve solo a un negocio.

Ejemplo: `watch_model`.

### Integración
Conecta con servicio externo.

Ejemplo: WhatsApp API.

### Inteligencia
Analiza o automatiza sobre datos existentes.

Ejemplo: lead scoring.

No mezclar estas capas sin necesidad.

---

## 20. Regla para agentes/desarrolladores

Antes de modificar el proyecto:

1. Leer `MEMORY.md`.
2. Leer `ROADMAP.md`.
3. Inspeccionar el código actual.
4. No reconstruir funciones existentes sin verificar si ya existen.
5. Preservar mobile-first.
6. Mantener el núcleo independiente de la vertical Relojes.
7. Probar el flujo completo después de cualquier cambio relevante.
8. Documentar decisiones importantes.

---

## 21. Definición de éxito de V0.1

Un usuario desde iPhone debe poder:

1. abrir Kelo Associates;
2. ver `Hoy`;
3. cambiar entre WhatsApp 1/2/3/Todos;
4. abrir un chat simulado;
5. ver el perfil del cliente;
6. crear o visualizar una cita;
7. saber qué reloj llevar;
8. marcarlo preparado;
9. ver recordatorios;
10. registrar el resultado.

Todo esto debe funcionar sin backend real para validar UX primero.

---

## 22. Estado al crear esta memoria

- Repositorio creado y disponible.
- `ROADMAP.md` creado.
- Se está creando el primer `index.html` funcional.
- No hay todavía backend conectado.
- No hay todavía WhatsApp real conectado.
- Los datos iniciales son mock/demostración.

---

## 23. Norte a largo plazo

Kelo Associates debe convertirse en un sistema que recuerde lo que una operación humana suele olvidar, coordine lo que normalmente queda disperso y convierta relaciones aisladas en una red comercial acumulativa.

La tecnología no es el producto por sí sola. El producto es:

> cliente correcto + necesidad entendida + persona correcta + seguimiento correcto + resultado medido.

La primera prueba de esa idea será mucho más simple: que ningún reloj pedido para una cita vuelva a depender únicamente de la memoria.
