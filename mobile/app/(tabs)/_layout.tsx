import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      tabBarStyle: { backgroundColor: '#111827', borderTopColor: '#1e293b' },
      tabBarActiveTintColor: '#6366f1',
      tabBarInactiveTintColor: '#64748b',
      headerStyle: { backgroundColor: '#0a0e1a' },
      headerTintColor: '#e2e8f0',
    }}>
      <Tabs.Screen name="index" options={{ title: 'Audit', tabBarIcon: () => null, tabBarLabel: 'Audit' }} />
      <Tabs.Screen name="history" options={{ title: 'History', tabBarIcon: () => null, tabBarLabel: 'History' }} />
      <Tabs.Screen name="monitors" options={{ title: 'Monitors', tabBarIcon: () => null, tabBarLabel: 'Monitors' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: () => null, tabBarLabel: 'Settings' }} />
    </Tabs>
  );
}
