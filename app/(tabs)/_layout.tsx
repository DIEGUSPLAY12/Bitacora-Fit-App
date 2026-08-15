import { Tabs } from 'expo-router';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { Home, History, User, Users, MessageCircle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform, TouchableOpacity, View, Text } from 'react-native';
import { MotiView } from 'moti';
import { useFriendRequests } from '../../hooks/useFriends';
import { useChats } from '../../hooks/useChats';

function TabIcon({ Icon, focused, badgeCount = 0 }: { Icon: any, focused: boolean, badgeCount?: number }) {
  return (
    <View style={{ position: 'relative' }}>
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
      {badgeCount > 0 && (
        <View style={{
          position: 'absolute',
          top: -4,
          right: 8,
          backgroundColor: colors.destructive,
          minWidth: 16,
          height: 16,
          borderRadius: 8,
          justifyContent: 'center',
          alignItems: 'center',
          borderWidth: 2,
          borderColor: colors.background,
        }}>
          <Text style={{
            color: 'white',
            fontSize: 9,
            fontFamily: typography.fontFamily.bold,
            paddingHorizontal: 3,
          }}>
            {badgeCount > 9 ? '9+' : badgeCount}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { data: requests } = useFriendRequests();
  const pendingCount = requests?.length || 0;
  
  const { data: chats } = useChats();
  const unreadChatsCount = chats?.reduce((total, chat) => total + (chat.unreadCount > 0 ? 1 : 0), 0) || 0;

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
          tabBarIcon: ({ focused }) => <TabIcon Icon={Users} focused={focused} badgeCount={pendingCount} />,
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: 'Chats',
          tabBarIcon: ({ focused }) => <TabIcon Icon={MessageCircle} focused={focused} badgeCount={unreadChatsCount} />,
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
