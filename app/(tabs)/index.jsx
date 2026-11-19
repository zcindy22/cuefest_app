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
import DemoLocationChip from '../../components/DemoLocationChip';
import {
  Colors,
  Fonts,
  headingStyle,
  labelStyle,
  bodyStyle,
  cardStyle,
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
  const [homeOpen, setHomeOpen]     = useState(false);  // collapsible: directions home
  const [historyOpen, setHistoryOpen] = useState(false); // collapsible: replan history

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
  const transitStatus = state?.transit_status ?? 'on_time';
  const isDelayed    = transitStatus === 'delayed';

  // Build timeline rows
  const anchorRows = [
    {
      key: 'leave',
      time: state?.leave_home ?? '17:00',
      label: 'Leave home',
      dotColor: Colors.yellow,
    },
    {
      key: 'transit',
      time: state?.transit_time ?? '17:20',
      label: 'Take transit',
      dotColor: Colors.yellow,
    },
    {
      key: 'arrive',
      time: state?.arrive_time ?? '18:25',
      label: 'Arrive at the entrance',
      dotColor: Colors.yellow,
    },
  ];

  const setRows = planItems.map(item => ({
    key: `set_${item.id}`,
    time: item.start_time,
    label: `${item.act_name}${item.stage_name ? ', ' + item.stage_name : ''}`,
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

      {/* Demo chip + transit badge on one row */}
      <View style={styles.chipRow}>
        <DemoLocationChip />
        <View style={[styles.transitBadge, isDelayed && styles.transitBadgeDelayed]}>
          <Text style={styles.transitBadgeText}>
            TRANSIT: {isDelayed ? 'DELAYED' : 'ON TIME'} (SIMULATED)
          </Text>
        </View>
      </View>

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
              <Text style={styles.timelineLabel} numberOfLines={1}>{row.label}</Text>
            </View>
          </View>
        ))}

        {planItems.length === 0 && (
          <Text style={styles.emptyPlan}>
            No sets yet. Add one in Stage Finder.
          </Text>
        )}
      </View>

      {/* Starting from + Open Directions — merged card */}
      <View style={styles.originCard}>
        <Text style={styles.cardTitle}>Starting from</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Leave blank for current location"
          placeholderTextColor={Colors.textMuted}
          value={originText}
          onChangeText={setOriginText}
          returnKeyType="done"
        />
        <TouchableOpacity style={styles.dirBtn} onPress={openDirectionsToFestival}>
          <Text style={styles.dirBtnText}>OPEN DIRECTIONS IN GOOGLE MAPS</Text>
        </TouchableOpacity>
      </View>

      {/* Directions home / next stop — collapsible */}
      <TouchableOpacity style={styles.collapseHeader} onPress={() => setHomeOpen(o => !o)}>
        <Text style={styles.collapseHeaderText}>DIRECTIONS HOME OR NEXT STOP</Text>
        <Text style={styles.caret}>{homeOpen ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {homeOpen && (
        <View style={styles.collapseBody}>
          <Text style={styles.cardSub}>
            Opens Google Maps from the festival entrance. Not saved.
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
      )}

      {/* Replan row: button + counter */}
      <View style={styles.replanRow}>
        <TouchableOpacity
          style={[styles.replanBtn, replansUsed >= 3 && styles.replanBtnDisabled]}
          onPress={handleReplan}
          disabled={replansUsed >= 3}
        >
          <Text style={styles.replanBtnText}>
            {replansUsed >= 3 ? 'REPLAN (ALL 3 USED)' : 'REPLAN'}
          </Text>
        </TouchableOpacity>
        <View style={styles.replanCounter}>
          <Text style={styles.replanCounterText}>{replansUsed}/3 used</Text>
        </View>
      </View>

      {/* Reset demo button — only after all 3 replans */}
      {replansUsed >= 3 && (
        <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
          <Text style={styles.resetBtnText}>RESET DEMO</Text>
        </TouchableOpacity>
      )}

      {/* Replan history — collapsible */}
      {replanLog.length > 0 && (
        <>
          <TouchableOpacity style={styles.collapseHeader} onPress={() => setHistoryOpen(o => !o)}>
            <Text style={styles.collapseHeaderText}>REPLAN HISTORY</Text>
            <Text style={styles.caret}>{historyOpen ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {historyOpen && (
            <View style={styles.collapseBody}>
              {replanLog.map(r => (
                <Text key={r.replan_number} style={styles.historyItem}>
                  {r.replan_number}. {r.reason} {r.what_changed}
                </Text>
              ))}
            </View>
          )}
        </>
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
    marginBottom: 8,
  },

  // ── Chip + badge row ──
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },

  // ── Transit badge ──
  transitBadge: {
    backgroundColor: Colors.blue,
    borderWidth: 2,
    borderColor: Colors.black,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  transitBadgeDelayed: {
    backgroundColor: Colors.pink,
  },
  transitBadgeText: {
    ...labelStyle,
    fontSize: 11,
    letterSpacing: 0.5,
  },

  // ── Replan card ──
  replanCard: {
    backgroundColor: Colors.pink,
    borderWidth: 2,
    borderColor: Colors.black,
    borderRadius: 4,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 2,
  },
  replanBadge: {
    backgroundColor: Colors.black,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 6,
  },
  replanBadgeText: {
    ...labelStyle,
    color: Colors.white,
    fontSize: 11,
  },
  replanTitle: {
    ...bodyStyle,
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    marginBottom: 2,
  },
  replanBody: {
    ...bodyStyle,
    fontSize: 13,
  },

  // ── Timeline ──
  timeline: {
    marginBottom: 12,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timeLabel: {
    ...labelStyle,
    fontFamily: Fonts.body,
    fontSize: 12,
    width: 64,
    paddingTop: 1,
    color: Colors.black,
  },
  dotCol: {
    width: 28,
    alignItems: 'center',
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: Colors.black,
    zIndex: 1,
  },
  line: {
    width: 2,
    flex: 1,
    minHeight: 15,
    backgroundColor: Colors.black,
    alignSelf: 'center',
  },
  timelineTextCol: {
    flex: 1,
    paddingLeft: 6,
    paddingBottom: 10,
  },
  timelineLabel: {
    ...bodyStyle,
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
  },
  emptyPlan: {
    ...bodyStyle,
    color: Colors.textMuted,
    fontStyle: 'italic',
    marginTop: 4,
    paddingLeft: 92,
  },

  // ── Origin card (merged with directions button) ──
  originCard: {
    ...cardStyle,
    marginBottom: 10,
    marginVertical: 0,
  },
  cardTitle: { ...bodyStyle, fontFamily: Fonts.bodyBold, fontSize: 14, marginBottom: 6 },
  cardSub:   { ...bodyStyle, fontSize: 12, color: Colors.textMuted, marginBottom: 8 },
  textInput: {
    borderWidth: 2,
    borderColor: Colors.black,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    ...bodyStyle,
    fontSize: 13,
    marginBottom: 8,
    backgroundColor: Colors.white,
  },

  // ── Open directions button (inside card) ──
  dirBtn: {
    backgroundColor: Colors.yellow,
    borderWidth: 2,
    borderColor: Colors.black,
    borderRadius: 24,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 2,
  },
  dirBtnText: {
    ...buttonTextStyle,
    fontFamily: Fonts.heading,
    fontSize: 15,
  },

  // ── Collapsible section header ──
  collapseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.black,
    borderRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 2,
    marginTop: 8,
  },
  collapseHeaderText: {
    ...labelStyle,
    fontSize: 11,
  },
  caret: {
    ...labelStyle,
    fontSize: 10,
  },
  collapseBody: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.black,
    borderTopWidth: 0,
    borderRadius: 4,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    padding: 12,
    marginBottom: 4,
  },

  // ── GET DIRECTIONS button ──
  goBtn: {
    backgroundColor: Colors.blue,
    borderWidth: 2,
    borderColor: Colors.black,
    borderRadius: 4,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 2,
  },
  goBtnText: { ...buttonTextStyle, fontFamily: Fonts.heading, fontSize: 14 },

  // ── Replan row ──
  replanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
    marginBottom: 6,
  },
  replanBtn: {
    flex: 1,
    backgroundColor: Colors.black,
    borderWidth: 2,
    borderColor: Colors.black,
    borderRadius: 4,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 2,
  },
  replanBtnDisabled: {
    opacity: 0.4,
  },
  replanBtnText: {
    ...buttonTextStyle,
    fontFamily: Fonts.heading,
    fontSize: 16,
    color: Colors.white,
  },
  replanCounter: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.black,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  replanCounterText: {
    ...labelStyle,
    fontSize: 11,
  },

  // ── Reset button ──
  resetBtn: {
    backgroundColor: Colors.yellow,
    borderWidth: 2,
    borderColor: Colors.black,
    borderRadius: 4,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 2,
  },
  resetBtnText: {
    ...buttonTextStyle,
    fontFamily: Fonts.heading,
    fontSize: 15,
  },

  // ── Replan history ──
  historyItem: {
    ...bodyStyle,
    fontSize: 12,
    marginBottom: 4,
  },
});
