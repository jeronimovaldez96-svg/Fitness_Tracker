import type { SQLiteDatabase } from 'expo-sqlite';

import { generateId } from '@/shared/utils/id';
import type {
  RoutineDetail,
  RoutineExerciseInput,
  RoutineSummary,
} from '@/domains/workout/types/routine.types';

const MINUTES_PER_SET = 3;

type RoutineRow = {
  id: string;
  name: string;
  cycle_label: string | null;
  day_label: string | null;
  order_index: number;
  last_used_at: number | null;
  exercise_count: number;
  total_sets: number;
};

export async function listRoutines(db: SQLiteDatabase): Promise<RoutineSummary[]> {
  const rows = await db.getAllAsync<RoutineRow>(`
    SELECT r.id, r.name, r.cycle_label, r.day_label, r.order_index, r.last_used_at,
           COUNT(re.id) as exercise_count,
           COALESCE(SUM(re.target_sets), 0) as total_sets
    FROM routines r
    LEFT JOIN routine_exercises re ON re.routine_id = r.id
    GROUP BY r.id
    ORDER BY r.order_index ASC
  `);

  if (rows.length === 0) return [];

  // "Next up" = the routine that's gone longest without being used (NULLs — never used — first).
  const nextId = [...rows].sort((a, b) => (a.last_used_at ?? -1) - (b.last_used_at ?? -1))[0]?.id;

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    cycleLabel: row.cycle_label,
    dayLabel: row.day_label,
    exerciseCount: row.exercise_count,
    estimatedMinutes: row.total_sets * MINUTES_PER_SET,
    lastUsedAt: row.last_used_at,
    isNext: row.id === nextId,
  }));
}

export async function getRoutineWithExercises(
  db: SQLiteDatabase,
  routineId: string
): Promise<RoutineDetail | null> {
  const routine = await db.getFirstAsync<{
    id: string;
    name: string;
    cycle_label: string | null;
    day_label: string | null;
    last_used_at: number | null;
  }>(
    'SELECT id, name, cycle_label, day_label, last_used_at FROM routines WHERE id = ?',
    [routineId]
  );
  if (!routine) return null;

  const exerciseRows = await db.getAllAsync<{
    id: string;
    exercise_id: string;
    exercise_name: string;
    equipment_id: string;
    equipment_name: string;
    order_index: number;
    target_sets: number;
    target_reps: string;
    target_weight_kg: number | null;
  }>(
    `SELECT re.id, re.exercise_id, ex.name as exercise_name, ex.equipment_id, eq.name as equipment_name,
            re.order_index, re.target_sets, re.target_reps, re.target_weight_kg
     FROM routine_exercises re
     JOIN exercises ex ON ex.id = re.exercise_id
     JOIN equipment eq ON eq.id = ex.equipment_id
     WHERE re.routine_id = ?
     ORDER BY re.order_index ASC`,
    [routineId]
  );

  return {
    id: routine.id,
    name: routine.name,
    cycleLabel: routine.cycle_label,
    dayLabel: routine.day_label,
    lastUsedAt: routine.last_used_at,
    exercises: exerciseRows.map((row) => ({
      id: row.id,
      exerciseId: row.exercise_id,
      exerciseName: row.exercise_name,
      equipmentId: row.equipment_id,
      equipmentName: row.equipment_name,
      orderIndex: row.order_index,
      targetSets: row.target_sets,
      targetReps: row.target_reps,
      targetWeightKg: row.target_weight_kg,
    })),
  };
}

async function writeRoutineExercises(
  db: SQLiteDatabase,
  routineId: string,
  exercises: RoutineExerciseInput[]
): Promise<void> {
  await db.runAsync('DELETE FROM routine_exercises WHERE routine_id = ?', [routineId]);
  for (const [index, exercise] of exercises.entries()) {
    await db.runAsync(
      `INSERT INTO routine_exercises
        (id, routine_id, exercise_id, order_index, target_sets, target_reps, target_weight_kg)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      generateId(),
      routineId,
      exercise.exerciseId,
      index,
      exercise.targetSets,
      exercise.targetReps,
      exercise.targetWeightKg
    );
  }
}

export async function createRoutine(
  db: SQLiteDatabase,
  params: { name: string; cycleLabel: string | null; dayLabel: string | null; exercises: RoutineExerciseInput[] }
): Promise<string> {
  const id = generateId();
  await db.withTransactionAsync(async () => {
    const maxOrder = await db.getFirstAsync<{ max_order: number | null }>(
      'SELECT MAX(order_index) as max_order FROM routines'
    );
    await db.runAsync(
      'INSERT INTO routines (id, name, cycle_label, day_label, order_index) VALUES (?, ?, ?, ?, ?)',
      id,
      params.name,
      params.cycleLabel,
      params.dayLabel,
      (maxOrder?.max_order ?? -1) + 1
    );
    await writeRoutineExercises(db, id, params.exercises);
  });
  return id;
}

export async function updateRoutine(
  db: SQLiteDatabase,
  routineId: string,
  params: { name: string; exercises: RoutineExerciseInput[] }
): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync('UPDATE routines SET name = ? WHERE id = ?', params.name, routineId);
    await writeRoutineExercises(db, routineId, params.exercises);
  });
}

export async function touchRoutineLastUsed(db: SQLiteDatabase, routineId: string): Promise<void> {
  await db.runAsync('UPDATE routines SET last_used_at = ? WHERE id = ?', Date.now(), routineId);
}
