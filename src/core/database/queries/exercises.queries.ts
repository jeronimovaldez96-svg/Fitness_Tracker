import type { SQLiteDatabase } from 'expo-sqlite';

import type {
  Equipment,
  ExerciseSearchFilters,
  ExerciseSummary,
  MuscleGroup,
} from '@/domains/catalog/types/catalog.types';

const SEARCH_RESULT_LIMIT = 30;

type ExerciseRow = {
  id: string;
  name: string;
  primary_muscle_id: string;
  primary_muscle_name: string;
  secondary_muscle_id: string | null;
  equipment_id: string;
  metric_type: ExerciseSummary['metricType'];
};

function mapExerciseRow(row: ExerciseRow): ExerciseSummary {
  return {
    id: row.id,
    name: row.name,
    primaryMuscleId: row.primary_muscle_id,
    primaryMuscleName: row.primary_muscle_name,
    secondaryMuscleId: row.secondary_muscle_id,
    equipmentId: row.equipment_id,
    metricType: row.metric_type,
  };
}

/**
 * Strips FTS5 query-syntax special characters from free-text user input so a
 * search term can never be interpreted as (invalid or unintended) FTS5 syntax.
 */
function sanitizeFtsQuery(rawQuery: string): string {
  return rawQuery
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export async function searchExercises(
  db: SQLiteDatabase,
  query: string,
  filters: ExerciseSearchFilters = {}
): Promise<ExerciseSummary[]> {
  const cleanedQuery = sanitizeFtsQuery(query);
  const extraConditions: string[] = [];
  const extraParams: string[] = [];

  if (filters.primaryMuscleId) {
    extraConditions.push('e.primary_muscle_id = ?');
    extraParams.push(filters.primaryMuscleId);
  }
  if (filters.equipmentId) {
    extraConditions.push('e.equipment_id = ?');
    extraParams.push(filters.equipmentId);
  }
  const extraWhere = extraConditions.length > 0 ? ` AND ${extraConditions.join(' AND ')}` : '';

  if (cleanedQuery.length === 0) {
    const rows = await db.getAllAsync<ExerciseRow>(
      `SELECT e.id, e.name, e.primary_muscle_id, mg.name as primary_muscle_name,
              e.secondary_muscle_id, e.equipment_id, e.metric_type
       FROM exercises e
       JOIN muscle_groups mg ON mg.id = e.primary_muscle_id
       WHERE 1 = 1${extraWhere}
       ORDER BY e.name ASC
       LIMIT ?`,
      [...extraParams, SEARCH_RESULT_LIMIT]
    );
    return rows.map(mapExerciseRow);
  }

  const ftsQuery = `${cleanedQuery}*`;
  const rows = await db.getAllAsync<ExerciseRow>(
    `SELECT e.id, e.name, e.primary_muscle_id, mg.name as primary_muscle_name,
            e.secondary_muscle_id, e.equipment_id, e.metric_type
     FROM exercise_search_fts
     JOIN exercises e ON e.id = exercise_search_fts.exercise_id
     JOIN muscle_groups mg ON mg.id = e.primary_muscle_id
     WHERE exercise_search_fts MATCH ?${extraWhere}
     ORDER BY rank
     LIMIT ?`,
    [ftsQuery, ...extraParams, SEARCH_RESULT_LIMIT]
  );
  return rows.map(mapExerciseRow);
}

export async function getExerciseById(
  db: SQLiteDatabase,
  exerciseId: string
): Promise<ExerciseSummary | null> {
  const row = await db.getFirstAsync<ExerciseRow>(
    `SELECT e.id, e.name, e.primary_muscle_id, mg.name as primary_muscle_name,
            e.secondary_muscle_id, e.equipment_id, e.metric_type
     FROM exercises e
     JOIN muscle_groups mg ON mg.id = e.primary_muscle_id
     WHERE e.id = ?`,
    [exerciseId]
  );
  return row ? mapExerciseRow(row) : null;
}

/** Most recent completed set's "weight × reps" per exercise id, for the picker's "last used" column. */
export async function getLastSetSummaries(
  db: SQLiteDatabase,
  exerciseIds: string[]
): Promise<Record<string, string>> {
  if (exerciseIds.length === 0) return {};
  const placeholders = exerciseIds.map(() => '?').join(',');
  // SQLite's bare-column extension: with a single MAX() aggregate and a
  // GROUP BY, the non-aggregated columns are taken from the row that produced
  // the max — i.e. this returns each exercise's most recently completed set.
  const rows = await db.getAllAsync<{ exercise_id: string; weight_kg: number; reps: number }>(
    `SELECT we.exercise_id, ws.weight_kg, ws.reps, MAX(ws.completed_at)
     FROM workout_sets ws
     JOIN workout_exercises we ON we.id = ws.workout_exercise_id
     WHERE we.exercise_id IN (${placeholders}) AND ws.is_completed = 1 AND ws.weight_kg IS NOT NULL
     GROUP BY we.exercise_id`,
    exerciseIds
  );
  const map: Record<string, string> = {};
  for (const row of rows) map[row.exercise_id] = `${row.weight_kg} × ${row.reps}`;
  return map;
}

export async function getMuscleGroups(db: SQLiteDatabase): Promise<MuscleGroup[]> {
  const rows = await db.getAllAsync<{ id: string; name: string; body_region: MuscleGroup['bodyRegion'] }>(
    'SELECT id, name, body_region FROM muscle_groups ORDER BY name ASC'
  );
  return rows.map((row) => ({ id: row.id, name: row.name, bodyRegion: row.body_region }));
}

export async function getEquipmentList(db: SQLiteDatabase): Promise<Equipment[]> {
  return db.getAllAsync<Equipment>('SELECT id, name FROM equipment ORDER BY name ASC');
}
