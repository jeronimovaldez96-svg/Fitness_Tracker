import { useCallback, useSyncExternalStore } from 'react';

import { storage } from './mmkv';

function subscribe(key: string, onStoreChange: () => void): () => void {
  const listener = storage.addOnValueChangedListener((changedKey: string) => {
    if (changedKey === key) onStoreChange();
  });
  return () => listener.remove();
}

/**
 * Typed, synchronous, reactive read/write hook over the shared MMKV instance.
 * Values are JSON-serialized so any serializable type can be stored.
 */
export function useMMKVValue<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  const getSnapshot = useCallback((): T => {
    const raw = storage.getString(key);
    if (raw === undefined) return defaultValue;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return defaultValue;
    }
  }, [key, defaultValue]);

  const value = useSyncExternalStore(
    (onStoreChange) => subscribe(key, onStoreChange),
    getSnapshot
  );

  const setValue = useCallback(
    (next: T) => {
      storage.set(key, JSON.stringify(next));
    },
    [key]
  );

  return [value, setValue];
}
