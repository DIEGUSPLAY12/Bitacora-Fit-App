import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, } from 'react-native';
import { customAlert as Alert } from '../../../store/alert-store';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors } from '../../../theme/colors';
import { typography, rs } from '../../../theme/typography';
import { ArrowLeft, Send, User, Trash2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWorkoutComments, usePostComment, useDeleteComment } from '../../../hooks/useComments';
import { useAuth } from '../../../hooks/useAuth';
import { Image } from 'expo-image';

function getRelativeTime(dateString: string) {
  if (!dateString) return '';
  const diffInMs = new Date().getTime() - new Date(dateString).getTime();
  const diffInMins = Math.round(diffInMs / 60000);
  if (diffInMins < 60) return `${Math.max(1, diffInMins)}m`;
  const diffInHours = Math.round(diffInMins / 60);
  if (diffInHours < 24) return `${diffInHours}h`;
  const diffInDays = Math.round(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d`;
  return new Date(dateString).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
}

export default function WorkoutCommentsScreen() {
  const { id } = useLocalSearchParams();
  const workoutId = Array.isArray(id) ? id[0] : id;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  
  const { data: comments, isLoading } = useWorkoutComments(workoutId);
  const { mutate: postComment, isPending: isPosting } = usePostComment();
  const { mutate: deleteComment } = useDeleteComment();

  const handlePost = () => {
    if (!inputText.trim()) return;
    postComment({ workoutId, content: inputText.trim() });
    setInputText('');
  };

  const handleDelete = (commentId: string) => {
    Alert.alert('Eliminar comentario', '¿Estás seguro de que quieres eliminar este comentario?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => deleteComment({ commentId }) }
    ]);
  };

  const renderComment = ({ item }: { item: any }) => {
    const isMe = item.profiles?.id === user?.id;
    
    return (
      <View style={styles.commentRow}>
        <View style={styles.avatarContainer}>
          {item.profiles?.avatar_url ? (
            <Image source={{ uri: item.profiles.avatar_url }} style={styles.avatar} contentFit="cover" />
          ) : (
            <User color={colors.background} size={16} />
          )}
        </View>
        <View style={styles.commentContent}>
          <View style={styles.commentHeader}>
            <Text style={styles.username}>{item.profiles?.username || 'Usuario'}</Text>
            <Text style={styles.timeText}>{getRelativeTime(item.created_at)}</Text>
          </View>
          <Text style={styles.commentText}>{item.content}</Text>
        </View>
        
        {isMe && (
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => handleDelete(item.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Trash2 color={colors.textSecondary} size={16} />
          </TouchableOpacity>
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
        <Text style={styles.title}>Comentarios</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.accent} style={{ flex: 1 }} />
      ) : comments?.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Sé el primero en comentar en este entrenamiento.</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={comments}
          keyExtractor={item => item.id}
          renderItem={renderComment}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TextInput
          style={styles.textInput}
          placeholder="Añade un comentario..."
          placeholderTextColor={colors.textSecondary}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={300}
        />
        <TouchableOpacity 
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]} 
          onPress={handlePost}
          disabled={!inputText.trim() || isPosting}
          activeOpacity={0.7}
        >
          {isPosting ? (
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
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 18,
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  
  listContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 16,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.textSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatar: { width: '100%', height: '100%' },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  username: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 14,
    color: colors.textPrimary,
    marginRight: 8,
  },
  timeText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  commentText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  deleteButton: {
    padding: 4,
    marginLeft: 8,
  },
  
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  
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
