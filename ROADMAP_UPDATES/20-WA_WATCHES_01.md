# Roadmap Update 20 — WA_WATCHES_01

Esta actualización forma parte del Roadmap Maestro y documenta la ejecución del primer canal real de WhatsApp para el negocio de Relojes.

## Objetivo

Conectar un único número piloto antes de escalar a Zara, Moissanita u otros números.

Canal:

- ID interno: `WA_WATCHES_01`
- negocio: `watches`
- nombre: `Watches Main`
- tipo: `whatsapp`

## Regla de identidad

El número de teléfono NO sustituye el `customer_id` interno. Kelo conserva un ID propio y usa teléfono/WhatsApp como identificador externo del canal.

## Flujo obligatorio

`WhatsApp → webhook → channel resolver → customer resolver → conversation → message persistence → AI analysis → heat → next action → human takeover`

Salida:

`Kelo/AI/human → backend → WhatsApp provider → customer`

## Seguridad

- nunca guardar access tokens, app secret ni verify token en GitHub Pages/localStorage;
- los secretos viven solo en backend/environment secrets;
- la UI puede guardar metadata pública/operativa como phone number, phone_number_id y WABA ID;
- `connected` solo se muestra después de una prueba real de entrada y salida.

## Estado implementado

- `channels.js` con registry `WA_WATCHES_01`;
- `connections.html` como pantalla de conexión;
- `connections.js` con persistencia de metadata y test harness local;
- `connections.css` con UI mobile-first;
- `WHATSAPP_WATCHES_01_CONTRACT.md` con contrato de webhook y salida;
- test incoming simulado crea cliente, conversación y mensaje en `kelo-associates-v2`;
- test outgoing valida únicamente el flujo UI/local hasta que exista backend real.

## Criterio de aceptación real

Desde otro teléfono enviar:

> ¿Tienes Daytona negro?

Debe entrar por WhatsApp real, persistirse, aparecer en Kelo, recibir análisis/heat, permitir respuesta IA y TAKE OVER humano, y la respuesta debe salir por `WA_WATCHES_01`.

No conectar un segundo número hasta cerrar este circuito.
