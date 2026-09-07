/**
 * Expo Router only passes serializable params between routes. Modal picker
 * screens (exercise-picker, replace-exercise) need to return a rich value to
 * whichever screen pushed them, so the caller registers a one-shot callback
 * here immediately before navigating, and the picker consumes it on select.
 */
type Callback<T> = (value: T) => void;

let pendingCallback: Callback<never> | null = null;

export function setNavigationCallback<T>(callback: Callback<T>): void {
  pendingCallback = callback as Callback<never>;
}

export function consumeNavigationCallback<T>(value: T): void {
  const callback = pendingCallback;
  pendingCallback = null;
  callback?.(value as never);
}
