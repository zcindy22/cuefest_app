import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { useFonts } from 'expo-font';
import { BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import { SpaceMono_400Regular } from '@expo-google-fonts/space-mono';
import { Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';
import 'react-native-reanimated';
import { Platform, StyleSheet, View } from 'react-native';
import { initDatabase } from '../db/database';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  anchor: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    BebasNeue_400Regular,
    SpaceMono_400Regular,
    Inter_400Regular,
    Inter_700Bold,
  });
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  useEffect(() => {
    initDatabase()
      .then(() => setDbReady(true))
      .catch((err) => { throw err; });
  }, []);

  useEffect(() => {
    if (fontsLoaded && dbReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, dbReady]);

  if (!fontsLoaded || !dbReady) {
    return null;
  }

  // On web, center the app in a phone-width column so it looks like a phone
  // on a laptop. On narrow screens (≤430) it fills the full width.
  const inner = (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );

  if (Platform.OS !== 'web') {
    return inner;
  }

  return (
    <View style={styles.webShell}>
      <View style={styles.phoneFrame}>
        {inner}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  webShell: {
    flex: 1,
    backgroundColor: '#D8D7D2', // slightly darker than the app background
    alignItems: 'center',
    justifyContent: 'flex-start',
    // On web, the outer container fills the viewport
    ...(Platform.OS === 'web' ? { minHeight: '100vh' } : {}),
  },
  phoneFrame: {
    width: '100%',
    maxWidth: 430,
    flex: 1,
    backgroundColor: '#F0EFEA',
    // On web: full viewport height
    ...(Platform.OS === 'web' ? { minHeight: '100vh' } : {}),
  },
});
