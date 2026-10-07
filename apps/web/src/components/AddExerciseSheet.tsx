import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { createExercise, listExercises } from '../api/exercises.ts';
import type { Exercise } from '../api/types.ts';
import { useDebouncedValue } from '../hooks/useDebouncedValue.ts';

interface AddExerciseSheetProps {
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
}

export function AddExerciseSheet({ onClose, onSelect }: AddExerciseSheetProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [muscleGroup, setMuscleGroup] = useState('');
  const debouncedSearch = useDebouncedValue(search);

  const { data: exercises, isLoading } = useQuery({
    queryKey: ['exercises', debouncedSearch],
    queryFn: () => listExercises(debouncedSearch || undefined),
  });

  const createMutation = useMutation({
    mutationFn: () => createExercise({ name: search.trim(), muscleGroup: muscleGroup.trim() }),
    onSuccess: (exercise) => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      onSelect(exercise);
    },
  });

  const normalizedSearch = search.trim().toLocaleLowerCase('es');
  const exactMatch = exercises?.some(
    (exercise) => exercise.name.trim().toLocaleLowerCase('es') === normalizedSearch,
  );

  function handleCreate() {
    if (!search.trim() || !muscleGroup.trim() || createMutation.isPending) return;
    createMutation.mutate();
  }

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
        {isCreating ? (
          <form
            className="mb-3 flex flex-col gap-3 rounded-xl border border-neutral-800 bg-neutral-900 p-3"
            onSubmit={(event) => {
              event.preventDefault();
              handleCreate();
            }}
          >
            <p className="font-medium">Crear “{search.trim()}”</p>
            <label className="flex flex-col gap-1 text-sm text-neutral-400">
              Grupo muscular
              <input
                autoFocus
                type="text"
                list="muscle-groups"
                value={muscleGroup}
                onChange={(event) => setMuscleGroup(event.target.value)}
                placeholder="Ej. Pecho"
                className="rounded-lg bg-neutral-800 px-4 py-3 text-base text-neutral-100 placeholder:text-neutral-500"
                style={{ minHeight: 48 }}
              />
              <datalist id="muscle-groups">
                {[
                  'Pecho',
                  'Espalda',
                  'Piernas',
                  'Hombros',
                  'Bíceps',
                  'Tríceps',
                  'Glúteos',
                  'Pantorrillas',
                  'Core',
                ].map((group) => (
                  <option key={group} value={group} />
                ))}
              </datalist>
            </label>
            {createMutation.isError && (
              <p role="alert" className="text-sm text-red-400">
                No se pudo crear. Comprueba que el nombre no exista e inténtalo otra vez.
              </p>
            )}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="rounded-lg bg-neutral-800 px-3 py-3 font-medium"
                style={{ minHeight: 48 }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!muscleGroup.trim() || createMutation.isPending}
                className="rounded-lg bg-red-600 px-3 py-3 font-semibold text-white disabled:opacity-50"
                style={{ minHeight: 48 }}
              >
                {createMutation.isPending ? 'Creando...' : 'Crear y agregar'}
              </button>
            </div>
          </form>
        ) : (
          normalizedSearch &&
          !exactMatch && (
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="mb-3 w-full rounded-lg border border-red-800 bg-red-950/40 px-3 py-3 text-left font-medium text-red-300 active:bg-red-950"
              style={{ minHeight: 48 }}
            >
              + Crear “{search.trim()}”
            </button>
          )
        )}
        <div className="max-h-[50vh] overflow-y-auto">
          {isLoading && <p className="py-4 text-center text-neutral-500">Cargando...</p>}
          {exercises?.length === 0 && !search.trim() && (
            <p className="py-4 text-center text-neutral-500">
              Todavía no hay ejercicios. Escribe un nombre para crear el primero.
            </p>
          )}
          {exercises?.length === 0 && search.trim() && !isCreating && (
            <p className="py-4 text-center text-neutral-500">No existe todavía.</p>
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
