import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { backupDatabase, exportWorkoutsAsCsv, resetAllData } from '@/core/storage/dataManagement';
import { useLastBackupAt, usePlateCalculatorSetting, useUnitSystem } from '@/core/storage/settings';
import { useThemedStyles, useTheme, useThemeOverride, type Theme } from '@/core/theme';
import { SegmentedControl } from '@/shared/components/SegmentedControl';
import { Tag } from '@/shared/components/Tag';

export default function ProfileScreen() {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [, setThemeOverride] = useThemeOverride();
  const [unitSystem, setUnitSystem] = useUnitSystem();
  const [plateCalculatorEnabled, setPlateCalculatorEnabled] = usePlateCalculatorSetting();
  const [lastBackupAt, setLastBackupAt] = useLastBackupAt();
  const [isExporting, setIsExporting] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);

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
      <View style={[styles.row, { borderBottomColor: colors.soft }]}>
        <Text style={[styles.rowLabel, { color: colors.ink }]}>Default rest</Text>
        <Text style={[styles.rowValue, { color: colors.ink }]}>1:30</Text>
      </View>
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
  };
}
