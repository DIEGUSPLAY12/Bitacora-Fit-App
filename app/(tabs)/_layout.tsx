import { Tabs } from 'expo-router';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { Home, History, User, Users } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform, TouchableOpacity } from 'react-native';
import { MotiView } from 'moti';

function TabIcon({ Icon, focused }: { Icon: any, focused: boolean }) {
  return (
    <MotiView
      animate={{
        scale: focused ? 1.15 : 1,
        backgroundColor: focused ? 'rgba(180, 240, 60, 0.15)' : 'transparent',
      }}
      transition={{ type: 'spring', damping: 15, stiffness: 200 }}
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        width: 56,
        height: 32,
        borderRadius: 16,
      }}
    >
      <Icon 
        color={focused ? colors.accent : colors.textSecondary} 
        size={22} 
        strokeWidth={focused ? 2.5 : 2} 
      />
    </MotiView>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: 'shift', // Adds a smooth crossfade/shift animation when changing tabs
        sceneStyle: { backgroundColor: colors.background }, // Prevents white flash during animation
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarButton: (props) => <TouchableOpacity {...props} activeOpacity={0.8} />,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: 'rgba(255, 255, 255, 0.08)',
          elevation: 0,
          shadowOpacity: 0,
          height: 65 + insets.bottom,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: typography.fontFamily.medium,
          fontSize: 11,
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
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
