import { storage } from './mmkv';
import { useMMKVValue } from './useMMKVValue';
import type { UnitSystem } from '@/shared/utils/units';

const UNIT_SYSTEM_KEY = 'settings-unit-system';
const PLATE_CALCULATOR_KEY = 'settings-plate-calculator-enabled';
const LAST_BACKUP_KEY = 'settings-last-backup-at';
const DEFAULT_REST_SECONDS_KEY = 'settings-default-rest-seconds';
export const DEFAULT_REST_SECONDS_FALLBACK = 90;

export function useUnitSystem(): [UnitSystem, (value: UnitSystem) => void] {
  return useMMKVValue<UnitSystem>(UNIT_SYSTEM_KEY, 'metric');
}

export function usePlateCalculatorSetting(): [boolean, (value: boolean) => void] {
  return useMMKVValue<boolean>(PLATE_CALCULATOR_KEY, true);
}

/** Unix ms timestamp of the last successful "Back up database" tap, or null if never run. */
export function useLastBackupAt(): [number | null, (value: number | null) => void] {
  return useMMKVValue<number | null>(LAST_BACKUP_KEY, null);
}

export function useDefaultRestSeconds(): [number, (value: number) => void] {
  return useMMKVValue<number>(DEFAULT_REST_SECONDS_KEY, DEFAULT_REST_SECONDS_FALLBACK);
}

/**
 * Synchronous read for non-component code (the Zustand workout store) that
 * can't call hooks. Mirrors useMMKVValue's read logic against the same key.
 */
export function getDefaultRestSeconds(): number {
  const raw = storage.getString(DEFAULT_REST_SECONDS_KEY);
  if (raw === undefined) return DEFAULT_REST_SECONDS_FALLBACK;
  try {
    return JSON.parse(raw) as number;
  } catch {
    return DEFAULT_REST_SECONDS_FALLBACK;
  }
}
