import { useContext } from 'react';
import { RestTimerContext, type RestTimerValue } from '../contexts/rest-timer-context.ts';

export function useRestTimer(): RestTimerValue {
  const ctx = useContext(RestTimerContext);
  if (!ctx) {
    throw new Error('useRestTimer debe usarse dentro de RestTimerProvider.');
  }
  return ctx;
}
