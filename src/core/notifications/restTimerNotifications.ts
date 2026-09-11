import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const CHANNEL_ID = 'rest-timer';
const NOTIFICATION_ID = 'rest-timer-complete';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function ensureRestTimerChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Rest Timer',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowCriticalAlerts: true },
  });
  return status === 'granted';
}

/** Reschedules the "rest complete" alert for the given wall-clock end time, replacing any prior one. */
export async function scheduleRestTimerNotification(targetEndTimestamp: number): Promise<void> {
  await cancelRestTimerNotification();
  await Notifications.scheduleNotificationAsync({
    identifier: NOTIFICATION_ID,
    content: {
      title: 'Rest complete',
      body: 'Time to start your next set.',
      ...(Platform.OS === 'ios' ? { sound: 'default', interruptionLevel: 'timeSensitive' } : {}),
    },
    trigger: {
      // Fires at this exact wall-clock timestamp rather than a relative
      // "seconds from now" delay, so rescheduling from adjustRestTimer can't
      // drift even if there's a tick of latency before this call resolves.
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: targetEndTimestamp,
      channelId: CHANNEL_ID,
    },
  });
}

export async function cancelRestTimerNotification(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_ID).catch(() => {});
}
