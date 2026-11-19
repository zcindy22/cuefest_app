/**
 * Wear & Bring screen — forecast, packing checklist, leave-at-home list,
 * Attendee Picks accordion with filter + hashtag chips, add your own tip.
 */

import { useCallback, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getDb } from '../../db/database';
import {
  Colors,
  Fonts,
  headingStyle,
  cardStyle,
  chipStyle,
  chipTextStyle,
  chipActiveStyle,
  bodyStyle,
  buttonStyle,
  buttonTextStyle,
  secondaryButtonStyle,
  secondaryButtonTextStyle,
  inkOutline,
} from '../../theme/theme';

// ── Helpers ──────────────────────────────────────────────────────────────────

function wearSuggestion(forecast) {
  if (!forecast) return null;
  const { condition, temp_f, rain_chance } = forecast;
  const c = (condition || '').toLowerCase();
  if (rain_chance >= 50 || c.includes('rain') || c.includes('storm')) {
    return 'Rain is likely — pack a clear poncho, waterproof sandals and quick-dry layers.';
  }
  if (temp_f >= 85) {
    return `Warm and ${condition.toLowerCase()} — go light: a breathable top, shorts and sunscreen.`;
  }
  if (temp_f <= 68) {
    return `Cool ${condition.toLowerCase()} night — layer up with a light jacket you can tie around your waist.`;
  }
  return `${condition} with a high of ${temp_f}°F — a comfortable outfit, light layer and comfy shoes.`;
}

const VERDICT_COLORS = {
  'Worth it': Colors.blue,
  Mixed: Colors.yellow,
  'Skip it': Colors.pink,
};

function parseTipText(type, text) {
  if (type === 'fit' || type === 'review') {
    const idx = text.lastIndexOf('|');
    if (idx !== -1) {
      return { main: text.slice(0, idx), extra: text.slice(idx + 1) };
    }
  }
  return { main: text, extra: null };
}

// ── Main screen ──────────────────────────────────────────────────────────────

export default function WearAndBringScreen() {
  const insets = useSafeAreaInsets();
  const db = getDb();

  // Data state
  const [forecast, setForecast] = useState(null);
  const [packingItems, setPackingItems] = useState([]);
  const [tips, setTips] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);

  // UI state
  const [picksOpen, setPicksOpen] = useState(false);
  const [filterType, setFilterType] = useState('All');
  const [activeTag, setActiveTag] = useState(null);
  const [showMoreTips, setShowMoreTips] = useState(false);

  // Add packing item
  const [addingItem, setAddingItem] = useState(false);
  const [newItemText, setNewItemText] = useState('');

  // Add own tip
  const [ownTipText, setOwnTipText] = useState('');
  const [ownTipTags, setOwnTipTags] = useState('');

  // ── Load data on focus ────────────────────────────────────────────────────
  function loadAll() {
    // Forecast
    const fc = db.getFirstSync(
      'SELECT condition, temp_f, rain_chance FROM forecast WHERE id = 1'
    );
    setForecast(fc ?? null);

    // Packing items
    const items = db.getAllSync(
      'SELECT id, label, checked, is_user_item FROM packing_items ORDER BY id'
    );
    setPackingItems(items);

    // Tips (all, ordered by id)
    const allTips = db.getAllSync(
      'SELECT id, tip_text, source_name, source_url, is_general, type, tags, last_updated FROM tips ORDER BY id'
    );
    setTips(allTips);

    // Last updated date from first row
    if (allTips.length > 0 && allTips[0].last_updated) {
      setLastUpdated(allTips[0].last_updated);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  // ── Packing list actions ──────────────────────────────────────────────────
  function togglePacking(id, checked) {
    db.runSync('UPDATE packing_items SET checked = ? WHERE id = ?', [
      checked ? 0 : 1,
      id,
    ]);
    setPackingItems(prev =>
      prev.map(it => (it.id === id ? { ...it, checked: it.checked ? 0 : 1 } : it))
    );
  }

  function removePackingItem(id) {
    db.runSync('DELETE FROM packing_items WHERE id = ? AND is_user_item = 1', [id]);
    setPackingItems(prev => prev.filter(it => it.id !== id));
  }

  function addPackingItem() {
    const label = newItemText.trim();
    if (!label) return;
    db.runSync(
      'INSERT INTO packing_items (label, checked, is_user_item) VALUES (?, 0, 1)',
      [label]
    );
    setNewItemText('');
    setAddingItem(false);
    loadAll();
  }

  function addToPackingFromTip(label) {
    const existing = db.getFirstSync(
      'SELECT id FROM packing_items WHERE label = ?',
      [label]
    );
    if (existing) {
      Alert.alert('Already in list', `"${label}" is already in your packing list.`);
      return;
    }
    db.runSync(
      'INSERT INTO packing_items (label, checked, is_user_item, source) VALUES (?, 0, 1, ?)',
      [label, 'attendee_picks']
    );
    loadAll();
    Alert.alert('Added', `"${label}" added to your packing list.`);
  }

  // ── Add own tip ───────────────────────────────────────────────────────────
  function submitOwnTip() {
    const text = ownTipText.trim();
    if (!text) return;
    const tags = ownTipTags.trim();
    const today = new Date().toISOString().slice(0, 10);
    db.runSync(
      `INSERT INTO tips (tip_text, source_name, source_url, is_general, type, tags, last_updated)
       VALUES (?, 'My tip', null, 1, 'tip', ?, ?)`,
      [text, tags, today]
    );
    setOwnTipText('');
    setOwnTipTags('');
    loadAll();
  }

  // ── Derived data ──────────────────────────────────────────────────────────
  const suggestion = wearSuggestion(forecast);

  // Count for the picker accordion title
  const picksCount = tips.length;

  // Filter tips for display
  const filteredTips = tips.filter(t => {
    // Exclude 'My tip' sourced items from the feed (they show nowhere but are stored)
    if (filterType !== 'All' && t.type !== filterType.toLowerCase() && filterType !== 'Tips') {
      if (filterType === 'Tips' && t.type !== 'tip') return false;
      if (filterType === 'Fits' && t.type !== 'fit') return false;
      if (filterType === 'Reviews' && t.type !== 'review') return false;
      return false;
    }
    if (filterType === 'Tips' && t.type !== 'tip') return false;
    if (filterType === 'Fits' && t.type !== 'fit') return false;
    if (filterType === 'Reviews' && t.type !== 'review') return false;
    if (activeTag && !(t.tags || '').includes(activeTag)) return false;
    return true;
  });

  // Top hashtags across all tips
  const tagCounts = {};
  tips.forEach(t => {
    (t.tags || '').split(' ').forEach(tag => {
      if (tag.startsWith('#')) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    });
  });
  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([tag]) => tag);

  const visibleTips = showMoreTips ? filteredTips : filteredTips.slice(0, 4);

  const LEAVE_AT_HOME = [
    'Selfie sticks — not allowed',
    'Large professional cameras',
    'Outside alcohol',
    'Glass containers',
    'Weapons or sharp objects',
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <ScrollView
      style={[styles.screen, { paddingTop: insets.top }]}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
      keyboardShouldPersistTaps="handled"
    >
      {/* Screen title */}
      <Text style={styles.heading}>Wear & Bring</Text>

      {/* ── Forecast card ─────────────────────────────────────────────────── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{"Today's forecast"}</Text>
        <View style={styles.simulatedChip}>
          <Text style={styles.simulatedText}>Simulated</Text>
        </View>
      </View>
      {forecast ? (
        <View style={styles.forecastCard}>
          <View style={styles.forecastRow}>
            <Ionicons name="partly-sunny-outline" size={40} color={Colors.yellow} />
            <View style={styles.forecastInfo}>
              <Text style={styles.forecastCondition}>{forecast.condition}</Text>
              <Text style={styles.forecastDetails}>
                {forecast.temp_f}°F · {forecast.rain_chance}% rain
              </Text>
            </View>
          </View>
          {suggestion ? (
            <View style={styles.suggestionRow}>
              <Ionicons name="shirt-outline" size={16} color={Colors.muted} />
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </View>
          ) : null}
        </View>
      ) : (
        <View style={cardStyle}>
          <Text style={styles.bodyText}>Loading forecast…</Text>
        </View>
      )}

      {/* ── Packing list ──────────────────────────────────────────────────── */}
      <View style={[styles.sectionHeader, { marginTop: 24 }]}>
        <Text style={styles.sectionTitle}>Packing list</Text>
        <Pressable
          style={styles.plusButton}
          onPress={() => setAddingItem(v => !v)}
          accessibilityLabel="Add item to packing list"
          hitSlop={8}
        >
          <Ionicons name={addingItem ? 'close' : 'add'} size={20} color={Colors.ink} />
        </Pressable>
      </View>

      {addingItem ? (
        <View style={styles.addItemRow}>
          <TextInput
            style={styles.addItemInput}
            placeholder="New item…"
            placeholderTextColor={Colors.muted}
            value={newItemText}
            onChangeText={setNewItemText}
            onSubmitEditing={addPackingItem}
            returnKeyType="done"
            autoFocus
          />
          <Pressable style={styles.addItemBtn} onPress={addPackingItem}>
            <Text style={styles.addItemBtnText}>Add</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.listCard}>
        {packingItems.map((item, idx) => (
          <View
            key={item.id}
            style={[
              styles.packingRow,
              idx < packingItems.length - 1 && styles.packingRowBorder,
            ]}
          >
            <Pressable
              style={styles.checkboxArea}
              onPress={() => togglePacking(item.id, item.checked)}
              hitSlop={8}
              accessibilityLabel={`Toggle ${item.label}`}
            >
              <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}>
                {!!item.checked && (
                  <Ionicons name="checkmark" size={14} color={Colors.white} />
                )}
              </View>
              <Text
                style={[
                  styles.packingLabel,
                  item.checked && styles.packingLabelDone,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
            <View style={styles.packingRight}>
              {!!item.is_user_item && (
                <View style={styles.mineChip}>
                  <Text style={styles.mineChipText}>Mine</Text>
                </View>
              )}
              {!!item.is_user_item && (
                <Pressable
                  onPress={() => removePackingItem(item.id)}
                  hitSlop={10}
                  accessibilityLabel={`Remove ${item.label}`}
                >
                  <Ionicons name="close" size={16} color={Colors.muted} />
                </Pressable>
              )}
            </View>
          </View>
        ))}
        {packingItems.length === 0 && (
          <Text style={styles.emptyText}>Tap + to add your first item.</Text>
        )}
      </View>

      {/* ── Leave at home ─────────────────────────────────────────────────── */}
      <Text style={[styles.sectionTitle, { marginTop: 24, marginBottom: 8 }]}>
        Leave at home
      </Text>
      <View style={styles.listCard}>
        {LEAVE_AT_HOME.map((item, idx) => (
          <View
            key={item}
            style={[
              styles.leaveRow,
              idx < LEAVE_AT_HOME.length - 1 && styles.packingRowBorder,
            ]}
          >
            <Ionicons name="close-circle-outline" size={18} color={Colors.pink} />
            <Text style={styles.leaveLabel}>{item}</Text>
          </View>
        ))}
      </View>

      {/* ── Attendee Picks accordion ──────────────────────────────────────── */}
      <Pressable
        style={styles.accordionHeader}
        onPress={() => setPicksOpen(v => !v)}
        accessibilityRole="button"
        accessibilityLabel={picksOpen ? 'Collapse Attendee Picks' : 'Expand Attendee Picks'}
      >
        <Text style={styles.sectionTitle}>Attendee Picks</Text>
        <View style={styles.accordionRight}>
          <View style={styles.countChip}>
            <Text style={styles.countChipText}>{picksCount}</Text>
          </View>
          <Ionicons
            name={picksOpen ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={Colors.ink}
          />
        </View>
      </Pressable>

      {picksOpen ? (
        <View>
          <Text style={styles.picksNote}>
            Sample posts written for this demo. Tips from public news coverage include their source. Not collected from social media.
          </Text>

          {/* Last updated */}
          {lastUpdated ? (
            <Text style={styles.lastUpdated}>Last updated {lastUpdated}</Text>
          ) : null}

          {/* Filter type chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {['All', 'Tips', 'Fits', 'Reviews'].map(f => (
              <Pressable
                key={f}
                style={[
                  styles.filterChip,
                  filterType === f && styles.filterChipActive,
                ]}
                onPress={() => { setFilterType(f); setShowMoreTips(false); }}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    filterType === f && styles.filterChipTextActive,
                  ]}
                >
                  {f}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Top hashtag chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {topTags.map(tag => (
              <Pressable
                key={tag}
                style={[
                  styles.hashChip,
                  activeTag === tag && styles.hashChipActive,
                ]}
                onPress={() => setActiveTag(activeTag === tag ? null : tag)}
              >
                <Text
                  style={[
                    styles.hashChipText,
                    activeTag === tag && styles.hashChipTextActive,
                  ]}
                >
                  {tag}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Feed */}
          {visibleTips.map(tip => (
            <TipCard key={tip.id} tip={tip} onAddToList={addToPackingFromTip} />
          ))}

          {filteredTips.length > 4 && !showMoreTips ? (
            <Pressable
              style={[secondaryButtonStyle, { marginTop: 8, marginBottom: 4 }]}
              onPress={() => setShowMoreTips(true)}
            >
              <Text style={secondaryButtonTextStyle}>
                Show more ({filteredTips.length - 4} left)
              </Text>
            </Pressable>
          ) : null}

          {filteredTips.length === 0 ? (
            <Text style={styles.emptyText}>No posts match this filter.</Text>
          ) : null}

          {/* Add own tip */}
          <View style={[styles.listCard, { marginTop: 20 }]}>
            <Text style={styles.addTipHeading}>Add your own tip</Text>
            <TextInput
              style={styles.tipInput}
              placeholder="Share a tip…"
              placeholderTextColor={Colors.muted}
              value={ownTipText}
              onChangeText={setOwnTipText}
              multiline
              numberOfLines={2}
            />
            <TextInput
              style={[styles.tipInput, { marginTop: 8 }]}
              placeholder="Hashtags, e.g. #shoes #rain"
              placeholderTextColor={Colors.muted}
              value={ownTipTags}
              onChangeText={setOwnTipTags}
              autoCapitalize="none"
            />
            <Text style={styles.addTipNote}>
              Stays only on this device. Not shared anywhere.
            </Text>
            <Pressable
              style={[buttonStyle, { marginTop: 12 }]}
              onPress={submitOwnTip}
            >
              <Text style={buttonTextStyle}>Post tip</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

// ── Tip card sub-component ────────────────────────────────────────────────────

function TipCard({ tip, onAddToList }) {
  const { type, tags, source_name, source_url } = tip;
  const { main, extra } = parseTipText(type, tip.tip_text);
  const tagList = (tags || '').split(' ').filter(t => t.startsWith('#'));
  const isMine = source_name === 'My tip';

  if (type === 'fit') {
    return (
      <View style={styles.tipCard}>
        <View style={styles.fitRow}>
          <View style={styles.fitIconTile}>
            <Ionicons name="shirt" size={24} color={Colors.ink} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.fitTitle}>{main}</Text>
            <Text style={styles.fitPieces}>{extra}</Text>
          </View>
        </View>
        <View style={styles.tipTagsRow}>
          {tagList.map(tag => (
            <View key={tag} style={styles.tagChip}>
              <Text style={styles.tagChipText}>{tag}</Text>
            </View>
          ))}
          <View style={styles.sampleBadge}>
            <Text style={styles.sampleBadgeText}>Sample</Text>
          </View>
        </View>
        <Pressable
          style={styles.addListBtn}
          onPress={() => onAddToList(main)}
        >
          <Ionicons name="add" size={14} color={Colors.ink} />
          <Text style={styles.addListBtnText}>Add to my list</Text>
        </Pressable>
      </View>
    );
  }

  if (type === 'review') {
    const verdict = extra || '';
    const verdictColor = VERDICT_COLORS[verdict] || Colors.paleYellow;
    return (
      <View style={styles.tipCard}>
        <Text style={styles.tipBody}>{main}</Text>
        {verdict ? (
          <View style={[styles.verdictChip, { backgroundColor: verdictColor }]}>
            <Text style={styles.verdictText}>{verdict}</Text>
          </View>
        ) : null}
        <View style={styles.tipTagsRow}>
          {tagList.map(tag => (
            <View key={tag} style={styles.tagChip}>
              <Text style={styles.tagChipText}>{tag}</Text>
            </View>
          ))}
          <View style={styles.sampleBadge}>
            <Text style={styles.sampleBadgeText}>Sample</Text>
          </View>
        </View>
      </View>
    );
  }

  // type === 'tip'
  const hasSource = !!source_url;
  return (
    <View style={styles.tipCard}>
      <Text style={styles.tipBody}>{main}</Text>
      <View style={styles.tipFooter}>
        <View style={styles.tipTagsRow}>
          {tagList.map(tag => (
            <View key={tag} style={styles.tagChip}>
              <Text style={styles.tagChipText}>{tag}</Text>
            </View>
          ))}
          {isMine ? (
            <View style={[styles.sampleBadge, { backgroundColor: Colors.savedBlue }]}>
              <Text style={styles.sampleBadgeText}>My tip</Text>
            </View>
          ) : hasSource ? (
            <Pressable onPress={() => Linking.openURL(source_url)}>
              <Text style={styles.sourceLink}>{source_name}</Text>
            </Pressable>
          ) : (
            <View style={styles.sampleBadge}>
              <Text style={styles.sampleBadgeText}>Sample</Text>
            </View>
          )}
        </View>
        <Pressable
          style={styles.addListBtn}
          onPress={() => onAddToList(main.length > 40 ? main.slice(0, 40) + '…' : main)}
        >
          <Ionicons name="add" size={14} color={Colors.ink} />
          <Text style={styles.addListBtnText}>Add to my list</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 20, paddingTop: 12 },

  heading: {
    ...headingStyle,
    fontSize: 38,
    marginBottom: 20,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: Fonts.display,
    fontSize: 20,
    color: Colors.ink,
  },
  simulatedChip: {
    backgroundColor: Colors.paleYellow,
    borderWidth: 1.5,
    borderColor: Colors.ink,
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  simulatedText: {
    fontFamily: Fonts.detailBold,
    fontSize: 13,
    color: Colors.ink,
  },

  // Forecast
  forecastCard: {
    ...cardStyle,
    marginVertical: 0,
    gap: 12,
  },
  forecastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  forecastInfo: { flex: 1 },
  forecastCondition: {
    fontFamily: Fonts.display,
    fontSize: 20,
    color: Colors.ink,
  },
  forecastDetails: {
    fontFamily: Fonts.detail,
    fontSize: 14,
    color: Colors.muted,
    marginTop: 2,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  suggestionText: {
    ...bodyStyle,
    fontSize: 15,
    flex: 1,
    color: Colors.ink,
  },

  // Plus button for packing
  plusButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.white,
    ...inkOutline,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Add item row
  addItemRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  addItemInput: {
    flex: 1,
    ...inkOutline,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: Fonts.body,
    fontSize: 16,
    color: Colors.ink,
    backgroundColor: Colors.white,
  },
  addItemBtn: {
    backgroundColor: Colors.ink,
    borderRadius: 100,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  addItemBtnText: {
    fontFamily: Fonts.display,
    fontSize: 15,
    color: Colors.white,
  },

  // Packing / leave list card
  listCard: {
    ...cardStyle,
    marginVertical: 0,
    padding: 0,
    overflow: 'hidden',
  },
  packingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    minHeight: 50,
  },
  packingRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  checkboxArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    ...inkOutline,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: Colors.ink,
  },
  packingLabel: {
    fontFamily: Fonts.body,
    fontSize: 16,
    color: Colors.ink,
    flex: 1,
  },
  packingLabelDone: {
    color: Colors.muted,
    textDecorationLine: 'line-through',
  },
  packingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  mineChip: {
    backgroundColor: Colors.savedPink,
    borderWidth: 1.5,
    borderColor: Colors.ink,
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  mineChipText: {
    fontFamily: Fonts.detailBold,
    fontSize: 12,
    color: Colors.ink,
  },
  emptyText: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.muted,
    padding: 16,
  },

  // Leave at home
  leaveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
    minHeight: 50,
  },
  leaveLabel: {
    fontFamily: Fonts.body,
    fontSize: 16,
    color: Colors.ink,
    flex: 1,
  },

  // Accordion
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 4,
  },
  accordionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countChip: {
    backgroundColor: Colors.savedBlue,
    borderWidth: 1.5,
    borderColor: Colors.ink,
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  countChipText: {
    fontFamily: Fonts.detailBold,
    fontSize: 13,
    color: Colors.ink,
  },
  picksNote: {
    fontFamily: Fonts.detail,
    fontSize: 13,
    color: Colors.muted,
    marginBottom: 10,
    lineHeight: 18,
  },
  lastUpdated: {
    fontFamily: Fonts.detail,
    fontSize: 13,
    color: Colors.muted,
    marginBottom: 10,
  },

  // Filter chips
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 10,
  },
  filterChip: {
    ...chipStyle,
    minHeight: 36,
  },
  filterChipActive: {
    ...chipActiveStyle,
  },
  filterChipText: {
    ...chipTextStyle,
    fontSize: 14,
  },
  filterChipTextActive: {
    fontFamily: Fonts.bodyBold,
  },
  hashChip: {
    backgroundColor: Colors.white,
    ...inkOutline,
    borderRadius: 100,
    minHeight: 34,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hashChipActive: {
    backgroundColor: Colors.savedBlue,
  },
  hashChipText: {
    fontFamily: Fonts.detail,
    fontSize: 13,
    color: Colors.ink,
  },
  hashChipTextActive: {
    fontFamily: Fonts.detailBold,
  },

  // Tip cards
  tipCard: {
    ...cardStyle,
    marginVertical: 6,
    gap: 8,
  },
  tipBody: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.ink,
    lineHeight: 21,
  },
  tipFooter: {
    gap: 6,
  },
  tipTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  tagChip: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.divider,
    borderRadius: 100,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  tagChipText: {
    fontFamily: Fonts.detail,
    fontSize: 13,
    color: Colors.muted,
  },
  sampleBadge: {
    backgroundColor: Colors.paleYellow,
    borderWidth: 1.5,
    borderColor: Colors.ink,
    borderRadius: 100,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  sampleBadgeText: {
    fontFamily: Fonts.detailBold,
    fontSize: 12,
    color: Colors.ink,
  },
  sourceLink: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.blue,
    textDecorationLine: 'underline',
  },
  addListBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.white,
    ...inkOutline,
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  addListBtnText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.ink,
  },

  // Fit card extras
  fitRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  fitIconTile: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: Colors.savedBlue,
    ...inkOutline,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  fitTitle: {
    fontFamily: Fonts.display,
    fontSize: 16,
    color: Colors.ink,
  },
  fitPieces: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.muted,
    marginTop: 2,
  },

  // Review verdict chip
  verdictChip: {
    borderWidth: 1.5,
    borderColor: Colors.ink,
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  verdictText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.ink,
  },

  // Add own tip form
  addTipHeading: {
    fontFamily: Fonts.display,
    fontSize: 17,
    color: Colors.ink,
    padding: 16,
    paddingBottom: 8,
  },
  tipInput: {
    ...inkOutline,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.ink,
    backgroundColor: Colors.background,
    marginHorizontal: 16,
  },
  addTipNote: {
    fontFamily: Fonts.detail,
    fontSize: 13,
    color: Colors.muted,
    marginHorizontal: 16,
    marginTop: 6,
  },
  bodyText: {
    ...bodyStyle,
  },
});
