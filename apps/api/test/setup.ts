import { config } from 'dotenv';
import { afterAll, afterEach, beforeAll } from 'vitest';

config();

function toTestDatabaseUrl(databaseUrl: string): string {
  const url = new URL(databaseUrl);
  url.pathname = `${url.pathname}_test`;
  return url.toString();
}

const baseUrl = process.env.DATABASE_URL;
if (!baseUrl) {
  throw new Error('DATABASE_URL no está definido. Copia .env.example a .env');
}
process.env.DATABASE_URL = toTestDatabaseUrl(baseUrl);

// Import dinámico: PrismaClient lee DATABASE_URL al construirse, y los imports
// estáticos se evalúan antes que el código de este módulo, así que un import
// normal capturaría la URL equivocada.
const { prisma } = await import('../src/lib/prisma.js');

async function resetDb() {
  await prisma.workout.deleteMany();
  await prisma.routine.deleteMany();
  await prisma.exercise.deleteMany();
}

beforeAll(async () => {
  await resetDb();
});

afterEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await prisma.$disconnect();
});
