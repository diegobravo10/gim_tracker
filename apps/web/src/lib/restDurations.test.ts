import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_REST_SECONDS, getRestDuration, setRestDuration } from './restDurations.ts';

beforeEach(() => {
  localStorage.clear();
});

describe('restDurations', () => {
  it('devuelve el default cuando no hay nada guardado', () => {
    expect(getRestDuration('ex-1')).toBe(DEFAULT_REST_SECONDS);
  });

  it('persiste y recupera una duración por ejercicio', () => {
    setRestDuration('ex-1', 120);
    expect(getRestDuration('ex-1')).toBe(120);
    expect(getRestDuration('ex-2')).toBe(DEFAULT_REST_SECONDS);
  });

  it('sobrevive una lectura con JSON inválido en localStorage', () => {
    localStorage.setItem('gym-tracker:rest-durations', '{not json');
    expect(getRestDuration('ex-1')).toBe(DEFAULT_REST_SECONDS);
  });
});
