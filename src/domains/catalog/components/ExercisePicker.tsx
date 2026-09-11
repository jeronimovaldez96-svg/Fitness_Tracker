import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';

import { getLastSetSummaries } from '@/core/database/queries/exercises.queries';
import { useThemedStyles, useTheme, type Theme } from '@/core/theme';
import { Button } from '@/shared/components/Button';
import { FormGuideIllustration } from '@/shared/components/FormGuideIllustration';
import { Input } from '@/shared/components/Input';
import { Modal } from '@/shared/components/Modal';
import { Tag } from '@/shared/components/Tag';

import { useExerciseSearch } from '../hooks/useExerciseSearch';
import type { ExerciseSummary } from '../types/catalog.types';
import { getEquipmentFamily, getMovementPattern } from '../utils/formGuide';
import { MuscleFilterBar } from './MuscleFilterBar';

type ExercisePickerProps = {
  onSelect: (exercise: ExerciseSummary) => void;
  initialMuscleFilter?: string | null;
};

export function ExercisePicker({ onSelect, initialMuscleFilter = null }: ExercisePickerProps) {
  const db = useSQLiteContext();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [query, setQuery] = useState('');
  const [selectedMuscleId, setSelectedMuscleId] = useState<string | null>(initialMuscleFilter);
  const results = useExerciseSearch(query, { primaryMuscleId: selectedMuscleId ?? undefined });
  const [lastUsed, setLastUsed] = useState<Record<string, string>>({});
  const [formGuideExercise, setFormGuideExercise] = useState<ExerciseSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    getLastSetSummaries(db, results.map((r) => r.id))
      .then((map) => {
        if (!cancelled) setLastUsed(map);
      })
      .catch((error: unknown) => {
        if (__DEV__) console.error('Failed to load last-used weights', error);
      });
    return () => {
      cancelled = true;
    };
  }, [db, results]);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.ink }]}>Exercises</Text>
        <Button label="Cancel" onPress={() => router.back()} variant="ghost" compact />
      </View>
      <View style={styles.searchWrapper}>
        <Input
          placeholder={`Search ${results.length} exercises`}
          value={query}
          onChangeText={setQuery}
          autoFocus
        />
      </View>
      <MuscleFilterBar selectedMuscleId={selectedMuscleId} onSelect={setSelectedMuscleId} />
      <View style={[styles.divider, { backgroundColor: colors.divider }]} />
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onSelect(item)}
            accessibilityRole="button"
            accessibilityLabel={item.name}
            style={[styles.row, { borderBottomColor: colors.soft }]}
          >
            <Pressable
              onPress={() => setFormGuideExercise(item)}
              accessibilityRole="button"
              accessibilityLabel={`View form guide for ${item.name}`}
              hitSlop={8}
              style={[styles.thumbnail, { borderColor: colors.divider }]}
            >
              <FormGuideIllustration
                movement={getMovementPattern(item.primaryMuscleId)}
                equipmentFamily={getEquipmentFamily(item.equipmentId)}
                color={colors.muted}
                size={36}
              />
            </Pressable>
            <View style={styles.rowInfo}>
              <Text style={[styles.rowName, { color: colors.ink }]}>{item.name}</Text>
              <Text style={[styles.rowMuscle, { color: colors.muted }]}>{item.primaryMuscleName}</Text>
            </View>
            <Tag variant="neutral" label={item.equipmentId.replace(/-/g, ' ')} />
            <Text style={[styles.rowLast, { color: colors.muted }]}>{lastUsed[item.id] ?? ''}</Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={[styles.emptyLabel, { color: colors.muted }]}>
            No exercises match &ldquo;{query}&rdquo;
          </Text>
        }
      />

      <Modal visible={formGuideExercise !== null} onRequestClose={() => setFormGuideExercise(null)}>
        {formGuideExercise ? (
          <>
            <View style={styles.formGuideIllustrationWrap}>
              <FormGuideIllustration
                movement={getMovementPattern(formGuideExercise.primaryMuscleId)}
                equipmentFamily={getEquipmentFamily(formGuideExercise.equipmentId)}
                color={colors.ink}
                size={160}
              />
            </View>
            <Text style={[styles.formGuideTitle, { color: colors.ink }]}>{formGuideExercise.name}</Text>
            <Text style={[styles.formGuideMeta, { color: colors.muted }]}>
              {formGuideExercise.primaryMuscleName} · {formGuideExercise.equipmentId.replace(/-/g, ' ')}
            </Text>
            <Button label="Close" onPress={() => setFormGuideExercise(null)} variant="secondary" fullWidth style={styles.formGuideCloseButton} />
          </>
        ) : null}
      </Modal>
    </View>
  );
}

function createStyles(theme: Theme) {
  return {
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row' as const,
      alignItems: 'flex-end' as const,
      justifyContent: 'space-between' as const,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.sm,
      paddingBottom: theme.spacing.md,
    },
    title: {
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.display1,
      letterSpacing: -0.4,
    },
    searchWrapper: {
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
    },
    divider: {
      height: 2,
    },
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: theme.spacing.md,
      minHeight: 64,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: 1,
    },
    rowInfo: {
      flex: 1,
      minWidth: 0,
    },
    rowName: {
      fontFamily: theme.fontFamily.semibold,
      fontSize: theme.fontSize.lg,
    },
    rowMuscle: {
      fontFamily: theme.fontFamily.regular,
      fontSize: theme.fontSize.sm,
      marginTop: 5,
    },
    rowLast: {
      fontFamily: theme.fontFamily.semibold,
      fontSize: theme.fontSize.md,
      width: 74,
      textAlign: 'right' as const,
    },
    emptyLabel: {
      fontFamily: theme.fontFamily.medium,
      fontSize: theme.fontSize.lg,
      textAlign: 'center' as const,
      marginTop: theme.spacing.xl,
    },
    thumbnail: {
      width: 44,
      height: 44,
      borderWidth: 1,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    formGuideIllustrationWrap: {
      alignItems: 'center' as const,
      marginBottom: theme.spacing.lg,
    },
    formGuideTitle: {
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.xl,
      textAlign: 'center' as const,
    },
    formGuideMeta: {
      fontFamily: theme.fontFamily.medium,
      fontSize: theme.fontSize.sm,
      textAlign: 'center' as const,
      marginTop: 4,
    },
    formGuideCloseButton: {
      marginTop: theme.spacing.lg,
    },
  };
}
