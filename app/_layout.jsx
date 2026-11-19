import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { useFonts } from 'expo-font';
import {
  BricolageGrotesque_800ExtraBold,
} from '@expo-google-fonts/bricolage-grotesque';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import {
  Nunito_600SemiBold,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';
import 'react-native-reanimated';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { initDatabase, closeDatabase } from '../db/database';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  anchor: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    BricolageGrotesque_800ExtraBold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState(null);

  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  useEffect(() => {
    console.log('[layout] starting initDatabase');
    initDatabase()
      .then(() => { console.log('[layout] DB ready'); setDbReady(true); })
      .catch((err) => { console.error('[layout] DB error', err); setDbError(String(err)); });

    // On web, close the DB when the tab unloads so the OPFS sync access handle
    // is released before a hot-reload spins up a new worker on the same files.
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleUnload = () => { closeDatabase(); };
      window.addEventListener('beforeunload', handleUnload);
      return () => window.removeEventListener('beforeunload', handleUnload);
    }
  }, []);

  useEffect(() => {
    if (fontsLoaded && dbReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, dbReady]);

  if (dbError) {
    return (
      <View style={styles.centerScreen}>
        <Text style={styles.errorTitle}>DB init failed</Text>
        <Text style={styles.errorBody}>{dbError}</Text>
        <Text style={styles.errorHint}>
          Try a hard-refresh (⌘⇧R / Ctrl+Shift+R) to clear the OPFS lock.
        </Text>
      </View>
    );
  }

  if (!fontsLoaded || !dbReady) {
    return (
      <View style={styles.centerScreen}>
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    );
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
  centerScreen: {
    flex: 1,
    backgroundColor: '#FFFAF2',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    color: '#888',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#c0392b',
    marginBottom: 8,
  },
  errorBody: {
    fontSize: 13,
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorHint: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
  webShell: {
    flex: 1,
    backgroundColor: '#EDE5D8', // slightly darker than the app background
    alignItems: 'center',
    justifyContent: 'flex-start',
    // On web, the outer container fills the viewport
    ...(Platform.OS === 'web' ? { minHeight: '100vh' } : {}),
  },
  phoneFrame: {
    width: '100%',
    maxWidth: 430,
    flex: 1,
    backgroundColor: '#FFFAF2',
    // On web: full viewport height
    ...(Platform.OS === 'web' ? { minHeight: '100vh' } : {}),
  },
});
