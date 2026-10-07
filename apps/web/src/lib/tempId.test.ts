import { describe, expect, it } from 'vitest';
import { createTempId, isTempId } from './tempId.ts';

describe('tempId', () => {
  it('genera ids con el prefijo temp- y distintos entre sí', () => {
    const a = createTempId();
    const b = createTempId();

    expect(a).not.toBe(b);
    expect(isTempId(a)).toBe(true);
    expect(isTempId(b)).toBe(true);
  });

  it('no confunde un id real del servidor con uno temporal', () => {
    expect(isTempId('cmuxdbmje000aksepknbg4a5z')).toBe(false);
  });
});
