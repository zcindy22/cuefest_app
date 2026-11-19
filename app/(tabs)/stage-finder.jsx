/**
 * Stage Finder screen — Prompt 9
 *
 * - Full illustrated SVG map from cue-festival-map-v3.svg geometry
 * - 13 tappable numbered stage pins
 * - Amenity icons with toggle chips + Find nearest
 * - Tap a pin: stage card with Saturday acts, walking route, Add to plan
 * - Pick start: defaults to entrance, tap any pin to change
 * - ArtistCard for act detail
 */

import { useCallback, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, {
  Circle,
  G,
  Line,
  Path,
  Polyline,
  Rect,
  Text as SvgText,
} from 'react-native-svg';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getDb } from '../../db/database';
import { calcRoute, findNearestAmenity, getPosition, ENTRANCE, AMENITIES } from '../../lib/routing';
import ArtistCard from '../../components/ArtistCard';
import {
  Colors,
  Fonts,
  headingStyle,
  labelStyle,
  bodyStyle,
  cardStyle,
  secondaryButtonStyle,
  secondaryButtonTextStyle,
} from '../../theme/theme';

// ─── Map constants ────────────────────────────────────────────────────────
const MAP_W = 800;
const MAP_H = 900;

const STAGE_PINS = [
  { id: 1,  x: 435, y: 560 },
  { id: 2,  x: 200, y: 640 },
  { id: 3,  x: 150, y: 520 },
  { id: 4,  x: 230, y: 460 },
  { id: 5,  x:  85, y: 500 },
  { id: 6,  x: 220, y: 260 },
  { id: 7,  x: 420, y: 130 },
  { id: 8,  x: 400, y: 220 },
  { id: 9,  x: 480, y: 280 },
  { id: 10, x: 560, y: 230 },
  { id: 11, x: 590, y: 140 },
  { id: 12, x: 650, y: 520 },
  { id: 13, x: 680, y: 640 },
];

const AMENITY_TYPES = [
  { key: 'first_aid',  label: 'First aid',         color: '#E5484D' },
  { key: 'water',      label: 'Water',              color: '#3E8BFF' },
  { key: 'restroom',   label: 'Restrooms',          color: '#6E6EF0' },
  { key: 'food',       label: 'Food',               color: '#FF8A3D' },
  { key: 'bar',        label: 'Cocktail bar',       color: '#C85BD9' },
  { key: 'merch',      label: 'Merch',              color: '#6E6EF0' },
  { key: 'info',       label: 'Info',               color: '#3E8BFF' },
  { key: 'lost_found', label: 'Lost and found',     color: '#2FB67C' },
  { key: 'lockers',    label: 'Lockers',            color: '#FF5FA8' },
  { key: 'accessible', label: 'Accessible viewing', color: '#2B6BD9' },
  { key: 'box_office', label: 'Box office',         color: '#6B6B78' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────

function fmt(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function polylineStr(pts) {
  return pts.map(([x, y]) => `${x},${y}`).join(' ');
}

function amenityColor(type) {
  return AMENITY_TYPES.find(t => t.key === type)?.color ?? '#888';
}

// ─── Amenity icon shapes (SVG paths/elements, centered at 0,0) ────────────
function AmenityIcon({ type, fill = '#fff' }) {
  switch (type) {
    case 'first_aid':
      return (
        <>
          <Rect x={-2.5} y={-7} width={5} height={14} fill={fill} />
          <Rect x={-7} y={-2.5} width={14} height={5} fill={fill} />
        </>
      );
    case 'food':
      return (
        <>
          <Path d="M-5 -7 V 0 M-2.5 -7 V 0 M0 -7 V 0 M-5 0 H 0 M-2.5 0 V 7" stroke={fill} strokeWidth={1.6} fill="none" />
          <Path d="M4 -7 C 8 -4 8 1 4 2 V 7" stroke={fill} strokeWidth={1.8} fill="none" />
        </>
      );
    case 'restroom':
      return <SvgText y={4} fontSize={9} fontWeight="700" textAnchor="middle" fill={fill}>WC</SvgText>;
    case 'water':
      return <Path d="M0 -8 C 6 -1 6 6 0 7 C -6 6 -6 -1 0 -8 Z" fill={fill} />;
    case 'bar':
      return (
        <>
          <Path d="M-6 -6 H 6 L 0 1 Z" fill={fill} />
          <Rect x={-0.8} y={1} width={1.6} height={6} fill={fill} />
          <Rect x={-4} y={6} width={8} height={1.6} fill={fill} />
        </>
      );
    case 'merch':
      return <Path d="M-4 -7 L -8 -3 L -5.5 0 L -4 -1 V 7 H 4 V -1 L 5.5 0 L 8 -3 L 4 -7 C 2 -4 -2 -4 -4 -7 Z" fill={fill} />;
    case 'info':
      return <SvgText y={5} fontSize={14} fontWeight="700" textAnchor="middle" fill={fill}>i</SvgText>;
    case 'lost_found':
      return <SvgText y={5} fontSize={14} fontWeight="700" textAnchor="middle" fill={fill}>?</SvgText>;
    case 'lockers':
      return (
        <>
          <Rect x={-6} y={-7} width={12} height={14} rx={1.5} fill="none" stroke={fill} strokeWidth={1.8} />
          <Circle cx={3} cy={0} r={1.4} fill={fill} />
        </>
      );
    case 'accessible':
      return (
        <>
          <Circle cx={-1} cy={-5} r={1.8} fill={fill} />
          <Path d="M-1 -2 V 3 H 4 M-1 0 H 3" stroke={fill} strokeWidth={1.6} fill="none" />
          <Circle cx={-2} cy={4} r={4} fill="none" stroke={fill} strokeWidth={1.5} />
        </>
      );
    case 'box_office':
      return (
        <>
          <Rect x={-8} y={-5} width={16} height={10} rx={1.5} fill={fill} />
          <Circle cx={0} cy={0} r={2} fill={amenityColor('box_office')} />
        </>
      );
    default:
      return null;
  }
}

// ─── Component ────────────────────────────────────────────────────────────

export default function StageFinderScreen() {
  const insets = useSafeAreaInsets();
  const [stages, setStages]           = useState([]);
  const [sets, setSets]               = useState([]);        // Saturday sets only
  const [planItems, setPlanItems]     = useState([]);
  const [savedActIds, setSavedActIds] = useState([]);

  const [selectedPin, setSelectedPin] = useState(null);
  const [selectedSetIdx, setSelectedSetIdx] = useState(0);
  const [startId, setStartId]         = useState('entrance');
  const [pickingStart, setPickingStart] = useState(false);

  const [route, setRoute]             = useState(null);
  const [nearestResult, setNearestResult] = useState(null); // { amenity, route, type }

  // Which amenity types are hidden on the map
  const [hiddenTypes, setHiddenTypes] = useState({});
  // Highlighted amenity index (after Find nearest)
  const [highlightedAmenity, setHighlightedAmenity] = useState(null);

  // Artist card
  const [openAct, setOpenAct] = useState(null);

  // Load DB on focus
  useFocusEffect(
    useCallback(() => {
      const db = getDb();
      setStages(db.getAllSync('SELECT id, name, x, y FROM stages ORDER BY id'));
      // Saturday acts only for the stage card and plan
      setSets(db.getAllSync(
        "SELECT id, stage_id, act_name, start_time, end_time, genre, subgenre, bio, day FROM sets WHERE day = 'Sat' ORDER BY stage_id, start_time"
      ));
      setPlanItems(db.getAllSync('SELECT id, set_id, start_time, end_time FROM plan_items'));
      setSavedActIds(db.getAllSync('SELECT act_id FROM saved_acts').map(r => r.act_id));
    }, [])
  );

  // ── Pin tap ──────────────────────────────────────────────────────────────
  function handlePinTap(stageId) {
    setNearestResult(null);
    setHighlightedAmenity(null);

    if (pickingStart) {
      setStartId(stageId);
      setPickingStart(false);
      if (selectedPin) {
        const dest  = getPosition(selectedPin);
        const start = getPosition(stageId);
        if (dest && start) {
          setRoute(calcRoute(start, dest, `stage_${stageId}`, `stage_${selectedPin}`));
        }
      }
      return;
    }

    setSelectedPin(stageId);
    setSelectedSetIdx(0);

    const startPos = startId === 'entrance'
      ? { x: ENTRANCE.x, y: ENTRANCE.y }
      : getPosition(startId);
    const destPos = getPosition(stageId);

    if (startPos && destPos) {
      const startLabel = startId === 'entrance' ? 'entrance' : `stage_${startId}`;
      const destLabel  = `stage_${stageId}`;
      if (startLabel !== destLabel) {
        setRoute(calcRoute(startPos, destPos, startLabel, destLabel));
      } else {
        setRoute({ polyline: [[destPos.x, destPos.y]], minutes: 0 });
      }
    }
  }

  // ── Add to plan ──────────────────────────────────────────────────────────
  function handleAddToPlan() {
    const stageSets = sets.filter(s => s.stage_id === selectedPin);
    if (!stageSets.length) return;
    const chosen = stageSets[selectedSetIdx] ?? stageSets[0];

    const overlap = planItems.find(p =>
      p.set_id !== chosen.id &&
      p.start_time < chosen.end_time &&
      p.end_time   > chosen.start_time
    );

    const stage = stages.find(s => s.id === selectedPin);
    const stageName = stage ? stage.name : `Stage ${selectedPin}`;

    const doInsert = () => {
      const db = getDb();
      db.runSync(
        `INSERT INTO plan_items (set_id, start_time, end_time, stage_name, act_name, is_original)
         VALUES (?, ?, ?, ?, ?, 1)`,
        [chosen.id, chosen.start_time, chosen.end_time, stageName, chosen.act_name]
      );
      setPlanItems(db.getAllSync('SELECT id, set_id, start_time, end_time FROM plan_items'));
      Alert.alert('Added!', `${chosen.act_name} at ${stageName} added to your plan.`);
    };

    if (overlap) {
      Alert.alert(
        'Schedule overlap',
        `This set (${chosen.start_time}–${chosen.end_time}) overlaps with another set already in your plan. Add anyway?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Add anyway', onPress: doInsert },
        ]
      );
    } else {
      doInsert();
    }
  }

  // ── Find nearest amenity ─────────────────────────────────────────────────
  function handleFindNearest(amenityType) {
    setSelectedPin(null);
    setRoute(null);

    const startPos = startId === 'entrance'
      ? { x: ENTRANCE.x, y: ENTRANCE.y }
      : getPosition(startId);

    if (!startPos) return;

    const startLabel = startId === 'entrance' ? 'entrance' : `stage_${startId}`;
    const result = findNearestAmenity(startPos, amenityType, startLabel);
    if (!result) return;

    setHighlightedAmenity(result.amenity.idx);
    setNearestResult({ ...result, type: amenityType });
    setRoute(result.route);
  }

  // ── Toggle amenity type visibility ───────────────────────────────────────
  function toggleType(key) {
    setHiddenTypes(prev => ({ ...prev, [key]: !prev[key] }));
    setNearestResult(null);
    setHighlightedAmenity(null);
  }

  // ── Toggle saved ─────────────────────────────────────────────────────────
  function handleToggleSaved(actId) {
    const db = getDb();
    if (savedActIds.includes(actId)) {
      db.runSync('DELETE FROM saved_acts WHERE act_id = ?', [actId]);
    } else {
      db.runSync('INSERT OR IGNORE INTO saved_acts (act_id) VALUES (?)', [actId]);
    }
    setSavedActIds(db.getAllSync('SELECT act_id FROM saved_acts').map(r => r.act_id));
  }

  // ── Derived ──────────────────────────────────────────────────────────────
  const selectedStageSets = selectedPin ? sets.filter(s => s.stage_id === selectedPin) : [];
  const selectedStage     = stages.find(s => s.id === selectedPin);
  const startLabel = startId === 'entrance' ? 'Entrance' : `Stage ${startId}`;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <ScrollView
      style={[styles.screen, { paddingTop: insets.top }]}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Stage finder</Text>
      </View>
      <Text style={styles.mapNote}>Illustrative map · Not to scale · Sample names</Text>

      {/* Pick-start hint */}
      {pickingStart && (
        <View style={styles.pickHint}>
          <Text style={styles.pickHintText}>Tap any stage pin to set it as your start</Text>
        </View>
      )}

      {/* ── SVG Map ── */}
      <View style={styles.mapContainer}>
        <Svg
          viewBox={`0 0 ${MAP_W} ${MAP_H}`}
          width="100%"
          style={{ aspectRatio: MAP_W / MAP_H }}
        >
          {/* Background */}
          <Rect width={MAP_W} height={MAP_H} fill="#FFFAF2" />

          {/* Streets – white filled corridors */}
          <G fill="#FFFFFF" stroke="#EADFD2" strokeWidth={2}>
            <Rect x={20}  y={335} width={760} height={60} />
            <Rect x={290} y={80}  width={40}  height={690} />
            <Rect x={540} y={395} width={40}  height={375} />
            <Rect x={20}  y={725} width={760} height={50} />
            {/* Decorative side streets */}
            <Rect x={108} y={190} width={22} height={145} />
            <Rect x={74}  y={190} width={22} height={145} />
            <Rect x={650} y={80}  width={26} height={255} />
          </G>

          {/* Street centerline dashes */}
          <G stroke="#C9C8C0" strokeWidth={2} strokeDasharray="10 8">
            <Line x1={30}  y1={365} x2={770} y2={365} />
            <Line x1={310} y1={90}  x2={310} y2={760} />
            <Line x1={560} y1={405} x2={560} y2={760} />
            <Line x1={30}  y1={750} x2={770} y2={750} />
          </G>

          {/* Street name labels */}
          <G fontSize={12} fontWeight="700" fill="#555">
            <SvgText x={660} y={352} textAnchor="middle">NW 5th Ave</SvgText>
            <SvgText x={660} y={768} textAnchor="middle">NW 6th Ave</SvgText>
            <G transform="translate(305,240) rotate(-90)">
              <SvgText textAnchor="middle">NW 23rd St</SvgText>
            </G>
            <G transform="translate(555,590) rotate(-90)">
              <SvgText textAnchor="middle">NW 22nd St</SvgText>
            </G>
            <G transform="translate(125,262) rotate(-90)">
              <SvgText textAnchor="middle" fontSize={10}>NW 24th St</SvgText>
            </G>
            <G transform="translate(91,262) rotate(-90)">
              <SvgText textAnchor="middle" fontSize={10}>NW 25th St</SvgText>
            </G>
            <G transform="translate(667,205) rotate(-90)">
              <SvgText textAnchor="middle" fontSize={10}>NW 22nd Ln</SvgText>
            </G>
          </G>

          {/* Block shadows */}
          <G fill="#1B1B22" opacity={0.2}>
            <Rect x={335} y={85}  width={310} height={250} rx={18} />
            <Rect x={155} y={195} width={136} height={140} rx={18} />
            <Rect x={45}  y={405} width={250} height={320} rx={18} />
            <Rect x={335} y={405} width={210} height={320} rx={18} />
            <Rect x={585} y={405} width={180} height={320} rx={18} />
          </G>

          {/* Blocks (v3 colors) */}
          <G stroke="#1B1B22" strokeWidth={3}>
            <Rect x={330} y={80}  width={310} height={250} rx={18} fill="#FFE680" />
            <Rect x={150} y={190} width={136} height={140} rx={18} fill="#C5DAFF" />
            <Rect x={40}  y={400} width={250} height={320} rx={18} fill="#FFC9E1" />
            <Rect x={330} y={400} width={210} height={320} rx={18} fill="#FFF0A8" />
            <Rect x={580} y={400} width={180} height={320} rx={18} fill="#D4E3FF" />
          </G>

          {/* Trees / greenery */}
          <G>
            {[
              [60,420],[60,640],[110,700],[270,430],[300,480],[330,420],
              [555,420],[570,520],[565,610],[570,700],[600,420],[740,420],
              [745,600],[740,700],[690,430],[620,470],[350,760],[140,760],
              [30,760],[760,760],[760,490],[760,580],[760,660],
            ].map(([cx,cy], i) => (
              <G key={`tree_${i}`}>
                <Circle cx={cx} cy={cy} r={10} fill="#BFE3B4" stroke="#7DB872" strokeWidth={2} />
                <Circle cx={cx-2} cy={cy-2} r={4} fill="#D8F0CF" />
              </G>
            ))}
          </G>

          {/* Walking route */}
          {route && route.polyline.length > 1 && (
            <Polyline
              points={polylineStr(route.polyline)}
              fill="none"
              stroke="#1B1B22"
              strokeWidth={5}
              strokeDasharray="14 8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Entrance */}
          <G>
            <Rect x={262} y={738} width={140} height={38} rx={6} fill="#1B1B22" />
            <SvgText x={332} y={763} fontSize={18} fontWeight="700" fill="#FFFFFF" textAnchor="middle">
              ENTRANCE
            </SvgText>
            <Path d="M332 722 L322 736 L342 736 Z" fill="#1B1B22" />
          </G>

          {/* VIP ENTRY left */}
          <G>
            <Rect x={22} y={735} width={84} height={26} rx={5} fill="#C85BD9" stroke="#1B1B22" strokeWidth={2} />
            <SvgText x={64} y={753} fontSize={12} fontWeight="700" fill="#fff" textAnchor="middle">VIP ENTRY</SvgText>
          </G>

          {/* VIP+ ENTRY top */}
          <G>
            <Rect x={258} y={88} width={76} height={22} rx={5} fill="#C85BD9" stroke="#1B1B22" strokeWidth={2} />
            <SvgText x={296} y={103} fontSize={11} fontWeight="700" fill="#fff" textAnchor="middle">VIP+ ENTRY</SvgText>
          </G>

          {/* Compass */}
          <G>
            <Circle cx={745} cy={55} r={22} fill="#FFFFFF" stroke="#1B1B22" strokeWidth={3} />
            <Path d="M727 55 L741 48 L741 62 Z" fill="#1B1B22" />
            <SvgText x={754} y={60} fontSize={12} fontWeight="700" textAnchor="middle" fill="#1B1B22">N</SvgText>
          </G>

          {/* Amenity icons */}
          {AMENITIES.map(a => {
            if (hiddenTypes[a.type]) return null;
            const color = amenityColor(a.type);
            const isHighlighted = a.idx === highlightedAmenity;
            return (
              <G key={`am_${a.idx}`} transform={`translate(${a.x},${a.y})`}>
                <Circle cx={2} cy={2} r={12} fill="#1B1B22" opacity={0.2} />
                <Circle
                  r={12}
                  fill={color}
                  stroke={isHighlighted ? Colors.yellow : '#1B1B22'}
                  strokeWidth={isHighlighted ? 3 : 2}
                />
                <AmenityIcon type={a.type} fill="#fff" />
              </G>
            );
          })}

          {/* Stage pin shadows */}
          <G fill="#1B1B22" opacity={0.25}>
            {STAGE_PINS.map(p => (
              <Circle key={`sh_${p.id}`} cx={p.x + 3} cy={p.y + 3} r={22} />
            ))}
          </G>

          {/* Stage pins */}
          {STAGE_PINS.map(p => {
            const isSelected = p.id === selectedPin;
            const isStart    = p.id === startId;
            const fill = isSelected ? Colors.yellow
                       : isStart    ? Colors.pink
                       : '#FFFFFF';
            return (
              <G key={`pin_${p.id}`} onPress={() => handlePinTap(p.id)}>
                <Circle cx={p.x} cy={p.y} r={22} fill={fill} stroke="#1B1B22" strokeWidth={3} />
                <SvgText
                  x={p.x} y={p.y + 7}
                  fontSize={p.id >= 10 ? 15 : 18}
                  fontWeight="700"
                  fill="#1B1B22"
                  textAnchor="middle"
                >
                  {p.id}
                </SvgText>
              </G>
            );
          })}

          {/* Start ring if entrance is start */}
          {startId === 'entrance' && (
            <Circle
              cx={ENTRANCE.x} cy={ENTRANCE.y - 24} r={10}
              fill={Colors.pink} stroke="#1B1B22" strokeWidth={2}
            />
          )}
        </Svg>
      </View>

      {/* ── Amenity legend chips ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chipRow}>
        {AMENITY_TYPES.map(t => {
          const hidden = !!hiddenTypes[t.key];
          return (
            <View key={t.key} style={styles.chipGroup}>
              <TouchableOpacity
                onPress={() => toggleType(t.key)}
                style={[styles.chip, hidden && styles.chipHidden]}
              >
                <View style={[styles.chipDot, { backgroundColor: t.color }]} />
                <Text style={[styles.chipText, hidden && styles.chipTextHidden]}>{t.label}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleFindNearest(t.key)}
                style={styles.nearestBtn}
              >
                <Text style={styles.nearestBtnText}>Find nearest</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>

      {/* ── Nearest result banner ── */}
      {nearestResult && (
        <View style={styles.nearestBanner}>
          <Text style={styles.nearestBannerText}>
            Nearest {AMENITY_TYPES.find(t => t.key === nearestResult.type)?.label ?? nearestResult.type}
            {' '}from {startLabel}:{' '}
            <Text style={styles.nearestBannerBold}>{nearestResult.route.minutes} min walk</Text>
            <Text style={styles.simLabel}> (simulated)</Text>
          </Text>
        </View>
      )}

      {/* ── Pick start button ── */}
      <View style={styles.startRow}>
        <Text style={styles.startLabel}>Start: <Text style={styles.startValue}>{startLabel}</Text></Text>
        <TouchableOpacity
          style={[styles.pickStartBtn, pickingStart && styles.pickStartBtnActive]}
          onPress={() => setPickingStart(v => !v)}
        >
          <Text style={styles.pickStartBtnText}>{pickingStart ? 'Cancel' : 'Pick start'}</Text>
        </TouchableOpacity>
      </View>

      {/* ── Selected stage card ── */}
      {selectedPin && selectedStage && (
        <View style={styles.card}>
          <Text style={styles.cardHeading}>{selectedStage.name}</Text>

          {selectedStageSets.length === 0 ? (
            <Text style={styles.noActsText}>No Saturday acts at this stage.</Text>
          ) : (
            selectedStageSets.map((s, i) => (
              <TouchableOpacity
                key={s.id}
                onPress={() => setSelectedSetIdx(i)}
                style={[styles.setRow, i === selectedSetIdx && styles.setRowActive]}
              >
                <TouchableOpacity onPress={() => setOpenAct(s)}>
                  <Text style={styles.setActName}>{s.act_name}</Text>
                </TouchableOpacity>
                <Text style={styles.setTime}>{fmt(s.start_time)} – {fmt(s.end_time)}</Text>
                {s.genre ? (
                  <Text style={styles.setGenre}>{s.genre}{s.subgenre ? ` · ${s.subgenre}` : ''}</Text>
                ) : null}
              </TouchableOpacity>
            ))
          )}

          {route && (
            <Text style={styles.walkTime}>
              Walk from {startLabel}: <Text style={styles.walkBold}>{route.minutes} min</Text>
              <Text style={styles.simLabel}> (simulated)</Text>
            </Text>
          )}

          <TouchableOpacity style={styles.addBtn} onPress={handleAddToPlan}>
            <Text style={styles.addBtnText}>Add to my plan</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Artist card modal ── */}
      {openAct && (
        <ArtistCard
          act={openAct}
          savedActIds={savedActIds}
          onToggleSaved={handleToggleSaved}
          onFindOnMap={() => setOpenAct(null)}
          onClose={() => setOpenAct(null)}
        />
      )}

    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen:   { flex: 1, backgroundColor: Colors.background },
  content:  { paddingHorizontal: 20, paddingBottom: 48 },

  headerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, marginBottom: 4 },
  heading: {
    ...headingStyle,
    fontSize: 36,
  },
  mapNote: {
    ...labelStyle,
    fontSize: 13,
    color: Colors.muted,
    marginBottom: 10,
  },

  pickHint: {
    backgroundColor: Colors.savedPink,
    borderWidth: 1.5,
    borderColor: Colors.ink,
    padding: 10,
    marginBottom: 10,
    borderRadius: 12,
  },
  pickHintText: {
    ...bodyStyle,
    fontFamily: Fonts.bodyBold,
    textAlign: 'center',
    fontSize: 15,
  },

  mapContainer: {
    borderWidth: 1.5,
    borderColor: Colors.ink,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },

  // ── Chips ──
  chipScroll: { marginBottom: 4 },
  chipRow:    { gap: 8, paddingVertical: 4, paddingRight: 8 },
  chipGroup:  { gap: 4, alignItems: 'flex-start' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: Colors.ink,
    borderRadius: 100,
    minHeight: 38,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.white,
  },
  chipHidden: {
    opacity: 0.4,
  },
  chipDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  chipText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.ink,
  },
  chipTextHidden: {
    color: Colors.muted,
  },
  nearestBtn: {
    borderWidth: 1.5,
    borderColor: Colors.ink,
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 5,
    minHeight: 32,
    backgroundColor: Colors.paleYellow,
    alignSelf: 'flex-start',
  },
  nearestBtnText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    color: Colors.ink,
  },

  // ── Nearest banner ──
  nearestBanner: {
    backgroundColor: Colors.savedBlue,
    borderWidth: 1.5,
    borderColor: Colors.ink,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  nearestBannerText: {
    ...bodyStyle,
    fontSize: 14,
  },
  nearestBannerBold: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    color: Colors.ink,
  },
  simLabel: {
    ...labelStyle,
    fontSize: 13,
    color: Colors.muted,
  },

  // ── Start row ──
  startRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  startLabel: {
    ...bodyStyle,
    fontSize: 14,
    flex: 1,
  },
  startValue: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    color: Colors.ink,
  },
  pickStartBtn: {
    ...secondaryButtonStyle,
    minHeight: 40,
    paddingHorizontal: 16,
  },
  pickStartBtnActive: {
    backgroundColor: Colors.savedPink,
  },
  pickStartBtnText: {
    ...secondaryButtonTextStyle,
    fontSize: 14,
  },

  // ── Stage card ──
  card: {
    ...cardStyle,
    marginBottom: 16,
  },
  cardHeading: {
    fontFamily: Fonts.display,
    fontSize: 22,
    color: Colors.ink,
    marginBottom: 10,
  },
  noActsText: {
    ...bodyStyle,
    color: Colors.muted,
    marginBottom: 10,
  },
  setRow: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 4,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  setRowActive: {
    backgroundColor: Colors.yellow,
    borderColor: Colors.ink,
  },
  setActName: {
    fontFamily: Fonts.display,
    fontSize: 16,
    color: Colors.ink,
  },
  setTime: {
    fontFamily: Fonts.detail,
    fontSize: 13,
    color: Colors.muted,
  },
  setGenre: {
    fontFamily: Fonts.detail,
    fontSize: 13,
    color: Colors.muted,
  },
  walkTime: {
    ...bodyStyle,
    fontSize: 14,
    marginTop: 10,
    marginBottom: 12,
  },
  walkBold: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
  },
  addBtn: {
    backgroundColor: Colors.ink,
    borderRadius: 100,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  addBtnText: {
    fontFamily: Fonts.display,
    fontSize: 17,
    color: Colors.white,
  },
});
