import type { WorkoutProgressPoint } from '../api/types.ts';

export type ProgressRange = '1m' | '3m' | 'all';

export const RANGE_LABELS: Record<ProgressRange, string> = {
  '1m': '1m',
  '3m': '3m',
  all: 'Todo',
};

export function filterByRange(
  points: WorkoutProgressPoint[],
  range: ProgressRange,
): WorkoutProgressPoint[] {
  if (range === 'all') return points;

  const days = range === '1m' ? 30 : 90;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return points.filter((point) => new Date(point.startedAt).getTime() >= cutoff);
}
