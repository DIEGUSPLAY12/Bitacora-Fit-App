import { Tabs } from 'expo-router';
import { colors } from '../../theme/colors';
import { Home, History, User, Users } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import { MotiView } from 'moti';

function TabIcon({ Icon, focused }: { Icon: any, focused: boolean }) {
  return (
    <MotiView
      animate={{
        scale: focused ? 1.1 : 1,
        backgroundColor: focused ? 'rgba(180, 240, 60, 0.15)' : 'transparent',
      }}
      transition={{ type: 'spring', damping: 15, stiffness: 200 }}
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        width: 48,
        height: 48,
        borderRadius: 24,
      }}
    >
      <Icon 
        color={focused ? colors.accent : colors.textSecondary} 
        size={24} 
        strokeWidth={focused ? 2.5 : 2} 
      />
    </MotiView>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  
  // Floating position logic
  const bottomPadding = Platform.OS === 'ios' ? (insets.bottom > 0 ? insets.bottom - 10 : 24) : 24;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false, // Hide labels for a cleaner, more premium look
        tabBarStyle: {
          position: 'absolute',
          bottom: bottomPadding,
          left: 20,
          right: 20,
          elevation: 10,
          backgroundColor: 'rgba(28, 28, 30, 0.95)',
          borderRadius: 32,
          height: 72,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.08)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.3,
          shadowRadius: 16,
          paddingBottom: 0, // Override default padding
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon Icon={Home} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="historial"
        options={{
          title: 'Historial',
          tabBarIcon: ({ focused }) => <TabIcon Icon={History} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Feed',
          tabBarIcon: ({ focused }) => <TabIcon Icon={Users} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ focused }) => <TabIcon Icon={User} focused={focused} />,
        }}
      />
    </Tabs>
  );
}
