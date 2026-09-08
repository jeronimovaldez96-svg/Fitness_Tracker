import type { SQLiteDatabase } from 'expo-sqlite';

type MuscleGroup = { id: string; name: string; bodyRegion: 'upper' | 'lower' | 'core' };
type Equipment = { id: string; name: string };
type SeedExercise = {
  id: string;
  name: string;
  primaryMuscleId: string;
  secondaryMuscleId: string | null;
  equipmentId: string;
  aliases: string[];
};

const MUSCLE_GROUPS: MuscleGroup[] = [
  { id: 'chest', name: 'Chest', bodyRegion: 'upper' },
  { id: 'back', name: 'Back', bodyRegion: 'upper' },
  { id: 'shoulders', name: 'Shoulders', bodyRegion: 'upper' },
  { id: 'biceps', name: 'Biceps', bodyRegion: 'upper' },
  { id: 'triceps', name: 'Triceps', bodyRegion: 'upper' },
  { id: 'quads', name: 'Quadriceps', bodyRegion: 'lower' },
  { id: 'hamstrings', name: 'Hamstrings', bodyRegion: 'lower' },
  { id: 'glutes', name: 'Glutes', bodyRegion: 'lower' },
  { id: 'calves', name: 'Calves', bodyRegion: 'lower' },
  { id: 'abs', name: 'Abs', bodyRegion: 'core' },
  { id: 'lats', name: 'Lats', bodyRegion: 'upper' },
  { id: 'traps', name: 'Traps', bodyRegion: 'upper' },
  { id: 'forearms', name: 'Forearms', bodyRegion: 'upper' },
  { id: 'obliques', name: 'Obliques', bodyRegion: 'core' },
];

const EQUIPMENT: Equipment[] = [
  { id: 'barbell', name: 'Barbell' },
  { id: 'dumbbell', name: 'Dumbbell' },
  { id: 'machine', name: 'Machine' },
  { id: 'cable', name: 'Cable' },
  { id: 'bodyweight', name: 'Bodyweight' },
  { id: 'kettlebell', name: 'Kettlebell' },
  { id: 'band', name: 'Resistance Band' },
  { id: 'ez-bar', name: 'EZ-Bar' },
  { id: 'smith-machine', name: 'Smith Machine' },
  { id: 'trap-bar', name: 'Trap Bar' },
];

const EXERCISES: SeedExercise[] = [
  {
    id: 'bench-press',
    name: 'Bench Press',
    primaryMuscleId: 'chest',
    secondaryMuscleId: 'triceps',
    equipmentId: 'barbell',
    aliases: ['Flat Bench Press', 'Barbell Bench Press', 'BB Bench'],
  },
  {
    id: 'incline-bench-press',
    name: 'Incline Bench Press',
    primaryMuscleId: 'chest',
    secondaryMuscleId: 'shoulders',
    equipmentId: 'barbell',
    aliases: ['Incline Press'],
  },
  {
    id: 'back-squat',
    name: 'Back Squat',
    primaryMuscleId: 'quads',
    secondaryMuscleId: 'glutes',
    equipmentId: 'barbell',
    aliases: ['Squat', 'Barbell Squat'],
  },
  {
    id: 'deadlift',
    name: 'Deadlift',
    primaryMuscleId: 'back',
    secondaryMuscleId: 'hamstrings',
    equipmentId: 'barbell',
    aliases: ['Conventional Deadlift'],
  },
  {
    id: 'overhead-press',
    name: 'Overhead Press',
    primaryMuscleId: 'shoulders',
    secondaryMuscleId: 'triceps',
    equipmentId: 'barbell',
    aliases: ['OHP', 'Military Press'],
  },
  {
    id: 'barbell-row',
    name: 'Barbell Row',
    primaryMuscleId: 'back',
    secondaryMuscleId: 'biceps',
    equipmentId: 'barbell',
    aliases: ['Bent Over Row'],
  },
  {
    id: 'pull-up',
    name: 'Pull-Up',
    primaryMuscleId: 'back',
    secondaryMuscleId: 'biceps',
    equipmentId: 'bodyweight',
    aliases: ['Pullup'],
  },
  {
    id: 'dumbbell-curl',
    name: 'Dumbbell Curl',
    primaryMuscleId: 'biceps',
    secondaryMuscleId: null,
    equipmentId: 'dumbbell',
    aliases: ['DB Curl', 'Bicep Curl'],
  },
  {
    id: 'leg-press',
    name: 'Leg Press',
    primaryMuscleId: 'quads',
    secondaryMuscleId: 'glutes',
    equipmentId: 'machine',
    aliases: [],
  },
  {
    id: 'cable-tricep-pushdown',
    name: 'Tricep Pushdown',
    primaryMuscleId: 'triceps',
    secondaryMuscleId: null,
    equipmentId: 'cable',
    aliases: ['Cable Pushdown', 'Rope Pushdown'],
  },

  // Chest
  {
    id: 'decline-bench-press',
    name: 'Decline Bench Press',
    primaryMuscleId: 'chest',
    secondaryMuscleId: 'triceps',
    equipmentId: 'barbell',
    aliases: ['Decline Barbell Press'],
  },
  {
    id: 'dumbbell-bench-press',
    name: 'Dumbbell Bench Press',
    primaryMuscleId: 'chest',
    secondaryMuscleId: 'triceps',
    equipmentId: 'dumbbell',
    aliases: ['DB Bench Press', 'Flat DB Press'],
  },
  {
    id: 'incline-dumbbell-press',
    name: 'Incline Dumbbell Press',
    primaryMuscleId: 'chest',
    secondaryMuscleId: 'shoulders',
    equipmentId: 'dumbbell',
    aliases: ['Incline DB Press'],
  },
  {
    id: 'dumbbell-fly',
    name: 'Dumbbell Fly',
    primaryMuscleId: 'chest',
    secondaryMuscleId: null,
    equipmentId: 'dumbbell',
    aliases: ['Chest Fly', 'Flat Fly'],
  },
  {
    id: 'cable-fly',
    name: 'Cable Fly',
    primaryMuscleId: 'chest',
    secondaryMuscleId: null,
    equipmentId: 'cable',
    aliases: ['Cable Crossover', 'Standing Cable Fly'],
  },
  {
    id: 'pec-deck-fly',
    name: 'Pec Deck Fly',
    primaryMuscleId: 'chest',
    secondaryMuscleId: null,
    equipmentId: 'machine',
    aliases: ['Pec Deck', 'Machine Fly'],
  },
  {
    id: 'push-up',
    name: 'Push-Up',
    primaryMuscleId: 'chest',
    secondaryMuscleId: 'triceps',
    equipmentId: 'bodyweight',
    aliases: ['Press Up'],
  },
  {
    id: 'chest-dip',
    name: 'Chest Dip',
    primaryMuscleId: 'chest',
    secondaryMuscleId: 'triceps',
    equipmentId: 'bodyweight',
    aliases: ['Dip'],
  },
  {
    id: 'smith-machine-bench-press',
    name: 'Smith Machine Bench Press',
    primaryMuscleId: 'chest',
    secondaryMuscleId: 'triceps',
    equipmentId: 'smith-machine',
    aliases: ['Smith Bench Press'],
  },
  {
    id: 'landmine-press',
    name: 'Landmine Press',
    primaryMuscleId: 'chest',
    secondaryMuscleId: 'shoulders',
    equipmentId: 'barbell',
    aliases: ['Landmine Chest Press'],
  },

  // Back / Lats / Traps
  {
    id: 'lat-pulldown',
    name: 'Lat Pulldown',
    primaryMuscleId: 'lats',
    secondaryMuscleId: 'biceps',
    equipmentId: 'cable',
    aliases: ['Cable Lat Pulldown', 'Wide-Grip Pulldown'],
  },
  {
    id: 'seated-cable-row',
    name: 'Seated Cable Row',
    primaryMuscleId: 'back',
    secondaryMuscleId: 'biceps',
    equipmentId: 'cable',
    aliases: ['Cable Row', 'Seated Row'],
  },
  {
    id: 't-bar-row',
    name: 'T-Bar Row',
    primaryMuscleId: 'back',
    secondaryMuscleId: 'biceps',
    equipmentId: 'barbell',
    aliases: ['T-Bar Row'],
  },
  {
    id: 'single-arm-dumbbell-row',
    name: 'Single-Arm Dumbbell Row',
    primaryMuscleId: 'back',
    secondaryMuscleId: 'biceps',
    equipmentId: 'dumbbell',
    aliases: ['DB Row', 'One-Arm Row'],
  },
  {
    id: 'inverted-row',
    name: 'Inverted Row',
    primaryMuscleId: 'back',
    secondaryMuscleId: 'biceps',
    equipmentId: 'bodyweight',
    aliases: ['Bodyweight Row', 'Australian Pull-Up'],
  },
  {
    id: 'chin-up',
    name: 'Chin-Up',
    primaryMuscleId: 'lats',
    secondaryMuscleId: 'biceps',
    equipmentId: 'bodyweight',
    aliases: ['Underhand Pull-Up'],
  },
  {
    id: 'back-extension',
    name: 'Back Extension',
    primaryMuscleId: 'back',
    secondaryMuscleId: 'glutes',
    equipmentId: 'machine',
    aliases: ['Hyperextension', '45-Degree Back Extension'],
  },
  {
    id: 'straight-arm-pulldown',
    name: 'Straight-Arm Pulldown',
    primaryMuscleId: 'lats',
    secondaryMuscleId: null,
    equipmentId: 'cable',
    aliases: ['Cable Pullover'],
  },
  {
    id: 'dumbbell-pullover',
    name: 'Dumbbell Pullover',
    primaryMuscleId: 'lats',
    secondaryMuscleId: 'chest',
    equipmentId: 'dumbbell',
    aliases: ['DB Pullover'],
  },
  {
    id: 'machine-row',
    name: 'Chest-Supported Row',
    primaryMuscleId: 'back',
    secondaryMuscleId: 'biceps',
    equipmentId: 'machine',
    aliases: ['Machine Row', 'Chest-Supported Row Machine'],
  },
  {
    id: 'barbell-shrug',
    name: 'Barbell Shrug',
    primaryMuscleId: 'traps',
    secondaryMuscleId: null,
    equipmentId: 'barbell',
    aliases: ['Shrug'],
  },
  {
    id: 'dumbbell-shrug',
    name: 'Dumbbell Shrug',
    primaryMuscleId: 'traps',
    secondaryMuscleId: null,
    equipmentId: 'dumbbell',
    aliases: ['DB Shrug'],
  },

  // Shoulders
  {
    id: 'dumbbell-shoulder-press',
    name: 'Dumbbell Shoulder Press',
    primaryMuscleId: 'shoulders',
    secondaryMuscleId: 'triceps',
    equipmentId: 'dumbbell',
    aliases: ['DB Shoulder Press'],
  },
  {
    id: 'arnold-press',
    name: 'Arnold Press',
    primaryMuscleId: 'shoulders',
    secondaryMuscleId: 'triceps',
    equipmentId: 'dumbbell',
    aliases: ['Arnold Dumbbell Press'],
  },
  {
    id: 'machine-shoulder-press',
    name: 'Machine Shoulder Press',
    primaryMuscleId: 'shoulders',
    secondaryMuscleId: 'triceps',
    equipmentId: 'machine',
    aliases: ['Shoulder Press Machine'],
  },
  {
    id: 'lateral-raise',
    name: 'Lateral Raise',
    primaryMuscleId: 'shoulders',
    secondaryMuscleId: null,
    equipmentId: 'dumbbell',
    aliases: ['Side Raise', 'DB Lateral Raise'],
  },
  {
    id: 'cable-lateral-raise',
    name: 'Cable Lateral Raise',
    primaryMuscleId: 'shoulders',
    secondaryMuscleId: null,
    equipmentId: 'cable',
    aliases: ['Cable Side Raise'],
  },
  {
    id: 'front-raise',
    name: 'Front Raise',
    primaryMuscleId: 'shoulders',
    secondaryMuscleId: null,
    equipmentId: 'dumbbell',
    aliases: ['Front Delt Raise'],
  },
  {
    id: 'rear-delt-fly',
    name: 'Rear Delt Fly',
    primaryMuscleId: 'shoulders',
    secondaryMuscleId: 'traps',
    equipmentId: 'dumbbell',
    aliases: ['Reverse Fly', 'Bent-Over Rear Delt Fly'],
  },
  {
    id: 'reverse-pec-deck',
    name: 'Reverse Pec Deck',
    primaryMuscleId: 'shoulders',
    secondaryMuscleId: 'traps',
    equipmentId: 'machine',
    aliases: ['Rear Delt Machine Fly'],
  },
  {
    id: 'face-pull',
    name: 'Face Pull',
    primaryMuscleId: 'shoulders',
    secondaryMuscleId: 'traps',
    equipmentId: 'cable',
    aliases: ['Cable Face Pull'],
  },
  {
    id: 'upright-row',
    name: 'Upright Row',
    primaryMuscleId: 'shoulders',
    secondaryMuscleId: 'traps',
    equipmentId: 'barbell',
    aliases: ['Barbell Upright Row'],
  },
  {
    id: 'band-pull-apart',
    name: 'Band Pull-Apart',
    primaryMuscleId: 'shoulders',
    secondaryMuscleId: 'traps',
    equipmentId: 'band',
    aliases: ['Resistance Band Pull-Apart'],
  },
  {
    id: 'band-face-pull',
    name: 'Band Face Pull',
    primaryMuscleId: 'shoulders',
    secondaryMuscleId: 'traps',
    equipmentId: 'band',
    aliases: ['Banded Face Pull'],
  },

  // Biceps
  {
    id: 'barbell-curl',
    name: 'Barbell Curl',
    primaryMuscleId: 'biceps',
    secondaryMuscleId: null,
    equipmentId: 'barbell',
    aliases: ['Barbell Bicep Curl'],
  },
  {
    id: 'ez-bar-curl',
    name: 'EZ-Bar Curl',
    primaryMuscleId: 'biceps',
    secondaryMuscleId: null,
    equipmentId: 'ez-bar',
    aliases: ['EZ Curl'],
  },
  {
    id: 'hammer-curl',
    name: 'Hammer Curl',
    primaryMuscleId: 'biceps',
    secondaryMuscleId: 'forearms',
    equipmentId: 'dumbbell',
    aliases: ['Hammer Curl'],
  },
  {
    id: 'preacher-curl',
    name: 'Preacher Curl',
    primaryMuscleId: 'biceps',
    secondaryMuscleId: null,
    equipmentId: 'ez-bar',
    aliases: ['Preacher Curl'],
  },
  {
    id: 'concentration-curl',
    name: 'Concentration Curl',
    primaryMuscleId: 'biceps',
    secondaryMuscleId: null,
    equipmentId: 'dumbbell',
    aliases: ['Concentration Curl'],
  },
  {
    id: 'cable-curl',
    name: 'Cable Curl',
    primaryMuscleId: 'biceps',
    secondaryMuscleId: null,
    equipmentId: 'cable',
    aliases: ['Cable Bicep Curl'],
  },
  {
    id: 'reverse-curl',
    name: 'Reverse Curl',
    primaryMuscleId: 'biceps',
    secondaryMuscleId: 'forearms',
    equipmentId: 'barbell',
    aliases: ['Reverse Grip Curl'],
  },
  {
    id: 'cable-hammer-curl',
    name: 'Cable Hammer Curl',
    primaryMuscleId: 'biceps',
    secondaryMuscleId: 'forearms',
    equipmentId: 'cable',
    aliases: ['Rope Hammer Curl'],
  },

  // Triceps
  {
    id: 'close-grip-bench-press',
    name: 'Close-Grip Bench Press',
    primaryMuscleId: 'triceps',
    secondaryMuscleId: 'chest',
    equipmentId: 'barbell',
    aliases: ['Close-Grip Bench'],
  },
  {
    id: 'skull-crusher',
    name: 'Skull Crusher',
    primaryMuscleId: 'triceps',
    secondaryMuscleId: null,
    equipmentId: 'ez-bar',
    aliases: ['Lying Tricep Extension', 'French Press'],
  },
  {
    id: 'overhead-tricep-extension',
    name: 'Overhead Tricep Extension',
    primaryMuscleId: 'triceps',
    secondaryMuscleId: null,
    equipmentId: 'dumbbell',
    aliases: ['DB Overhead Extension'],
  },
  {
    id: 'cable-overhead-tricep-extension',
    name: 'Cable Overhead Tricep Extension',
    primaryMuscleId: 'triceps',
    secondaryMuscleId: null,
    equipmentId: 'cable',
    aliases: ['Cable Overhead Extension'],
  },
  {
    id: 'tricep-dip',
    name: 'Bench Dip',
    primaryMuscleId: 'triceps',
    secondaryMuscleId: 'chest',
    equipmentId: 'bodyweight',
    aliases: ['Tricep Dip', 'Bench Dip'],
  },
  {
    id: 'diamond-push-up',
    name: 'Diamond Push-Up',
    primaryMuscleId: 'triceps',
    secondaryMuscleId: 'chest',
    equipmentId: 'bodyweight',
    aliases: ['Close-Grip Push-Up'],
  },

  // Forearms
  {
    id: 'barbell-wrist-curl',
    name: 'Barbell Wrist Curl',
    primaryMuscleId: 'forearms',
    secondaryMuscleId: null,
    equipmentId: 'barbell',
    aliases: ['Wrist Curl'],
  },
  {
    id: 'reverse-wrist-curl',
    name: 'Reverse Wrist Curl',
    primaryMuscleId: 'forearms',
    secondaryMuscleId: null,
    equipmentId: 'barbell',
    aliases: ['Barbell Reverse Wrist Curl'],
  },
  {
    id: 'dumbbell-wrist-curl',
    name: 'Dumbbell Wrist Curl',
    primaryMuscleId: 'forearms',
    secondaryMuscleId: null,
    equipmentId: 'dumbbell',
    aliases: ['DB Wrist Curl'],
  },
  {
    id: 'farmers-carry',
    name: "Farmer's Carry",
    primaryMuscleId: 'forearms',
    secondaryMuscleId: 'traps',
    equipmentId: 'dumbbell',
    aliases: ["Farmer's Walk", 'Farmer Carry'],
  },

  // Quads
  {
    id: 'front-squat',
    name: 'Front Squat',
    primaryMuscleId: 'quads',
    secondaryMuscleId: 'glutes',
    equipmentId: 'barbell',
    aliases: ['Front Squat'],
  },
  {
    id: 'smith-machine-squat',
    name: 'Smith Machine Squat',
    primaryMuscleId: 'quads',
    secondaryMuscleId: 'glutes',
    equipmentId: 'smith-machine',
    aliases: ['Smith Squat'],
  },
  {
    id: 'hack-squat',
    name: 'Hack Squat',
    primaryMuscleId: 'quads',
    secondaryMuscleId: 'glutes',
    equipmentId: 'machine',
    aliases: ['Hack Squat Machine'],
  },
  {
    id: 'leg-extension',
    name: 'Leg Extension',
    primaryMuscleId: 'quads',
    secondaryMuscleId: null,
    equipmentId: 'machine',
    aliases: ['Leg Extension Machine'],
  },
  {
    id: 'bulgarian-split-squat',
    name: 'Bulgarian Split Squat',
    primaryMuscleId: 'quads',
    secondaryMuscleId: 'glutes',
    equipmentId: 'dumbbell',
    aliases: ['Rear-Foot Elevated Split Squat', 'BSS'],
  },
  {
    id: 'walking-lunge',
    name: 'Walking Lunge',
    primaryMuscleId: 'quads',
    secondaryMuscleId: 'glutes',
    equipmentId: 'dumbbell',
    aliases: ['Dumbbell Lunge'],
  },
  {
    id: 'goblet-squat',
    name: 'Goblet Squat',
    primaryMuscleId: 'quads',
    secondaryMuscleId: 'glutes',
    equipmentId: 'kettlebell',
    aliases: ['Goblet Squat'],
  },
  {
    id: 'sissy-squat',
    name: 'Sissy Squat',
    primaryMuscleId: 'quads',
    secondaryMuscleId: null,
    equipmentId: 'bodyweight',
    aliases: ['Sissy Squat'],
  },

  // Hamstrings
  {
    id: 'romanian-deadlift',
    name: 'Romanian Deadlift',
    primaryMuscleId: 'hamstrings',
    secondaryMuscleId: 'glutes',
    equipmentId: 'barbell',
    aliases: ['RDL', 'Stiff-Leg Deadlift'],
  },
  {
    id: 'trap-bar-deadlift',
    name: 'Trap Bar Deadlift',
    primaryMuscleId: 'hamstrings',
    secondaryMuscleId: 'glutes',
    equipmentId: 'trap-bar',
    aliases: ['Hex Bar Deadlift'],
  },
  {
    id: 'good-morning',
    name: 'Good Morning',
    primaryMuscleId: 'hamstrings',
    secondaryMuscleId: 'back',
    equipmentId: 'barbell',
    aliases: ['Good Morning'],
  },
  {
    id: 'lying-leg-curl',
    name: 'Lying Leg Curl',
    primaryMuscleId: 'hamstrings',
    secondaryMuscleId: null,
    equipmentId: 'machine',
    aliases: ['Lying Hamstring Curl', 'Leg Curl Machine'],
  },
  {
    id: 'seated-leg-curl',
    name: 'Seated Leg Curl',
    primaryMuscleId: 'hamstrings',
    secondaryMuscleId: null,
    equipmentId: 'machine',
    aliases: ['Seated Hamstring Curl'],
  },
  {
    id: 'single-leg-romanian-deadlift',
    name: 'Single-Leg Romanian Deadlift',
    primaryMuscleId: 'hamstrings',
    secondaryMuscleId: 'glutes',
    equipmentId: 'dumbbell',
    aliases: ['Single-Leg RDL'],
  },

  // Glutes
  {
    id: 'hip-thrust',
    name: 'Hip Thrust',
    primaryMuscleId: 'glutes',
    secondaryMuscleId: 'hamstrings',
    equipmentId: 'barbell',
    aliases: ['Barbell Hip Thrust'],
  },
  {
    id: 'glute-bridge',
    name: 'Glute Bridge',
    primaryMuscleId: 'glutes',
    secondaryMuscleId: 'hamstrings',
    equipmentId: 'bodyweight',
    aliases: ['Glute Bridge'],
  },
  {
    id: 'cable-kickback',
    name: 'Cable Kickback',
    primaryMuscleId: 'glutes',
    secondaryMuscleId: null,
    equipmentId: 'cable',
    aliases: ['Cable Glute Kickback'],
  },
  {
    id: 'hip-abduction-machine',
    name: 'Hip Abduction Machine',
    primaryMuscleId: 'glutes',
    secondaryMuscleId: null,
    equipmentId: 'machine',
    aliases: ['Hip Abductor Machine'],
  },
  {
    id: 'kettlebell-swing',
    name: 'Kettlebell Swing',
    primaryMuscleId: 'glutes',
    secondaryMuscleId: 'hamstrings',
    equipmentId: 'kettlebell',
    aliases: ['KB Swing', 'Russian Kettlebell Swing'],
  },
  {
    id: 'step-up',
    name: 'Step-Up',
    primaryMuscleId: 'glutes',
    secondaryMuscleId: 'quads',
    equipmentId: 'dumbbell',
    aliases: ['Box Step-Up', 'Dumbbell Step-Up'],
  },

  // Calves
  {
    id: 'standing-calf-raise',
    name: 'Standing Calf Raise',
    primaryMuscleId: 'calves',
    secondaryMuscleId: null,
    equipmentId: 'machine',
    aliases: ['Standing Calf Raise Machine'],
  },
  {
    id: 'seated-calf-raise',
    name: 'Seated Calf Raise',
    primaryMuscleId: 'calves',
    secondaryMuscleId: null,
    equipmentId: 'machine',
    aliases: ['Seated Calf Raise Machine'],
  },
  {
    id: 'dumbbell-calf-raise',
    name: 'Dumbbell Calf Raise',
    primaryMuscleId: 'calves',
    secondaryMuscleId: null,
    equipmentId: 'dumbbell',
    aliases: ['DB Calf Raise'],
  },
  {
    id: 'donkey-calf-raise',
    name: 'Donkey Calf Raise',
    primaryMuscleId: 'calves',
    secondaryMuscleId: null,
    equipmentId: 'machine',
    aliases: ['Donkey Calf Raise Machine'],
  },

  // Abs / Obliques
  {
    id: 'hanging-leg-raise',
    name: 'Hanging Leg Raise',
    primaryMuscleId: 'abs',
    secondaryMuscleId: null,
    equipmentId: 'bodyweight',
    aliases: ['Hanging Knee Raise'],
  },
  {
    id: 'cable-crunch',
    name: 'Cable Crunch',
    primaryMuscleId: 'abs',
    secondaryMuscleId: null,
    equipmentId: 'cable',
    aliases: ['Kneeling Cable Crunch'],
  },
  {
    id: 'ab-wheel-rollout',
    name: 'Ab Wheel Rollout',
    primaryMuscleId: 'abs',
    secondaryMuscleId: null,
    equipmentId: 'bodyweight',
    aliases: ['Ab Rollout'],
  },
  {
    id: 'decline-sit-up',
    name: 'Decline Sit-Up',
    primaryMuscleId: 'abs',
    secondaryMuscleId: null,
    equipmentId: 'bodyweight',
    aliases: ['Decline Crunch'],
  },
  {
    id: 'reverse-crunch',
    name: 'Reverse Crunch',
    primaryMuscleId: 'abs',
    secondaryMuscleId: null,
    equipmentId: 'bodyweight',
    aliases: ['Reverse Crunch'],
  },
  {
    id: 'weighted-crunch-machine',
    name: 'Ab Crunch Machine',
    primaryMuscleId: 'abs',
    secondaryMuscleId: null,
    equipmentId: 'machine',
    aliases: ['Weighted Crunch Machine'],
  },
  {
    id: 'russian-twist',
    name: 'Russian Twist',
    primaryMuscleId: 'obliques',
    secondaryMuscleId: 'abs',
    equipmentId: 'bodyweight',
    aliases: ['Russian Twist'],
  },
  {
    id: 'cable-woodchopper',
    name: 'Cable Woodchopper',
    primaryMuscleId: 'obliques',
    secondaryMuscleId: 'abs',
    equipmentId: 'cable',
    aliases: ['Cable Wood Chop', 'Woodchopper'],
  },
];

export async function seedDatabaseIfEmpty(db: SQLiteDatabase): Promise<void> {
  const existing = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM exercises'
  );
  if ((existing?.count ?? 0) > 0) return;

  await db.withTransactionAsync(async () => {
    for (const group of MUSCLE_GROUPS) {
      await db.runAsync(
        'INSERT INTO muscle_groups (id, name, body_region) VALUES (?, ?, ?)',
        group.id,
        group.name,
        group.bodyRegion
      );
    }

    for (const item of EQUIPMENT) {
      await db.runAsync('INSERT INTO equipment (id, name) VALUES (?, ?)', item.id, item.name);
    }

    for (const exercise of EXERCISES) {
      await db.runAsync(
        `INSERT INTO exercises (id, name, primary_muscle_id, secondary_muscle_id, equipment_id, metric_type, is_custom)
         VALUES (?, ?, ?, ?, ?, 'weight_reps', 0)`,
        exercise.id,
        exercise.name,
        exercise.primaryMuscleId,
        exercise.secondaryMuscleId,
        exercise.equipmentId
      );

      for (const alias of exercise.aliases) {
        await db.runAsync(
          'INSERT INTO exercise_aliases (exercise_id, alias) VALUES (?, ?)',
          exercise.id,
          alias
        );
      }

      await db.runAsync(
        'INSERT INTO exercise_search_fts (exercise_id, name, aliases) VALUES (?, ?, ?)',
        exercise.id,
        exercise.name,
        exercise.aliases.join(' ')
      );
    }
  });
}
