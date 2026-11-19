/**
 * My Lineup — placeholder screen
 * Full implementation coming in Prompt 10.
 */

import { StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts, headingStyle, labelStyle, bodyStyle } from '../../theme/theme';

export default function MyLineupScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.appLabel}>CUE SAMPLE FESTIVAL DAY</Text>
      <Text style={styles.heading}>MY LINEUP</Text>
      <Text style={styles.body}>
        Discover acts, build your lineup, and add them to your plan.
      </Text>
      <Text style={styles.coming}>Coming soon — Prompt 10</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 20,
  },
  appLabel: {
    fontFamily: Fonts.label,
    fontSize: 11,
    backgroundColor: Colors.yellow,
    borderWidth: 2,
    borderColor: Colors.black,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  heading: {
    ...headingStyle,
    fontSize: 52,
    marginBottom: 12,
  },
  body: {
    ...bodyStyle,
    marginBottom: 8,
  },
  coming: {
    fontFamily: Fonts.label,
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 16,
  },
});
