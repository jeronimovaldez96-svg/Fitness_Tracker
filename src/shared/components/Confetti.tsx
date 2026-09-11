import { useEffect, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/core/theme';

const PARTICLE_COUNT = 24;
const FALL_DISTANCE = 420;
const DURATION_MS = 1100;

type Particle = {
  id: number;
  x: number;
  color: string;
  delay: number;
  rotation: number;
};

/**
 * Deterministic pseudo-random in [0, 1), seeded by the trigger + particle
 * index. Avoids calling Math.random() during render (React purity rule)
 * while still varying per PR since each trigger is a unique set id.
 */
function seededRandom(seed: number): number {
  let t = seed + 0x6d2b79f5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function ConfettiPiece({ particle }: { particle: Particle }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      particle.delay,
      withTiming(1, { duration: DURATION_MS, easing: Easing.out(Easing.quad) })
    );
  }, [particle.delay, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [
      { translateX: particle.x + Math.sin(progress.value * Math.PI * 2) * 20 },
      { translateY: progress.value * FALL_DISTANCE },
      { rotate: `${progress.value * particle.rotation}deg` },
    ],
  }));

  return <Animated.View style={[styles.piece, { backgroundColor: particle.color }, animatedStyle]} />;
}

/**
 * TRD 7.3: "dispatch an in-app confetti event" on a new PR. `trigger` is the
 * id of the set that earned the PR — a fresh, always-unique value — so a new
 * burst fires whenever it changes, without needing an explicit reset.
 */
export function Confetti({ trigger }: { trigger: string | null }) {
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const particleColors = [colors.accent, colors.ink, colors.accentDeep, colors.muted, colors.accent];
  const [prevTrigger, setPrevTrigger] = useState(trigger);
  const [particles, setParticles] = useState<Particle[]>([]);

  if (trigger !== prevTrigger) {
    setPrevTrigger(trigger);
    if (trigger !== null) {
      const seed = hashString(trigger);
      setParticles(
        Array.from({ length: PARTICLE_COUNT }, (_, id) => ({
          id,
          x: seededRandom(seed + id) * width,
          color: particleColors[id % particleColors.length],
          delay: seededRandom(seed + id + 1000) * 150,
          rotation: 360 + seededRandom(seed + id + 2000) * 360,
        }))
      );
    }
  }

  useEffect(() => {
    if (particles.length === 0) return;
    const timeout = setTimeout(() => setParticles([]), DURATION_MS + 200);
    return () => clearTimeout(timeout);
  }, [particles]);

  if (particles.length === 0) return null;

  return (
    <View style={styles.overlay} pointerEvents="none">
      {particles.map((particle) => (
        <ConfettiPiece key={particle.id} particle={particle} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 100,
  },
  piece: {
    position: 'absolute',
    top: -20,
    width: 8,
    height: 14,
  },
});
