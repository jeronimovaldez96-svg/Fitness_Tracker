declare module 'react-native-background-timer' {
  const BackgroundTimer: {
    setInterval: (callback: () => void, timeout: number) => number;
    clearInterval: (intervalId: number) => void;
    setTimeout: (callback: () => void, timeout: number) => number;
    clearTimeout: (timeoutId: number) => void;
    start: (delay?: number) => void;
    stop: () => void;
  };
  export default BackgroundTimer;
}
