import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { SymbolView } from 'expo-symbols';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#E8DC5A',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: { backgroundColor: '#000', borderTopColor: '#000' },
        headerStyle: { backgroundColor: '#000' },
        headerTintColor: '#F0EFEA',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Getting There',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'map', android: 'map', web: 'map' }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="stage-finder"
        options={{
          title: 'Stage Finder',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'music.note', android: 'music_note', web: 'music_note' }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="wear-bring"
        options={{
          title: 'Wear & Bring',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'bag', android: 'shopping_bag', web: 'shopping_bag' }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
    </Tabs>
  );
}
