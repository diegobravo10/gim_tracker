import { describe, expect, it } from 'vitest';
import {
  formatDuration,
  formatElapsed,
  formatLastTimeSummary,
  formatWeight,
} from './formatters.ts';

describe('formatDuration', () => {
  it('muestra "en curso" si no hay finishedAt', () => {
    expect(formatDuration('2026-01-01T10:00:00Z', null)).toBe('en curso');
  });

  it('muestra minutos cuando dura menos de una hora', () => {
    expect(formatDuration('2026-01-01T10:00:00Z', '2026-01-01T10:45:00Z')).toBe('45 min');
  });

  it('muestra horas y minutos cuando dura una hora o más', () => {
    expect(formatDuration('2026-01-01T10:00:00Z', '2026-01-01T11:30:00Z')).toBe('1 h 30 min');
  });
});

describe('formatElapsed', () => {
  it('formatea segundos y minutos sin horas', () => {
    const startedAt = '2026-01-01T10:00:00Z';
    const now = new Date('2026-01-01T10:05:09Z').getTime();
    expect(formatElapsed(startedAt, now)).toBe('05:09');
  });

  it('incluye horas cuando pasa de 60 minutos', () => {
    const startedAt = '2026-01-01T10:00:00Z';
    const now = new Date('2026-01-01T11:02:03Z').getTime();
    expect(formatElapsed(startedAt, now)).toBe('1:02:03');
  });
});

describe('formatWeight', () => {
  it('no muestra decimales para pesos enteros', () => {
    expect(formatWeight(60)).toBe('60');
  });

  it('muestra un decimal para pesos fraccionarios', () => {
    expect(formatWeight(62.5)).toBe('62.5');
  });
});

describe('formatLastTimeSummary', () => {
  it('devuelve null si no hay series de trabajo', () => {
    expect(formatLastTimeSummary([])).toBeNull();
    expect(formatLastTimeSummary([{ weightKg: 20, reps: 15, isWarmup: true }])).toBeNull();
  });

  it('resume series iguales como "3×8 @ 60kg"', () => {
    const sets = [
      { weightKg: 20, reps: 15, isWarmup: true },
      { weightKg: 60, reps: 8, isWarmup: false },
      { weightKg: 60, reps: 8, isWarmup: false },
      { weightKg: 60, reps: 8, isWarmup: false },
    ];
    expect(formatLastTimeSummary(sets)).toBe('3×8 @ 60kg');
  });

  it('usa el grupo más frecuente cuando las series varían', () => {
    const sets = [
      { weightKg: 60, reps: 8, isWarmup: false },
      { weightKg: 65, reps: 6, isWarmup: false },
      { weightKg: 65, reps: 6, isWarmup: false },
    ];
    expect(formatLastTimeSummary(sets)).toBe('2×6 @ 65kg');
  });
});
