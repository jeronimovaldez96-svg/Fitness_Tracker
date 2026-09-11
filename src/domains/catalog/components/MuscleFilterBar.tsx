import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text } from 'react-native';

import { getMuscleGroups } from '@/core/database/queries/exercises.queries';
import { useThemedStyles, useTheme, type Theme } from '@/core/theme';

import type { MuscleGroup } from '../types/catalog.types';

type MuscleFilterBarProps = {
  selectedMuscleId: string | null;
  onSelect: (muscleId: string | null) => void;
};

export function MuscleFilterBar({ selectedMuscleId, onSelect }: MuscleFilterBarProps) {
  const db = useSQLiteContext();
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);
  const styles = useThemedStyles(createStyles);

  useEffect(() => {
    getMuscleGroups(db)
      .then(setMuscleGroups)
      .catch((error: unknown) => {
        if (__DEV__) console.error('Failed to load muscle groups', error);
      });
  }, [db]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      <Chip label="ALL" isSelected={selectedMuscleId === null} onPress={() => onSelect(null)} />
      {muscleGroups.map((muscle) => (
        <Chip
          key={muscle.id}
          label={muscle.name.toUpperCase()}
          isSelected={selectedMuscleId === muscle.id}
          onPress={() => onSelect(muscle.id)}
        />
      ))}
    </ScrollView>
  );
}

type ChipProps = {
  label: string;
  isSelected: boolean;
  onPress: () => void;
};

function Chip({ label, isSelected, onPress }: ChipProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[
        styles.chip,
        isSelected ? { backgroundColor: colors.ink } : { borderWidth: 1, borderColor: colors.divider },
      ]}
    >
      <Text style={[styles.chipLabel, { color: isSelected ? colors.bg : colors.muted }]}>{label}</Text>
    </Pressable>
  );
}

function createStyles(theme: Theme) {
  return {
    container: {
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
    },
    chip: {
      minHeight: 44,
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
