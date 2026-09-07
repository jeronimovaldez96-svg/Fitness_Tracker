import { useSQLiteContext } from 'expo-sqlite';
import { useCallback } from 'react';

import { getGhostSetsForExercise, type GhostSet } from '@/core/database/queries/workoutSets.queries';

/**
 * Exposes the TRD 5.1 Ghost Value Engine lookup as a hook so any screen
 * (not just the active session flow) can preview a lifter's most recent
 * completed performance for a given exercise.
 */
export function useGhostData() {
  const db = useSQLiteContext();

  return useCallback(
    (exerciseId: string, excludeWorkoutId: string): Promise<GhostSet[]> =>
      getGhostSetsForExercise(db, exerciseId, excludeWorkoutId),
    [db]
  );
}
