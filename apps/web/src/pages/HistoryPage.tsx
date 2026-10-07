import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { listWorkouts } from '../api/workouts.ts';
import type { WorkoutSummary } from '../api/types.ts';
import { formatArrivalTime, formatDate, formatDuration } from '../lib/formatters.ts';

function groupByDate(workouts: WorkoutSummary[]): [string, WorkoutSummary[]][] {
  const map = new Map<string, WorkoutSummary[]>();
  for (const workout of workouts) {
    const key = formatDate(workout.startedAt);
    const group = map.get(key);
    if (group) {
      group.push(workout);
    } else {
      map.set(key, [workout]);
    }
  }
  return [...map.entries()];
}

export function HistoryPage() {
  const navigate = useNavigate();
  const { data: workouts, isLoading } = useQuery({
    queryKey: ['workouts'],
    queryFn: listWorkouts,
  });

  const groups = groupByDate(workouts ?? []);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">Historial</h1>

      {isLoading && <p className="text-neutral-500">Cargando...</p>}

      {!isLoading && groups.length === 0 && (
        <p className="text-neutral-500">Todavía no hay entrenos registrados.</p>
      )}

      {groups.map(([date, dayWorkouts]) => (
        <section key={date}>
          <h2 className="mb-2 text-sm font-medium uppercase text-neutral-500">{date}</h2>
          <div className="flex flex-col gap-2">
            {dayWorkouts.map((workout) => (
              <button
                key={workout.id}
                type="button"
                onClick={() => navigate(`/historial/${workout.id}`)}
                className="rounded-xl bg-neutral-900/60 p-3 text-left active:bg-neutral-800"
                style={{ minHeight: 48 }}
              >
                <div className="flex items-baseline justify-between">
                  <span className="font-semibold">{formatArrivalTime(workout.startedAt)}</span>
                  <span className="text-sm text-neutral-400">
                    {formatDuration(workout.startedAt, workout.finishedAt)}
                  </span>
                </div>
                <p className="text-sm text-neutral-400">
                  Volumen: {workout.totalVolumeKg.toLocaleString('es-EC')} kg
                </p>
                {workout.exercises.length > 0 && (
                  <p className="text-sm text-neutral-500">
                    {workout.exercises.map((e) => e.name).join(', ')}
                  </p>
                )}
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
