import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL no está definido.');
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const exercises: { name: string; muscleGroup: string }[] = [
  // Pecho
  { name: 'Press de banca', muscleGroup: 'Pecho' },
  { name: 'Press inclinado con mancuernas', muscleGroup: 'Pecho' },
  { name: 'Press declinado', muscleGroup: 'Pecho' },
  { name: 'Aperturas con mancuernas', muscleGroup: 'Pecho' },
  { name: 'Fondos en paralelas', muscleGroup: 'Pecho' },
  // Espalda
  { name: 'Dominadas', muscleGroup: 'Espalda' },
  { name: 'Remo con barra', muscleGroup: 'Espalda' },
  { name: 'Remo con mancuerna', muscleGroup: 'Espalda' },
  { name: 'Jalón al pecho', muscleGroup: 'Espalda' },
  { name: 'Peso muerto', muscleGroup: 'Espalda' },
  // Piernas
  { name: 'Sentadilla', muscleGroup: 'Piernas' },
  { name: 'Prensa de piernas', muscleGroup: 'Piernas' },
  { name: 'Zancadas', muscleGroup: 'Piernas' },
  { name: 'Peso muerto rumano', muscleGroup: 'Piernas' },
  { name: 'Extensión de cuádriceps', muscleGroup: 'Piernas' },
  { name: 'Curl femoral', muscleGroup: 'Piernas' },
  // Hombros
  { name: 'Press militar', muscleGroup: 'Hombros' },
  { name: 'Elevaciones laterales', muscleGroup: 'Hombros' },
  { name: 'Elevaciones frontales', muscleGroup: 'Hombros' },
  { name: 'Pájaros (elevación posterior)', muscleGroup: 'Hombros' },
  // Bíceps
  { name: 'Curl con barra', muscleGroup: 'Bíceps' },
  { name: 'Curl con mancuernas', muscleGroup: 'Bíceps' },
  { name: 'Curl martillo', muscleGroup: 'Bíceps' },
  // Tríceps
  { name: 'Press francés', muscleGroup: 'Tríceps' },
  { name: 'Extensión de tríceps en polea', muscleGroup: 'Tríceps' },
  { name: 'Fondos de tríceps', muscleGroup: 'Tríceps' },
  // Core
  { name: 'Plancha', muscleGroup: 'Core' },
  { name: 'Crunch abdominal', muscleGroup: 'Core' },
  { name: 'Elevación de piernas', muscleGroup: 'Core' },
  // Glúteos
  { name: 'Hip thrust', muscleGroup: 'Glúteos' },
  // Pantorrillas
  { name: 'Elevación de talones de pie', muscleGroup: 'Pantorrillas' },
];

async function main() {
  for (const exercise of exercises) {
    await prisma.exercise.upsert({
      where: { name: exercise.name },
      create: exercise,
      update: { muscleGroup: exercise.muscleGroup },
    });
  }
  console.log(`Seed completo: ${exercises.length} ejercicios.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
