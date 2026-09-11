import { type ReactNode } from 'react';
import { Modal as RNModal, Pressable } from 'react-native';

import { useThemedStyles, useTheme, type Theme } from '@/core/theme';

type ModalProps = {
  visible: boolean;
  onRequestClose: () => void;
  children: ReactNode;
};

export function Modal({ visible, onRequestClose, children }: ModalProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onRequestClose}
      statusBarTranslucent
    >
      <Pressable style={[styles.backdrop, { backgroundColor: colors.overlay }]} onPress={onRequestClose}>
        <Pressable
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.divider }]}
          onPress={(e) => e.stopPropagation()}
        >
          {children}
        </Pressable>
      </Pressable>
    </RNModal>
  );
}

function createStyles(theme: Theme) {
  return {
    backdrop: {
      flex: 1,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      padding: theme.spacing.xl,
    },
    card: {
      width: '100%' as const,
      borderTopWidth: 2,
      padding: theme.spacing.lg,
    },
  };
}
