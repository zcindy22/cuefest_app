import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts } from '../../theme/theme';

// Active tab: yellow outlined pill with icon + label in Display 14
function ActiveTabButton({ iconName, label, onPress, onLongPress, children, style }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      style={[tabStyles.tabCell, style]}
      activeOpacity={0.8}
    >
      <View style={tabStyles.activePill}>
        <Ionicons name={iconName} size={20} color={Colors.ink} />
        <Text style={tabStyles.activeLabel} numberOfLines={1}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
}

function InactiveTabButton({ iconName, onPress, onLongPress, style }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      style={[tabStyles.tabCell, style]}
      activeOpacity={0.7}
    >
      <Ionicons name={iconName} size={24} color={Colors.muted} />
    </TouchableOpacity>
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
        tabBarActiveTintColor: 'transparent',
        tabBarInactiveTintColor: Colors.muted,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Plan',
          tabBarButton: (props) =>
            props.accessibilityState?.selected ? (
              <ActiveTabButton {...props} iconName="calendar" label="Plan" />
            ) : (
              <InactiveTabButton {...props} iconName="calendar-outline" />
            ),
        }}
      />
      <Tabs.Screen
        name="my-lineup"
        options={{
          title: 'Discover',
          tabBarButton: (props) =>
            props.accessibilityState?.selected ? (
              <ActiveTabButton {...props} iconName="sparkles" label="Discover" />
            ) : (
              <InactiveTabButton {...props} iconName="sparkles-outline" />
            ),
        }}
      />
      <Tabs.Screen
        name="stage-finder"
        options={{
          title: 'Nav',
          tabBarButton: (props) =>
            props.accessibilityState?.selected ? (
              <ActiveTabButton {...props} iconName="map" label="Nav" />
            ) : (
              <InactiveTabButton {...props} iconName="map-outline" />
            ),
        }}
      />
      <Tabs.Screen
        name="wear-bring"
        options={{
          title: 'Wear & Tips',
          tabBarButton: (props) =>
            props.accessibilityState?.selected ? (
              <ActiveTabButton {...props} iconName="shirt" label="Wear & Tips" />
            ) : (
              <InactiveTabButton {...props} iconName="shirt-outline" />
            ),
        }}
      />
    </Tabs>
  );
}

const tabStyles = StyleSheet.create({
  tabCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  },
  activeLabel: {
    fontFamily: Fonts.display,
    fontSize: 14,
    color: Colors.ink,
  },
});
