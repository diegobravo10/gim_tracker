import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    setupFiles: ['test/setup.ts'],
    // Los tests comparten una sola base de datos de test: correr los
    // archivos en paralelo produciría datos cruzados entre ellos.
    fileParallelism: false,
  },
});
