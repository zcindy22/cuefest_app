// Cue theme — colors, fonts, and reusable styles

export const Colors = {
  background: '#F0EFEA',
  black: '#000000',
  white: '#FFFFFF',
  yellow: '#E8DC5A',
  pink: '#DFA0DB',
  blue: '#7C9CF0',
  green: '#9CC76B',
  orange: '#E08A3C',
  red: '#DE5560',
  textMuted: '#555555',
  border: '#000000',
};

// Font family names (loaded via expo-google-fonts packages)
export const Fonts = {
  heading: 'BebasNeue_400Regular',
  label: 'SpaceMono_400Regular',
  body: 'Inter_400Regular',
  bodyBold: 'Inter_700Bold',
};

// Soft shadow — 2 px offset at ~25% black (replaces hard black offset)
export const softShadow = {
  shadowColor: '#000000',
  shadowOffset: { width: 2, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 2,
  elevation: 2,
};

// Card: 2 px border + soft shadow
export const cardStyle = {
  backgroundColor: Colors.white,
  borderWidth: 2,
  borderColor: Colors.black,
  borderRadius: 4,
  ...softShadow,
  padding: 16,
  marginVertical: 8,
};

// Button: pill-friendly base — minHeight 48, bold 17 px text, soft shadow
export const buttonStyle = {
  backgroundColor: Colors.yellow,
  borderWidth: 2,
  borderColor: Colors.black,
  borderRadius: 4,
  ...softShadow,
  minHeight: 48,
  paddingHorizontal: 20,
  alignItems: 'center',
  justifyContent: 'center',
};

export const buttonTextStyle = {
  fontFamily: Fonts.bodyBold,
  fontSize: 17,
  fontWeight: 'bold',
  color: Colors.black,
};

export const headingStyle = {
  fontFamily: Fonts.heading,
  fontSize: 36,
  color: Colors.black,
  letterSpacing: 1,
};

export const labelStyle = {
  fontFamily: Fonts.label,
  fontSize: 11,
  color: Colors.black,
};

export const bodyStyle = {
  fontFamily: Fonts.body,
  fontSize: 14,
  color: Colors.black,
  lineHeight: 20,
};
