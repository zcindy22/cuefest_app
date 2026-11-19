import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts } from '../../theme/theme';

// Active tab: yellow outlined pill with icon + label in Display 14
function ActiveTabIcon({ iconName, label }) {
  return (
    <View style={tabStyles.activePill}>
      <Ionicons name={iconName} size={20} color={Colors.ink} />
      <Text style={tabStyles.activeLabel} numberOfLines={1}>{label}</Text>
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopWidth: 1.5,
          borderTopColor: Colors.ink,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
        },
        tabBarActiveTintColor: Colors.ink,
        tabBarInactiveTintColor: Colors.muted,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Lineup',
          tabBarIcon: ({ focused }) =>
            focused ? (
              <ActiveTabIcon iconName="calendar" label="Lineup" />
            ) : (
              <Ionicons name="calendar-outline" size={24} color={Colors.muted} />
            ),
        }}
      />
      <Tabs.Screen
        name="my-lineup"
        options={{
          title: 'Discover',
          tabBarIcon: ({ focused }) =>
            focused ? (
              <ActiveTabIcon iconName="sparkles" label="Discover" />
            ) : (
              <Ionicons name="sparkles-outline" size={24} color={Colors.muted} />
            ),
        }}
      />
      <Tabs.Screen
        name="stage-finder"
        options={{
          title: 'Map',
          tabBarIcon: ({ focused }) =>
            focused ? (
              <ActiveTabIcon iconName="map" label="Map" />
            ) : (
              <Ionicons name="map-outline" size={24} color={Colors.muted} />
            ),
        }}
      />
      <Tabs.Screen
        name="wear-bring"
        options={{
          title: 'Wear',
          tabBarIcon: ({ focused }) =>
            focused ? (
              <ActiveTabIcon iconName="shirt" label="Wear" />
            ) : (
              <Ionicons name="shirt-outline" size={24} color={Colors.muted} />
            ),
        }}
      />
    </Tabs>
  );
}

const tabStyles = StyleSheet.create({
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.yellow,
    borderWidth: 1.5,
    borderColor: Colors.ink,
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 6,
    minHeight: 36,
    alignSelf: 'center',
  },
  activeLabel: {
    fontFamily: Fonts.display,
    fontSize: 14,
    color: Colors.ink,
    flexShrink: 0,
  },
});
