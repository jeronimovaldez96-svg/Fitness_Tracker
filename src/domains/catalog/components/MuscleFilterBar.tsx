import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { getMuscleGroups } from '@/core/database/queries/exercises.queries';
import { colors, fontSize, MIN_TOUCH_TARGET, radius, spacing } from '@/core/theme';

import type { MuscleGroup } from '../types/catalog.types';

type MuscleFilterBarProps = {
  selectedMuscleId: string | null;
  onSelect: (muscleId: string | null) => void;
};

export function MuscleFilterBar({ selectedMuscleId, onSelect }: MuscleFilterBarProps) {
  const db = useSQLiteContext();
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);

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
      <Chip label="All" isSelected={selectedMuscleId === null} onPress={() => onSelect(null)} />
      {muscleGroups.map((muscle) => (
        <Chip
          key={muscle.id}
          label={muscle.name}
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
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.chip, isSelected && styles.chipSelected]}
    >
      <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chip: {
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: colors.primary,
  },
  chipLabel: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  chipLabelSelected: {
    color: colors.text,
  },
});
