/**
 * components/ArtistCard.jsx
 *
 * Bottom-sheet artist card. Reusable from Discover and Stage finder.
 * Props:
 *   act            – row from sets table (id, act_name, genre, subgenre, stage_id, day, start_time, end_time, bio)
 *   savedActIds    – array of saved act_id numbers
 *   onToggleSaved  – (actId) => void
 *   onFindOnMap    – (act) => void
 *   onClose        – () => void
 */

import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Fonts, bodyStyle, labelStyle } from '../theme/theme';

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

function genreColor(genre) {
  return GENRE_COLORS[genre] ?? Colors.yellow;
}

function fmt(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function InitialsTile({ name, genre, size = 56 }) {
  const bg = genreColor(genre);
  return (
    <View style={[tileStyles.tile, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Text style={[tileStyles.text, { fontSize: size * 0.33 }]}>{initials(name)}</Text>
    </View>
  );
}
const tileStyles = StyleSheet.create({
  tile: { alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: Colors.ink },
  text: { fontFamily: Fonts.bodyBold, color: Colors.ink },
});

export default function ArtistCard({ act, savedActIds, onToggleSaved, onFindOnMap, onClose }) {
  if (!act) return null;
  const isSaved = savedActIds.includes(act.id);

  return (
    <Modal
      visible={!!act}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <ScrollView showsVerticalScrollIndicator={false}>
            <TouchableOpacity style={styles.closeRow} onPress={onClose}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>

            <View style={styles.top}>
              <InitialsTile name={act.act_name} genre={act.genre} size={64} />
              <View style={styles.topMeta}>
                <Text style={styles.name}>{act.act_name}</Text>
                <View style={styles.chipRow}>
                  <View style={[styles.chip, { backgroundColor: genreColor(act.genre) }]}>
                    <Text style={styles.chipText}>{act.genre}</Text>
                  </View>
                  <View style={[styles.chip, { backgroundColor: Colors.white }]}>
                    <Text style={styles.chipText}>{act.subgenre}</Text>
                  </View>
                </View>
              </View>
            </View>

            <Text style={styles.meta}>
              Stage {act.stage_id} · {act.day} · {fmt(act.start_time)} – {fmt(act.end_time)}
            </Text>

            <Text style={styles.bio}>{act.bio}</Text>

            <Text style={styles.sampleNote}>Sample act invented for this demo — not a real artist.</Text>

            <View style={styles.btnRow}>
              <TouchableOpacity
                style={[styles.btn, isSaved && styles.btnFilled]}
                onPress={() => onToggleSaved(act.id)}
              >
                <Text style={[styles.btnText, isSaved && styles.btnTextFilled]}>
                  {isSaved ? '♥ Saved' : '♡ Save'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.btn} onPress={() => onFindOnMap(act)}>
                <Text style={styles.btnText}>Find on map</Text>
              </TouchableOpacity>
            </View>

            {act.day === 'Fri' && (
              <View style={styles.friNote}>
                <Text style={styles.friNoteText}>Plan covers Saturday in this demo.</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay:     { flex: 1, justifyContent: 'flex-end' },
  backdrop:    { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(27,27,34,0.45)' },
  sheet:       { backgroundColor: Colors.white, borderTopWidth: 1.5, borderTopColor: Colors.ink, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '88%' },
  handle:      { width: 40, height: 4, backgroundColor: Colors.divider, borderRadius: 2, alignSelf: 'center', marginBottom: 12 },
  closeRow:    { alignSelf: 'flex-end', marginBottom: 10 },
  closeText:   { ...labelStyle, fontSize: 14, color: Colors.muted },
  top:         { flexDirection: 'row', gap: 14, marginBottom: 12, alignItems: 'flex-start' },
  topMeta:     { flex: 1, gap: 6 },
  name:        { fontFamily: Fonts.display, fontSize: 20, color: Colors.ink, flexShrink: 1 },
  chipRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip:        { borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1.5, borderColor: Colors.ink },
  chipText:    { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.ink },
  meta:        { ...labelStyle, fontSize: 13, color: Colors.muted, marginBottom: 10 },
  bio:         { ...bodyStyle, fontSize: 15, lineHeight: 22, marginBottom: 8 },
  sampleNote:  { ...labelStyle, fontSize: 13, color: Colors.muted, marginBottom: 16 },
  btnRow:      { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 10 },
  btn:         { borderWidth: 1.5, borderColor: Colors.ink, borderRadius: 100, paddingHorizontal: 18, paddingVertical: 12, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  btnFilled:   { backgroundColor: Colors.ink },
  btnText:     { fontFamily: Fonts.bodyBold, fontSize: 14, color: Colors.ink },
  btnTextFilled: { color: Colors.white },
  friNote:     { backgroundColor: Colors.paleYellow, borderWidth: 1.5, borderColor: Colors.ink, borderRadius: 12, padding: 10, marginTop: 4 },
  friNoteText: { ...labelStyle, fontSize: 13 },
});
