import type { SQLiteDatabase } from 'expo-sqlite';
import { create } from 'zustand';

import {
  completeWorkoutSet,
  getGhostSetsForExercise,
  getHistoricalMaxE1RM,
  insertBlankSet,
  insertWorkoutExercise,
  resetWorkoutSets,
  updateWorkoutExerciseId,
} from '@/core/database/queries/workoutSets.queries';
import { finishWorkoutRecord, insertWorkoutRecord } from '@/core/database/queries/workouts.queries';
import { getRoutineWithExercises, touchRoutineLastUsed } from '@/core/database/queries/routines.queries';
import { getWorkoutDetail } from '@/core/database/queries/history.queries';
import {
  cancelRestTimerNotification,
  scheduleRestTimerNotification,
} from '@/core/notifications/restTimerNotifications';
import { storage } from '@/core/storage/mmkv';
import type { ExerciseSummary } from '@/domains/catalog/types/catalog.types';
import { calculateE1RM } from '@/shared/utils/oneRepMax';
import { generateId } from '@/shared/utils/id';

import type { ActiveSet, ActiveWorkoutExercise, FocusedField } from '../types/workout.types';

const SNAPSHOT_KEY = 'active-workout-snapshot-v1';
const DEFAULT_REST_SECONDS = 90;
const MIN_REST_SECONDS = 5;

export type ReplaceExerciseMode = 'transfer' | 'reset';

type PersistedSnapshot = {
  workoutId: string;
  title: string;
  startTime: number;
  exercises: ActiveWorkoutExercise[];
  focusedField: FocusedField | null;
  restTimerTargetEndTimestamp: number | null;
  restTimerDurationSeconds: number | null;
};

type ActiveWorkoutState = {
  workoutId: string | null;
  title: string;
  startTime: number | null;
  exercises: ActiveWorkoutExercise[];
  focusedField: FocusedField | null;
  restTimerTargetEndTimestamp: number | null;
  restTimerDurationSeconds: number | null;
  /** Runtime-only (not persisted): set id of the most recent PR, used to trigger confetti. */
  lastPersonalRecordSetId: string | null;

  startWorkout: (db: SQLiteDatabase, title?: string) => Promise<void>;
  startWorkoutFromRoutine: (db: SQLiteDatabase, routineId: string) => Promise<void>;
  startWorkoutFromWorkout: (db: SQLiteDatabase, workoutId: string) => Promise<void>;
  addExercise: (db: SQLiteDatabase, exercise: ExerciseSummary) => Promise<void>;
  focusField: (setId: string, field: 'weight' | 'reps') => void;
  clearFocus: () => void;
  appendDigit: (digit: string) => void;
  backspace: () => void;
  completeSet: (db: SQLiteDatabase, workoutExerciseId: string, setId: string) => Promise<void>;
  addSet: (db: SQLiteDatabase, workoutExerciseId: string) => Promise<void>;
  replaceExercise: (
    db: SQLiteDatabase,
    workoutExerciseId: string,
    newExercise: ExerciseSummary,
    mode: ReplaceExerciseMode
  ) => Promise<void>;
  adjustRestTimer: (deltaSeconds: number) => void;
  skipRestTimer: () => void;
  /** Returns the id of the workout that was just finished, so callers can navigate to its summary. */
  finishWorkout: (db: SQLiteDatabase) => Promise<string | null>;
};

/** Shared by startWorkoutFromRoutine/startWorkoutFromWorkout: inserts one exercise + N pre-filled blank sets. */
async function seedExercise(
  db: SQLiteDatabase,
  workoutExerciseId: string,
  exerciseId: string,
  exerciseName: string,
  equipmentId: string,
  orderIndex: number,
  workoutId: string,
  ghosts: { weightKg: number | null; reps: number | null }[]
): Promise<ActiveWorkoutExercise> {
  await insertWorkoutExercise(db, { id: workoutExerciseId, workoutId, exerciseId, orderIndex });

  const sets: ActiveSet[] = [];
  for (const [index, ghost] of ghosts.entries()) {
    const setId = generateId();
    await insertBlankSet(db, { id: setId, workoutExerciseId, setOrder: index + 1 });
    sets.push({
      id: setId,
      workoutExerciseId,
      setOrder: index + 1,
      isCompleted: false,
      weightKg: null,
      reps: null,
      isPersonalRecord: false,
      ghostWeightKg: ghost.weightKg,
      ghostReps: ghost.reps,
      draftWeight: '',
      draftReps: '',
    });
  }

  return { id: workoutExerciseId, exerciseId, exerciseName, equipmentId, lastLabel: null, sets };
}

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
    restTimerDurationSeconds: state.restTimerDurationSeconds,
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
  restTimerDurationSeconds: initialSnapshot?.restTimerDurationSeconds ?? null,
  lastPersonalRecordSetId: null,

  async startWorkout(db, title = 'Workout') {
    const workoutId = generateId();
    const startTime = Date.now();

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

  async startWorkoutFromRoutine(db, routineId) {
    const routine = await getRoutineWithExercises(db, routineId);
    if (!routine) return;

    await get().startWorkout(db, routine.name);
    const workoutId = get().workoutId;
    if (!workoutId) return;

    const exercises: ActiveWorkoutExercise[] = [];
    for (const [index, routineExercise] of routine.exercises.entries()) {
      const ghosts = Array.from({ length: Math.max(1, routineExercise.targetSets) }, () => ({
        weightKg: routineExercise.targetWeightKg,
        reps: parseInt(routineExercise.targetReps, 10) || null,
      }));
      exercises.push(
        await seedExercise(
          db,
          generateId(),
          routineExercise.exerciseId,
          routineExercise.exerciseName,
          routineExercise.equipmentId,
          index,
          workoutId,
          ghosts
        )
      );
    }

    set({ exercises });
    persistSnapshot(get());
    await touchRoutineLastUsed(db, routineId);
  },

  async startWorkoutFromWorkout(db, workoutId) {
    const source = await getWorkoutDetail(db, workoutId);
    if (!source) return;

    await get().startWorkout(db, source.title);
    const newWorkoutId = get().workoutId;
    if (!newWorkoutId) return;

    const exercises: ActiveWorkoutExercise[] = [];
    for (const [index, sourceExercise] of source.exercises.entries()) {
      const completedSets = sourceExercise.sets.filter((s) => s.weightKg !== null && s.reps !== null);
      const ghosts =
        completedSets.length > 0
          ? completedSets.map((s) => ({ weightKg: s.weightKg, reps: s.reps }))
          : [{ weightKg: null, reps: null }];
      exercises.push(
        await seedExercise(
          db,
          generateId(),
          sourceExercise.exerciseId,
          sourceExercise.exerciseName,
          sourceExercise.equipmentId,
          index,
          newWorkoutId,
          ghosts
        )
      );
    }

    set({ exercises });
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
      equipmentId: exercise.equipmentId,
      lastLabel:
        firstGhost && firstGhost.weightKg !== null && firstGhost.reps !== null
          ? `Last: ${firstGhost.weightKg} kg × ${firstGhost.reps}`
          : null,
      sets: [
        {
          id: setId,
          workoutExerciseId,
          setOrder: 1,
          isCompleted: false,
          weightKg: null,
          reps: null,
          isPersonalRecord: false,
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

    let isPersonalRecord = false;
    const e1rm = weightKg !== null && reps !== null ? calculateE1RM(weightKg, reps) : null;
    if (e1rm !== null) {
      const historicalMax = await getHistoricalMaxE1RM(db, exercise.exerciseId, setId);
      isPersonalRecord = historicalMax !== null && e1rm > historicalMax;
    }

    await completeWorkoutSet(db, { id: setId, weightKg, reps, completedAt, isPersonalRecord });

    const restTimerTargetEndTimestamp = Date.now() + DEFAULT_REST_SECONDS * 1000;

    set({
      exercises: get().exercises.map((ex) =>
        ex.id !== workoutExerciseId
          ? ex
          : {
              ...ex,
              sets: ex.sets.map((s) =>
                s.id !== setId ? s : { ...s, isCompleted: true, weightKg, reps, isPersonalRecord }
              ),
            }
      ),
      restTimerTargetEndTimestamp,
      restTimerDurationSeconds: DEFAULT_REST_SECONDS,
      lastPersonalRecordSetId: isPersonalRecord ? setId : get().lastPersonalRecordSetId,
    });
    persistSnapshot(get());
    void scheduleRestTimerNotification(restTimerTargetEndTimestamp);

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
      isPersonalRecord: false,
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

  async replaceExercise(db, workoutExerciseId, newExercise, mode) {
    const state = get();
    const exercise = state.exercises.find((ex) => ex.id === workoutExerciseId);
    if (!exercise || !state.workoutId) return;

    await updateWorkoutExerciseId(db, { workoutExerciseId, exerciseId: newExercise.id });

    if (mode === 'reset') {
      await resetWorkoutSets(db, workoutExerciseId);
      const ghostSets = await getGhostSetsForExercise(db, newExercise.id, state.workoutId);

      set({
        exercises: get().exercises.map((ex) =>
          ex.id !== workoutExerciseId
            ? ex
            : {
                ...ex,
                exerciseId: newExercise.id,
                exerciseName: newExercise.name,
                equipmentId: newExercise.equipmentId,
                lastLabel: null,
                sets: ex.sets.map((s, index) => ({
                  ...s,
                  isCompleted: false,
                  weightKg: null,
                  reps: null,
                  isPersonalRecord: false,
                  draftWeight: '',
                  draftReps: '',
                  ghostWeightKg: ghostSets[index]?.weightKg ?? null,
                  ghostReps: ghostSets[index]?.reps ?? null,
                })),
              }
        ),
      });
    } else {
      set({
        exercises: get().exercises.map((ex) =>
          ex.id !== workoutExerciseId
            ? ex
            : { ...ex, exerciseId: newExercise.id, exerciseName: newExercise.name, equipmentId: newExercise.equipmentId }
        ),
      });
    }
    persistSnapshot(get());
  },

  adjustRestTimer(deltaSeconds) {
    const state = get();
    if (state.restTimerTargetEndTimestamp === null) return;

    const newTarget = state.restTimerTargetEndTimestamp + deltaSeconds * 1000;
    if (newTarget - Date.now() < MIN_REST_SECONDS * 1000) {
      get().skipRestTimer();
      return;
    }

    const newDuration = Math.max(
      MIN_REST_SECONDS,
      (state.restTimerDurationSeconds ?? DEFAULT_REST_SECONDS) + deltaSeconds
    );

    set({ restTimerTargetEndTimestamp: newTarget, restTimerDurationSeconds: newDuration });
    persistSnapshot(get());
    void scheduleRestTimerNotification(newTarget);
  },

  skipRestTimer() {
    set({ restTimerTargetEndTimestamp: null, restTimerDurationSeconds: null });
    persistSnapshot(get());
    void cancelRestTimerNotification();
  },

  async finishWorkout(db) {
    const state = get();
    if (!state.workoutId) return null;

    const finishedWorkoutId = state.workoutId;
    await finishWorkoutRecord(db, { id: finishedWorkoutId, endTime: Date.now() });
    storage.remove(SNAPSHOT_KEY);
    void cancelRestTimerNotification();

    set({
      workoutId: null,
      title: '',
      startTime: null,
      exercises: [],
      focusedField: null,
      restTimerTargetEndTimestamp: null,
      restTimerDurationSeconds: null,
    });

    return finishedWorkoutId;
  },
}));
