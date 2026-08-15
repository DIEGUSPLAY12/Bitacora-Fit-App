import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors } from '../theme/colors';
import { typography, rs } from '../theme/typography';
import { ArrowLeft, Send, Users, User, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useChats, useSendMessage } from '../hooks/useChats';
import { useAuth } from '../hooks/useAuth';
import { Image } from 'expo-image';

export default function CompartirScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { workoutId } = useLocalSearchParams();
  const { user } = useAuth();
  
  const { data: chats, isLoading } = useChats();
  const { mutateAsync: sendMessage, isPending } = useSendMessage();

  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  const handleShare = async (chatId: string) => {
    try {
      setSelectedChatId(chatId);
      await sendMessage({ 
        chatId, 
        sharedWorkoutId: Array.isArray(workoutId) ? workoutId[0] : workoutId 
      });
      router.replace(`/chats/${chatId}`);
    } catch (e: any) {
      Alert.alert('Error', 'No se pudo compartir el entrenamiento: ' + e.message);
      setSelectedChatId(null);
    }
  };

  const renderChatItem = ({ item }: { item: any }) => {
    let chatName = item.name;
    let avatarUrl = null;
    let isGroup = item.type === 'group';
    
    if (!isGroup) {
      const otherMember = item.chat_members?.find((m: any) => m.user_id !== user?.id);
      if (otherMember) {
        chatName = otherMember.profiles?.username || 'Usuario';
        avatarUrl = otherMember.profiles?.avatar_url;
      }
    }

    const isSendingHere = isPending && selectedChatId === item.id;

    return (
      <TouchableOpacity 
        style={styles.chatRow} 
        activeOpacity={0.7}
        onPress={() => handleShare(item.id)}
        disabled={isPending}
      >
        <View style={styles.avatarContainer}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} contentFit="cover" />
          ) : (
            isGroup ? <Users color={colors.background} size={18} /> : <User color={colors.background} size={18} />
          )}
        </View>
        
        <Text style={styles.chatName} numberOfLines={1}>{chatName}</Text>
        
        <View style={styles.sendButton}>
          {isSendingHere ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <Text style={styles.sendButtonText}>Enviar</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <X color={colors.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Compartir con...</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 60 }} />
      ) : chats?.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No tienes chats activos. Crea uno primero para compartir entrenamientos.</Text>
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 18,
    color: colors.textPrimary,
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.textSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    overflow: 'hidden',
  },
  avatar: { width: '100%', height: '100%' },
  chatName: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 16,
    color: colors.textPrimary,
    flex: 1,
    marginRight: 10,
  },
  sendButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(180, 240, 60, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(180, 240, 60, 0.2)',
    width: 76,
    alignItems: 'center',
  },
  sendButtonText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 13,
    color: colors.accent,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginLeft: 78,
  },
  
  emptyState: {
    padding: 40,
  },
  emptyText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
