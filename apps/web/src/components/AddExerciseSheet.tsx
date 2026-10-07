import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { listExercises } from '../api/exercises.ts';
import type { Exercise } from '../api/types.ts';
import { useDebouncedValue } from '../hooks/useDebouncedValue.ts';

interface AddExerciseSheetProps {
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
}

export function AddExerciseSheet({ onClose, onSelect }: AddExerciseSheetProps) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);

  const { data: exercises, isLoading } = useQuery({
    queryKey: ['exercises', debouncedSearch],
    queryFn: () => listExercises(debouncedSearch || undefined),
  });

  return (
    <div className="fixed inset-0 z-30 flex flex-col justify-end bg-black/60">
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0"
      />
      <div className="relative max-h-[80vh] rounded-t-2xl bg-neutral-950 p-4 pb-8">
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-neutral-700" />
        <h2 className="mb-3 text-lg font-semibold">Agregar ejercicio</h2>
        <input
          autoFocus
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar ejercicio..."
          className="mb-3 w-full rounded-lg bg-neutral-900 px-4 py-3 text-base text-neutral-100 placeholder:text-neutral-500"
          style={{ minHeight: 48 }}
        />
        <div className="max-h-[50vh] overflow-y-auto">
          {isLoading && <p className="py-4 text-center text-neutral-500">Cargando...</p>}
          {exercises?.length === 0 && (
            <p className="py-4 text-center text-neutral-500">Sin resultados.</p>
          )}
          <ul className="flex flex-col gap-1">
            {exercises?.map((exercise) => (
              <li key={exercise.id}>
                <button
                  type="button"
                  onClick={() => onSelect(exercise)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-left active:bg-neutral-800"
                  style={{ minHeight: 48 }}
                >
                  <span>{exercise.name}</span>
                  <span className="text-sm text-neutral-500">{exercise.muscleGroup}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
