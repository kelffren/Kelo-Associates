# Kelo Associates — Actualizador automático

## Objetivo
La PWA debe detectar y aplicar versiones nuevas sin que el usuario tenga que borrar caché ni reinstalarla.

## Flujo
1. Cada push que cambia `main` dispara `.github/workflows/auto-version.yml`.
2. El workflow escribe el SHA actual en `service-worker.js` mediante `const BUILD='...'`.
3. Ese cambio produce una versión diferente del service worker y un nuevo namespace de caché.
4. `updater.js` registra el service worker con `updateViaCache: 'none'` y ejecuta `registration.update()`:
   - al abrir la app;
   - al recuperar conexión;
   - al volver la app al primer plano;
   - al recuperar foco;
   - cada 2 minutos mientras siga abierta.
5. Cuando el nuevo service worker toma control, la app muestra un aviso breve y recarga una sola vez.

## Reglas
- No pedir al usuario reinstalar la PWA después de cada commit.
- No depender de cambiar manualmente el número de caché.
- Mantener `updater.js` dentro de la lista `CORE` del service worker.
- No eliminar el marcador `const BUILD='...'`; el workflow depende de él.
- El commit automático del workflow solo modifica `service-worker.js`, por eso `paths-ignore` evita un loop infinito.

## Fallback
El fetch del service worker es network-first y guarda una copia reciente. Si no hay conexión, usa la caché actual y finalmente `index.html` como fallback de navegación.
