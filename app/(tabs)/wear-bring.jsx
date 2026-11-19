/**
 * Wear & Bring screen — shows a heading and reads the forecast from the database.
 */

import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getDb } from '../../db/database';
import { Colors, Fonts, headingStyle, labelStyle, bodyStyle, cardStyle } from '../../theme/theme';

export default function WearAndBringScreen() {
  const [forecast, setForecast] = useState(null);

  useFocusEffect(
    useCallback(() => {
      const db = getDb();
      const row = db.getFirstSync(
        'SELECT condition, temp_f, rain_chance FROM forecast WHERE id = 1'
      );
      setForecast(row ?? null);
    }, [])
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Wear &amp; Bring</Text>
      <Text style={styles.badge}>⬤ SIMULATED FORECAST</Text>
      {forecast ? (
        <View style={styles.card}>
          <Text style={styles.body}>
            Condition: <Text style={styles.bold}>{forecast.condition}</Text>
          </Text>
          <Text style={styles.body}>
            Temp: <Text style={styles.bold}>{forecast.temp_f}°F</Text>
          </Text>
          <Text style={styles.body}>
            Rain chance: <Text style={styles.bold}>{forecast.rain_chance}%</Text>
          </Text>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.body}>Loading forecast…</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20 },
  heading: { ...headingStyle, fontSize: 42, marginBottom: 4 },
  badge: {
    ...labelStyle,
    fontSize: 10,
    backgroundColor: Colors.pink,
    borderWidth: 1,
    borderColor: Colors.black,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  card: { ...cardStyle },
  body: { ...bodyStyle },
  bold: { ...bodyStyle, fontFamily: Fonts.bodyBold },
});
