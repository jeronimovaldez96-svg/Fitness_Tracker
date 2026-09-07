import type { SQLiteDatabase } from 'expo-sqlite';
import { create } from 'zustand';

import {
  completeWorkoutSet,
  getGhostSetsForExercise,
  insertBlankSet,
  insertWorkoutExercise,
} from '@/core/database/queries/workoutSets.queries';
import { finishWorkoutRecord, insertWorkoutRecord } from '@/core/database/queries/workouts.queries';
import { storage } from '@/core/storage/mmkv';
import type { ExerciseSummary } from '@/domains/catalog/types/catalog.types';
import { generateId } from '@/shared/utils/id';

import type { ActiveSet, ActiveWorkoutExercise, FocusedField } from '../types/workout.types';

const SNAPSHOT_KEY = 'active-workout-snapshot-v1';
/** Stub default; the real rest-timer engine (durations per exercise, adjustments) lands in M5. */
const DEFAULT_REST_SECONDS = 90;

type PersistedSnapshot = {
  workoutId: string;
  title: string;
  startTime: number;
  exercises: ActiveWorkoutExercise[];
  focusedField: FocusedField | null;
  restTimerTargetEndTimestamp: number | null;
};

type ActiveWorkoutState = {
  workoutId: string | null;
  title: string;
  startTime: number | null;
  exercises: ActiveWorkoutExercise[];
  focusedField: FocusedField | null;
  restTimerTargetEndTimestamp: number | null;

  startWorkout: (db: SQLiteDatabase) => Promise<void>;
  addExercise: (db: SQLiteDatabase, exercise: ExerciseSummary) => Promise<void>;
  focusField: (setId: string, field: 'weight' | 'reps') => void;
  clearFocus: () => void;
  appendDigit: (digit: string) => void;
  backspace: () => void;
  completeSet: (db: SQLiteDatabase, workoutExerciseId: string, setId: string) => Promise<void>;
  addSet: (db: SQLiteDatabase, workoutExerciseId: string) => Promise<void>;
  finishWorkout: (db: SQLiteDatabase) => Promise<void>;
};

function persistSnapshot(state: ActiveWorkoutState): void {
  if (!state.workoutId || state.startTime === null) {
    storage.remove(SNAPSHOT_KEY);
    return;
  }
  const snapshot: PersistedSnapshot = {
    workoutId: state.workoutId,
    title: state.title,
    startTime: state.startTime,
    exercises: state.exercises,
    focusedField: state.focusedField,
    restTimerTargetEndTimestamp: state.restTimerTargetEndTimestamp,
  };
  storage.set(SNAPSHOT_KEY, JSON.stringify(snapshot));
}

function loadSnapshot(): PersistedSnapshot | null {
  const raw = storage.getString(SNAPSHOT_KEY);
  if (raw === undefined) return null;
  try {
    return JSON.parse(raw) as PersistedSnapshot;
  } catch {
    return null;
  }
}

const initialSnapshot = loadSnapshot();

export const useActiveWorkoutStore = create<ActiveWorkoutState>((set, get) => ({
  workoutId: initialSnapshot?.workoutId ?? null,
  title: initialSnapshot?.title ?? '',
  startTime: initialSnapshot?.startTime ?? null,
  exercises: initialSnapshot?.exercises ?? [],
  focusedField: initialSnapshot?.focusedField ?? null,
  restTimerTargetEndTimestamp: initialSnapshot?.restTimerTargetEndTimestamp ?? null,

  async startWorkout(db) {
    const workoutId = generateId();
    const startTime = Date.now();
    const title = 'Workout';

    await insertWorkoutRecord(db, { id: workoutId, title, startTime });

    set({
      workoutId,
      title,
      startTime,
      exercises: [],
      focusedField: null,
      restTimerTargetEndTimestamp: null,
    });
    persistSnapshot(get());
  },

  async addExercise(db, exercise) {
    const state = get();
    if (!state.workoutId) return;

    const workoutExerciseId = generateId();
    const orderIndex = state.exercises.length;
    await insertWorkoutExercise(db, {
      id: workoutExerciseId,
      workoutId: state.workoutId,
      exerciseId: exercise.id,
      orderIndex,
    });

    const ghostSets = await getGhostSetsForExercise(db, exercise.id, state.workoutId);
    const firstGhost = ghostSets[0] ?? null;

    const setId = generateId();
    await insertBlankSet(db, { id: setId, workoutExerciseId, setOrder: 1 });

    const newExercise: ActiveWorkoutExercise = {
      id: workoutExerciseId,
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      sets: [
        {
          id: setId,
          workoutExerciseId,
          setOrder: 1,
          isCompleted: false,
          weightKg: null,
          reps: null,
          ghostWeightKg: firstGhost?.weightKg ?? null,
          ghostReps: firstGhost?.reps ?? null,
          draftWeight: '',
          draftReps: '',
        },
      ],
    };

    set({ exercises: [...get().exercises, newExercise] });
    persistSnapshot(get());
  },

  focusField(setId, field) {
    set({ focusedField: { setId, field } });
    persistSnapshot(get());
  },

  clearFocus() {
    set({ focusedField: null });
    persistSnapshot(get());
  },

  appendDigit(digit) {
    const state = get();
    const { focusedField } = state;
    if (!focusedField) return;

    set({
      exercises: state.exercises.map((exercise) => ({
        ...exercise,
        sets: exercise.sets.map((activeSet) => {
          if (activeSet.id !== focusedField.setId) return activeSet;
          const key = focusedField.field === 'weight' ? 'draftWeight' : 'draftReps';
          const current = activeSet[key];
          if (digit === '.' && current.includes('.')) return activeSet;
          if (current.length >= 6) return activeSet;
          return { ...activeSet, [key]: current + digit };
        }),
      })),
    });
    persistSnapshot(get());
  },

  backspace() {
    const state = get();
    const { focusedField } = state;
    if (!focusedField) return;

    set({
      exercises: state.exercises.map((exercise) => ({
        ...exercise,
        sets: exercise.sets.map((activeSet) => {
          if (activeSet.id !== focusedField.setId) return activeSet;
          const key = focusedField.field === 'weight' ? 'draftWeight' : 'draftReps';
          return { ...activeSet, [key]: activeSet[key].slice(0, -1) };
        }),
      })),
    });
    persistSnapshot(get());
  },

  async completeSet(db, workoutExerciseId, setId) {
    const state = get();
    const exercise = state.exercises.find((ex) => ex.id === workoutExerciseId);
    const activeSet = exercise?.sets.find((s) => s.id === setId);
    if (!exercise || !activeSet) return;

    const weightKg =
      activeSet.draftWeight !== '' ? parseFloat(activeSet.draftWeight) : activeSet.ghostWeightKg;
    const reps =
      activeSet.draftReps !== '' ? parseInt(activeSet.draftReps, 10) : activeSet.ghostReps;
    const completedAt = Date.now();

    await completeWorkoutSet(db, { id: setId, weightKg, reps, completedAt });

    set({
      exercises: get().exercises.map((ex) =>
        ex.id !== workoutExerciseId
          ? ex
          : {
              ...ex,
              sets: ex.sets.map((s) =>
                s.id !== setId ? s : { ...s, isCompleted: true, weightKg, reps }
              ),
            }
      ),
      // Stub: real wall-clock rest timer engine (banner, notifications, adjustments) is M5.
      restTimerTargetEndTimestamp: Date.now() + DEFAULT_REST_SECONDS * 1000,
    });
    persistSnapshot(get());

    const refreshedExercise = get().exercises.find((ex) => ex.id === workoutExerciseId);
    const currentIndex = refreshedExercise?.sets.findIndex((s) => s.id === setId) ?? -1;
    const nextExisting = refreshedExercise?.sets[currentIndex + 1];

    if (nextExisting) {
      set({ focusedField: { setId: nextExisting.id, field: 'weight' } });
      persistSnapshot(get());
    } else {
      await get().addSet(db, workoutExerciseId);
    }
  },

  async addSet(db, workoutExerciseId) {
    const state = get();
    const exercise = state.exercises.find((ex) => ex.id === workoutExerciseId);
    if (!exercise) return;

    const newSetId = generateId();
    const newSetOrder = exercise.sets.length + 1;
    await insertBlankSet(db, { id: newSetId, workoutExerciseId, setOrder: newSetOrder });

    const lastSet = exercise.sets[exercise.sets.length - 1];
    const newSet: ActiveSet = {
      id: newSetId,
      workoutExerciseId,
      setOrder: newSetOrder,
      isCompleted: false,
      weightKg: null,
      reps: null,
      ghostWeightKg: lastSet?.weightKg ?? lastSet?.ghostWeightKg ?? null,
      ghostReps: lastSet?.reps ?? lastSet?.ghostReps ?? null,
      draftWeight: '',
      draftReps: '',
    };

    set({
      exercises: get().exercises.map((ex) =>
        ex.id !== workoutExerciseId ? ex : { ...ex, sets: [...ex.sets, newSet] }
      ),
      focusedField: { setId: newSetId, field: 'weight' },
    });
    persistSnapshot(get());
  },

  async finishWorkout(db) {
    const state = get();
    if (!state.workoutId) return;

    await finishWorkoutRecord(db, { id: state.workoutId, endTime: Date.now() });
    storage.remove(SNAPSHOT_KEY);

    set({
      workoutId: null,
      title: '',
      startTime: null,
      exercises: [],
      focusedField: null,
      restTimerTargetEndTimestamp: null,
    });
  },
}));
