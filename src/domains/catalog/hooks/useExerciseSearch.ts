import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';

import { searchExercises } from '@/core/database/queries/exercises.queries';

import type { ExerciseSearchFilters, ExerciseSummary } from '../types/catalog.types';

export function useExerciseSearch(
  query: string,
  filters: ExerciseSearchFilters = {}
): ExerciseSummary[] {
  const db = useSQLiteContext();
  const [results, setResults] = useState<ExerciseSummary[]>([]);
  const { primaryMuscleId, equipmentId } = filters;

  useEffect(() => {
    let cancelled = false;

    searchExercises(db, query, { primaryMuscleId, equipmentId })
      .then((rows) => {
        if (!cancelled) setResults(rows);
      })
      .catch((error: unknown) => {
        if (__DEV__) console.error('Exercise search failed', error);
      });

    return () => {
      cancelled = true;
    };
  }, [db, query, primaryMuscleId, equipmentId]);

  return results;
}
