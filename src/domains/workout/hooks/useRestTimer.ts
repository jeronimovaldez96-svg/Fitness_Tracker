import { useAudioPlayer } from 'expo-audio';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import BackgroundTimer from 'react-native-background-timer';

import { useActiveWorkoutStore } from '../store/activeWorkoutStore';

const TICK_MS = 250;
const ALARM_SOUND = require('../../../../assets/sounds/rest-timer-alarm.wav');

// `useRestTimer` can be mounted by multiple consumers at once (the inline
// banner and the full-screen /rest route both stay mounted together). This
// module-level guard, shared across every instance, makes sure the alarm
// fires exactly once per completed timer instead of once per consumer.
let lastAlarmedTargetEndTimestamp: number | null = null;

function computeRemainingSeconds(targetEndTimestamp: number | null): number {
  if (targetEndTimestamp === null) return 0;
  return Math.max(0, Math.ceil((targetEndTimestamp - Date.now()) / 1000));
}

/**
 * Wall-clock rest timer. `remainingSeconds` is always derived from
 * `targetEndTimestamp - Date.now()`, never accumulated from tick counts, so
 * correctness survives JS timer throttling, background suspension, or the
 * ticking mechanism missing beats entirely.
 */
export function useRestTimer() {
  const targetEndTimestamp = useActiveWorkoutStore((state) => state.restTimerTargetEndTimestamp);
  const durationSeconds = useActiveWorkoutStore((state) => state.restTimerDurationSeconds);
  const skipRestTimer = useActiveWorkoutStore((state) => state.skipRestTimer);
  const adjustRestTimer = useActiveWorkoutStore((state) => state.adjustRestTimer);
  const alarmPlayer = useAudioPlayer(ALARM_SOUND);

  const [prevTargetEndTimestamp, setPrevTargetEndTimestamp] = useState(targetEndTimestamp);
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    computeRemainingSeconds(targetEndTimestamp)
  );

  // Derived-state-during-render pattern: resets the displayed countdown the
  // instant targetEndTimestamp changes, without a synchronous setState-in-effect.
  if (targetEndTimestamp !== prevTargetEndTimestamp) {
    setPrevTargetEndTimestamp(targetEndTimestamp);
    setRemainingSeconds(computeRemainingSeconds(targetEndTimestamp));
  }

  useEffect(() => {
    if (targetEndTimestamp === null) return;

    const intervalId = BackgroundTimer.setInterval(() => {
      setRemainingSeconds(computeRemainingSeconds(targetEndTimestamp));
    }, TICK_MS);

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        setRemainingSeconds(computeRemainingSeconds(targetEndTimestamp));
      }
    });

    return () => {
      BackgroundTimer.clearInterval(intervalId);
      subscription.remove();
    };
  }, [targetEndTimestamp]);

  useEffect(() => {
    if (targetEndTimestamp !== null && remainingSeconds <= 0) {
      // Only play in-app: while backgrounded, the scheduled system
      // notification already alerts the user, and background JS can't
      // reliably play foreground-style audio anyway.
      if (AppState.currentState === 'active' && lastAlarmedTargetEndTimestamp !== targetEndTimestamp) {
        lastAlarmedTargetEndTimestamp = targetEndTimestamp;
        void alarmPlayer.seekTo(0).then(() => alarmPlayer.play());
      }
      skipRestTimer();
    }
  }, [remainingSeconds, targetEndTimestamp, skipRestTimer, alarmPlayer]);

  const progress =
    durationSeconds && durationSeconds > 0 ? Math.min(1, remainingSeconds / durationSeconds) : 0;

  return {
    isActive: targetEndTimestamp !== null,
    remainingSeconds,
    durationSeconds: durationSeconds ?? 0,
    progress,
    addSeconds: adjustRestTimer,
    skip: skipRestTimer,
  };
}
