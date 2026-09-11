import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { LayoutChangeEvent, Pressable, ScrollView, Text, View } from 'react-native';

import { getMuscleGroups } from '@/core/database/queries/exercises.queries';
import { useThemedStyles, useTheme, type Theme } from '@/core/theme';

import type { MuscleGroup } from '../types/catalog.types';

type MuscleFilterBarProps = {
  selectedMuscleId: string | null;
  onSelect: (muscleId: string | null) => void;
};

export function MuscleFilterBar({ selectedMuscleId, onSelect }: MuscleFilterBarProps) {
  const db = useSQLiteContext();
  const theme = useTheme();
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);
  const styles = useThemedStyles(createStyles);
  // Every chip is measured at its natural (unconstrained) width, then the
  // widest one wins so all chips render at one uniform width — "QUADRICEPS"
  // and "ALL" end up the same size instead of hugging their own label.
  // Measurement happens on an off-screen twin (see MeasureLabel below), never
  // on the visible chip's own Text — feeding a chip's onLayout back into its
  // own width would deadlock at 0 the moment the fixed width leaves no room
  // for the label, since the squeezed Text then re-measures at 0 forever.
  const [labelWidths, setLabelWidths] = useState<Record<string, number>>({});

  useEffect(() => {
    getMuscleGroups(db)
      .then(setMuscleGroups)
      .catch((error: unknown) => {
        if (__DEV__) console.error('Failed to load muscle groups', error);
      });
  }, [db]);

  const handleLabelLayout = useCallback((label: string, width: number) => {
    setLabelWidths((prev) => (prev[label] === width ? prev : { ...prev, [label]: width }));
  }, []);

  const labels = useMemo(() => ['ALL', ...muscleGroups.map((m) => m.name.toUpperCase())], [muscleGroups]);

  const chipWidth = useMemo(() => {
    const widths = Object.values(labelWidths);
    return widths.length > 0 ? Math.max(...widths) + theme.spacing.md * 2 : undefined;
  }, [labelWidths, theme.spacing.md]);

  return (
    <View>
      <View style={styles.measureLayer} pointerEvents="none">
        {labels.map((label) => (
          <MeasureLabel key={label} label={label} onLayout={handleLabelLayout} />
        ))}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        <Chip label="ALL" isSelected={selectedMuscleId === null} onPress={() => onSelect(null)} width={chipWidth} />
        {muscleGroups.map((muscle) => (
          <Chip
            key={muscle.id}
            label={muscle.name.toUpperCase()}
            isSelected={selectedMuscleId === muscle.id}
            onPress={() => onSelect(muscle.id)}
            width={chipWidth}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function MeasureLabel({ label, onLayout }: { label: string; onLayout: (label: string, width: number) => void }) {
  const styles = useThemedStyles(createStyles);

  function handleLayout(event: LayoutChangeEvent) {
    onLayout(label, event.nativeEvent.layout.width);
  }

  return (
    <Text style={styles.chipLabel} onLayout={handleLayout}>
      {label}
    </Text>
  );
}

type ChipProps = {
  label: string;
  isSelected: boolean;
  onPress: () => void;
  width: number | undefined;
};

function Chip({ label, isSelected, onPress, width }: ChipProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[
        styles.chip,
        { borderColor: isSelected ? 'transparent' : colors.divider },
        isSelected && { backgroundColor: colors.ink },
        width !== undefined && { width },
      ]}
    >
      <Text style={[styles.chipLabel, { color: isSelected ? colors.bg : colors.muted }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

function createStyles(theme: Theme) {
  return {
    measureLayer: {
      position: 'absolute' as const,
      opacity: 0,
      flexDirection: 'row' as const,
    },
    container: {
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
    },
    chip: {
      minHeight: 44,
      // Always present (never toggled) so selecting a chip can't change its
      // box size — only its color changes.
      borderWidth: 1,
      paddingHorizontal: theme.spacing.md,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    chipLabel: {
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.sm,
      letterSpacing: 0.4,
    },
  };
}
