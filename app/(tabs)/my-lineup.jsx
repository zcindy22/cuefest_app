/**
 * app/(tabs)/my-lineup.jsx
 *
 * Discover screen — Prompt 10.
 * Two tabs: Discover (glow bubbles → subgenres → act card with Like/Skip)
 *           Matches  (scored ranking with why lines)
 *
 * All acts are invented sample acts. Everything about taste stays on this device.
 * Saturday is the sample festival day.
 */

import { useCallback, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getDb } from '../../db/database';
import ArtistCard from '../../components/ArtistCard';
import {
  Colors,
  Fonts,
  bodyStyle,
  cardStyle,
  headingStyle,
} from '../../theme/theme';

// ─── Genre → theme color ──────────────────────────────────────────────────────

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

const GENRE_DEEP = {
  'Dance':   Colors.deepYellow,
  'Techno':  Colors.deepBlue,
  'Bass':    Colors.deepPeach,
  'Latin':   Colors.deepPink,
  'Indie':   Colors.deepLilac,
  'Alt R&B': Colors.deepPink,
  'Electro': Colors.deepBlue,
  'Hip hop': Colors.deepYellow,
};

function genreColor(genre) { return GENRE_COLORS[genre] ?? Colors.yellow; }
function genreDeep(genre)  { return GENRE_DEEP[genre]  ?? Colors.deepYellow; }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function initials(name) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

// ─── InitialsTile ─────────────────────────────────────────────────────────────

function InitialsTile({ name, genre, size = 44 }) {
  const bg = genreColor(genre);
  return (
    <View style={[tileStyles.tile, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Text style={[tileStyles.text, { fontSize: Math.max(12, size * 0.33) }]}>{initials(name)}</Text>
    </View>
  );
}
const tileStyles = StyleSheet.create({
  tile: { alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: Colors.ink },
  text: { fontFamily: Fonts.bodyBold, color: Colors.ink },
});

// ─── GenreChip ────────────────────────────────────────────────────────────────

function GenreChip({ genre }) {
  return (
    <View style={[chipStyles.chip, { backgroundColor: genreColor(genre) }]}>
      <Text style={chipStyles.text}>{genre}</Text>
    </View>
  );
}
function SubgenreChip({ subgenre, genre }) {
  return (
    <View style={[chipStyles.chip, { backgroundColor: Colors.white }]}>
      <Text style={chipStyles.text}>{subgenre}</Text>
    </View>
  );
}
const chipStyles = StyleSheet.create({
  chip: { borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1.5, borderColor: Colors.ink, alignSelf: 'flex-start' },
  text: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.ink },
});

// ─── SegmentedControl ─────────────────────────────────────────────────────────

function SegmentedControl({ tabs, active, onSelect }) {
  return (
    <View style={segStyles.row}>
      {tabs.map(t => (
        <TouchableOpacity
          key={t}
          style={[segStyles.tab, active === t && segStyles.tabActive]}
          onPress={() => onSelect(t)}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
        >
          <Text style={[segStyles.text, active === t && segStyles.textActive]}>{t}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
const segStyles = StyleSheet.create({
  row: { flexDirection: 'row', backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.ink, borderRadius: 100, marginBottom: 20, overflow: 'hidden', minHeight: 48 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  tabActive: { backgroundColor: Colors.ink, borderRadius: 100, margin: 3 },
  text: { fontFamily: Fonts.bodyBold, fontSize: 14, color: Colors.ink },
  textActive: { color: Colors.white },
});

// ─── GlowBubble (SVG radial gradient) ────────────────────────────────────────

function GlowBubble({ label, genre, size, selected, onPress, dotLabel }) {
  const color   = genreColor(genre || label);
  const deep    = genreDeep(genre || label);
  const id      = `rg-${(genre || label).replace(/[^a-z]/gi, '')}`;
  const ringR   = size * 0.4; // ring at 80% of radius
  const tapSize = Math.max(56, size);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{ width: tapSize, height: tapSize, alignItems: 'center', justifyContent: 'center' }}
      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
      activeOpacity={0.8}
    >
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <Stop offset="0%"   stopColor={color} stopOpacity="0.95" />
            <Stop offset="50%"  stopColor={color} stopOpacity="0.65" />
            <Stop offset="100%" stopColor={color} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        {/* Glow fill */}
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${id})`} />
        {/* Deep-shade ring */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={ringR}
          fill="none"
          stroke={deep}
          strokeWidth={selected ? 2.5 : 1.5}
          strokeOpacity={0.85}
        />
      </Svg>

      {/* Label overlay */}
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        <Text style={[bubStyles.label, selected && bubStyles.labelBold]} numberOfLines={2}>
          {label}
        </Text>
        {dotLabel && <Text style={bubStyles.dotLabel}>{dotLabel}</Text>}
        {selected && <View style={bubStyles.dot} />}
      </View>
    </TouchableOpacity>
  );
}

const bubStyles = StyleSheet.create({
  label:      { fontFamily: Fonts.detailBold, fontSize: 14, color: Colors.ink, textAlign: 'center', paddingHorizontal: 4 },
  labelBold:  { fontFamily: Fonts.detailBold, fontWeight: '700' },
  dotLabel:   { fontFamily: Fonts.detail, fontSize: 13, color: Colors.ink, marginTop: 1 },
  dot:        { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.ink, marginTop: 3 },
});

// ─── Main component ───────────────────────────────────────────────────────────

export default function MyLineupScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();

  const [tab, setTab] = useState('Discover');

  // DB state
  const [acts, setActs]               = useState([]);
  const [tastePicks, setTastePicks]   = useState([]);
  const [swipeData, setSwipeData]     = useState([]);
  const [savedActIds, setSavedActIds] = useState([]);

  // Discover bubble state
  const [bubbleView, setBubbleView]   = useState('genres');   // 'genres' | 'subgenres'
  const [activeGenre, setActiveGenre] = useState(null);
  // Genre bloom animation
  const bloomAnim = useRef(new Animated.Value(0)).current;

  // Swipe card state (embedded in Discover)
  const [swipeIndex, setSwipeIndex]   = useState(0);
  const swipeDeckRef = useRef([]);
  const swipeAnimRef = useRef(new Animated.ValueXY()).current;

  // Artist detail
  const [detailAct, setDetailAct] = useState(null);

  // ── Build swipe deck ────────────────────────────────────────────────────────

  function buildSwipeDeck(allActs, picks, swipedIds) {
    const unSwiped = id => !swipedIds.includes(id);
    const inPick   = allActs.filter(a => picks.includes(a.subgenre) && unSwiped(a.id));
    const others   = allActs.filter(a => !picks.includes(a.subgenre) && unSwiped(a.id));
    return [...inPick, ...others].slice(0, 8);
  }

  // ── Load from DB ────────────────────────────────────────────────────────────

  function loadAll() {
    const db = getDb();
    const allActs = db.getAllSync(
      'SELECT id, stage_id, act_name, start_time, end_time, genre, subgenre, bio, day FROM sets ORDER BY day, stage_id, start_time'
    );
    const picks    = db.getAllSync('SELECT subgenre FROM taste_picks').map(r => r.subgenre);
    const swiped   = db.getAllSync('SELECT act_id, action FROM swipes');
    const saved    = db.getAllSync('SELECT act_id FROM saved_acts').map(r => r.act_id);

    setActs(allActs);
    setTastePicks(picks);
    setSwipeData(swiped);
    setSavedActIds(saved);
    setSwipeIndex(0);
    swipeDeckRef.current = buildSwipeDeck(allActs, picks, swiped.map(s => s.act_id));
  }

  useFocusEffect(useCallback(() => { loadAll(); }, [])); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Genre / subgenre data ────────────────────────────────────────────────────

  function getGenres() {
    const map = {};
    for (const a of acts) {
      map[a.genre] = (map[a.genre] || 0) + 1;
    }
    return Object.entries(map).map(([genre, count]) => ({ genre, count }));
  }

  function getSubgenres(genre) {
    const map = {};
    for (const a of acts.filter(a => a.genre === genre)) {
      map[a.subgenre] = (map[a.subgenre] || 0) + 1;
    }
    return Object.entries(map).map(([subgenre, count]) => ({ subgenre, count }));
  }

  function togglePick(subgenre) {
    const db = getDb();
    if (tastePicks.includes(subgenre)) {
      db.runSync('DELETE FROM taste_picks WHERE subgenre = ?', [subgenre]);
      const next = tastePicks.filter(s => s !== subgenre);
      setTastePicks(next);
      swipeDeckRef.current = buildSwipeDeck(acts, next, swipeData.map(s => s.act_id));
    } else {
      db.runSync('INSERT OR IGNORE INTO taste_picks (subgenre) VALUES (?)', [subgenre]);
      const next = [...tastePicks, subgenre];
      setTastePicks(next);
      swipeDeckRef.current = buildSwipeDeck(acts, next, swipeData.map(s => s.act_id));
    }
    setSwipeIndex(0);
    swipeAnimRef.setValue({ x: 0, y: 0 });
  }

  function clearTaste() {
    Alert.alert('Clear my taste', 'This clears your genre picks and swipes. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          const db = getDb();
          db.execSync('DELETE FROM taste_picks; DELETE FROM swipes; DELETE FROM saved_acts;');
          loadAll();
          setBubbleView('genres');
          setActiveGenre(null);
        },
      },
    ]);
  }

  function openGenre(genre) {
    setActiveGenre(genre);
    bloomAnim.setValue(0);
    Animated.spring(bloomAnim, { toValue: 1, useNativeDriver: true, friction: 6 }).start();
    setBubbleView('subgenres');
  }

  function backToGenres() {
    setBubbleView('genres');
    setActiveGenre(null);
  }

  // ── Swipe card helpers ───────────────────────────────────────────────────────

  function handleSwipe(actId, action) {
    const db = getDb();
    db.runSync('INSERT OR IGNORE INTO swipes (act_id, action) VALUES (?, ?)', [actId, action]);
    if (action === 'like') {
      db.runSync('INSERT OR IGNORE INTO saved_acts (act_id) VALUES (?)', [actId]);
      setSavedActIds(ids => [...ids, actId]);
    }
    setSwipeData(d => [...d, { act_id: actId, action }]);
    setSwipeIndex(i => i + 1);
    swipeAnimRef.setValue({ x: 0, y: 0 });
  }

  // ── Matches helpers ─────────────────────────────────────────────────────────

  function getPickedGenres() {
    const genres = new Set();
    for (const sg of tastePicks) {
      const act = acts.find(a => a.subgenre === sg);
      if (act) genres.add(act.genre);
    }
    return genres;
  }

  function scoreAct(act) {
    const likedSubs   = swipeData.filter(s => s.action === 'like').map(s => acts.find(a => a.id === s.act_id)?.subgenre).filter(Boolean);
    const skippedSubs = swipeData.filter(s => s.action === 'skip').map(s => acts.find(a => a.id === s.act_id)?.subgenre).filter(Boolean);
    let score = 0;
    const reasons = [];

    if (tastePicks.includes(act.subgenre)) {
      score += 3;
      reasons.push(`You picked ${act.genre}, ${act.subgenre}`);
    } else if (getPickedGenres().has(act.genre)) {
      score += 1;
      reasons.push(`You picked ${act.genre}`);
    }
    if (likedSubs.includes(act.subgenre)) {
      score += 2;
      if (!reasons.some(r => r.includes(act.subgenre))) reasons.push(`Liked a ${act.subgenre} act`);
    }
    if (skippedSubs.includes(act.subgenre)) score -= 1;

    return { score, why: reasons.join(' · ') || 'Explore something new' };
  }

  function getMatches() {
    return acts.map(a => ({ ...a, ...scoreAct(a) })).sort((a, b) => b.score - a.score);
  }

  // ── toggleSaved ──────────────────────────────────────────────────────────────

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

  // ── Find on map ──────────────────────────────────────────────────────────────

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

  // ── Render ───────────────────────────────────────────────────────────────────

  const deck    = swipeDeckRef.current;
  const current = deck[swipeIndex];

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.content}>

        <View style={styles.headerRow}>
          <Text style={styles.heading}>Discover</Text>
          <View style={styles.samplePill}>
            <Text style={styles.samplePillText}>Sample day</Text>
          </View>
        </View>

        <SegmentedControl tabs={['Discover', 'Matches']} active={tab} onSelect={setTab} />

        {/* ── DISCOVER TAB ── */}
        {tab === 'Discover' && (
          <DiscoverTab
            acts={acts}
            tastePicks={tastePicks}
            bubbleView={bubbleView}
            activeGenre={activeGenre}
            getGenres={getGenres}
            getSubgenres={getSubgenres}
            togglePick={togglePick}
            onOpenGenre={openGenre}
            onBack={backToGenres}
            onSeeMatches={() => setTab('Matches')}
            clearTaste={clearTaste}
            bloomAnim={bloomAnim}
            // swipe card
            deck={deck}
            swipeIndex={swipeIndex}
            swipeAnim={swipeAnimRef}
            current={current}
            onSwipe={handleSwipe}
            onDetail={act => setDetailAct(act)}
            savedActIds={savedActIds}
          />
        )}

        {/* ── MATCHES TAB ── */}
        {tab === 'Matches' && (
          <MatchesTab
            matches={getMatches()}
            savedActIds={savedActIds}
            onToggleSaved={toggleSaved}
            onDetail={act => setDetailAct(act)}
          />
        )}

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

// ─── Discover tab ─────────────────────────────────────────────────────────────

function DiscoverTab({
  acts, tastePicks, bubbleView, activeGenre,
  getGenres, getSubgenres, togglePick,
  onOpenGenre, onBack, onSeeMatches, clearTaste, bloomAnim,
  deck, swipeIndex, swipeAnim, current, onSwipe, onDetail, savedActIds,
}) {
  const genres    = getGenres();
  const maxCount  = Math.max(...genres.map(g => g.count), 1);
  const subgenres = activeGenre ? getSubgenres(activeGenre) : [];
  const pickedGenres = new Set(
    tastePicks.map(sg => acts.find(a => a.subgenre === sg)?.genre).filter(Boolean)
  );

  function bubbleSize(count) {
    return Math.max(72, Math.round(72 + (count / maxCount) * 40));
  }

  // Show swipe card below bubbles once at least one subgenre is picked
  const showCard = tastePicks.length > 0 && current;

  return (
    <View>
      {/* Bubble area */}
      {bubbleView === 'genres' && (
        <View>
          <Text style={discStyles.sectionLabel}>Tap a genre to explore</Text>
          <View style={discStyles.bubbleWrap}>
            {genres.map(({ genre, count }) => {
              const sz = bubbleSize(count);
              return (
                <GlowBubble
                  key={genre}
                  label={genre}
                  genre={genre}
                  size={sz}
                  selected={pickedGenres.has(genre)}
                  onPress={() => onOpenGenre(genre)}
                />
              );
            })}
          </View>

          {tastePicks.length > 0 && (
            <View style={discStyles.picksRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
                {tastePicks.map(sg => (
                  <View key={sg} style={discStyles.pickChip}>
                    <Text style={discStyles.pickChipText}>{sg}</Text>
                  </View>
                ))}
              </ScrollView>
              <TouchableOpacity style={discStyles.matchBtn} onPress={onSeeMatches}>
                <Text style={discStyles.matchBtnText}>See my matches</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={discStyles.clearBtn} onPress={clearTaste}>
            <Text style={discStyles.clearBtnText}>Clear my taste</Text>
          </TouchableOpacity>
        </View>
      )}

      {bubbleView === 'subgenres' && activeGenre && (
        <Animated.View style={{ transform: [{ scale: bloomAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }], opacity: bloomAnim }}>
          <TouchableOpacity style={discStyles.backBtn} onPress={onBack}>
            <Text style={discStyles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={discStyles.sectionLabel}>{activeGenre}</Text>
          <View style={discStyles.bubbleWrap}>
            {subgenres.map(({ subgenre, count }) => {
              const picked = tastePicks.includes(subgenre);
              const sz = Math.max(64, Math.round(64 + (count / 4) * 28));
              return (
                <GlowBubble
                  key={subgenre}
                  label={subgenre}
                  genre={activeGenre}
                  size={sz}
                  selected={picked}
                  dotLabel={`${count}`}
                  onPress={() => togglePick(subgenre)}
                />
              );
            })}
          </View>
          {tastePicks.length > 0 && (
            <TouchableOpacity style={discStyles.matchBtn} onPress={onSeeMatches}>
              <Text style={discStyles.matchBtnText}>See my matches</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      )}

      {/* Act card below bubbles */}
      {showCard && (
        <ActCard
          act={current}
          totalInDeck={deck.length}
          currentIndex={swipeIndex}
          savedActIds={savedActIds}
          onSwipe={onSwipe}
          onDetail={onDetail}
        />
      )}

      {tastePicks.length > 0 && !current && (
        <View style={discStyles.allSwipedNote}>
          <Text style={discStyles.allSwipedText}>All caught up! Check your matches.</Text>
          <TouchableOpacity style={discStyles.matchBtn} onPress={onSeeMatches}>
            <Text style={discStyles.matchBtnText}>See my matches</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const discStyles = StyleSheet.create({
  sectionLabel:   { fontFamily: Fonts.detail, fontSize: 14, color: Colors.muted, marginBottom: 14 },
  bubbleWrap:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  backBtn:        { paddingVertical: 8, marginBottom: 2 },
  backText:       { fontFamily: Fonts.bodyBold, fontSize: 15, color: Colors.ink },
  picksRow:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  pickChip:       { borderRadius: 100, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1.5, borderColor: Colors.ink, backgroundColor: Colors.white, marginRight: 6 },
  pickChipText:   { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.ink },
  matchBtn:       { backgroundColor: Colors.ink, borderRadius: 100, paddingHorizontal: 16, paddingVertical: 10, alignSelf: 'flex-start' },
  matchBtnText:   { fontFamily: Fonts.bodyBold, fontSize: 14, color: Colors.white },
  clearBtn:       { alignSelf: 'flex-start', borderWidth: 1.5, borderColor: Colors.ink, borderRadius: 100, paddingHorizontal: 12, paddingVertical: 8, marginTop: 8, marginBottom: 8 },
  clearBtnText:   { fontFamily: Fonts.bodyBold, fontSize: 14, color: Colors.ink },
  allSwipedNote:  { gap: 12, paddingVertical: 20, alignItems: 'flex-start' },
  allSwipedText:  { ...bodyStyle, color: Colors.muted },
});

// ─── Act card (embedded in Discover, below bubbles) ───────────────────────────

function ActCard({ act, totalInDeck, currentIndex, savedActIds, onSwipe, onDetail }) {
  if (!act) return null;
  const isSaved = savedActIds.includes(act.id);

  return (
    <View style={actCardStyles.wrapper}>
      <Text style={actCardStyles.counter}>
        {currentIndex + 1} of {totalInDeck}
      </Text>

      <View style={actCardStyles.card}>
        <View style={actCardStyles.top}>
          <InitialsTile name={act.act_name} genre={act.genre} size={52} />
          <View style={actCardStyles.meta}>
            <TouchableOpacity onPress={() => onDetail(act)}>
              <Text style={actCardStyles.name}>{act.act_name}</Text>
            </TouchableOpacity>
            <View style={actCardStyles.chipRow}>
              <GenreChip genre={act.genre} />
              <SubgenreChip subgenre={act.subgenre} genre={act.genre} />
            </View>
            <Text style={actCardStyles.sub}>Stage {act.stage_id} · {act.day} · {fmt(act.start_time)}</Text>
          </View>
        </View>

        <Text style={actCardStyles.bio} numberOfLines={2}>{act.bio}</Text>
        <Text style={actCardStyles.sample}>Sample act — invented for this demo</Text>

        {act.day === 'Fri' && (
          <View style={actCardStyles.friNote}>
            <Text style={actCardStyles.friNoteText}>Plan covers Saturday in this demo.</Text>
          </View>
        )}
      </View>

      <View style={actCardStyles.buttons}>
        <TouchableOpacity style={actCardStyles.skipBtn} onPress={() => onSwipe(act.id, 'skip')}>
          <Text style={actCardStyles.skipBtnText}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity style={actCardStyles.likeBtn} onPress={() => onSwipe(act.id, 'like')}>
          <Text style={actCardStyles.likeBtnText}>Like ♥</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const actCardStyles = StyleSheet.create({
  wrapper:      { marginTop: 20 },
  counter:      { fontFamily: Fonts.detail, fontSize: 13, color: Colors.muted, marginBottom: 8 },
  card:         { ...cardStyle, padding: 16, marginVertical: 0, marginBottom: 14 },
  top:          { flexDirection: 'row', gap: 12, marginBottom: 10, alignItems: 'flex-start' },
  meta:         { flex: 1, gap: 5 },
  name:         { fontFamily: Fonts.display, fontSize: 17, color: Colors.ink },
  chipRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  sub:          { fontFamily: Fonts.detail, fontSize: 13, color: Colors.muted },
  bio:          { ...bodyStyle, fontSize: 15, lineHeight: 21, marginBottom: 6 },
  sample:       { fontFamily: Fonts.detail, fontSize: 13, color: Colors.muted },
  friNote:      { backgroundColor: Colors.paleYellow, borderWidth: 1.5, borderColor: Colors.ink, borderRadius: 10, padding: 8, marginTop: 8 },
  friNoteText:  { fontFamily: Fonts.detail, fontSize: 13 },
  buttons:      { flexDirection: 'row', gap: 12 },
  skipBtn:      { flex: 1, backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.ink, borderRadius: 100, minHeight: 52, alignItems: 'center', justifyContent: 'center' },
  skipBtnText:  { fontFamily: Fonts.bodyBold, fontSize: 15, color: Colors.ink },
  likeBtn:      { flex: 1, backgroundColor: Colors.yellow, borderWidth: 1.5, borderColor: Colors.ink, borderRadius: 100, minHeight: 52, alignItems: 'center', justifyContent: 'center' },
  likeBtnText:  { fontFamily: Fonts.bodyBold, fontSize: 15, color: Colors.ink },
});

// ─── Matches tab ──────────────────────────────────────────────────────────────

function MatchesTab({ matches, savedActIds, onToggleSaved, onDetail }) {
  return (
    <View>
      <View style={matchStyles.disclaimer}>
        <Text style={matchStyles.disclaimerText}>Simple rules, not AI</Text>
      </View>

      {matches.length === 0 && (
        <Text style={matchStyles.empty}>Pick some genres in Discover to get matches.</Text>
      )}

      {matches.map(act => {
        const isSaved = savedActIds.includes(act.id);
        return (
          <View key={act.id} style={matchStyles.row}>
            <InitialsTile name={act.act_name} genre={act.genre} size={40} />
            <View style={matchStyles.info}>
              <TouchableOpacity onPress={() => onDetail(act)}>
                <Text style={matchStyles.name}>{act.act_name}</Text>
              </TouchableOpacity>
              <View style={matchStyles.chipRow}>
                <GenreChip genre={act.genre} />
                {act.score > 0 && (
                  <View style={matchStyles.scoreBadge}>
                    <Text style={matchStyles.scoreText}>+{act.score}</Text>
                  </View>
                )}
              </View>
              <Text style={matchStyles.meta}>Stage {act.stage_id} · {act.day} · {fmt(act.start_time)}</Text>
              <Text style={matchStyles.why}>{act.why}</Text>
            </View>
            <TouchableOpacity onPress={() => onToggleSaved(act.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={[matchStyles.heart, isSaved && matchStyles.heartFilled]}>
                {isSaved ? '♥' : '♡'}
              </Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}

const matchStyles = StyleSheet.create({
  disclaimer:   { backgroundColor: Colors.paleYellow, alignSelf: 'flex-start', borderWidth: 1.5, borderColor: Colors.ink, borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 14 },
  disclaimerText: { fontFamily: Fonts.detail, fontSize: 13 },
  empty:        { ...bodyStyle, color: Colors.muted, marginTop: 8 },
  row:          { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  info:         { flex: 1, gap: 4 },
  name:         { fontFamily: Fonts.display, fontSize: 16, color: Colors.ink },
  chipRow:      { flexDirection: 'row', alignItems: 'center', gap: 6 },
  scoreBadge:   { backgroundColor: Colors.savedBlue, borderRadius: 100, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1.5, borderColor: Colors.ink },
  scoreText:    { fontFamily: Fonts.detail, fontSize: 13 },
  meta:         { fontFamily: Fonts.detail, fontSize: 13, color: Colors.muted },
  why:          { fontFamily: Fonts.detail, fontSize: 13, color: Colors.muted },
  heart:        { fontSize: 24, color: Colors.muted, minWidth: 36, textAlign: 'center' },
  heartFilled:  { color: Colors.pink },
});

// ─── Screen styles ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen:   { flex: 1, backgroundColor: Colors.background },
  content:  { paddingHorizontal: 20, paddingBottom: 48 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, marginTop: 12 },
  heading:  { ...headingStyle, fontSize: 38 },
  samplePill: { backgroundColor: Colors.paleYellow, borderWidth: 1.5, borderColor: Colors.ink, borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4 },
  samplePillText: { fontFamily: Fonts.detail, fontSize: 13 },
});
