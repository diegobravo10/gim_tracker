import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getRestDuration } from '../lib/restDurations.ts';
import { RestTimerContext } from './rest-timer-context.ts';

export function RestTimerProvider({ children }: { children: React.ReactNode }) {
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [exerciseName, setExerciseName] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const vibratedRef = useRef(false);

  // El tick es la única fuente de "ahora": remainingSeconds se deriva de
  // endsAt - now en el render, en vez de guardarse como estado aparte.
  useEffect(() => {
    if (endsAt === null) return;
    const interval = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(interval);
  }, [endsAt]);

  const remainingSeconds =
    endsAt === null ? null : Math.max(0, Math.round((endsAt - now) / 1000));

  useEffect(() => {
    if (remainingSeconds === 0 && !vibratedRef.current) {
      vibratedRef.current = true;
      navigator.vibrate?.(500);
    }
  }, [remainingSeconds]);

  const start = useCallback((exerciseId: string, name: string) => {
    const duration = getRestDuration(exerciseId);
    vibratedRef.current = false;
    setNow(Date.now());
    setEndsAt(Date.now() + duration * 1000);
    setExerciseName(name);
  }, []);

  const addFifteen = useCallback(() => {
    setEndsAt((prev) => (prev === null ? null : prev + 15_000));
  }, []);

  const skip = useCallback(() => {
    setEndsAt(null);
    setExerciseName(null);
  }, []);

  const value = useMemo(
    () => ({ remainingSeconds, exerciseName, start, addFifteen, skip }),
    [remainingSeconds, exerciseName, start, addFifteen, skip],
  );

  return <RestTimerContext.Provider value={value}>{children}</RestTimerContext.Provider>;
}
