import { useState } from 'react';
import { getRestDuration, setRestDuration } from '../lib/restDurations.ts';

const STEP = 15;
const MIN_SECONDS = 15;

export function RestDurationControl({ exerciseId }: { exerciseId: string }) {
  const [seconds, setSeconds] = useState(() => getRestDuration(exerciseId));

  function update(next: number) {
    const clamped = Math.max(MIN_SECONDS, next);
    setSeconds(clamped);
    setRestDuration(exerciseId, clamped);
  }

  return (
    <div className="flex items-center gap-1 text-xs text-neutral-500">
      <span>Descanso</span>
      <button
        type="button"
        onClick={() => update(seconds - STEP)}
        aria-label="Restar tiempo de descanso"
        className="flex h-8 w-8 items-center justify-center rounded bg-neutral-800 text-neutral-300 active:bg-neutral-700"
      >
        −
      </button>
      <span className="w-10 text-center tabular-nums">{seconds}s</span>
      <button
        type="button"
        onClick={() => update(seconds + STEP)}
        aria-label="Sumar tiempo de descanso"
        className="flex h-8 w-8 items-center justify-center rounded bg-neutral-800 text-neutral-300 active:bg-neutral-700"
      >
        +
      </button>
    </div>
  );
}
