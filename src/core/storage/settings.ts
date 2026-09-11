import { useMMKVValue } from './useMMKVValue';
import type { UnitSystem } from '@/shared/utils/units';

const UNIT_SYSTEM_KEY = 'settings-unit-system';
const PLATE_CALCULATOR_KEY = 'settings-plate-calculator-enabled';
const LAST_BACKUP_KEY = 'settings-last-backup-at';

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
