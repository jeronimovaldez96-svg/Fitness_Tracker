import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  getBodyweightSeries,
  getLatestMeasurements,
  insertBodyweightEntry,
  insertMeasurement,
} from '@/core/database/queries/bodyMetrics.queries';
import { useThemedStyles, useTheme, type Theme } from '@/core/theme';
import {
  MEASUREMENT_LABELS,
  MEASUREMENT_METRICS,
  type BodyweightTrend,
  type MeasurementRow,
} from '@/domains/workout/types/bodyMetrics.types';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { Sheet } from '@/shared/components/Sheet';
import { Sparkline } from '@/shared/components/Sparkline';

type LoggableMetric = 'weight' | (typeof MEASUREMENT_METRICS)[number];
const LOGGABLE_METRICS: LoggableMetric[] = ['weight', ...MEASUREMENT_METRICS];

export default function BodyMetricsRoute() {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [trend, setTrend] = useState<BodyweightTrend>({ series: [], latestKg: null, deltaKg: null });
  const [measurements, setMeasurements] = useState<MeasurementRow[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<LoggableMetric>('weight');
  const [inputValue, setInputValue] = useState('');

  const load = useCallback(async () => {
    const [bodyweight, latest] = await Promise.all([getBodyweightSeries(db), getLatestMeasurements(db)]);
    setTrend(bodyweight);
    setMeasurements(latest);
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  async function handleSave() {
    const value = parseFloat(inputValue);
    if (!Number.isFinite(value) || value <= 0) return;

    if (selectedMetric === 'weight') {
      await insertBodyweightEntry(db, { weightKg: value, measuredAt: Date.now() });
    } else {
      await insertMeasurement(db, { metric: selectedMetric, value, unit: 'cm', measuredAt: Date.now() });
    }
    setInputValue('');
    setSheetOpen(false);
    void load();
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Button label="← PROGRESS" onPress={() => router.back()} variant="ghost" compact style={styles.backButton} />
        <Text style={[styles.title, { color: colors.ink }]}>Body</Text>
      </View>
      <View style={[styles.divider, { backgroundColor: colors.divider }]} />

      <ScrollView>
        <View style={[styles.weightSection, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionLabel, { color: colors.muted }]}>BODYWEIGHT · 12 WEEKS</Text>
          <View style={styles.weightRow}>
            <Text style={[styles.weightValue, { color: colors.ink }]}>{trend.latestKg ?? '—'}</Text>
            <Text style={[styles.weightUnit, { color: colors.muted }]}>kg</Text>
            {trend.deltaKg !== null ? (
              <Text style={[styles.weightDelta, { color: colors.accent }]}>
                {trend.deltaKg >= 0 ? '+' : ''}
                {trend.deltaKg}
              </Text>
            ) : null}
          </View>
          {trend.series.length >= 2 ? (
            <View style={[styles.sparklineWrap, { borderBottomColor: colors.divider }]}>
              <Sparkline values={trend.series} width={264} height={84} />
            </View>
          ) : (
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              Log your weight a couple of times to see a trend.
            </Text>
          )}
        </View>
        <View style={[styles.divider, { backgroundColor: colors.divider }]} />

        <View style={styles.measuresSection}>
          <Text style={[styles.sectionLabel, { color: colors.muted }]}>MEASUREMENTS · LAST 12 WEEKS</Text>
          {measurements.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.muted }]}>No measurements logged yet.</Text>
          ) : (
            measurements.map((row) => (
              <View key={row.metric} style={[styles.measureRow, { borderBottomColor: colors.soft }]}>
                <Text style={[styles.measureName, { color: colors.ink }]}>{row.label}</Text>
                <Text style={[styles.measureValue, { color: colors.ink }]}>{row.value}</Text>
                <Text style={[styles.measureUnit, { color: colors.muted }]}>{row.unit}</Text>
                <Text style={[styles.measureDelta, { color: colors.muted }]}>
                  {row.deltaValue >= 0 ? '+' : ''}
                  {row.deltaValue}
                </Text>
              </View>
            ))
          )}
          <Button
            label="+ Log measurement"
            onPress={() => setSheetOpen(true)}
            variant="secondary"
            fullWidth
            style={styles.logButton}
          />
        </View>
      </ScrollView>

      <Sheet visible={sheetOpen} onClose={() => setSheetOpen(false)}>
        <Text style={[styles.sheetTitle, { color: colors.ink }]}>Log measurement</Text>
        <View style={styles.metricPicker}>
          {LOGGABLE_METRICS.map((metric) => {
            const label = metric === 'weight' ? 'Weight' : MEASUREMENT_LABELS[metric];
            const active = metric === selectedMetric;
            return (
              <Pressable
                key={metric}
                onPress={() => setSelectedMetric(metric)}
                style={[
                  styles.metricChip,
                  active ? { backgroundColor: colors.ink } : { borderWidth: 1, borderColor: colors.divider },
                ]}
              >
                <Text style={[styles.metricChipLabel, { color: active ? colors.bg : colors.muted }]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
        <Input
          label={`Value (${selectedMetric === 'weight' ? 'kg' : 'cm'})`}
          value={inputValue}
          onChangeText={setInputValue}
          keyboardType="decimal-pad"
          placeholder="0"
          style={styles.sheetInput}
        />
        <Button label="Save" onPress={handleSave} variant="primary" fullWidth style={styles.sheetSaveButton} />
      </Sheet>
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
      paddingTop: theme.spacing.sm,
      paddingBottom: theme.spacing.md,
    },
    backButton: {
      alignSelf: 'flex-start' as const,
      paddingHorizontal: 0,
    },
    title: {
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.display3,
      letterSpacing: -0.5,
      marginTop: 6,
    },
    divider: {
      height: 2,
    },
    weightSection: {
      padding: theme.spacing.lg,
    },
    sectionLabel: {
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.xs,
      letterSpacing: 1,
    },
    weightRow: {
      flexDirection: 'row' as const,
      alignItems: 'baseline' as const,
      gap: theme.spacing.sm,
      marginTop: 10,
    },
    weightValue: {
      fontFamily: theme.fontFamily.bold,
      fontSize: 46,
      letterSpacing: -1,
    },
    weightUnit: {
      fontFamily: theme.fontFamily.semibold,
      fontSize: theme.fontSize.md,
    },
    weightDelta: {
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.md,
      fontVariant: ['tabular-nums' as const],
    },
    sparklineWrap: {
      marginTop: 18,
      borderBottomWidth: 2,
      paddingBottom: 4,
    },
    emptyText: {
      fontFamily: theme.fontFamily.medium,
      fontSize: theme.fontSize.md,
      marginTop: theme.spacing.sm,
    },
    measuresSection: {
      padding: theme.spacing.lg,
    },
    measureRow: {
      flexDirection: 'row' as const,
      alignItems: 'baseline' as const,
      gap: theme.spacing.md,
      paddingVertical: 13,
      borderBottomWidth: 1,
    },
    measureName: {
      flex: 1,
      fontFamily: theme.fontFamily.semibold,
      fontSize: theme.fontSize.lg,
    },
    measureValue: {
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.xl,
      fontVariant: ['tabular-nums' as const],
    },
    measureUnit: {
      width: 24,
      fontFamily: theme.fontFamily.medium,
      fontSize: theme.fontSize.sm,
    },
    measureDelta: {
      width: 44,
      textAlign: 'right' as const,
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.md,
      fontVariant: ['tabular-nums' as const],
    },
    logButton: {
      marginTop: theme.spacing.lg,
    },
    sheetTitle: {
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.xxl,
      marginBottom: theme.spacing.md,
    },
    metricPicker: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    metricChip: {
      minHeight: 44,
      paddingHorizontal: theme.spacing.md,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    metricChipLabel: {
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.sm,
    },
    sheetInput: {
      marginBottom: theme.spacing.md,
    },
    sheetSaveButton: {
      marginBottom: theme.spacing.lg,
    },
  };
}
