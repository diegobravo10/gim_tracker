import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { config } from 'dotenv';
import pg from 'pg';

const require = createRequire(import.meta.url);

config();

const baseUrl = process.env.DATABASE_URL;
if (!baseUrl) {
  console.error('DATABASE_URL no está definido. Copia .env.example a .env');
  process.exit(1);
}

function toTestDatabaseUrl(databaseUrl) {
  const url = new URL(databaseUrl);
  url.pathname = `${url.pathname}_test`;
  return url;
}

const testUrl = toTestDatabaseUrl(baseUrl);
const testDbName = testUrl.pathname.replace(/^\//, '');

const client = new pg.Client({ connectionString: baseUrl });
await client.connect();
try {
  await client.query(`CREATE DATABASE "${testDbName}"`);
  console.log(`Base de datos de test "${testDbName}" creada.`);
} catch (err) {
  if (err.code === '42P04') {
    console.log(`Base de datos de test "${testDbName}" ya existe.`);
  } else {
    throw err;
  }
} finally {
  await client.end();
}

const prismaBin = require.resolve('prisma/build/index.js');

execFileSync(process.execPath, [prismaBin, 'migrate', 'deploy'], {
  stdio: 'inherit',
  env: { ...process.env, DATABASE_URL: testUrl.toString() },
});
