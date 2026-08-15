import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { ArrowLeft, Check, Users } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFriends } from '../../hooks/useFriends';
import { useCreateChat } from '../../hooks/useChats';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

export default function NewChatScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const { data: friends, isLoading } = useFriends();
  const { mutateAsync: createChat, isPending } = useCreateChat();
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleCreate = async () => {
    if (selectedIds.length === 0) return;
    
    const isGroup = selectedIds.length > 1;
    if (isGroup && !groupName.trim()) {
      Alert.alert('Nombre requerido', 'Por favor, dale un nombre al grupo.');
      return;
    }

    try {
      const chatId = await createChat({
        type: isGroup ? 'group' : 'direct',
        name: isGroup ? groupName.trim() : undefined,
        memberIds: selectedIds
      });
      
      router.replace(`/chats/${chatId}`);
    } catch (e: any) {
      Alert.alert('Error', 'No se pudo crear el chat: ' + e.message);
    }
  };

  const renderFriend = ({ item }: { item: any }) => {
    const isSelected = selectedIds.includes(item.id);
    return (
      <TouchableOpacity 
        style={styles.friendRow} 
        activeOpacity={0.7}
        onPress={() => toggleSelect(item.id)}
      >
        <View style={styles.avatarContainer}>
          {item.avatar_url ? (
            <Image source={{ uri: item.avatar_url }} style={styles.avatar} contentFit="cover" />
          ) : (
            <Text style={styles.avatarInitial}>{item.username.charAt(0).toUpperCase()}</Text>
          )}
        </View>
        <Text style={styles.friendName}>{item.username}</Text>
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Check color={colors.background} size={14} strokeWidth={3} />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft color={colors.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Nuevo chat</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {selectedIds.length > 1 && (
          <View style={styles.groupNameContainer}>
            <Text style={styles.groupNameLabel}>NOMBRE DEL GRUPO</Text>
            <TextInput
              style={styles.groupNameInput}
              placeholder="Ej: Los mamados 🏋️"
              placeholderTextColor={colors.textSecondary}
              value={groupName}
              onChangeText={setGroupName}
              maxLength={30}
            />
          </View>
        )}

        <Text style={styles.sectionTitle}>Selecciona amigos</Text>
        
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 40 }} />
        ) : friends?.length === 0 ? (
          <Text style={styles.emptyText}>No tienes amigos añadidos aún.</Text>
        ) : (
          <FlatList
            data={friends}
            keyExtractor={item => item.id}
            renderItem={renderFriend}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {selectedIds.length > 0 && (
        <View style={[styles.footer, { paddingBottom: insets.bottom || 20 }]}>
          <TouchableOpacity 
            style={styles.createButton} 
            onPress={handleCreate}
            disabled={isPending}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[colors.accent, '#90D41C']}
              style={styles.createButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {isPending ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text style={styles.createButtonText}>
                  {selectedIds.length > 1 ? 'Crear Grupo' : 'Iniciar Chat'}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
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
    fontSize: 20,
    color: colors.textPrimary,
  },
  
  content: {
    flex: 1,
    paddingTop: 20,
  },
  groupNameContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  groupNameLabel: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 1.2,
    marginBottom: 8,
    marginLeft: 4,
  },
  groupNameInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 54,
    color: colors.textPrimary,
    fontFamily: typography.fontFamily.medium,
    fontSize: 16,
  },
  
  sectionTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 14,
    color: colors.textPrimary,
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    overflow: 'hidden',
  },
  avatar: { width: '100%', height: '100%' },
  avatarInitial: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 18,
    color: colors.textSecondary,
  },
  friendName: {
    flex: 1,
    fontFamily: typography.fontFamily.semibold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  emptyText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    padding: 40,
  },
  
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  createButton: {
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  createButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 16,
    color: colors.background,
  }
});
