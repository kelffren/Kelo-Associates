# Kelo Intelligence — Supervisor de Inbox

> Leer junto con MEMORY.md, ROADMAP.md y KELO_INBOX_ARCHITECTURE.md antes de tocar IA, Inbox o conexiones.

## Objetivo
Kelo Intelligence es una capa superior sobre todos los canales autorizados. No necesita reemplazar la IA nativa de Meta. Lee la copia normalizada de conversaciones que Kelo Associates puede obtener legítimamente y responde: **¿qué merece atención ahora y dónde parece haber mayor oportunidad comercial?**

## Dos disparadores
1. **Hourly run:** backend ejecuta el análisis cada hora.
2. **Analizar ahora:** botón móvil que llama al mismo pipeline inmediatamente.

No mantener dos implementaciones distintas.

## Pipeline
```text
Provider inboxes / Meta AI / humanos
          ↓
webhooks + sync autorizado
          ↓
Kelo normalized messages
          ↓
signal extraction
          ↓
Kelo Intelligence
    ├─ Attention Score
    ├─ Money Opportunity Score
    ├─ recommended action
    ├─ reason codes
    └─ account summary
          ↓
Attention Center + push notification queue
```

## Lo que analiza
- intención explícita de comprar;
- pregunta por precio/disponibilidad;
- intención de cita;
- interés en shipping;
- cliente previo;
- valor estimado de oportunidad;
- unread/stale;
- cliente pide humano;
- bucle donde IA y cliente no avanzan;
- sentimiento negativo que requiere revisión.

La puntuación es priorización operativa, no una garantía de compra o dinero.

## Attention Center
Vista principal:
- **Necesita tu atención**
- **Probable dinero**
- **IA atascada**
- **Sin responder**
- **Por cuenta**
- **Analizado hace X min**
- botón **ANALIZAR AHORA**

Cada tarjeta debe explicar POR QUÉ apareció y sugerir una acción. Nunca mostrar solo un score opaco.

## Multi-Facebook
Cuatro cuentas Facebook autorizadas se modelan como cuatro ProviderConnections/Channels. El dashboard agrega y compara:
- chats que requieren atención;
- oportunidades HOT;
- opportunity score acumulado;
- top priority;
- tiempo de respuesta;
- ventas/appointments cuando estén vinculados.

Agregar la quinta cuenta no cambia el algoritmo.

## IA sobre IA
Guardar attribution por mensaje:
- customer
- human
- meta_ai
- kelo_ai
- other_ai

Kelo Intelligence puede evaluar resultados de conversaciones atendidas por Meta AI sin necesitar controlar esa IA. El objetivo es supervisión y escalamiento humano.

## OpenAI
OpenAI debe ser un adapter/model provider intercambiable en backend. No acoplar reglas comerciales al SDK/modelo. Guardar:
- model/provider;
- prompt/policy version;
- run id;
- timestamps;
- output estructurado;
- razones;
- coste/tokens cuando estén disponibles.

API keys solo servidor.

## Notificaciones móviles
Backend genera candidatos cuando attentionScore/moneyScore supera umbral. Antes de push:
- deduplicar por conversación/evento;
- cooldown;
- no repetir si nada cambió;
- deep link a conversación/cliente;
- respetar quiet hours/configuración del usuario.

Ejemplos: “3 clientes necesitan tu atención”; “Oportunidad alta: cliente preguntó precio + disponibilidad”; “Meta AI parece atascada: revisar conversación”.

## Persistencia futura
Tablas/colecciones:
- intelligence_runs
- intelligence_items
- conversation_signals
- notification_events
- ai_attribution
- intelligence_policies

No almacenar todo el prompt sensible en logs de producción por defecto.

## API objetivo
- POST /v1/intelligence/runs — manual run.
- GET /v1/intelligence/latest — último resultado.
- GET /v1/intelligence/attention — cola actual.
- GET /v1/intelligence/accounts — resumen por conexión.
- PATCH /v1/intelligence/policy — umbrales/preferencias.
- POST /v1/push/subscriptions — registrar dispositivo/PWA.

## Scheduler
Producción: cron/worker backend cada hora llama al MISMO servicio que el botón manual. Evitar scheduler en frontend: iOS puede cerrar la PWA y no es fiable.

## Seguridad y límites
- solo datos de conexiones autorizadas;
- mínimo acceso necesario;
- no automatizar evasión de controles de plataforma;
- no afirmar acceso a Marketplace inbox si Meta no lo expone;
- Kelo AI puede recomendar takeover, no debe enviar mensajes por un canal sin capability oficial;
- human override siempre disponible.

## Criterios de aceptación
1. 4+ conexiones pueden aparecer en un solo análisis.
2. Run manual y hourly producen el mismo formato.
3. Resultado ordena atención y oportunidad monetaria por separado.
4. Cada resultado incluye razones y acción sugerida.
5. Puede detectar AI loop/human takeover.
6. Resumen compara cuentas sin mezclar attribution.
7. Push se deduplica y tiene cooldown.
8. OpenAI puede cambiarse sin modificar el dominio CRM.
9. Ninguna key/token vive en frontend.
10. Si un canal es read-only, análisis sí; envío no.
