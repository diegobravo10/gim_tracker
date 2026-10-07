import { createContext } from 'react';

export interface RestTimerValue {
  remainingSeconds: number | null;
  exerciseName: string | null;
  start: (exerciseId: string, exerciseName: string) => void;
  addFifteen: () => void;
  skip: () => void;
}

export const RestTimerContext = createContext<RestTimerValue | null>(null);
