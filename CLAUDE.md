# Gym Tracker — contexto para Claude

App web personal (un solo usuario) para registrar entrenamientos de gimnasio desde el celular.

## Principio de UX (no negociable)
Registrar una serie = 1–2 toques. Mobile-first, botones grandes, todo prellenado con lo del último entreno.
La hora de llegada NO se escribe: `Workout.startedAt` se guarda al tocar "Empezar entreno".

## Stack
- `apps/api`: Node 20 + Express + TypeScript + Prisma + PostgreSQL 16. Validación con zod. Tests con vitest + supertest.
- `apps/web`: React + Vite + TypeScript + Tailwind + React Router + TanStack Query + Recharts. PWA con vite-plugin-pwa.
- Todo con Docker Compose. Deploy en servidor propio vía Cloudflare Tunnel en `gym.bravoserver.fun`.
- Auth: ninguna en la app; se protege con Cloudflare Access delante.

## Estructura
```
apps/api/      prisma/schema.prisma, src/routes, src/services, src/lib
apps/web/      src/pages, src/components, src/api, src/hooks
docker-compose.yml          (dev)
docker-compose.prod.yml     (prod)
```

## Modelo de datos (Prisma)
Exercise, Workout, WorkoutExercise, WorkoutSet, Routine, RoutineItem.
- Usar `WorkoutSet`, NO `Set` (choca con el `Set` global de JS en el cliente generado).
- Peso siempre en kg (Float). `onDelete: Cascade` desde Workout → WorkoutExercise → WorkoutSet.

## Convenciones
- TypeScript estricto en ambos lados. Tipos de request/response compartidos vía schemas zod.
- Rutas REST finas; la lógica va en `services/`.
- UI en español. Código, nombres de variables y commits en inglés.
- Un commit por tarea terminada, con mensaje convencional (`feat:`, `fix:`, `chore:`).
- Antes de dar algo por terminado: `npm run typecheck`, `npm test` y que levante con `docker compose up`.

## Comandos
- `docker compose up -d db` — solo la base de datos
- `npm run dev -w apps/api` / `npm run dev -w apps/web`
- `npx prisma migrate dev -w apps/api`
- `npm test -w apps/api`

## Plan
Ver `PLAN.md`. Trabajar una fase a la vez y marcar los checkboxes al terminar.
