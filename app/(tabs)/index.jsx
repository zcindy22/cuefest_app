/**
 * Getting There screen
 *
 * - Timeline: Leave home → Take transit → Arrive at entrance → plan_items sets
 * - Transit status badge (simulated)
 * - Open Directions button (Google Maps, current location → festival entrance)
 * - Directions home / next stop (text input, not saved, opens Google Maps)
 * - Replan button: 3 scripted disruptions, counter, disable after 3rd
 * - Latest replan card (what changed + why)
 * - Replan history list
 * - Reset demo button after 3 replans
 */

import { useCallback, useState } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getDb } from '../../db/database';
import { runReplan, resetDemo } from '../../lib/replan';
import {
  Colors,
  Fonts,
  headingStyle,
  labelStyle,
  bodyStyle,
  cardStyle,
  buttonStyle,
  buttonTextStyle,
} from '../../theme/theme';

// ─── Constants ────────────────────────────────────────────────────────────────

const DIRECTIONS_TO_FESTIVAL =
  'https://www.google.com/maps/dir/?api=1&destination=2217%20NW%205th%20Ave%2C%20Miami%2C%20FL&travelmode=transit';

const FESTIVAL_ORIGIN = '2217%20NW%205th%20Ave%2C%20Miami%2C%20FL';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function GettingThereScreen() {
  const [state, setState]           = useState(null);   // replan_state row
  const [planItems, setPlanItems]   = useState([]);
  const [replanLog, setReplanLog]   = useState([]);
  const [lastReplan, setLastReplan] = useState(null);   // { reason, what_changed }
  const [destText, setDestText]     = useState('');     // directions dest input, never saved
  const [originText, setOriginText] = useState('');     // starting-from input, never saved

  // ── Load from DB on focus ──────────────────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [])
  );

  function loadAll() {
    const db = getDb();
    setState(db.getFirstSync('SELECT * FROM replan_state WHERE id = 1'));
    setPlanItems(db.getAllSync(
      'SELECT id, act_name, stage_name, start_time, end_time FROM plan_items ORDER BY start_time ASC'
    ));
    setReplanLog(db.getAllSync(
      'SELECT replan_number, reason, what_changed FROM replan_log ORDER BY replan_number ASC'
    ));
  }

  // ── Replan handler ─────────────────────────────────────────────────────────
  function handleReplan() {
    if (!state || state.replans_used >= 3) return;
    const db = getDb();
    const nextReplan = state.replans_used + 1;
    const result = runReplan(nextReplan, db);
    setLastReplan({ number: nextReplan, ...result });
    loadAll();
  }

  // ── Reset handler ──────────────────────────────────────────────────────────
  function handleReset() {
    Alert.alert(
      'Reset demo',
      'This will clear your plan and restore all original times. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            const db = getDb();
            resetDemo(db);
            setLastReplan(null);
            loadAll();
          },
        },
      ]
    );
  }

  // ── Open directions to festival ────────────────────────────────────────────
  function openDirectionsToFestival() {
    // If user typed a starting location, include it; otherwise Google Maps uses current location
    if (originText.trim()) {
      const encodedOrigin = encodeURIComponent(originText.trim());
      const url = `https://www.google.com/maps/dir/?api=1&origin=${encodedOrigin}&destination=2217%20NW%205th%20Ave%2C%20Miami%2C%20FL&travelmode=transit`;
      Linking.openURL(url);
    } else {
      Linking.openURL(DIRECTIONS_TO_FESTIVAL);
    }
  }

  // ── Open directions home / next stop ──────────────────────────────────────
  function openDirectionsHome() {
    if (!destText.trim()) {
      Alert.alert('Enter a destination', 'Type an address or place name first.');
      return;
    }
    const encoded = encodeURIComponent(destText.trim());
    const url = `https://www.google.com/maps/dir/?api=1&origin=${FESTIVAL_ORIGIN}&destination=${encoded}&travelmode=transit`;
    Linking.openURL(url);
  }

  // ── Derived ────────────────────────────────────────────────────────────────
  const replansUsed  = state?.replans_used ?? 0;
  const replansLeft  = 3 - replansUsed;
  const transitStatus = state?.transit_status ?? 'on_time';
  const isDelayed    = transitStatus === 'delayed';

  // Build timeline rows
  const anchorRows = [
    {
      key: 'leave',
      time: state?.leave_home ?? '17:00',
      label: 'Leave home',
      sub: replansUsed >= 1
        ? '15 minutes earlier than planned'
        : 'Head to the transit stop',
      dotColor: Colors.yellow,
    },
    {
      key: 'transit',
      time: state?.transit_time ?? '17:20',
      label: 'Take transit',
      sub: 'Status is simulated',
      dotColor: Colors.yellow,
    },
    {
      key: 'arrive',
      time: state?.arrive_time ?? '18:25',
      label: 'Arrive at the entrance',
      sub: 'Plan extra time for entry lines',
      dotColor: Colors.yellow,
    },
  ];

  const setRows = planItems.map(item => ({
    key: `set_${item.id}`,
    time: item.start_time,
    label: `${item.act_name}${item.stage_name ? ', ' + item.stage_name : ''}`,
    sub: `Walk from entrance: see Stage Finder`,
    dotColor: Colors.pink,
  }));

  const timelineRows = [...anchorRows, ...setRows].sort((a, b) =>
    a.time.localeCompare(b.time)
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>

      {/* Header */}
      <Text style={styles.appLabel}>CUE SAMPLE FESTIVAL DAY</Text>
      <Text style={styles.heading}>GETTING THERE</Text>

      {/* Latest replan card */}
      {lastReplan && (
        <View style={styles.replanCard}>
          <View style={styles.replanBadge}>
            <Text style={styles.replanBadgeText}>REPLAN {lastReplan.number} OF 3</Text>
          </View>
          <Text style={styles.replanTitle}>{lastReplan.reason}</Text>
          <Text style={styles.replanBody}>{lastReplan.what_changed}</Text>
        </View>
      )}

      {/* Transit status badge */}
      <View style={[styles.transitBadge, isDelayed && styles.transitBadgeDelayed]}>
        <Text style={styles.transitBadgeText}>
          TRANSIT: {isDelayed ? 'DELAYED' : 'ON TIME'} (SIMULATED)
        </Text>
      </View>

      {/* Timeline */}
      <View style={styles.timeline}>
        {timelineRows.map((row, i) => (
          <View key={row.key} style={styles.timelineRow}>
            {/* Time column */}
            <Text style={styles.timeLabel}>{fmt(row.time)}</Text>

            {/* Dot + line column */}
            <View style={styles.dotCol}>
              <View style={[styles.dot, { backgroundColor: row.dotColor }]} />
              {i < timelineRows.length - 1 && <View style={styles.line} />}
            </View>

            {/* Label column */}
            <View style={styles.timelineTextCol}>
              <Text style={styles.timelineLabel}>{row.label}</Text>
              <Text style={styles.timelineSub}>{row.sub}</Text>
            </View>
          </View>
        ))}

        {planItems.length === 0 && (
          <Text style={styles.emptyPlan}>
            No sets added yet — go to Stage Finder to add one.
          </Text>
        )}
      </View>

      {/* Starting from input */}
      <View style={styles.originCard}>
        <Text style={styles.cardTitle}>Starting from</Text>
        <Text style={styles.cardSub}>
          Optional. Leave blank to use your current location. Not saved.
        </Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g. New York, NY or 123 Main St"
          placeholderTextColor={Colors.textMuted}
          value={originText}
          onChangeText={setOriginText}
          returnKeyType="done"
        />
      </View>

      {/* Open directions button */}
      <TouchableOpacity style={styles.dirBtn} onPress={openDirectionsToFestival}>
        <Text style={styles.dirBtnText}>OPEN DIRECTIONS IN GOOGLE MAPS</Text>
      </TouchableOpacity>

      {/* Directions home / next stop */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Directions home or next stop</Text>
        <Text style={styles.cardSub}>
          Type any address. Opens Google Maps from the festival entrance.
          What you type is not saved.
        </Text>
        <TextInput
          style={styles.textInput}
          placeholder="Address or place name"
          placeholderTextColor={Colors.textMuted}
          value={destText}
          onChangeText={setDestText}
          returnKeyType="done"
        />
        <TouchableOpacity style={styles.goBtn} onPress={openDirectionsHome}>
          <Text style={styles.goBtnText}>GET DIRECTIONS</Text>
        </TouchableOpacity>
      </View>

      {/* Replan button */}
      <TouchableOpacity
        style={[styles.replanBtn, replansUsed >= 3 && styles.replanBtnDisabled]}
        onPress={handleReplan}
        disabled={replansUsed >= 3}
      >
        <Text style={styles.replanBtnText}>
          {replansUsed >= 3
            ? 'REPLAN (ALL 3 USED)'
            : `REPLAN (${replansUsed} OF 3 USED)`}
        </Text>
      </TouchableOpacity>

      {/* Reset demo button — only after all 3 replans */}
      {replansUsed >= 3 && (
        <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
          <Text style={styles.resetBtnText}>RESET DEMO</Text>
        </TouchableOpacity>
      )}

      {/* Replan history */}
      {replanLog.length > 0 && (
        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>REPLAN HISTORY</Text>
          {replanLog.map(r => (
            <Text key={r.replan_number} style={styles.historyItem}>
              {r.replan_number}. {r.reason} {r.what_changed}
            </Text>
          ))}
        </View>
      )}

    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 48 },

  appLabel: {
    ...labelStyle,
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

  // ── Replan card ──
  replanCard: {
    backgroundColor: Colors.pink,
    borderWidth: 2,
    borderColor: Colors.black,
    borderRadius: 4,
    padding: 14,
    marginBottom: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  replanBadge: {
    backgroundColor: Colors.black,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 8,
  },
  replanBadgeText: {
    ...labelStyle,
    color: Colors.white,
    fontSize: 11,
  },
  replanTitle: {
    ...bodyStyle,
    fontFamily: Fonts.bodyBold,
    fontSize: 17,
    marginBottom: 4,
  },
  replanBody: {
    ...bodyStyle,
    fontSize: 14,
  },

  // ── Transit badge ──
  transitBadge: {
    backgroundColor: Colors.blue,
    borderWidth: 2,
    borderColor: Colors.black,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  transitBadgeDelayed: {
    backgroundColor: Colors.pink,
  },
  transitBadgeText: {
    ...labelStyle,
    fontSize: 11,
    letterSpacing: 0.5,
  },

  // ── Timeline ──
  timeline: {
    marginBottom: 20,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 0,
  },
  timeLabel: {
    ...labelStyle,
    fontFamily: Fonts.body,
    fontSize: 13,
    width: 70,
    paddingTop: 2,
    color: Colors.black,
  },
  dotCol: {
    width: 32,
    alignItems: 'center',
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: Colors.black,
    zIndex: 1,
  },
  line: {
    width: 2,
    flex: 1,
    minHeight: 32,
    backgroundColor: Colors.black,
    marginTop: 0,
  },
  timelineTextCol: {
    flex: 1,
    paddingLeft: 8,
    paddingBottom: 24,
  },
  timelineLabel: {
    ...bodyStyle,
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
  },
  timelineSub: {
    ...bodyStyle,
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  emptyPlan: {
    ...bodyStyle,
    color: Colors.textMuted,
    fontStyle: 'italic',
    marginTop: 8,
    paddingLeft: 102,
  },

  // ── Directions to festival button ──
  dirBtn: {
    backgroundColor: Colors.yellow,
    borderWidth: 2,
    borderColor: Colors.black,
    borderRadius: 4,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  dirBtnText: {
    ...buttonTextStyle,
    fontFamily: Fonts.heading,
    fontSize: 17,
  },

  // ── Directions card ──
  card: { ...cardStyle, marginBottom: 12 },
  originCard: { ...cardStyle, marginBottom: 10 },
  cardTitle: { ...bodyStyle, fontFamily: Fonts.bodyBold, fontSize: 15, marginBottom: 4 },
  cardSub:   { ...bodyStyle, fontSize: 13, color: Colors.textMuted, marginBottom: 10 },
  textInput: {
    borderWidth: 2,
    borderColor: Colors.black,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    ...bodyStyle,
    fontSize: 14,
    marginBottom: 10,
    backgroundColor: Colors.white,
  },
  goBtn: {
    backgroundColor: Colors.blue,
    borderWidth: 2,
    borderColor: Colors.black,
    borderRadius: 4,
    paddingVertical: 10,
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  goBtnText: { ...buttonTextStyle, fontFamily: Fonts.heading, fontSize: 15 },

  // ── Replan button ──
  replanBtn: {
    backgroundColor: Colors.black,
    borderWidth: 2,
    borderColor: Colors.black,
    borderRadius: 4,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: Colors.black,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  replanBtnDisabled: {
    opacity: 0.4,
  },
  replanBtnText: {
    ...buttonTextStyle,
    fontFamily: Fonts.heading,
    fontSize: 17,
    color: Colors.white,
  },

  // ── Reset button ──
  resetBtn: {
    backgroundColor: Colors.yellow,
    borderWidth: 2,
    borderColor: Colors.black,
    borderRadius: 4,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: Colors.black,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  resetBtnText: {
    ...buttonTextStyle,
    fontFamily: Fonts.heading,
    fontSize: 16,
  },

  // ── Replan history ──
  historySection: {
    borderTopWidth: 1,
    borderTopColor: Colors.black,
    paddingTop: 14,
    marginTop: 4,
  },
  historyTitle: {
    ...labelStyle,
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    marginBottom: 8,
  },
  historyItem: {
    ...bodyStyle,
    fontSize: 13,
    marginBottom: 6,
  },
});
