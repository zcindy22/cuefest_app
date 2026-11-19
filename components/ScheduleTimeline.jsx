/**
 * components/ScheduleTimeline.jsx
 *
 * Horizontal-scrolling schedule grid for the Lineup page.
 * - Time axis 17:00–24:00, 76px per hour on the left
 * - One column per stage that has acts on the selected day
 * - Each act block is 205px wide, at least 76px tall (or 64px minimum)
 * - Saved acts (in savedActIds) get a blue/pink tinted fill
 * - Tapping the act name opens the artist card; tapping the heart saves/unsaves
 */

import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Fonts } from '../theme/theme';

const TIME_START  = 17 * 60;   // 17:00 in minutes
const TIME_END    = 24 * 60;   // 24:00 in minutes
const PX_PER_MIN  = 76 / 60;   // 76px per hour
const TOTAL_H     = (TIME_END - TIME_START) * PX_PER_MIN;
const COL_W       = 205;
const TIME_AXIS_W = 48;
const HOUR_H      = 76;

function toMins(t) {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function fmt(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12  = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
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
const SAVED_FILLS = {
  'Dance':   Colors.savedBlue,
  'Techno':  Colors.savedBlue,
  'Bass':    Colors.savedPink,
  'Latin':   Colors.savedPink,
  'Indie':   Colors.savedBlue,
  'Alt R&B': Colors.savedPink,
  'Electro': Colors.savedBlue,
  'Hip hop': Colors.savedBlue,
};
function genreColor(genre) { return GENRE_COLORS[genre] ?? Colors.yellow; }
function savedFill(genre)  { return SAVED_FILLS[genre]  ?? Colors.savedBlue; }

export default function ScheduleTimeline({ acts, savedActIds, onDetail, onToggleSaved }) {
  // Build stage columns — only stages with acts on this day
  const stageIds = [...new Set(acts.map(a => a.stage_id))].sort((a, b) => a - b);

  const hourMarks = [];
  for (let h = 17; h <= 24; h++) hourMarks.push(h);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tl.scroll}>
      <View style={{ flexDirection: 'row' }}>

        {/* Time axis */}
        <View style={[tl.timeAxis, { height: TOTAL_H + HOUR_H }]}>
          {hourMarks.map(h => (
            <View
              key={h}
              style={[tl.hourMark, { top: (h * 60 - TIME_START) * PX_PER_MIN }]}
            >
              <Text style={tl.hourText}>{h < 24 ? `${h}:00` : '0:00'}</Text>
            </View>
          ))}
        </View>

        {/* Stage columns */}
        {stageIds.map(stageId => {
          const stageActs = acts.filter(a => a.stage_id === stageId);
          return (
            <View key={stageId} style={[tl.stageCol, { height: TOTAL_H + HOUR_H }]}>
              <Text style={tl.stageHeader} numberOfLines={1}>Stage {stageId}</Text>
              {stageActs.map(act => {
                const startMins = toMins(act.start_time);
                const endMins   = toMins(act.end_time);
                const topPx     = (startMins - TIME_START) * PX_PER_MIN + 28; // +28 for header
                const heightPx  = Math.max(
                  64,
                  Math.max(76, (endMins - startMins) * PX_PER_MIN)
                );
                const isSaved   = savedActIds.includes(act.id);
                const blockBg   = isSaved ? savedFill(act.genre) : Colors.white;

                return (
                  <View
                    key={act.id}
                    style={[tl.actBlock, { top: topPx, height: heightPx, backgroundColor: blockBg }]}
                  >
                    {/* Top row: tile + name */}
                    <View style={tl.blockTop}>
                      <View style={[tl.tile, { backgroundColor: genreColor(act.genre) }]}>
                        <Text style={tl.tileText}>{initials(act.act_name)}</Text>
                      </View>
                      <TouchableOpacity
                        style={tl.nameWrap}
                        onPress={() => onDetail(act)}
                        hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                      >
                        <Text style={tl.actName} numberOfLines={2}>{act.act_name}</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Genre + time line */}
                    <Text style={tl.genreTime} numberOfLines={1}>
                      {act.genre} · {fmt(act.start_time)}
                    </Text>

                    {/* Heart — bottom right */}
                    <TouchableOpacity
                      style={tl.heartBtn}
                      onPress={() => onToggleSaved(act.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={[tl.heart, isSaved && tl.heartFilled]}>
                        {isSaved ? '♥' : '♡'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          );
        })}

      </View>
    </ScrollView>
  );
}

const tl = StyleSheet.create({
  scroll:      { marginHorizontal: -20 },   // bleed to screen edges
  timeAxis:    { width: TIME_AXIS_W, position: 'relative', marginRight: 2, paddingLeft: 4 },
  hourMark:    { position: 'absolute', left: 4 },
  hourText:    { fontFamily: Fonts.detail, fontSize: 13, color: Colors.muted },
  stageCol:    { width: COL_W, marginRight: 8, position: 'relative' },
  stageHeader: { fontFamily: Fonts.display, fontSize: 15, color: Colors.ink, marginBottom: 4 },
  actBlock:    {
    position: 'absolute',
    left: 0,
    width: COL_W - 8,
    borderWidth: 1.5,
    borderColor: Colors.ink,
    borderRadius: 12,
    padding: 8,
    overflow: 'hidden',
  },
  blockTop:    { flexDirection: 'row', gap: 6, marginBottom: 4, alignItems: 'flex-start' },
  tile:        { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.ink, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  tileText:    { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.ink },
  nameWrap:    { flex: 1 },
  actName:     { fontFamily: Fonts.display, fontSize: 16, color: Colors.ink, lineHeight: 20 },
  genreTime:   { fontFamily: Fonts.detail, fontSize: 13, color: Colors.muted, marginBottom: 4 },
  heartBtn:    { position: 'absolute', bottom: 6, right: 6 },
  heart:       { fontSize: 20, color: Colors.muted },
  heartFilled: { color: Colors.pink },
});
