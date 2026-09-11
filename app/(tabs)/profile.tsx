import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { backupDatabase, exportWorkoutsAsCsv, resetAllData, restoreDatabase } from '@/core/storage/dataManagement';
import {
  useDefaultRestSeconds,
  useLastBackupAt,
  usePlateCalculatorSetting,
  useUnitSystem,
} from '@/core/storage/settings';
import { useThemedStyles, useTheme, useThemeOverride, type Theme } from '@/core/theme';
import { Modal } from '@/shared/components/Modal';
import { SegmentedControl } from '@/shared/components/SegmentedControl';
import { Tag } from '@/shared/components/Tag';

const MIN_DEFAULT_REST_SECONDS = 15;
const MAX_DEFAULT_REST_SECONDS = 300;

function formatRestClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function ProfileScreen() {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [, setThemeOverride] = useThemeOverride();
  const [unitSystem, setUnitSystem] = useUnitSystem();
  const [plateCalculatorEnabled, setPlateCalculatorEnabled] = usePlateCalculatorSetting();
  const [lastBackupAt, setLastBackupAt] = useLastBackupAt();
  const [defaultRestSeconds, setDefaultRestSeconds] = useDefaultRestSeconds();
  const [isExporting, setIsExporting] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isRestPickerVisible, setIsRestPickerVisible] = useState(false);

  function handleAdjustDefaultRest(deltaSeconds: number) {
    setDefaultRestSeconds(
      Math.min(MAX_DEFAULT_REST_SECONDS, Math.max(MIN_DEFAULT_REST_SECONDS, defaultRestSeconds + deltaSeconds))
    );
  }

  async function handleExport() {
    setIsExporting(true);
    try {
      await exportWorkoutsAsCsv(db);
    } catch (error) {
      if (__DEV__) console.error('Export failed', error);
      Alert.alert('Export failed', 'Could not export your workout data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }

  async function handleBackup() {
    setIsBackingUp(true);
    try {
      await backupDatabase();
      setLastBackupAt(Date.now());
    } catch (error) {
      if (__DEV__) console.error('Backup failed', error);
      Alert.alert('Backup failed', 'Could not back up your database. Please try again.');
    } finally {
      setIsBackingUp(false);
    }
  }

  async function performRestore() {
    setIsRestoring(true);
    try {
      const restored = await restoreDatabase(db);
      // On success the app reloads before this line would matter; this only
      // runs if the user cancelled the picker or the reload didn't happen.
      if (!restored) setIsRestoring(false);
    } catch (error) {
      if (__DEV__) console.error('Restore failed', error);
      Alert.alert('Restore failed', 'Could not restore the database from that file.');
      setIsRestoring(false);
    }
  }

  function handleRestore() {
    Alert.alert(
      'Restore from backup?',
      'This completely replaces your current workout data with the picked backup file. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Restore', style: 'destructive', onPress: () => void performRestore() },
      ]
    );
  }

  function handleReset() {
    Alert.alert(
      'Reset all data?',
      'This permanently deletes your workout history, plans and body metrics. Your exercise catalog is unaffected. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            void resetAllData(db).then(() => router.replace('/(tabs)'));
          },
        },
      ]
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bg }]}
      contentContainerStyle={{ paddingTop: insets.top + 14, paddingBottom: insets.bottom + 20 }}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.ink }]}>You</Text>
      </View>
      <View style={[styles.divider, { backgroundColor: colors.divider }]} />

      <SectionLabel text="TRAINING" />
      <View style={[styles.row, { borderBottomColor: colors.soft }]}>
        <Text style={[styles.rowLabel, { color: colors.ink }]}>Units</Text>
        <SegmentedControl
          options={[
            { label: 'KG', value: 'metric' as const },
            { label: 'LB', value: 'imperial' as const },
          ]}
          value={unitSystem}
          onChange={setUnitSystem}
        />
      </View>
      <Pressable
        onPress={() => setIsRestPickerVisible(true)}
        style={[styles.row, { borderBottomColor: colors.soft }]}
      >
        <Text style={[styles.rowLabel, { color: colors.ink }]}>Default rest</Text>
        <Text style={[styles.rowValue, { color: colors.ink }]}>{formatRestClock(defaultRestSeconds)}</Text>
      </Pressable>
      <Pressable
        onPress={() => setPlateCalculatorEnabled(!plateCalculatorEnabled)}
        style={[styles.row, { borderBottomColor: colors.soft }]}
      >
        <Text style={[styles.rowLabel, { color: colors.ink }]}>Plate calculator</Text>
        <View
          style={[
            styles.toggle,
            plateCalculatorEnabled
              ? { backgroundColor: colors.ink }
              : { borderWidth: 1, borderColor: colors.divider },
          ]}
        >
          <View
            style={[
              styles.toggleDot,
              { backgroundColor: plateCalculatorEnabled ? colors.bg : colors.ghost },
              plateCalculatorEnabled && styles.toggleDotOn,
            ]}
          />
        </View>
      </Pressable>

      <View style={[styles.divider, { backgroundColor: colors.divider, marginTop: 14 }]} />
      <SectionLabel text="APPEARANCE" />
      <View style={[styles.row, { borderBottomColor: colors.soft }]}>
        <Text style={[styles.rowLabel, { color: colors.ink }]}>Theme</Text>
        <SegmentedControl
          options={[
            { label: 'LIGHT', value: 'light' as const },
            { label: 'DARK', value: 'dark' as const },
          ]}
          value={isDark ? 'dark' : 'light'}
          onChange={setThemeOverride}
        />
      </View>

      <View style={[styles.divider, { backgroundColor: colors.divider, marginTop: 14 }]} />
      <SectionLabel text="MODULES" />
      <Pressable onPress={() => router.push('/nutrition')} style={[styles.row, { borderBottomColor: colors.soft }]}>
        <Text style={[styles.rowLabel, { color: colors.ink }]}>Nutrition</Text>
        <View style={styles.rowRight}>
          <Tag variant="neutral" label="NOT SHIPPED" />
          <Text style={[styles.rowArrow, { color: colors.muted }]}>→</Text>
        </View>
      </Pressable>

      <View style={[styles.divider, { backgroundColor: colors.divider, marginTop: 14 }]} />
      <SectionLabel text="DATA" />
      <Pressable onPress={handleExport} disabled={isExporting} style={[styles.row, { borderBottomColor: colors.soft }]}>
        <Text style={[styles.rowLabel, { color: colors.ink }]}>{isExporting ? 'Exporting…' : 'Export as CSV'}</Text>
        <Text style={[styles.rowArrow, { color: colors.muted }]}>→</Text>
      </Pressable>
      <Pressable onPress={handleBackup} disabled={isBackingUp} style={[styles.row, { borderBottomColor: colors.soft }]}>
        <Text style={[styles.rowLabel, { color: colors.ink }]}>{isBackingUp ? 'Backing up…' : 'Back up database'}</Text>
        <Text style={[styles.rowValueMuted, { color: colors.muted }]}>
          {lastBackupAt ? new Date(lastBackupAt).toLocaleDateString() : 'Never'}
        </Text>
      </Pressable>
      {__DEV__ ? (
        <Pressable onPress={handleRestore} disabled={isRestoring} style={[styles.row, { borderBottomColor: colors.soft }]}>
          <Text style={[styles.rowLabel, { color: colors.ink }]}>
            {isRestoring ? 'Restoring…' : 'Restore from backup'}
          </Text>
          <Tag variant="outline" label="DEV" />
        </Pressable>
      ) : null}

      <View style={styles.footer}>
        <Pressable
          onPress={handleReset}
          style={[styles.resetButton, { borderColor: colors.accent }]}
          accessibilityRole="button"
          accessibilityLabel="Reset all data"
        >
          <Text style={[styles.resetLabel, { color: colors.accent }]}>Reset all data</Text>
        </Pressable>
        <Text style={[styles.versionText, { color: colors.ghost }]}>Fitness_Tracker · local-only · v0.6.0</Text>
      </View>

      <Modal visible={isRestPickerVisible} onRequestClose={() => setIsRestPickerVisible(false)}>
        <Text style={[styles.restPickerTitle, { color: colors.ink }]}>Default rest</Text>
        <View style={styles.restPickerRow}>
          <Pressable
            onPress={() => handleAdjustDefaultRest(-15)}
            accessibilityRole="button"
            accessibilityLabel="Decrease default rest by 15 seconds"
            style={[styles.restPickerAdjustButton, { borderColor: colors.divider }]}
          >
            <Text style={[styles.restPickerAdjustLabel, { color: colors.ink }]}>−15</Text>
          </Pressable>
          <Text style={[styles.restPickerValue, { color: colors.ink }]}>
            {formatRestClock(defaultRestSeconds)}
          </Text>
          <Pressable
            onPress={() => handleAdjustDefaultRest(15)}
            accessibilityRole="button"
            accessibilityLabel="Increase default rest by 15 seconds"
            style={[styles.restPickerAdjustButton, { borderColor: colors.divider }]}
          >
            <Text style={[styles.restPickerAdjustLabel, { color: colors.ink }]}>+15</Text>
          </Pressable>
        </View>
        <Pressable
          onPress={() => setIsRestPickerVisible(false)}
          style={[styles.restPickerDoneButton, { backgroundColor: colors.ink }]}
          accessibilityRole="button"
          accessibilityLabel="Done"
        >
          <Text style={[styles.restPickerDoneLabel, { color: colors.bg }]}>Done</Text>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

function SectionLabel({ text }: { text: string }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.sectionLabelWrap}>
      <Text style={[styles.sectionLabel, { color: colors.muted }]}>{text}</Text>
    </View>
  );
}

function createStyles(theme: Theme) {
  return {
    container: {
      flex: 1,
    },
    header: {
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
    },
    title: {
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.display3,
      letterSpacing: -0.5,
    },
    divider: {
      height: 2,
    },
    sectionLabelWrap: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.md,
      paddingBottom: 6,
    },
    sectionLabel: {
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.xs,
      letterSpacing: 1,
    },
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      gap: theme.spacing.md,
      minHeight: 56,
      paddingHorizontal: theme.spacing.lg,
      borderBottomWidth: 1,
    },
    rowLabel: {
      fontFamily: theme.fontFamily.semibold,
      fontSize: theme.fontSize.lg,
    },
    rowValue: {
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.xl,
      fontVariant: ['tabular-nums' as const],
    },
    rowValueMuted: {
      fontFamily: theme.fontFamily.medium,
      fontSize: theme.fontSize.sm,
    },
    rowRight: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: theme.spacing.sm,
    },
    rowArrow: {
      fontSize: theme.fontSize.xl,
    },
    toggle: {
      width: 52,
      height: 28,
      padding: 3,
      justifyContent: 'center' as const,
    },
    toggleDot: {
      width: 20,
      height: 20,
    },
    toggleDotOn: {
      alignSelf: 'flex-end' as const,
    },
    footer: {
      padding: theme.spacing.lg,
    },
    resetButton: {
      minHeight: theme.minTouchTarget,
      borderWidth: 1,
      alignItems: 'flex-start' as const,
      justifyContent: 'center' as const,
      paddingHorizontal: theme.spacing.lg,
    },
    resetLabel: {
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.md,
      letterSpacing: 0.4,
    },
    versionText: {
      fontFamily: theme.fontFamily.regular,
      fontSize: theme.fontSize.xs,
      marginTop: theme.spacing.lg,
    },
    restPickerTitle: {
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.xl,
      marginBottom: theme.spacing.lg,
    },
    restPickerRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      gap: theme.spacing.md,
    },
    restPickerAdjustButton: {
      minHeight: theme.minTouchTarget,
      minWidth: theme.minTouchTarget,
      borderWidth: 1,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    restPickerAdjustLabel: {
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.md,
    },
    restPickerValue: {
      flex: 1,
      textAlign: 'center' as const,
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.display1,
      fontVariant: ['tabular-nums' as const],
    },
    restPickerDoneButton: {
      minHeight: theme.minTouchTarget,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginTop: theme.spacing.lg,
    },
    restPickerDoneLabel: {
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.md,
      letterSpacing: 0.4,
    },
  };
}
