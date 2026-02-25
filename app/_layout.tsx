import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../src/contexts/ThemeContext';
import { ThemeProvider } from '../src/contexts/ThemeContext';
import { SettingsProvider } from '../src/contexts/SettingsContext';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import Sora from '@expo-google-fonts/sora';
import NunitoSans from '@expo-google-fonts/nunito-sans';

function RootLayoutNav() {
  const { isDark, colors } = useTheme();
  const router = useRouter();

  // Handle notification tap — navigate to Today tab
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      router.replace('/(tabs)');
    });

    return () => subscription.remove();
  }, [router]);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Sora: Sora,
    'Nunito Sans': NunitoSans,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider>
      <SettingsProvider>
        <RootLayoutNav />
      </SettingsProvider>
    </ThemeProvider>
  );
}
