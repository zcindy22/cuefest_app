/**
 * components/DemoLocationChip.jsx
 *
 * A small tappable chip shown at the top of every screen.
 * Displays "Demo location: ON" or "Demo location: OFF" and toggles on tap.
 * Reads and writes the demo_location key in the settings table.
 * Starts ON by default (seeded in db/database.js).
 */

import { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getDb } from '../db/database';
import { getDemoLocationSetting, setDemoLocationSetting } from '../lib/location';
import { Colors, Fonts } from '../theme/theme';

export default function DemoLocationChip() {
  const [isOn, setIsOn] = useState(true);

  // Read from DB whenever the screen is focused
  useFocusEffect(
    useCallback(() => {
      const db = getDb();
      if (!db) return;
      const val = getDemoLocationSetting(db);
      setIsOn(val === 'on');
    }, [])
  );

  function handleToggle() {
    const db = getDb();
    if (!db) return;
    const next = isOn ? 'off' : 'on';
    setDemoLocationSetting(db, next);
    setIsOn(!isOn);
  }

  return (
    <TouchableOpacity
      style={[styles.chip, isOn ? styles.chipOn : styles.chipOff]}
      onPress={handleToggle}
      accessibilityRole="button"
      accessibilityLabel={`Demo location ${isOn ? 'ON' : 'OFF'}, tap to toggle`}
    >
      <Text style={styles.text}>
        📍 Demo location: <Text style={styles.bold}>{isOn ? 'ON' : 'OFF'}</Text>
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    borderWidth: 2,
    borderColor: Colors.black,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 10,
  },
  chipOn: {
    backgroundColor: Colors.yellow,
  },
  chipOff: {
    backgroundColor: Colors.white,
  },
  text: {
    fontFamily: Fonts.label,
    fontSize: 11,
    color: Colors.black,
  },
  bold: {
    fontFamily: Fonts.label,
    fontWeight: 'bold',
  },
});
