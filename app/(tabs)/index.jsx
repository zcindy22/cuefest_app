/**
 * app/(tabs)/index.jsx
 *
 * Lineup page — Prompt 8.
 * Header: title + Sample day pill + round yellow navigate button.
 * Day tabs: Friday / Saturday (Saturday default, pink underline).
 * Segmented control: Timeline | Saved | All acts.
 * Directions: plain Linking.openURL to Google Maps, no sheet or picker.
 * Demo location switch at the very bottom.
 *
 * Replan code, helper files and tables are untouched — just not shown.
 */

import { useCallback, useState } from 'react';
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getDb } from '../../db/database';
import { getDemoLocationSetting, setDemoLocationSetting } from '../../lib/location';
import ArtistCard from '../../components/ArtistCard';
import ScheduleTimeline from '../../components/ScheduleTimeline';
import {
  Colors,
  Fonts,
  bodyStyle,
  cardStyle,
  headingStyle,
} from '../../theme/theme';

// ─── Google Maps directions ────────────────────────────────────────────────────
// No travelmode — Google Maps uses its own default and the person can switch there.

const DESTINATION = '2217%20NW%205th%20Ave%2C%20Miami%2C%20FL';
const DEMO_ORIGIN = 'Wynwood%2C%20Miami%2C%20FL';

function directionsUrl(demoOn) {
  const base = `https://www.google.com/maps/dir/?api=1&destination=${DESTINATION}`;
  return demoOn ? `${base}&origin=${DEMO_ORIGIN}` : base;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12  = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function toMins(t) {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function initials(name) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

const GENRE_COLORS = {
  'Dance':   Colors.yellow,
  'Techno':  Colors.blue,
  'Bass':    Colors.peach,
  'Latin':   Colors.pink,
  'Indie':   Colors.lilac,
  'Alt R&B': Colors.pink,
  'Electro': Colors.blue,
  'Hip hop': Colors.yellow,
};
function genreColor(genre) { return GENRE_COLORS[genre] ?? Colors.yellow; }

// ─── Small shared components ──────────────────────────────────────────────────

function InitialsTile({ name, genre, size = 44 }) {
  const bg = genreColor(genre);
  return (
    <View style={[tileStyles.tile, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Text style={[tileStyles.text, { fontSize: Math.max(12, size * 0.33) }]}>
        {initials(name)}
      </Text>
    </View>
  );
}
const tileStyles = StyleSheet.create({
  tile: { alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: Colors.ink },
  text: { fontFamily: Fonts.bodyBold, color: Colors.ink },
});

function GenreChip({ genre }) {
  return (
    <View style={[chipSt.chip, { backgroundColor: genreColor(genre) }]}>
      <Text style={chipSt.text}>{genre}</Text>
    </View>
  );
}
const chipSt = StyleSheet.create({
  chip: { borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1.5, borderColor: Colors.ink, alignSelf: 'flex-start' },
  text: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.ink },
});

function SegmentedControl({ tabs, active, onSelect }) {
  return (
    <View style={segSt.row}>
      {tabs.map(t => (
        <TouchableOpacity
          key={t}
          style={[segSt.tab, active === t && segSt.tabActive]}
          onPress={() => onSelect(t)}
          hitSlop={{ top: 6, bottom: 6, left: 2, right: 2 }}
        >
          <Text style={[segSt.text, active === t && segSt.textActive]}>{t}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
const segSt = StyleSheet.create({
  row: { flexDirection: 'row', backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.ink, borderRadius: 100, marginBottom: 16, overflow: 'hidden', minHeight: 48 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  tabActive: { backgroundColor: Colors.ink, borderRadius: 100, margin: 3 },
  text: { fontFamily: Fonts.bodyBold, fontSize: 14, color: Colors.ink },
  textActive: { color: Colors.white },
});

// ─── Main component ───────────────────────────────────────────────────────────

export default function LineupScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [day, setDay]               = useState('Sat');
  const [view, setView]             = useState('Timeline');
  const [acts, setActs]             = useState([]);
  const [savedActIds, setSavedActIds] = useState([]);
  const [planItems, setPlanItems]   = useState([]);
  const [demoOn, setDemoOn]         = useState(true);
  const [detailAct, setDetailAct]   = useState(null);

  function loadAll() {
    const db = getDb();
    setActs(db.getAllSync(
      'SELECT id, stage_id, act_name, start_time, end_time, genre, subgenre, bio, day FROM sets ORDER BY stage_id, start_time'
    ));
    setSavedActIds(db.getAllSync('SELECT act_id FROM saved_acts').map(r => r.act_id));
    setPlanItems(db.getAllSync(
      'SELECT set_id, act_name, stage_name, start_time, end_time FROM plan_items ORDER BY start_time'
    ));
    const val = getDemoLocationSetting(db);
    setDemoOn(val === 'on');
  }

  useFocusEffect(useCallback(() => { loadAll(); }, [])); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleSaved(actId) {
    const db = getDb();
    if (savedActIds.includes(actId)) {
      db.runSync('DELETE FROM saved_acts WHERE act_id = ?', [actId]);
      setSavedActIds(ids => ids.filter(id => id !== actId));
    } else {
      db.runSync('INSERT OR IGNORE INTO saved_acts (act_id) VALUES (?)', [actId]);
      setSavedActIds(ids => [...ids, actId]);
    }
  }

  function toggleDemo() {
    const db = getDb();
    const next = demoOn ? 'off' : 'on';
    setDemoLocationSetting(db, next);
    setDemoOn(!demoOn);
  }

  function openDirections() {
    Linking.openURL(directionsUrl(demoOn));
  }

  function findOnMap(act) {
    setDetailAct(null);
    const db = getDb();
    db.runSync(
      `INSERT INTO settings (key, value) VALUES ('open_stage', ?)
       ON CONFLICT(key) DO UPDATE SET value = ?`,
      [String(act.stage_id), String(act.stage_id)]
    );
    router.navigate('/(tabs)/stage-finder');
  }

  // ── Data for each view ───────────────────────────────────────────────────────

  const dayActs = acts.filter(a => a.day === day);
  const dayActsSorted = [...dayActs].sort((a, b) => a.start_time.localeCompare(b.start_time));

  // Saved view: merge saved_acts + plan_items by set_id, no duplicates
  // plan_items stores set_id as a column, so we match on that
  const savedIdsForDay = dayActs.filter(a => savedActIds.includes(a.id)).map(a => a.id);
  const planSetIdsForDay = planItems
    .filter(p => {
      const act = acts.find(a => a.id === p.set_id);
      return act && act.day === day;
    })
    .map(p => p.set_id);
  const mergedSetIds = [...new Set([...savedIdsForDay, ...planSetIdsForDay])];
  const savedActsForDay = mergedSetIds
    .map(id => acts.find(a => a.id === id))
    .filter(Boolean)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.content}>

        {/* Header row */}
        <View style={styles.headerRow}>
          <Text style={styles.heading}>Lineup</Text>
          <View style={styles.headerRight}>
            <View style={styles.samplePill}>
              <Text style={styles.samplePillText}>Sample day</Text>
            </View>
            <TouchableOpacity
              style={styles.navBtn}
              onPress={openDirections}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Get directions to festival"
            >
              <Ionicons name="navigate-outline" size={20} color={Colors.ink} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Day tabs */}
        <View style={styles.dayTabRow}>
          {['Fri', 'Sat'].map(d => (
            <TouchableOpacity key={d} style={styles.dayTab} onPress={() => setDay(d)}>
              <Text style={[styles.dayTabText, day === d && styles.dayTabTextActive]}>
                {d === 'Fri' ? 'Friday' : 'Saturday'}
              </Text>
              {day === d && <View style={styles.dayUnderline} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* Segmented control */}
        <SegmentedControl
          tabs={['Timeline', 'Saved', 'All acts']}
          active={view}
          onSelect={setView}
        />

        {/* Timeline view */}
        {view === 'Timeline' && (
          <TimelineView
            acts={dayActsSorted}
            savedActIds={savedActIds}
            day={day}
            onDetail={setDetailAct}
            onToggleSaved={toggleSaved}
          />
        )}

        {/* Saved view */}
        {view === 'Saved' && (
          <SavedView
            acts={savedActsForDay}
            day={day}
            onDetail={setDetailAct}
            onToggleSaved={toggleSaved}
            onGoDiscover={() => router.navigate('/(tabs)/my-lineup')}
          />
        )}

        {/* All acts view */}
        {view === 'All acts' && (
          <AllActsView
            acts={dayActsSorted}
            savedActIds={savedActIds}
            onDetail={setDetailAct}
            onToggleSaved={toggleSaved}
          />
        )}

        {/* Demo location row — bottom of page */}
        <View style={styles.demoRow}>
          <Text style={styles.demoLabel}>Demo location</Text>
          <TouchableOpacity
            style={[styles.demoToggle, demoOn && styles.demoToggleOn]}
            onPress={toggleDemo}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.demoToggleText}>{demoOn ? 'ON' : 'OFF'}</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Artist card bottom sheet */}
      <ArtistCard
        act={detailAct}
        savedActIds={savedActIds}
        onToggleSaved={toggleSaved}
        onFindOnMap={findOnMap}
        onClose={() => setDetailAct(null)}
      />
    </View>
  );
}

// ─── Timeline view ────────────────────────────────────────────────────────────

function TimelineView({ acts, savedActIds, day, onDetail, onToggleSaved }) {
  if (acts.length === 0) {
    return (
      <Text style={emptyStyle.text}>No acts scheduled for {day === 'Fri' ? 'Friday' : 'Saturday'}.</Text>
    );
  }
  return (
    <ScheduleTimeline
      acts={acts}
      savedActIds={savedActIds}
      onDetail={onDetail}
      onToggleSaved={onToggleSaved}
    />
  );
}

// ─── Saved view ───────────────────────────────────────────────────────────────

function SavedView({ acts, day, onDetail, onToggleSaved, onGoDiscover }) {
  if (acts.length === 0) {
    return (
      <View style={savedSt.empty}>
        <Text style={savedSt.emptyText}>
          No saved {day === 'Fri' ? 'Friday' : 'Saturday'} acts yet.
        </Text>
        <TouchableOpacity style={savedSt.discoverBtn} onPress={onGoDiscover}>
          <Text style={savedSt.discoverBtnText}>Go to Discover</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View>
      {acts.map((act, i) => {
        // Overlap: check against other saved acts on the same day
        const overlaps = acts.some(
          other =>
            other.id !== act.id &&
            toMins(other.start_time) < toMins(act.end_time) &&
            toMins(other.end_time)   > toMins(act.start_time)
        );
        return (
          <View key={act.id} style={savedSt.card}>
            <View style={savedSt.cardTop}>
              <InitialsTile name={act.act_name} genre={act.genre} size={44} />
              <View style={savedSt.cardMeta}>
                <TouchableOpacity onPress={() => onDetail(act)}>
                  <Text style={savedSt.name}>{act.act_name}</Text>
                </TouchableOpacity>
                <View style={savedSt.chipRow}>
                  <GenreChip genre={act.genre} />
                  {overlaps && (
                    <View style={savedSt.overlapChip}>
                      <Text style={savedSt.overlapChipText}>Overlap</Text>
                    </View>
                  )}
                </View>
                <Text style={savedSt.meta}>
                  Stage {act.stage_id} · {act.day} · {fmt(act.start_time)} – {fmt(act.end_time)}
                </Text>
                {act.bio ? (
                  <Text style={savedSt.bio} numberOfLines={1}>{act.bio}</Text>
                ) : null}
              </View>
              <TouchableOpacity
                onPress={() => onToggleSaved(act.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={savedSt.heart}>♥</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const savedSt = StyleSheet.create({
  empty:          { paddingVertical: 32, alignItems: 'center', gap: 16 },
  emptyText:      { ...bodyStyle, color: Colors.muted, textAlign: 'center' },
  discoverBtn:    { backgroundColor: Colors.ink, borderRadius: 100, paddingHorizontal: 24, paddingVertical: 14, minHeight: 48 },
  discoverBtnText: { fontFamily: Fonts.bodyBold, fontSize: 15, color: Colors.white },
  card:           { ...cardStyle, marginVertical: 4 },
  cardTop:        { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  cardMeta:       { flex: 1, gap: 4 },
  name:           { fontFamily: Fonts.display, fontSize: 16, color: Colors.ink },
  chipRow:        { flexDirection: 'row', gap: 6, alignItems: 'center', flexWrap: 'wrap' },
  overlapChip:    { backgroundColor: Colors.paleYellow, borderWidth: 1.5, borderColor: Colors.ink, borderRadius: 100, paddingHorizontal: 8, paddingVertical: 3 },
  overlapChipText: { fontFamily: Fonts.detail, fontSize: 13 },
  meta:           { fontFamily: Fonts.detail, fontSize: 13, color: Colors.muted },
  bio:            { ...bodyStyle, fontSize: 15, color: Colors.muted },
  heart:          { fontSize: 22, color: Colors.pink, minWidth: 36, textAlign: 'center' },
});

// ─── All acts view ────────────────────────────────────────────────────────────

function AllActsView({ acts, savedActIds, onDetail, onToggleSaved }) {
  if (acts.length === 0) {
    return <Text style={emptyStyle.text}>No acts for this day.</Text>;
  }
  return (
    <View>
      {acts.map(act => {
        const isSaved = savedActIds.includes(act.id);
        return (
          <View key={act.id} style={allSt.row}>
            <InitialsTile name={act.act_name} genre={act.genre} size={40} />
            <View style={allSt.info}>
              <TouchableOpacity onPress={() => onDetail(act)}>
                <Text style={allSt.name}>{act.act_name}</Text>
              </TouchableOpacity>
              <View style={allSt.chipRow}>
                <GenreChip genre={act.genre} />
              </View>
              <Text style={allSt.meta}>
                Stage {act.stage_id} · {fmt(act.start_time)}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => onToggleSaved(act.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={[allSt.heart, isSaved && allSt.heartFilled]}>
                {isSaved ? '♥' : '♡'}
              </Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}

const allSt = StyleSheet.create({
  row:        { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  info:       { flex: 1, gap: 4 },
  name:       { fontFamily: Fonts.display, fontSize: 16, color: Colors.ink },
  chipRow:    { flexDirection: 'row', gap: 6 },
  meta:       { fontFamily: Fonts.detail, fontSize: 13, color: Colors.muted },
  heart:      { fontSize: 24, color: Colors.muted, minWidth: 36, textAlign: 'center' },
  heartFilled: { color: Colors.pink },
});

const emptyStyle = StyleSheet.create({
  text: { ...bodyStyle, color: Colors.muted, marginTop: 8 },
});

// ─── Screen styles ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: Colors.background },
  content:      { paddingHorizontal: 20, paddingBottom: 48 },

  // Header
  headerRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, marginBottom: 16 },
  heading:      { ...headingStyle, fontSize: 38 },
  headerRight:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  samplePill:   { backgroundColor: Colors.paleYellow, borderWidth: 1.5, borderColor: Colors.ink, borderRadius: 100, paddingHorizontal: 10, paddingVertical: 5 },
  samplePillText: { fontFamily: Fonts.detail, fontSize: 13 },
  navBtn:       { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.yellow, borderWidth: 1.5, borderColor: Colors.ink, alignItems: 'center', justifyContent: 'center' },

  // Day tabs
  dayTabRow:    { flexDirection: 'row', gap: 24, marginBottom: 16 },
  dayTab:       { alignItems: 'center', paddingBottom: 4 },
  dayTabText:   { fontFamily: Fonts.display, fontSize: 24, color: Colors.muted },
  dayTabTextActive: { fontSize: 28, color: Colors.ink },
  dayUnderline: { height: 3, width: '100%', backgroundColor: Colors.pink, borderRadius: 2, marginTop: 2 },

  // Demo location row
  demoRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 32, paddingTop: 16, borderTopWidth: 1, borderTopColor: Colors.divider },
  demoLabel:    { fontFamily: Fonts.detail, fontSize: 14, color: Colors.muted },
  demoToggle:   { borderWidth: 1.5, borderColor: Colors.ink, borderRadius: 100, paddingHorizontal: 14, paddingVertical: 6, backgroundColor: Colors.white },
  demoToggleOn: { backgroundColor: Colors.yellow },
  demoToggleText: { fontFamily: Fonts.bodyBold, fontSize: 14, color: Colors.ink },
});
