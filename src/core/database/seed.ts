import type { SQLiteDatabase } from 'expo-sqlite';

type MuscleGroup = { id: string; name: string; bodyRegion: 'upper' | 'lower' | 'core' };
type Equipment = { id: string; name: string };
type SeedExercise = {
  id: string;
  name: string;
  primaryMuscleId: string;
  secondaryMuscleId: string | null;
  equipmentId: string;
  aliases: string[];
};

const MUSCLE_GROUPS: MuscleGroup[] = [
  { id: 'chest', name: 'Chest', bodyRegion: 'upper' },
  { id: 'back', name: 'Back', bodyRegion: 'upper' },
  { id: 'shoulders', name: 'Shoulders', bodyRegion: 'upper' },
  { id: 'biceps', name: 'Biceps', bodyRegion: 'upper' },
  { id: 'triceps', name: 'Triceps', bodyRegion: 'upper' },
  { id: 'quads', name: 'Quadriceps', bodyRegion: 'lower' },
  { id: 'hamstrings', name: 'Hamstrings', bodyRegion: 'lower' },
  { id: 'glutes', name: 'Glutes', bodyRegion: 'lower' },
  { id: 'calves', name: 'Calves', bodyRegion: 'lower' },
  { id: 'abs', name: 'Abs', bodyRegion: 'core' },
];

const EQUIPMENT: Equipment[] = [
  { id: 'barbell', name: 'Barbell' },
  { id: 'dumbbell', name: 'Dumbbell' },
  { id: 'machine', name: 'Machine' },
  { id: 'cable', name: 'Cable' },
  { id: 'bodyweight', name: 'Bodyweight' },
];

const EXERCISES: SeedExercise[] = [
  {
    id: 'bench-press',
    name: 'Bench Press',
    primaryMuscleId: 'chest',
    secondaryMuscleId: 'triceps',
    equipmentId: 'barbell',
    aliases: ['Flat Bench Press', 'Barbell Bench Press', 'BB Bench'],
  },
  {
    id: 'incline-bench-press',
    name: 'Incline Bench Press',
    primaryMuscleId: 'chest',
    secondaryMuscleId: 'shoulders',
    equipmentId: 'barbell',
    aliases: ['Incline Press'],
  },
  {
    id: 'back-squat',
    name: 'Back Squat',
    primaryMuscleId: 'quads',
    secondaryMuscleId: 'glutes',
    equipmentId: 'barbell',
    aliases: ['Squat', 'Barbell Squat'],
  },
  {
    id: 'deadlift',
    name: 'Deadlift',
    primaryMuscleId: 'back',
    secondaryMuscleId: 'hamstrings',
    equipmentId: 'barbell',
    aliases: ['Conventional Deadlift'],
  },
  {
    id: 'overhead-press',
    name: 'Overhead Press',
    primaryMuscleId: 'shoulders',
    secondaryMuscleId: 'triceps',
    equipmentId: 'barbell',
    aliases: ['OHP', 'Military Press'],
  },
  {
    id: 'barbell-row',
    name: 'Barbell Row',
    primaryMuscleId: 'back',
    secondaryMuscleId: 'biceps',
    equipmentId: 'barbell',
    aliases: ['Bent Over Row'],
  },
  {
    id: 'pull-up',
    name: 'Pull-Up',
    primaryMuscleId: 'back',
    secondaryMuscleId: 'biceps',
    equipmentId: 'bodyweight',
    aliases: ['Pullup', 'Chin-Up'],
  },
  {
    id: 'dumbbell-curl',
    name: 'Dumbbell Curl',
    primaryMuscleId: 'biceps',
    secondaryMuscleId: null,
    equipmentId: 'dumbbell',
    aliases: ['DB Curl', 'Bicep Curl'],
  },
  {
    id: 'leg-press',
    name: 'Leg Press',
    primaryMuscleId: 'quads',
    secondaryMuscleId: 'glutes',
    equipmentId: 'machine',
    aliases: [],
  },
  {
    id: 'cable-tricep-pushdown',
    name: 'Tricep Pushdown',
    primaryMuscleId: 'triceps',
    secondaryMuscleId: null,
    equipmentId: 'cable',
    aliases: ['Cable Pushdown', 'Rope Pushdown'],
  },
];

export async function seedDatabaseIfEmpty(db: SQLiteDatabase): Promise<void> {
  const existing = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM exercises'
  );
  if ((existing?.count ?? 0) > 0) return;

  await db.withTransactionAsync(async () => {
    for (const group of MUSCLE_GROUPS) {
      await db.runAsync(
        'INSERT INTO muscle_groups (id, name, body_region) VALUES (?, ?, ?)',
        group.id,
        group.name,
        group.bodyRegion
      );
    }

    for (const item of EQUIPMENT) {
      await db.runAsync('INSERT INTO equipment (id, name) VALUES (?, ?)', item.id, item.name);
    }

    for (const exercise of EXERCISES) {
      await db.runAsync(
        `INSERT INTO exercises (id, name, primary_muscle_id, secondary_muscle_id, equipment_id, metric_type, is_custom)
         VALUES (?, ?, ?, ?, ?, 'weight_reps', 0)`,
        exercise.id,
        exercise.name,
        exercise.primaryMuscleId,
        exercise.secondaryMuscleId,
        exercise.equipmentId
      );

      for (const alias of exercise.aliases) {
        await db.runAsync(
          'INSERT INTO exercise_aliases (exercise_id, alias) VALUES (?, ?)',
          exercise.id,
          alias
        );
      }

      await db.runAsync(
        'INSERT INTO exercise_search_fts (exercise_id, name, aliases) VALUES (?, ?, ?)',
        exercise.id,
        exercise.name,
        exercise.aliases.join(' ')
      );
    }
  });
}
