import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, MIN_TOUCH_TARGET, spacing } from '@/core/theme';
import { Input } from '@/shared/components/Input';

import { useExerciseSearch } from '../hooks/useExerciseSearch';
import type { ExerciseSummary } from '../types/catalog.types';
import { MuscleFilterBar } from './MuscleFilterBar';

type ExercisePickerProps = {
  onSelect: (exercise: ExerciseSummary) => void;
  initialMuscleFilter?: string | null;
};

export function ExercisePicker({ onSelect, initialMuscleFilter = null }: ExercisePickerProps) {
  const [query, setQuery] = useState('');
  const [selectedMuscleId, setSelectedMuscleId] = useState<string | null>(initialMuscleFilter);
  const results = useExerciseSearch(query, { primaryMuscleId: selectedMuscleId ?? undefined });

  return (
    <View style={styles.container}>
      <View style={styles.searchWrapper}>
        <Input placeholder="Search exercises" value={query} onChangeText={setQuery} autoFocus />
      </View>
      <MuscleFilterBar selectedMuscleId={selectedMuscleId} onSelect={setSelectedMuscleId} />
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onSelect(item)}
            accessibilityRole="button"
            accessibilityLabel={item.name}
            style={styles.row}
          >
            <Text style={styles.rowLabel}>{item.name}</Text>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={styles.emptyLabel}>No exercises found</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchWrapper: {
    margin: spacing.md,
  },
  row: {
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLabel: {
    color: colors.text,
    fontSize: fontSize.md,
  },
  emptyLabel: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
