const STORAGE_KEY = 'gym-tracker:rest-durations';

export const DEFAULT_REST_SECONDS = 90;

function readAll(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

export function getRestDuration(exerciseId: string): number {
  return readAll()[exerciseId] ?? DEFAULT_REST_SECONDS;
}

export function setRestDuration(exerciseId: string, seconds: number): void {
  try {
    const all = readAll();
    all[exerciseId] = seconds;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // localStorage puede fallar (modo privado, cuota llena); se ignora.
  }
}
