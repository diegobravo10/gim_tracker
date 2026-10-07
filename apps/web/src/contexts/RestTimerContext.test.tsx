import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useRestTimer } from '../hooks/useRestTimer.ts';
import { RestTimerProvider } from './RestTimerContext.tsx';

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  vi.stubGlobal('navigator', { ...navigator, vibrate: vi.fn() });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function setup() {
  return renderHook(() => useRestTimer(), { wrapper: RestTimerProvider });
}

describe('RestTimerContext', () => {
  it('no corre ningún timer antes de start()', () => {
    const { result } = setup();
    expect(result.current.remainingSeconds).toBeNull();
  });

  it('arranca una cuenta regresiva de 90s por defecto al hacer start()', () => {
    const { result } = setup();

    act(() => {
      result.current.start('ex-1', 'Press de banca');
    });

    expect(result.current.remainingSeconds).toBe(90);
    expect(result.current.exerciseName).toBe('Press de banca');
  });

  it('cuenta hacia atrás con el paso del tiempo', () => {
    const { result } = setup();

    act(() => {
      result.current.start('ex-1', 'Press de banca');
    });
    act(() => {
      vi.advanceTimersByTime(10_000);
    });

    expect(result.current.remainingSeconds).toBe(80);
  });

  it('vibra al llegar a 0', () => {
    const { result } = setup();

    act(() => {
      result.current.start('ex-1', 'Press de banca');
    });
    act(() => {
      vi.advanceTimersByTime(90_000);
    });

    expect(result.current.remainingSeconds).toBe(0);
    expect(navigator.vibrate).toHaveBeenCalledTimes(1);
  });

  it('+15s suma tiempo a la cuenta regresiva', () => {
    const { result } = setup();

    act(() => {
      result.current.start('ex-1', 'Press de banca');
    });
    act(() => {
      result.current.addFifteen();
    });

    expect(result.current.remainingSeconds).toBe(105);
  });

  it('saltar detiene el timer', () => {
    const { result } = setup();

    act(() => {
      result.current.start('ex-1', 'Press de banca');
    });
    act(() => {
      result.current.skip();
    });

    expect(result.current.remainingSeconds).toBeNull();
    expect(result.current.exerciseName).toBeNull();
  });
});
