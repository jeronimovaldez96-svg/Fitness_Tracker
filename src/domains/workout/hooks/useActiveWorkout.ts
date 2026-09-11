import { useSQLiteContext } from 'expo-sqlite';
import { useCallback } from 'react';

import type { ExerciseSummary } from '@/domains/catalog/types/catalog.types';

import { type ReplaceExerciseMode, useActiveWorkoutStore } from '../store/activeWorkoutStore';

export function useActiveWorkout() {
  const db = useSQLiteContext();
  const state = useActiveWorkoutStore();

  const startWorkout = useCallback(() => state.startWorkout(db), [db, state]);
  const addExercise = useCallback(
    (exercise: ExerciseSummary) => state.addExercise(db, exercise),
    [db, state]
  );
  const completeSet = useCallback(
    (workoutExerciseId: string, setId: string) => state.completeSet(db, workoutExerciseId, setId),
    [db, state]
  );
  const addSet = useCallback(
    (workoutExerciseId: string) => state.addSet(db, workoutExerciseId),
    [db, state]
  );
  const replaceExercise = useCallback(
    (workoutExerciseId: string, newExercise: ExerciseSummary, mode: ReplaceExerciseMode) =>
      state.replaceExercise(db, workoutExerciseId, newExercise, mode),
    [db, state]
  );
  const finishWorkout = useCallback(() => state.finishWorkout(db), [db, state]);

  return {
    workoutId: state.workoutId,
    title: state.title,
    startTime: state.startTime,
    exercises: state.exercises,
    focusedField: state.focusedField,
    restTimerTargetEndTimestamp: state.restTimerTargetEndTimestamp,
    lastPersonalRecordSetId: state.lastPersonalRecordSetId,
    startWorkout,
    addExercise,
    focusField: state.focusField,
    clearFocus: state.clearFocus,
    appendDigit: state.appendDigit,
    backspace: state.backspace,
    completeSet,
    addSet,
    replaceExercise,
    finishWorkout,
  };
}
