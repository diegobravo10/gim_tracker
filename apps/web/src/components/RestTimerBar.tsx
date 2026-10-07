import { useRestTimer } from '../hooks/useRestTimer.ts';

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}

export function RestTimerBar() {
  const { remainingSeconds, exerciseName, addFifteen, skip } = useRestTimer();

  if (remainingSeconds === null) return null;

  return (
    <div className="fixed inset-x-0 bottom-14 z-20 flex items-center gap-3 border-t border-neutral-800 bg-neutral-900 px-4 py-2">
      <div className="flex-1">
        <p className="text-xs text-neutral-400">
          Descanso{exerciseName ? ` · ${exerciseName}` : ''}
        </p>
        <p className="text-2xl font-bold tabular-nums text-emerald-400">
          {formatTime(remainingSeconds)}
        </p>
      </div>
      <button
        type="button"
        onClick={addFifteen}
        className="rounded-lg bg-neutral-800 px-3 text-sm font-medium text-neutral-200 active:bg-neutral-700"
        style={{ minHeight: 48 }}
      >
        +15s
      </button>
      <button
        type="button"
        onClick={skip}
        className="rounded-lg bg-neutral-800 px-3 text-sm font-medium text-neutral-200 active:bg-neutral-700"
        style={{ minHeight: 48 }}
      >
        Saltar
      </button>
    </div>
  );
}
