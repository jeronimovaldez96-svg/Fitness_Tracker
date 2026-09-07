import { useEffect, useState, type ReactNode } from 'react';
import { Modal as RNModal, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, spacing } from '@/core/theme';

type SheetProps = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
};

const ANIMATION_DURATION = 220;
const OFFSCREEN_Y = 400;

export function Sheet({ visible, onClose, children }: SheetProps) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(OFFSCREEN_Y);
  const backdropOpacity = useSharedValue(0);
  const [shouldRender, setShouldRender] = useState(visible);
  const [prevVisible, setPrevVisible] = useState(visible);

  // Derived state: opening must render immediately, so this is computed during
  // render (React's documented pattern) rather than a setState-in-effect.
  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (visible) setShouldRender(true);
  }

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, { duration: ANIMATION_DURATION });
      backdropOpacity.value = withTiming(1, { duration: ANIMATION_DURATION });
      return;
    }
    if (!shouldRender) return;

    translateY.value = withTiming(OFFSCREEN_Y, { duration: ANIMATION_DURATION });
    backdropOpacity.value = withTiming(0, { duration: ANIMATION_DURATION }, (finished) => {
      if (finished) runOnJS(setShouldRender)(false);
    });
  }, [visible, shouldRender, translateY, backdropOpacity]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!shouldRender) return null;

  return (
    <RNModal visible transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.container}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        </Animated.View>
        <Animated.View
          style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }, sheetStyle]}
        >
          {children}
        </Animated.View>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.surfaceElevated,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
});
