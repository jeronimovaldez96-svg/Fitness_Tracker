import { Tabs } from 'expo-router';

import { useTheme } from '@/core/theme';
import { TabBarButton } from '@/shared/components/TabBarButton';

export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.bg, borderTopWidth: 2, borderTopColor: colors.divider, height: 62 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Train', tabBarButton: (props) => <TabBarButton {...props} label="TRAIN" /> }}
      />
      <Tabs.Screen
        name="history"
        options={{ title: 'History', tabBarButton: (props) => <TabBarButton {...props} label="HISTORY" /> }}
      />
      <Tabs.Screen
        name="progress"
        options={{ title: 'Progress', tabBarButton: (props) => <TabBarButton {...props} label="PROGRESS" /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'You', tabBarButton: (props) => <TabBarButton {...props} label="YOU" /> }}
      />
    </Tabs>
  );
}
