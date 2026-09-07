import { router, useLocalSearchParams } from 'expo-router';

import { ExercisePicker } from '@/domains/catalog/components/ExercisePicker';
import type { ExerciseSummary } from '@/domains/catalog/types/catalog.types';
import { consumeNavigationCallback } from '@/shared/utils/navigationCallback';

export default function ExercisePickerRoute() {
  const { muscleId } = useLocalSearchParams<{ muscleId?: string }>();

  function handleSelect(exercise: ExerciseSummary) {
    consumeNavigationCallback<ExerciseSummary>(exercise);
    router.back();
  }

  return <ExercisePicker onSelect={handleSelect} initialMuscleFilter={muscleId ?? null} />;
}
