export const CURRENT_SCHEMA_VERSION = 1;

export const SCHEMA_SQL = `
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- ==========================================================
-- 1. EXERCISE CATALOG TAXONOMY
-- ==========================================================

CREATE TABLE IF NOT EXISTS muscle_groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    body_region TEXT CHECK(body_region IN ('upper', 'lower', 'core')) NOT NULL
);

CREATE TABLE IF NOT EXISTS equipment (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS exercises (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    primary_muscle_id TEXT NOT NULL,
    secondary_muscle_id TEXT,
    equipment_id TEXT NOT NULL,
    metric_type TEXT CHECK(metric_type IN ('weight_reps', 'reps_only', 'duration_reps', 'duration_distance')) NOT NULL DEFAULT 'weight_reps',
    is_custom INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (UNIXEPOCH()),
    FOREIGN KEY (primary_muscle_id) REFERENCES muscle_groups(id) ON UPDATE CASCADE,
    FOREIGN KEY (secondary_muscle_id) REFERENCES muscle_groups(id) ON UPDATE CASCADE,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS exercise_aliases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exercise_id TEXT NOT NULL,
    alias TEXT NOT NULL COLLATE NOCASE,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
);

-- Full Text Search index for Instant Autocomplete
CREATE VIRTUAL TABLE IF NOT EXISTS exercise_search_fts USING fts5(
    exercise_id UNINDEXED,
    name,
    aliases,
    tokenize = 'porter unicode61'
);

-- ==========================================================
-- 2. WORKOUT ENGINE & LOGGING (CORE MVP)
-- ==========================================================

CREATE TABLE IF NOT EXISTS workouts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    start_time INTEGER NOT NULL,
    end_time INTEGER,                  -- NULL = In-progress
    notes TEXT,
    created_at INTEGER NOT NULL DEFAULT (UNIXEPOCH())
);

CREATE TABLE IF NOT EXISTS workout_exercises (
    id TEXT PRIMARY KEY,
    workout_id TEXT NOT NULL,
    exercise_id TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    notes TEXT,
    FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS workout_sets (
    id TEXT PRIMARY KEY,
    workout_exercise_id TEXT NOT NULL,
    set_order INTEGER NOT NULL,
    set_type TEXT CHECK(set_type IN ('normal', 'warmup', 'drop', 'failure')) NOT NULL DEFAULT 'normal',
    weight_kg REAL,
    reps INTEGER,
    duration_seconds INTEGER,
    distance_meters REAL,
    rpe REAL,
    is_completed INTEGER NOT NULL DEFAULT 0,
    completed_at INTEGER,
    FOREIGN KEY (workout_exercise_id) REFERENCES workout_exercises(id) ON DELETE CASCADE
);

-- ==========================================================
-- 3. NUTRITION & BODY COMP (PHASE 2 - DORMANT ISOLATION)
-- ==========================================================

CREATE TABLE IF NOT EXISTS nutrition_daily_logs (
    id TEXT PRIMARY KEY,
    log_date TEXT NOT NULL UNIQUE,     -- 'YYYY-MM-DD'
    target_calories INTEGER,
    target_protein_g REAL,
    target_carbs_g REAL,
    target_fat_g REAL,
    water_ml INTEGER DEFAULT 0,
    notes TEXT,
    created_at INTEGER NOT NULL DEFAULT (UNIXEPOCH())
);

CREATE TABLE IF NOT EXISTS nutrition_meal_items (
    id TEXT PRIMARY KEY,
    daily_log_id TEXT NOT NULL,
    meal_type TEXT CHECK(meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')) NOT NULL,
    food_name TEXT NOT NULL,
    calories INTEGER NOT NULL,
    protein_g REAL NOT NULL DEFAULT 0.0,
    carbs_g REAL NOT NULL DEFAULT 0.0,
    fat_g REAL NOT NULL DEFAULT 0.0,
    serving_size TEXT,
    created_at INTEGER NOT NULL DEFAULT (UNIXEPOCH()),
    FOREIGN KEY (daily_log_id) REFERENCES nutrition_daily_logs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS body_metrics (
    id TEXT PRIMARY KEY,
    measured_at INTEGER NOT NULL,      -- Unix timestamp
    weight_kg REAL NOT NULL,
    body_fat_percentage REAL,
    notes TEXT
);

-- ==========================================================
-- 4. PERFORMANCE INDEXES
-- ==========================================================

CREATE INDEX IF NOT EXISTS idx_workout_exercises_order ON workout_exercises(workout_id, order_index);
CREATE INDEX IF NOT EXISTS idx_workout_sets_lookup ON workout_sets(workout_exercise_id, is_completed);
CREATE INDEX IF NOT EXISTS idx_exercises_filter ON exercises(primary_muscle_id, equipment_id);
CREATE INDEX IF NOT EXISTS idx_workouts_history ON workouts(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_body_metrics_date ON body_metrics(measured_at DESC);
`;
