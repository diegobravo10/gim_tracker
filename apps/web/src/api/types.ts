export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  createdAt: string;
}

export interface WorkoutSet {
  id: string;
  workoutExerciseId: string;
  order: number;
  weightKg: number;
  reps: number;
  isWarmup: boolean;
  completed: boolean;
  completedAt: string | null;
}

export interface WorkoutExercise {
  id: string;
  workoutId: string;
  exerciseId: string;
  order: number;
  exercise: Exercise;
  sets: WorkoutSet[];
}

export interface WorkoutDetail {
  id: string;
  routineId: string | null;
  startedAt: string;
  finishedAt: string | null;
  createdAt: string;
  exercises: WorkoutExercise[];
  totalVolumeKg: number;
}

export interface WorkoutSummary {
  id: string;
  routineId: string | null;
  startedAt: string;
  finishedAt: string | null;
  totalVolumeKg: number;
  exercises: { id: string; name: string }[];
}

export interface LastExerciseSets {
  workoutId: string;
  startedAt: string;
  sets: { order: number; weightKg: number; reps: number; isWarmup: boolean }[];
}

export interface RoutineItem {
  id: string;
  routineId: string;
  exerciseId: string;
  order: number;
  targetSets: number | null;
  targetReps: number | null;
  exercise: Exercise;
}

export interface Routine {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  items: RoutineItem[];
}
