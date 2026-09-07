import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, spacing } from '@/core/theme';
import { Button } from '@/shared/components/Button';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fitness_Tracker</Text>
      <Button label="Add Exercise" onPress={() => router.push('/exercise-picker')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: fontSize.lg,
    color: colors.text,
  },
});
