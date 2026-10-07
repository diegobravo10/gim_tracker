import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client.ts';
import { createWorkout, getActiveWorkout } from '../api/workouts.ts';
import { StartWorkoutSheet } from '../components/StartWorkoutSheet.tsx';

export function HomePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showStartSheet, setShowStartSheet] = useState(false);

  const activeQuery = useQuery({
    queryKey: ['workout', 'active'],
    queryFn: getActiveWorkout,
  });

  const startWorkout = useMutation({
    mutationFn: (routineId?: string) => createWorkout(routineId),
    onSuccess: (workout) => {
      queryClient.setQueryData(['workout', 'active'], workout);
      navigate('/entreno');
    },
  });

  const hasActiveWorkout = activeQuery.isSuccess;
  const noActiveWorkout =
    activeQuery.isError && activeQuery.error instanceof ApiError && activeQuery.error.status === 404;

  function handleSelect(routineId?: string) {
    setShowStartSheet(false);
    startWorkout.mutate(routineId);
  }

  return (
    <div className="flex flex-col items-center gap-6 pt-16">
      <h1 className="text-2xl font-bold">Gym Tracker</h1>

      {activeQuery.isLoading && <p className="text-neutral-500">Cargando...</p>}

      {hasActiveWorkout && (
        <button
          type="button"
          onClick={() => navigate('/entreno')}
          className="w-full rounded-2xl bg-emerald-500 py-5 text-lg font-bold text-neutral-950 active:bg-emerald-400"
          style={{ minHeight: 48 }}
        >
          Continuar entreno
        </button>
      )}

      {noActiveWorkout && (
        <button
          type="button"
          onClick={() => setShowStartSheet(true)}
          disabled={startWorkout.isPending}
          className="w-full rounded-2xl bg-emerald-500 py-5 text-lg font-bold text-neutral-950 active:bg-emerald-400 disabled:opacity-60"
          style={{ minHeight: 48 }}
        >
          Empezar entreno
        </button>
      )}

      {startWorkout.isError && (
        <p className="text-sm text-red-400">No se pudo empezar el entreno. Intenta de nuevo.</p>
      )}

      {showStartSheet && (
        <StartWorkoutSheet onClose={() => setShowStartSheet(false)} onSelect={handleSelect} />
      )}
    </div>
  );
}
