const TEMP_PREFIX = 'temp-';

export function createTempId(): string {
  return `${TEMP_PREFIX}${crypto.randomUUID()}`;
}

export function isTempId(id: string): boolean {
  return id.startsWith(TEMP_PREFIX);
}
