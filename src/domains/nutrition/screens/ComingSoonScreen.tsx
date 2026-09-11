import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemedStyles, useTheme, type Theme } from '@/core/theme';
import { useMMKVValue } from '@/core/storage/useMMKVValue';
import { Button } from '@/shared/components/Button';

const ROADMAP = [
  {
    n: '01',
    title: 'Daily macro targets',
    body: 'Protein, carbs and fat against a goal you set once.',
  },
  {
    n: '02',
    title: 'Barcode & recent foods',
    body: 'The same ghost-value shortcut the set logger uses.',
  },
  {
    n: '03',
    title: 'Volume against intake',
    body: 'One chart tying training load to calories.',
  },
];

export function ComingSoonScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [notifyMe, setNotifyMe] = useMMKVValue('nutrition-notify-me', false);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bg }]}
      contentContainerStyle={{ paddingTop: insets.top + 14, paddingBottom: insets.bottom + 20 }}
    >
      <View style={styles.header}>
        <Button label="← YOU" onPress={() => router.back()} variant="ghost" compact />
        <Text style={[styles.kicker, { color: colors.accent }]}>NOT SHIPPED YET</Text>
        <Text style={[styles.title, { color: colors.ink }]}>Nutrition</Text>
      </View>
      <View style={[styles.divider, { backgroundColor: colors.divider }]} />

      <View style={styles.body}>
        <Text style={[styles.paragraph, { color: colors.ink }]}>
          Meal and macro logging is next on the roadmap. Your workout history is unaffected.
        </Text>

        <View style={[styles.list, { borderTopColor: colors.soft }]}>
          {ROADMAP.map((item) => (
            <View key={item.n} style={[styles.listRow, { borderBottomColor: colors.soft }]}>
              <Text style={[styles.listIndex, { color: colors.ghost }]}>{item.n}</Text>
              <View style={styles.listContent}>
                <Text style={[styles.listTitle, { color: colors.ink }]}>{item.title}</Text>
                <Text style={[styles.listBody, { color: colors.muted }]}>{item.body}</Text>
              </View>
            </View>
          ))}
        </View>

        <Button
          label={notifyMe ? "You're on the list" : 'Notify me when it lands'}
          onPress={() => setNotifyMe(true)}
          variant="secondary"
          fullWidth
          disabled={notifyMe}
          style={styles.notifyButton}
        />
      </View>
    </ScrollView>
  );
}

function createStyles(theme: Theme) {
  return {
    container: {
      flex: 1,
    },
    header: {
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
      gap: 6,
    },
    kicker: {
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.xs,
      letterSpacing: 1.5,
      marginTop: 4,
    },
    title: {
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.display3,
      letterSpacing: -0.5,
    },
    divider: {
      height: 2,
    },
    body: {
      padding: theme.spacing.lg,
      gap: theme.spacing.lg,
    },
    paragraph: {
      fontFamily: theme.fontFamily.regular,
      fontSize: theme.fontSize.lg,
      lineHeight: 22,
      maxWidth: '90%' as const,
    },
    list: {
      borderTopWidth: 1,
    },
    listRow: {
      flexDirection: 'row' as const,
      gap: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
    },
    listIndex: {
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.md,
      width: 22,
    },
    listContent: {
      flex: 1,
      gap: 4,
    },
    listTitle: {
      fontFamily: theme.fontFamily.semibold,
      fontSize: theme.fontSize.lg,
    },
    listBody: {
      fontFamily: theme.fontFamily.regular,
      fontSize: theme.fontSize.md,
      lineHeight: 18,
    },
    notifyButton: {
      marginTop: theme.spacing.sm,
    },
  };
}
