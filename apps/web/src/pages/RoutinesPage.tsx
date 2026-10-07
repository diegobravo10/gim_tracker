import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { deleteRoutine, listRoutines } from '../api/routines.ts';

export function RoutinesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: routines, isLoading } = useQuery({
    queryKey: ['routines'],
    queryFn: listRoutines,
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => deleteRoutine(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['routines'] }),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Rutinas</h1>
        <button
          type="button"
          onClick={() => navigate('/rutinas/nueva')}
          className="rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-neutral-950 active:bg-emerald-400"
          style={{ minHeight: 48 }}
        >
          + Nueva
        </button>
      </div>

      {isLoading && <p className="text-neutral-500">Cargando...</p>}

      {!isLoading && routines?.length === 0 && (
        <p className="text-neutral-500">Todavía no tienes rutinas.</p>
      )}

      <div className="flex flex-col gap-2">
        {routines?.map((routine) => (
          <div
            key={routine.id}
            className="flex items-center gap-2 rounded-xl bg-neutral-900/60 p-3"
          >
            <button
              type="button"
              onClick={() => navigate(`/rutinas/${routine.id}`)}
              className="flex-1 text-left"
              style={{ minHeight: 48 }}
            >
              <p className="font-semibold">{routine.name}</p>
              <p className="text-sm text-neutral-500">
                {routine.items.length === 0
                  ? 'Sin ejercicios'
                  : routine.items.map((item) => item.exercise.name).join(', ')}
              </p>
            </button>
            <button
              type="button"
              onClick={() => removeMutation.mutate(routine.id)}
              aria-label={`Eliminar rutina ${routine.name}`}
              className="flex h-10 w-10 items-center justify-center text-neutral-500 active:text-neutral-300"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
