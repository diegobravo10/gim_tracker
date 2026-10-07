const TIME_ZONE = 'America/Guayaquil';

const timeFormatter = new Intl.DateTimeFormat('es-EC', {
  timeZone: TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
});

const dateFormatter = new Intl.DateTimeFormat('es-EC', {
  timeZone: TIME_ZONE,
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

export function formatArrivalTime(isoDate: string): string {
  return timeFormatter.format(new Date(isoDate));
}

export function formatDate(isoDate: string): string {
  return dateFormatter.format(new Date(isoDate));
}

export function formatDuration(startedAt: string, finishedAt: string | null): string {
  if (!finishedAt) return 'en curso';

  const totalMinutes = Math.max(
    0,
    Math.round((new Date(finishedAt).getTime() - new Date(startedAt).getTime()) / 60000),
  );
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes} min`;
  return `${hours} h ${minutes} min`;
}

export function formatElapsed(startedAt: string, nowMs: number): string {
  const totalSeconds = Math.max(0, Math.floor((nowMs - new Date(startedAt).getTime()) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

export function formatWeight(weightKg: number): string {
  return Number.isInteger(weightKg) ? `${weightKg}` : weightKg.toFixed(1);
}

/** Resume la última sesión como "3×8 @ 60kg" a partir del grupo peso/reps más repetido entre las series de trabajo. */
export function formatLastTimeSummary(
  sets: { weightKg: number; reps: number; isWarmup: boolean }[],
): string | null {
  const workingSets = sets.filter((set) => !set.isWarmup);
  if (workingSets.length === 0) return null;

  const groups = new Map<string, { weightKg: number; reps: number; count: number }>();
  for (const set of workingSets) {
    const key = `${set.weightKg}-${set.reps}`;
    const existing = groups.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      groups.set(key, { weightKg: set.weightKg, reps: set.reps, count: 1 });
    }
  }

  const best = [...groups.values()].sort((a, b) => b.count - a.count)[0];
  return `${best.count}×${best.reps} @ ${formatWeight(best.weightKg)}kg`;
}
