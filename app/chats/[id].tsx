import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { ArrowLeft, Send, Users, User, Dumbbell, Check, CheckCheck, Repeat } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useChats, useChatMessages, useSendMessage, useMarkChatRead } from '../../hooks/useChats';
import { useAuth } from '../../hooks/useAuth';
import { Image } from 'expo-image';
import { useQueryClient } from '@tanstack/react-query';

function getMessageTime(dateString: string) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function isSameDay(d1: string, d2: string) {
  if (!d1 || !d2) return false;
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  return date1.getFullYear() === date2.getFullYear() && 
         date1.getMonth() === date2.getMonth() && 
         date1.getDate() === date2.getDate();
}

function getDateSeparatorText(dateString: string) {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (isSameDay(dateString, today.toISOString())) return 'Hoy';
  if (isSameDay(dateString, yesterday.toISOString())) return 'Ayer';
  
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function ChatDetailScreen() {
  const { id } = useLocalSearchParams();
  const chatId = Array.isArray(id) ? id[0] : id;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  
  const { data: chats } = useChats();
  const chat = chats?.find(c => c.id === chatId);
  
  const { data: messages, isLoading } = useChatMessages(chatId);
  const { mutate: sendMessage, isPending: isSending } = useSendMessage();
  const { mutate: markRead } = useMarkChatRead();

  // Marcar como leído al entrar o al recibir mensajes
  useEffect(() => {
    if (chatId) {
      markRead(chatId);
    }
  }, [chatId, messages?.length]);

  // Suscripción en tiempo real a mensajes, lecturas y última conexión
  useEffect(() => {
    if (!chatId) return;
    
    let channel = supabase.channel(`chat_${chatId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages', filter: `chat_id=eq.${chatId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['chat_messages', chatId] });
        queryClient.invalidateQueries({ queryKey: ['chats'] });
        markRead(chatId); // Si estamos dentro del chat y llega un mensaje, lo leemos
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_members', filter: `chat_id=eq.${chatId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['chats'] });
      });

    // Si sabemos quién es el otro miembro, escuchamos su "última vez visto"
    if (otherMember?.user_id) {
      channel = channel.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${otherMember.user_id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['chats'] });
      });
    }

    channel.subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, otherMember?.user_id]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    sendMessage({ chatId, content: inputText.trim() });
    setInputText('');
  };

  // Determine chat name
  let chatName = chat?.name;
  let isGroup = chat?.type === 'group';
  
  const otherMember = chat?.chat_members?.find((m: any) => m.user_id !== user?.id);
  const otherLastReadAt = otherMember?.last_read_at;
  const otherLastSeenAt = otherMember?.profiles?.last_seen_at;

  if (!isGroup && otherMember) {
    chatName = otherMember.profiles?.username || 'Usuario';
  }

  const renderMessage = ({ item, index }: { item: any, index: number }) => {
    const isMe = item.user_id === user?.id;
    const prevItem = messages?.[index - 1];
    const nextItem = messages?.[index + 1];
    
    // Header logic (Avatar and Name) depends on PREVIOUS message
    const isSameUserAsPrev = prevItem && prevItem.user_id === item.user_id;
    const isSameDateAsPrev = prevItem && isSameDay(prevItem.created_at, item.created_at);
    const showHeader = !isSameUserAsPrev || !isSameDateAsPrev;
    const showDateSeparator = !isSameDateAsPrev;
    
    // Margin logic depends on NEXT message
    const isSameUserAsNext = nextItem && nextItem.user_id === item.user_id;
    const isSameDateAsNext = nextItem && isSameDay(item.created_at, nextItem.created_at);
    
    // No juntar demasiado si este mensaje o el siguiente es una tarjeta de entrenamiento
    const isGroupedWithNext = 
      isSameUserAsNext && 
      isSameDateAsNext && 
      !item.shared_workout_id && 
      !nextItem?.shared_workout_id;
      
    // Lógica de Checks
    const isDirect = chat?.type === 'direct';
    let statusIcon = null;
    if (isMe && isDirect) {
      const msgDate = new Date(item.created_at).getTime();
      const readDate = otherLastReadAt ? new Date(otherLastReadAt).getTime() : 0;
      const seenDate = otherLastSeenAt ? new Date(otherLastSeenAt).getTime() : 0;

      if (msgDate <= readDate) {
        // Leído
        statusIcon = <CheckCheck color="#0A84FF" size={14} style={styles.statusIcon} />;
      } else if (msgDate <= seenDate) {
        // Entregado
        statusIcon = <CheckCheck color="rgba(0,0,0,0.35)" size={14} style={styles.statusIcon} />;
      } else {
        // Enviado
        statusIcon = <Check color="rgba(0,0,0,0.35)" size={14} style={styles.statusIcon} />;
      }
    }
    
    return (
      <View>
        {showDateSeparator && (
          <View style={styles.dateSeparator}>
            <Text style={styles.dateSeparatorText}>{getDateSeparatorText(item.created_at)}</Text>
          </View>
        )}
        
        {/* Shared Workout Card */}
        {item.shared_workout_id && item.workouts ? (
          <View style={[
            styles.messageRow, 
            isMe ? styles.messageRowMe : styles.messageRowOther,
            isGroupedWithNext && styles.messageRowGrouped
          ]}>
            {!isMe && isGroup && (
              <View style={styles.avatarSpacer}>
                {showHeader ? (
                  <Image source={{ uri: item.profiles?.avatar_url }} style={styles.messageAvatar} />
                ) : null}
              </View>
            )}
            <TouchableOpacity 
              style={[styles.workoutCard, isMe ? styles.workoutCardMe : styles.workoutCardOther]}
              activeOpacity={0.85}
              onPress={() => router.push(item.workouts.is_template ? `/template/${item.workouts.id}` : `/entrenos/${item.workouts.id}`)}
            >
              {/* Gradient background */}
              <LinearGradient
                colors={['#1F2514', '#10140A']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.65)']}
                style={StyleSheet.absoluteFill}
                locations={[0.2, 1]}
              />

              <View style={styles.workoutCardInner}>
                {/* Badge */}
                <View style={styles.workoutBadge}>
                  <Text style={styles.workoutBadgeText}>
                    {item.workouts.is_template ? 'Plantilla' : 'Entreno'}
                  </Text>
                </View>

                {/* Title */}
                <Text style={styles.workoutCardTitle} numberOfLines={2}>
                  {item.workouts.name}
                </Text>

                {/* Stats row */}
                <View style={styles.workoutCardStats}>
                  <View style={styles.workoutCardStat}>
                    <Dumbbell color={colors.accent} size={13} style={{ marginRight: 5 }} />
                    <Text style={styles.workoutCardStatText}>
                      {item.workouts.workout_exercises?.length || 0} ejercicios
                    </Text>
                  </View>
                  {(item.workouts.workout_exercises || []).reduce((acc: number, we: any) => acc + (we.sets?.length || 0), 0) > 0 && (
                    <>
                      <View style={styles.workoutStatDot} />
                      <View style={styles.workoutCardStat}>
                        <Repeat color={colors.accent} size={13} style={{ marginRight: 5 }} />
                        <Text style={styles.workoutCardStatText}>
                          {(item.workouts.workout_exercises || []).reduce((acc: number, we: any) => acc + (we.sets?.length || 0), 0)} series
                        </Text>
                      </View>
                    </>
                  )}
                </View>

                {/* CTA Button */}
                <View style={styles.workoutCardButton}>
                  <Text style={styles.workoutCardButtonText}>Ver detalle</Text>
                </View>

                {/* Time */}
                <View style={styles.timeContainer}>
                  <Text style={[styles.timeText, styles.timeTextOther]}>
                    {getMessageTime(item.created_at)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[
            styles.messageRow, 
            isMe ? styles.messageRowMe : styles.messageRowOther,
            isGroupedWithNext && styles.messageRowGrouped
          ]}>
            {!isMe && isGroup && (
              <View style={styles.avatarSpacer}>
                {showHeader ? (
                  <Image source={{ uri: item.profiles?.avatar_url }} style={styles.messageAvatar} />
                ) : null}
              </View>
            )}
            <View style={[
              styles.messageBubble, 
              isMe ? styles.messageBubbleMe : styles.messageBubbleOther,
              !showHeader && (isMe ? styles.messageBubbleMeGrouped : styles.messageBubbleOtherGrouped)
            ]}>
              {!isMe && isGroup && showHeader && <Text style={styles.senderName}>{item.profiles?.username}</Text>}
              <View style={styles.messageContent}>
                <Text style={[styles.messageText, isMe ? styles.messageTextMe : styles.messageTextOther]}>
                  {item.content}
                </Text>
                <View style={styles.timeContainerText}>
                  <Text style={[styles.timeText, isMe ? styles.timeTextMe : styles.timeTextOther]}>
                    {getMessageTime(item.created_at)}
                  </Text>
                  {statusIcon}
                </View>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft color={colors.textPrimary} size={24} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.title} numberOfLines={1}>{chatName}</Text>
          {isGroup && <Text style={styles.subtitle}>{chat?.chat_members?.length} miembros</Text>}
        </View>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.accent} style={{ flex: 1 }} />
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TextInput
          style={styles.textInput}
          placeholder="Escribe un mensaje..."
          placeholderTextColor={colors.textSecondary}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity 
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]} 
          onPress={handleSend}
          disabled={!inputText.trim() || isSending}
          activeOpacity={0.7}
        >
          {isSending ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <Send color={!inputText.trim() ? colors.textSecondary : colors.background} size={20} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginRight: 12,
  },
  headerInfo: { flex: 1, alignItems: 'center' },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 18,
    color: colors.textPrimary,
  },
  subtitle: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 0,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateSeparatorText: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontFamily: typography.fontFamily.medium,
    fontSize: 12,
    color: colors.textSecondary,
    overflow: 'hidden',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  messageRowGrouped: {
    marginBottom: 4,
  },
  messageRowMe: {
    justifyContent: 'flex-end',
  },
  messageRowOther: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceElevated,
  },
  avatarSpacer: {
    width: 28,
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
  },
  messageBubbleMe: {
    backgroundColor: colors.accent,
    borderBottomRightRadius: 4,
  },
  messageBubbleMeGrouped: {
    borderBottomRightRadius: 16,
    borderTopRightRadius: 4,
  },
  messageBubbleOther: {
    backgroundColor: colors.surfaceElevated,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  messageBubbleOtherGrouped: {
    borderBottomLeftRadius: 16,
    borderTopLeftRadius: 4,
  },
  senderName: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 12,
    color: colors.accent,
    marginBottom: 2,
    marginLeft: 4,
  },
  messageContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
  },
  messageText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: 2,
    paddingBottom: 0,
  },
  messageTextMe: {
    color: colors.background,
  },
  messageTextOther: {
    color: colors.textPrimary,
  },
  timeContainerText: {
    marginLeft: 8,
    alignSelf: 'flex-end',
    marginBottom: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusIcon: {
    marginLeft: 2,
  },
  timeContainer: {
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  timeText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 10,
  },
  timeTextMe: {
    color: 'rgba(0,0,0,0.7)',
  },
  timeTextOther: {
    color: colors.textSecondary,
  },
  
  // Shared Workout Card in chat
  workoutCard: {
    width: '78%',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(180, 240, 60, 0.2)',
  },
  workoutCardMe: {
    borderBottomRightRadius: 4,
  },
  workoutCardOther: {
    borderBottomLeftRadius: 4,
  },
  workoutCardInner: {
    padding: 16,
    gap: 12,
    zIndex: 2,
  },
  workoutBadge: {
    backgroundColor: 'rgba(180, 240, 60, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(180, 240, 60, 0.3)',
  },
  workoutBadgeText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 10,
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  workoutCardTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 20,
    color: colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    lineHeight: 26,
  },
  workoutCardStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  workoutCardStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutStatDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  workoutCardStatText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  workoutCardButton: {
    backgroundColor: colors.accent,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  workoutCardButtonText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 14,
    color: colors.background,
  },
  
  // Input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 24,
    minHeight: 48,
    maxHeight: 120,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 14,
    color: colors.textPrimary,
    fontFamily: typography.fontFamily.regular,
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  sendButtonDisabled: {
    backgroundColor: colors.surfaceElevated,
  }
});
