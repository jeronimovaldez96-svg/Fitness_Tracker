import { type ReactNode } from 'react';
import { Modal as RNModal, Pressable, StyleSheet } from 'react-native';

import { colors, radius, spacing } from '@/core/theme';

type ModalProps = {
  visible: boolean;
  onRequestClose: () => void;
  children: ReactNode;
};

export function Modal({ visible, onRequestClose, children }: ModalProps) {
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onRequestClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onRequestClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          {children}
        </Pressable>
      </Pressable>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
});
