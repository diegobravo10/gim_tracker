import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { WorkoutProgressPoint } from '../api/types.ts';
import { filterByRange } from './progressRange.ts';

function point(startedAt: string): WorkoutProgressPoint {
  return { workoutId: startedAt, startedAt, maxWeightKg: 1, estimated1RM: 1, volumeKg: 1 };
}

const NOW = new Date('2026-06-15T12:00:00Z');

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('filterByRange', () => {
  const points = [
    point('2026-06-14T00:00:00Z'), // 1 día atrás
    point('2026-05-20T00:00:00Z'), // ~26 días atrás
    point('2026-04-01T00:00:00Z'), // ~75 días atrás
    point('2025-01-01T00:00:00Z'), // mucho más de 90 días atrás
  ];

  it('"all" devuelve todo sin filtrar', () => {
    expect(filterByRange(points, 'all')).toHaveLength(4);
  });

  it('"1m" solo incluye los últimos 30 días', () => {
    const result = filterByRange(points, '1m');
    expect(result.map((p) => p.workoutId)).toEqual([
      '2026-06-14T00:00:00Z',
      '2026-05-20T00:00:00Z',
    ]);
  });

  it('"3m" solo incluye los últimos 90 días', () => {
    const result = filterByRange(points, '3m');
    expect(result.map((p) => p.workoutId)).toEqual([
      '2026-06-14T00:00:00Z',
      '2026-05-20T00:00:00Z',
      '2026-04-01T00:00:00Z',
    ]);
  });
});
