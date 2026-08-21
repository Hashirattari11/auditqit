import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function Layout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{
        headerStyle: { backgroundColor: '#0a0e1a' },
        headerTintColor: '#e2e8f0',
        contentStyle: { backgroundColor: '#0a0e1a' },
      }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="report/[id]" options={{ title: 'Audit Report', presentation: 'card' }} />
      </Stack>
    </>
  );
}
