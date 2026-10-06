# Plan de ejecución — Gym Tracker

## Cómo usar este plan con Claude Code
1. Crea la carpeta del repo, `git init`, y pon `CLAUDE.md` y `PLAN.md` en la raíz.
2. Abre `claude` en esa carpeta.
3. Por cada fase:
   - Entra en plan mode (Shift+Tab) y pega el prompt de la fase.
   - Revisa el plan que te propone, ajusta y apruébalo.
   - Cuando termine, verifica los criterios de "Listo cuando" tú mismo.
   - Commit y `/clear` antes de pasar a la siguiente fase (el contexto vive en CLAUDE.md, no en el chat).
4. Si una fase sale mal: `git reset --hard` y repites con un prompt más específico, sin parchar encima.

---

## Fase 0 — Esqueleto del repo
**Prompt:**
> Lee CLAUDE.md. Monta el monorepo con npm workspaces: `apps/api` (Express + TS + Prisma) y `apps/web` (Vite React TS + Tailwind). Agrega docker-compose.yml con postgres 16 y volumen persistente, `.env.example`, ESLint + Prettier, y scripts `dev`, `build`, `typecheck` y `test` en cada app. Un endpoint `GET /health` en la API. Todavía no hagas el modelo de datos.

**Listo cuando:**
- [ ] `docker compose up -d db` levanta Postgres
- [ ] La API responde en `/health` y la web muestra una página vacía
- [ ] `npm run typecheck` pasa en ambas apps

## Fase 1 — Modelo de datos y API base
**Prompt:**
> Implementa el schema de Prisma descrito en CLAUDE.md (Exercise, Workout, WorkoutExercise, WorkoutSet, Routine, RoutineItem). Crea la migración y un seed con ~30 ejercicios comunes agrupados por músculo. Después implementa, con validación zod y tests de integración (vitest + supertest contra una DB de test):
> - `POST /workouts` (startedAt=now, routineId opcional; si viene, precarga los ejercicios de la rutina)
> - `GET /workouts/active`, `PATCH /workouts/:id/finish`, `GET /workouts?from&to`, `GET /workouts/:id`, `DELETE /workouts/:id`
> - `POST /workouts/:id/exercises`, `DELETE /workout-exercises/:id`
> - `POST /workout-exercises/:id/sets`, `PATCH /sets/:id`, `DELETE /sets/:id`
> - CRUD `/exercises` con búsqueda `?q=`
> Solo puede haber un workout activo a la vez: devuelve 409 si intento crear otro.

**Listo cuando:**
- [ ] Migración y seed corren limpios desde cero
- [ ] Todos los tests pasan
- [ ] Probé a mano un entreno completo con curl o Bruno

## Fase 2 — Frontend: entreno activo
**Prompt:**
> Lee CLAUDE.md. En apps/web configura React Router, TanStack Query y un cliente de API tipado. Diseño mobile-first, tema oscuro y botones de al menos 48px. Pantallas:
> - Home: botón grande "Empezar entreno", o "Continuar entreno" si hay uno activo
> - Entreno activo: cronómetro desde startedAt, lista de ejercicios, cada uno con filas `kg | reps | ✓` editables con steppers +/- (2.5 kg y 1 rep), "+ serie", "+ ejercicio" con buscador en bottom sheet, y botón "Terminar"
> Usa updates optimistas al marcar una serie. Barra de navegación inferior: Inicio, Historial, Rutinas.

**Listo cuando:**
- [ ] Puedo hacer un entreno completo desde el celular (usa la IP local o `vite --host`)
- [ ] Recargar la página a mitad del entreno no pierde nada
- [ ] Una serie se registra en 1–2 toques

## Fase 3 — Prellenado e historial
**Prompt:**
> Agrega `GET /exercises/:id/last`, que devuelve las series del último workout terminado que incluyó ese ejercicio. En el frontend, al agregar un ejercicio, crea las filas prellenadas con esos valores (sin marcar), y muestra en gris "Última vez: 3×8 @ 60kg". Agrega la pantalla Historial: lista por fecha con hora de llegada, duración, volumen total (Σ kg×reps, sin calentamientos) y ejercicios. Al tocar un entreno se abre su detalle, editable.

**Listo cuando:**
- [ ] El segundo entreno con el mismo ejercicio sale prellenado
- [ ] El historial muestra bien la hora de llegada y la duración en zona America/Guayaquil

## Fase 4 — Rutinas y timer de descanso
**Prompt:**
> CRUD de rutinas (API + pantalla) con ejercicios ordenables, series y reps objetivo. En Home, "Empezar entreno" deja elegir "Vacío" o una rutina. Timer de descanso: al marcar ✓ en una serie arranca una cuenta regresiva (90 s por defecto, configurable por ejercicio, guardada en localStorage) en una barra fija abajo, con vibración (`navigator.vibrate`) al terminar y botones +15 s / saltar.

**Listo cuando:**
- [ ] Puedo empezar un entreno desde una rutina con todo precargado
- [ ] El timer sigue funcionando si cambio de pantalla dentro de la app

## Fase 5 — Progreso y récords
**Prompt:**
> Agrega `GET /exercises/:id/progress`: por workout, el peso máximo, el 1RM estimado (Epley: w × (1 + reps/30)) y el volumen. Calcula PRs: mayor peso, mayor 1RM estimado y mayor volumen en una sesión. Crea una pantalla de detalle de ejercicio con un gráfico Recharts (selector de métrica y de rango: 1m/3m/todo) y la lista de PRs. En el entreno activo, muestra un badge 🏆 cuando una serie rompe un PR.

**Listo cuando:**
- [ ] Los gráficos cuadran con datos que verifiqué a mano
- [ ] El badge de PR aparece en el momento

## Fase 6 — PWA y offline
**Prompt:**
> Convierte la web en PWA con vite-plugin-pwa (manifest, íconos y modo standalone). Haz que el entreno activo funcione sin conexión: persiste el cache de TanStack Query en IndexedDB y encola las mutaciones offline para reintentarlas al volver la red. Muestra un indicador discreto de "sin conexión / sincronizando". Usa IDs temporales en el cliente para las series creadas offline.

**Listo cuando:**
- [ ] Se instala en el home del celular
- [ ] Con modo avión puedo registrar series y se sincronizan al reconectar sin duplicarse

## Fase 7 — Deploy
**Prompt:**
> Crea Dockerfiles de producción multi-stage para api y web (la web servida con nginx, que además hace proxy de `/api` a la API) y un `docker-compose.prod.yml` con postgres, api y web, healthchecks y `restart: unless-stopped`. Las migraciones se corren al arrancar la API (`prisma migrate deploy`). Agrega un servicio o script de backup diario con pg_dump que conserve 14 días. Documenta en README cómo agregar el ingress `gym.bravoserver.fun` a cloudflared y cómo protegerlo con Cloudflare Access (solo mi email).

**Listo cuando:**
- [ ] Funciona en `gym.bravoserver.fun` detrás de Access
- [ ] Un backup se restaura bien en una DB limpia

---

## Ideas para después (fuera del MVP)
- Exportar a CSV
- Peso corporal con gráfico
- Superseries
- Calendario de constancia tipo heatmap de GitHub
