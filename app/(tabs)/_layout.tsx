import { Tabs } from 'expo-router';
import { colors } from '../../theme/colors';
import { Home, History, User } from 'lucide-react-native';
import { typography } from '../../theme/typography';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: colors.background,
        borderTopWidth: 1,
        borderTopColor: colors.surface,
        elevation: 0,
        shadowOpacity: 0,
        height: 60,
        paddingBottom: 8,
        paddingTop: 8,
      },
      tabBarActiveTintColor: colors.accent,
      tabBarInactiveTintColor: colors.textSecondary,
      tabBarLabelStyle: {
        fontFamily: typography.fontFamily.medium,
        fontSize: typography.scale.caption.fontSize,
      }
    }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Home color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="historial"
        options={{
          title: 'Historial',
          tabBarIcon: ({ color }) => <History color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <User color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}
