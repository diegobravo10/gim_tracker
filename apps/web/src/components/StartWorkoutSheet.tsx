import { useQuery } from '@tanstack/react-query';
import { listRoutines } from '../api/routines.ts';

interface StartWorkoutSheetProps {
  onClose: () => void;
  onSelect: (routineId?: string) => void;
}

export function StartWorkoutSheet({ onClose, onSelect }: StartWorkoutSheetProps) {
  const { data: routines, isLoading } = useQuery({
    queryKey: ['routines'],
    queryFn: listRoutines,
  });

  return (
    <div className="fixed inset-0 z-30 flex flex-col justify-end bg-black/60">
      <button type="button" aria-label="Cerrar" onClick={onClose} className="absolute inset-0" />
      <div className="relative max-h-[80vh] rounded-t-2xl bg-neutral-950 p-4 pb-8">
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-neutral-700" />
        <h2 className="mb-3 text-lg font-semibold">¿Qué entreno empezamos?</h2>

        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => onSelect(undefined)}
            className="w-full rounded-lg px-3 py-3 text-left font-medium active:bg-neutral-800"
            style={{ minHeight: 48 }}
          >
            Vacío
          </button>

          {isLoading && <p className="px-3 py-2 text-neutral-500">Cargando rutinas...</p>}

          {routines?.map((routine) => (
            <button
              key={routine.id}
              type="button"
              onClick={() => onSelect(routine.id)}
              className="flex w-full flex-col items-start rounded-lg px-3 py-3 text-left active:bg-neutral-800"
              style={{ minHeight: 48 }}
            >
              <span className="font-medium">{routine.name}</span>
              <span className="text-sm text-neutral-500">
                {routine.items.length} ejercicio{routine.items.length === 1 ? '' : 's'}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
