/**
 * Stage Finder screen
 *
 * - SVG map rebuilt from street/block geometry matching cue-festival-map.svg
 * - 13 tappable numbered pins
 * - Tap a pin: show card with stage name, set schedule, walking route (dashed line), walk time
 * - Pick start button: choose any stage as route start (default: entrance)
 * - Add to my plan: writes selected set to plan_items, warns on overlap
 * - Stage list below map
 */

import { useCallback, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
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
import { getDb } from '../../db/database';
import { calcRoute, getPosition, ENTRANCE } from '../../lib/routing';
import DemoLocationChip from '../../components/DemoLocationChip';
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

// ─── Helpers ──────────────────────────────────────────────────────────────

function fmt(t) {
  // "18:00" → "6:00 PM"
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function polylineStr(pts) {
  return pts.map(([x, y]) => `${x},${y}`).join(' ');
}

// ─── Component ────────────────────────────────────────────────────────────

export default function StageFinderScreen() {
  const [stages, setStages]           = useState([]);
  const [sets, setSets]               = useState([]);        // all sets
  const [planItems, setPlanItems]     = useState([]);        // current plan

  const [selectedPin, setSelectedPin] = useState(null);     // stage id
  const [selectedSetIdx, setSelectedSetIdx] = useState(0);  // which set for Add to Plan
  const [startId, setStartId]         = useState('entrance'); // 'entrance' or stage id number
  const [pickingStart, setPickingStart] = useState(false);

  const [route, setRoute]             = useState(null);      // { polyline, minutes }
  const [pickStartModal, setPickStartModal] = useState(false);

  // Load DB on focus
  useFocusEffect(
    useCallback(() => {
      const db = getDb();
      setStages(db.getAllSync('SELECT id, name, x, y FROM stages ORDER BY id'));
      setSets(db.getAllSync('SELECT id, stage_id, act_name, start_time, end_time FROM sets ORDER BY stage_id, start_time'));
      setPlanItems(db.getAllSync('SELECT id, set_id, start_time, end_time FROM plan_items'));
    }, [])
  );

  // ── Pin tap ──────────────────────────────────────────────────────────────
  function handlePinTap(stageId) {
    if (pickingStart) {
      setStartId(stageId);
      setPickingStart(false);
      // If a pin was already selected, recalc route
      if (selectedPin) {
        const dest = getPosition(selectedPin);
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

    // Overlap check
    const overlap = planItems.find(p => {
      return p.set_id !== chosen.id &&
        p.start_time < chosen.end_time &&
        p.end_time   > chosen.start_time;
    });

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

  // ── Derived data ─────────────────────────────────────────────────────────
  const selectedStageSets = selectedPin
    ? sets.filter(s => s.stage_id === selectedPin)
    : [];
  const selectedStage = stages.find(s => s.id === selectedPin);
  const startLabel = startId === 'entrance'
    ? 'Entrance'
    : `Stage ${startId}`;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>

      {/* Header */}
      <Text style={styles.appLabel}>CUE SAMPLE FESTIVAL DAY</Text>
      <Text style={styles.heading}>STAGE FINDER</Text>
      <DemoLocationChip />
      <Text style={styles.mapNote}>ILLUSTRATIVE MAP, NOT TO SCALE</Text>

      {/* Pick-start hint */}
      {pickingStart && (
        <View style={styles.pickHint}>
          <Text style={styles.pickHintText}>Tap any pin to set it as your start point</Text>
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
          <Rect width={MAP_W} height={MAP_H} fill="#F0EFEA" />

          {/* Streets – white filled corridors */}
          <G fill="#FFFFFF" stroke="#D5D4CC" strokeWidth={2}>
            <Rect x={20}  y={335} width={760} height={60} />
            <Rect x={290} y={80}  width={40}  height={690} />
            <Rect x={540} y={395} width={40}  height={375} />
            <Rect x={20}  y={725} width={760} height={50} />
          </G>
          {/* Street centerline dashes */}
          <G stroke="#C9C8C0" strokeWidth={2} strokeDasharray="10 8">
            <Line x1={30}  y1={365} x2={770} y2={365} />
            <Line x1={310} y1={90}  x2={310} y2={760} />
            <Line x1={560} y1={405} x2={560} y2={760} />
            <Line x1={30}  y1={750} x2={770} y2={750} />
          </G>

          {/* Block shadows */}
          <G fill="#000">
            <Rect x={336} y={86}  width={310} height={250} rx={18} />
            <Rect x={156} y={196} width={136} height={140} rx={18} />
            <Rect x={46}  y={406} width={250} height={320} rx={18} />
            <Rect x={336} y={406} width={210} height={320} rx={18} />
            <Rect x={586} y={406} width={180} height={320} rx={18} />
          </G>
          {/* Blocks */}
          <G stroke="#000" strokeWidth={3}>
            <Rect x={330} y={80}  width={310} height={250} rx={18} fill="#F4EE9C" />
            <Rect x={150} y={190} width={136} height={140} rx={18} fill="#BFD0FA" />
            <Rect x={40}  y={400} width={250} height={320} rx={18} fill="#F1C9EE" />
            <Rect x={330} y={400} width={210} height={320} rx={18} fill="#F4EE9C" />
            <Rect x={580} y={400} width={180} height={320} rx={18} fill="#BFD0FA" />
          </G>

          {/* Walking route */}
          {route && route.polyline.length > 1 && (
            <Polyline
              points={polylineStr(route.polyline)}
              fill="none"
              stroke="#000"
              strokeWidth={5}
              strokeDasharray="14 8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Entrance */}
          <G>
            <Rect x={262} y={738} width={140} height={38} rx={6} fill="#000" />
            <SvgText
              x={332} y={763}
              fontSize={18} fontWeight="700" fill="#FFFFFF"
              textAnchor="middle"
            >
              ENTRANCE
            </SvgText>
            <Path d="M332 722 L322 736 L342 736 Z" fill="#000" />
          </G>

          {/* Stage pin shadows */}
          <G fill="#000">
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
                <Circle
                  cx={p.x} cy={p.y} r={22}
                  fill={fill}
                  stroke="#000" strokeWidth={3}
                />
                <SvgText
                  x={p.x} y={p.y + 7}
                  fontSize={p.id >= 10 ? 15 : 18}
                  fontWeight="700"
                  fill="#000"
                  textAnchor="middle"
                >
                  {p.id}
                </SvgText>
              </G>
            );
          })}

          {/* Start marker ring if entrance is start */}
          {startId === 'entrance' && (
            <Circle
              cx={ENTRANCE.x} cy={ENTRANCE.y - 20} r={10}
              fill={Colors.pink} stroke="#000" strokeWidth={2}
            />
          )}

          {/* Compass */}
          <G>
            <Circle cx={745} cy={55} r={22} fill="#FFFFFF" stroke="#000" strokeWidth={3} />
            <Path d="M745 38 L752 58 L738 58 Z" fill="#000" />
            <SvgText x={745} y={88} fontSize={12} fontWeight="700" textAnchor="middle" fill="#000">N</SvgText>
          </G>
        </Svg>
      </View>

      {/* ── Selected stage card ── */}
      {selectedPin && selectedStage && (
        <View style={styles.card}>
          <Text style={styles.cardHeading}>{selectedStage.name.toUpperCase()}</Text>

          {/* Set picker */}
          {selectedStageSets.map((s, i) => (
            <TouchableOpacity
              key={s.id}
              onPress={() => setSelectedSetIdx(i)}
              style={[styles.setRow, i === selectedSetIdx && styles.setRowActive]}
            >
              <Text style={styles.setActName}>{s.act_name}</Text>
              <Text style={styles.setTime}>{fmt(s.start_time)} – {fmt(s.end_time)}</Text>
            </TouchableOpacity>
          ))}

          {/* Walk time */}
          {route && (
            <Text style={styles.walkTime}>
              Walk from {startLabel}: {route.minutes} min{' '}
              <Text style={styles.simLabel}>(simulated)</Text>
            </Text>
          )}

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.btn, styles.btnYellow]} onPress={handleAddToPlan}>
              <Text style={styles.btnText}>ADD TO MY PLAN</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnPink, pickingStart && styles.btnActive]}
              onPress={() => setPickingStart(v => !v)}
            >
              <Text style={styles.btnText}>PICK START</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── All stages list ── */}
      <Text style={styles.allStagesLabel}>ALL STAGES</Text>
      <View style={styles.stageList}>
        {stages.map(s => (
          <TouchableOpacity
            key={s.id}
            style={[
              styles.stageChip,
              s.id === selectedPin && styles.stageChipSelected,
              s.id === startId    && styles.stageChipStart,
            ]}
            onPress={() => handlePinTap(s.id)}
          >
            <Text style={styles.stageChipText}>{s.id}</Text>
          </TouchableOpacity>
        ))}
      </View>

    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen:   { flex: 1, backgroundColor: Colors.background },
  content:  { padding: 16, paddingBottom: 40 },

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
    marginBottom: 2,
  },
  mapNote: {
    ...labelStyle,
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 12,
    letterSpacing: 1,
  },

  pickHint: {
    backgroundColor: Colors.pink,
    borderWidth: 2,
    borderColor: Colors.black,
    padding: 8,
    marginBottom: 8,
    borderRadius: 4,
  },
  pickHintText: {
    ...bodyStyle,
    fontFamily: Fonts.bodyBold,
    textAlign: 'center',
  },

  mapContainer: {
    borderWidth: 2,
    borderColor: Colors.black,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 2,
    backgroundColor: '#F0EFEA',
  },

  // ── Card ──
  card: {
    ...cardStyle,
    marginBottom: 16,
  },
  cardHeading: {
    ...headingStyle,
    fontSize: 36,
    marginBottom: 10,
  },
  setRow: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  setRowActive: {
    backgroundColor: Colors.yellow,
    borderColor: Colors.black,
  },
  setActName: { ...bodyStyle, fontFamily: Fonts.bodyBold },
  setTime:    { ...bodyStyle, fontSize: 13, color: Colors.textMuted },

  walkTime: { ...bodyStyle, marginTop: 8, marginBottom: 12 },
  simLabel: { ...labelStyle, fontSize: 12, color: Colors.textMuted },

  buttonRow: { flexDirection: 'row', gap: 10 },
  btn: {
    ...buttonStyle,
    flex: 1,
  },
  btnYellow: { backgroundColor: Colors.yellow },
  btnPink:   { backgroundColor: Colors.pink },
  btnActive: { opacity: 0.7 },
  btnText:   { ...buttonTextStyle, fontFamily: Fonts.heading, fontSize: 16 },

  // ── Stage list ──
  allStagesLabel: {
    ...labelStyle,
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    marginBottom: 10,
  },
  stageList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stageChip: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: Colors.black,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 2,
  },
  stageChipSelected: { backgroundColor: Colors.yellow },
  stageChipStart:    { backgroundColor: Colors.pink },
  stageChipText: {
    ...bodyStyle,
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
  },
});
