// TRD Section 6: Phase-2 domain contracts. Dormant — not read or written
// anywhere in Phase 1, kept only so the shape is settled ahead of time.

export interface DailyNutritionLog {
  id: string;
  date: string;
  targetCalories: number;
  targetProteinG: number;
  targetCarbsG: number;
  targetFatG: number;
  waterMl: number;
  meals: MealItem[];
}

export interface MealItem {
  id: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}
