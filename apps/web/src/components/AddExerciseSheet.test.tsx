import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import * as exercisesApi from '../api/exercises.ts';
import { AddExerciseSheet } from './AddExerciseSheet.tsx';

vi.mock('../api/exercises.ts', () => ({
  listExercises: vi.fn(),
  createExercise: vi.fn(),
}));

describe('AddExerciseSheet', () => {
  it('crea y selecciona un ejercicio cuando la lista está vacía', async () => {
    vi.mocked(exercisesApi.listExercises).mockResolvedValue([]);
    vi.mocked(exercisesApi.createExercise).mockResolvedValue({
      id: 'exercise-1',
      name: 'Remo Meadows',
      muscleGroup: 'Espalda',
      createdAt: '2026-10-06T00:00:00.000Z',
    });
    const onSelect = vi.fn();

    render(
      <QueryClientProvider client={new QueryClient()}>
        <AddExerciseSheet onClose={vi.fn()} onSelect={onSelect} />
      </QueryClientProvider>,
    );

    fireEvent.change(screen.getByPlaceholderText('Buscar ejercicio...'), {
      target: { value: 'Remo Meadows' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Crear “Remo Meadows”/ }));
    fireEvent.change(screen.getByPlaceholderText('Ej. Pecho'), {
      target: { value: 'Espalda' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Crear y agregar' }));

    await waitFor(() => {
      expect(exercisesApi.createExercise).toHaveBeenCalledWith({
        name: 'Remo Meadows',
        muscleGroup: 'Espalda',
      });
      expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'exercise-1' }));
    });
  });
});
