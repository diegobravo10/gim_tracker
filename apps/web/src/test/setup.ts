import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Sin "test.globals" en vitest.config.ts, el auto-cleanup de testing-library
// no se registra solo: hay que llamarlo explícitamente entre tests.
afterEach(() => {
  cleanup();
});
