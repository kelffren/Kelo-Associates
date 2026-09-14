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
