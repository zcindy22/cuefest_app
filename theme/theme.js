// Cue theme — colors, fonts, and reusable styles

export const Colors = {
  background: '#F0EFEA',
  black: '#000000',
  white: '#FFFFFF',
  yellow: '#E8DC5A',
  pink: '#DFA0DB',
  blue: '#7C9CF0',
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

// Chunky card: thick black border + hard offset shadow
export const cardStyle = {
  backgroundColor: Colors.white,
  borderWidth: 2,
  borderColor: Colors.black,
  borderRadius: 4,
  // Hard shadow — offset right+down, no blur
  shadowColor: Colors.black,
  shadowOffset: { width: 4, height: 4 },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: 4, // Android
  padding: 16,
  marginVertical: 8,
};

// Chunky button: same treatment
export const buttonStyle = {
  backgroundColor: Colors.yellow,
  borderWidth: 2,
  borderColor: Colors.black,
  borderRadius: 4,
  shadowColor: Colors.black,
  shadowOffset: { width: 3, height: 3 },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: 3,
  paddingVertical: 10,
  paddingHorizontal: 20,
  alignItems: 'center',
};

export const buttonTextStyle = {
  fontFamily: Fonts.bodyBold,
  fontSize: 14,
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
