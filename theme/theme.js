// Cue theme v3 — colors, fonts, type scale and reusable styles
// Look and feel: bright, soft, dreamy. Pink + blue + yellow on warm off-white.

// ─── Colors ───────────────────────────────────────────────────────────────────
export const Colors = {
  // Surfaces
  background: '#FFFAF2',
  white:      '#FFFFFF',
  divider:    '#E4D8C8',

  // Text
  ink:        '#1B1B22',
  muted:      '#6E6E7A',

  // Brand
  pink:       '#FF7EB6',
  blue:       '#6FA8FF',
  yellow:     '#FFD84A',
  peach:      '#FF9A6B',
  lilac:      '#B9A6FF',

  // Semantic fills
  paleYellow: '#FFF0A8',
  savedBlue:  '#BBD4FF',
  savedPink:  '#FFC2DD',

  // Deep shades for bubble outlines
  deepYellow: '#E0B000',
  deepBlue:   '#3F7FE8',
  deepPeach:  '#F2733F',
  deepPink:   '#E8559B',
  deepLilac:  '#8C73E6',

  // Kept for compatibility
  black:      '#1B1B22',
  textMuted:  '#6E6E7A',
  border:     '#1B1B22',
};

// ─── Fonts ────────────────────────────────────────────────────────────────────
// Display  → Bricolage Grotesque ExtraBold  (screen titles, act names, buttons, tabs)
// Body     → DM Sans Regular / Medium / Bold (sentences, chips, inputs)
// Detail   → Nunito SemiBold / Bold (times, genre lines, labels, captions)
export const Fonts = {
  display:    'BricolageGrotesque_800ExtraBold',
  body:       'DMSans_400Regular',
  bodyMedium: 'DMSans_500Medium',
  bodyBold:   'DMSans_700Bold',
  detail:     'Nunito_600SemiBold',
  detailBold: 'Nunito_700Bold',
};

// ─── Type scale (nothing under 12) ────────────────────────────────────────────
// Screen title:    36–40  Display
// Day tabs:        28 sel / 24 unsel  Display
// Section/stage:   20–22  Display
// Act/card names:  15–17  Display
// Body text:       16     DM Sans
// Chips/buttons:   14–15  DM Sans Bold
// Main button:     17     Display
// Times/captions:  13     Nunito SemiBold
// Small labels:    14     Nunito Bold
// Active tab:      14     Display

// ─── Shared style primitives ──────────────────────────────────────────────────

// 1.5 px ink outline — no shadows anywhere
export const inkOutline = {
  borderWidth: 1.5,
  borderColor: Colors.ink,
};

// Cards: white, 1.5 px ink outline, r16
export const cardStyle = {
  backgroundColor: Colors.white,
  ...inkOutline,
  borderRadius: 16,
  padding: 16,
  marginVertical: 8,
};

// Main button: ink pill, 56 h, full width, white text
export const buttonStyle = {
  backgroundColor: Colors.ink,
  borderRadius: 100,
  minHeight: 56,
  paddingHorizontal: 24,
  alignItems: 'center',
  justifyContent: 'center',
};

export const buttonTextStyle = {
  fontFamily: Fonts.display,
  fontSize: 17,
  color: Colors.white,
};

// Secondary button: white pill, ink outline
export const secondaryButtonStyle = {
  backgroundColor: Colors.white,
  ...inkOutline,
  borderRadius: 100,
  minHeight: 48,
  paddingHorizontal: 20,
  alignItems: 'center',
  justifyContent: 'center',
};

export const secondaryButtonTextStyle = {
  fontFamily: Fonts.bodyBold,
  fontSize: 15,
  color: Colors.ink,
};

// Chip: pill, 38–40 h. Selected = yellow. Unselected = white + ink outline.
export const chipStyle = {
  backgroundColor: Colors.white,
  ...inkOutline,
  borderRadius: 100,
  minHeight: 38,
  paddingHorizontal: 14,
  alignItems: 'center',
  justifyContent: 'center',
};

export const chipTextStyle = {
  fontFamily: Fonts.bodyBold,
  fontSize: 14,
  color: Colors.ink,
};

export const chipActiveStyle = {
  backgroundColor: Colors.yellow,
};

// Headings use Display font
export const headingStyle = {
  fontFamily: Fonts.display,
  fontSize: 36,
  color: Colors.ink,
};

export const labelStyle = {
  fontFamily: Fonts.detail,
  fontSize: 13,
  color: Colors.ink,
};

export const bodyStyle = {
  fontFamily: Fonts.body,
  fontSize: 16,
  color: Colors.ink,
  lineHeight: 22,
};
