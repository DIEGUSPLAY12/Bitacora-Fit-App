import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../theme/colors';
import { typography, rs } from '../../theme/typography';
import { ArrowLeft, Edit, User, Users } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useChats } from '../../hooks/useChats';
import { useAuth } from '../../hooks/useAuth';
import { Image } from 'expo-image';

function getRelativeTimeShort(dateString: string) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMins = Math.round(diffInMs / 60000);
  
  if (diffInMins < 60) return `${Math.max(1, diffInMins)}m`;
  
  const diffInHours = Math.round(diffInMins / 60);
  if (diffInHours < 24) return `${diffInHours}h`;
  
  const diffInDays = Math.round(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d`;
  
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
}

export default function ChatsInboxScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  
  const { data: chats, isLoading } = useChats();

  const renderChatItem = ({ item }: { item: any }) => {
    // Determine chat name and avatar
    let chatName = item.name;
    let avatarUrl = null;
    let isGroup = item.type === 'group';
    
    if (!isGroup) {
      // Find the other member
      const otherMember = item.chat_members?.find((m: any) => m.user_id !== user?.id);
      if (otherMember) {
        chatName = otherMember.profiles?.username || 'Usuario';
        avatarUrl = otherMember.profiles?.avatar_url;
      }
    }

    const lastMessage = item.lastMessage;
    let lastMsgText = '';
    if (lastMessage) {
      if (lastMessage.shared_workout_id) {
        lastMsgText = '🏋️ Entreno compartido';
      } else {
        lastMsgText = lastMessage.content || '';
      }
    } else {
      lastMsgText = 'Empieza a chatear';
    }

    const unreadCount = item.unreadCount || 0;
    const hasUnread = unreadCount > 0;

    return (
      <TouchableOpacity 
        style={styles.chatRow} 
        activeOpacity={0.7}
        onPress={() => router.push(`/chats/${item.id}`)}
      >
        <View style={styles.avatarContainer}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} contentFit="cover" />
          ) : (
            isGroup ? <Users color={colors.background} size={20} /> : <User color={colors.background} size={20} />
          )}
        </View>
        
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={[styles.chatName, hasUnread && styles.chatNameUnread]} numberOfLines={1}>{chatName}</Text>
            {lastMessage && (
              <Text style={[styles.timeText, hasUnread && styles.timeTextUnread]}>{getRelativeTimeShort(lastMessage.created_at)}</Text>
            )}
          </View>
          <View style={styles.chatFooter}>
            <Text style={[styles.lastMessage, hasUnread && styles.lastMessageUnread]} numberOfLines={1}>
              {lastMsgText}
            </Text>
            {hasUnread && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Mensajes</Text>
        </View>
        <TouchableOpacity 
          style={styles.newChatButton} 
          onPress={() => router.push('/chats/nuevo')}
        >
          <Edit color={colors.accent} size={20} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 60 }} />
      ) : chats?.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconBg}>
            <Edit color={colors.textSecondary} size={32} />
          </View>
          <Text style={styles.emptyTitle}>Bandeja vacía</Text>
          <Text style={styles.emptyText}>No tienes conversaciones activas. ¡Crea un nuevo chat o grupo para empezar!</Text>
          <TouchableOpacity 
            style={styles.emptyButton}
            onPress={() => router.push('/chats/nuevo')}
          >
            <Text style={styles.emptyButtonText}>Nuevo chat</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={item => item.id}
          renderItem={renderChatItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 22,
    color: colors.textPrimary,
  },
  newChatButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(180, 240, 60, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  listContent: {
    paddingTop: 10,
    paddingBottom: 40,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.textSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  avatar: { width: '100%', height: '100%' },
  chatInfo: { flex: 1, justifyContent: 'center' },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  chatName: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 16,
    color: colors.textPrimary,
    flex: 1,
    marginRight: 10,
  },
  chatNameUnread: {
    fontFamily: typography.fontFamily.bold,
  },
  timeText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  timeTextUnread: {
    color: colors.accent,
    fontFamily: typography.fontFamily.bold,
  },
  chatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
    marginRight: 10,
  },
  lastMessageUnread: {
    fontFamily: typography.fontFamily.semibold,
    color: colors.textPrimary,
  },
  unreadBadge: {
    backgroundColor: colors.accent,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: colors.background,
    fontFamily: typography.fontFamily.bold,
    fontSize: 11,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginLeft: 92, // avatar width + margins
  },
  
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 20,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  emptyButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 20,
  },
  emptyButtonText: {
    fontFamily: typography.fontFamily.semibold,
    color: colors.background,
    fontSize: 16,
  }
});
