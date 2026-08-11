import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { ArrowLeft, User, Search, Check, X as XIcon } from 'lucide-react-native';
import { useSearchUsers, useFriendRequests, useSendFriendRequest, useAcceptFriendRequest, useRejectFriendRequest } from '../hooks/useFriends';
import { Image } from 'expo-image';

export default function AmigosScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: searchResults, isLoading: isSearching } = useSearchUsers(searchQuery);
  const { data: requests, isLoading: isRequestsLoading } = useFriendRequests();
  
  const { mutateAsync: sendRequest, isPending: isSending } = useSendFriendRequest();
  const { mutateAsync: acceptRequest, isPending: isAccepting } = useAcceptFriendRequest();
  const { mutateAsync: rejectRequest, isPending: isRejecting } = useRejectFriendRequest();

  const [pendingUserIds, setPendingUserIds] = useState<Set<string>>(new Set());

  const handleSendRequest = async (friendId: string) => {
    try {
      await sendRequest(friendId);
      setPendingUserIds(prev => new Set(prev).add(friendId));
    } catch (e) {
      console.error(e);
    }
  };

  const renderRequestCard = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.userInfo}>
        <View style={styles.avatarContainer}>
          {item.profiles?.avatar_url ? (
            <Image source={item.profiles.avatar_url} style={styles.avatar} />
          ) : (
            <User color={colors.background} size={24} />
          )}
        </View>
        <Text style={styles.username}>{item.profiles?.username}</Text>
      </View>
      
      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.acceptButton} 
          onPress={() => acceptRequest(item.id)}
          disabled={isAccepting || isRejecting}
        >
          <Check color={colors.background} size={18} />
          <Text style={styles.acceptText}>Aceptar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.rejectButton} 
          onPress={() => rejectRequest(item.id)}
          disabled={isAccepting || isRejecting}
        >
          <XIcon color={colors.textSecondary} size={18} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSearchCard = ({ item }: { item: any }) => {
    const isPending = pendingUserIds.has(item.id);
    
    return (
      <View style={styles.card}>
        <View style={styles.userInfo}>
          <View style={styles.avatarContainer}>
            {item.avatar_url ? (
              <Image source={item.avatar_url} style={styles.avatar} />
            ) : (
              <User color={colors.background} size={24} />
            )}
          </View>
          <Text style={styles.username}>{item.username}</Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.addButton, isPending && styles.addButtonPending]} 
          onPress={() => handleSendRequest(item.id)}
          disabled={isPending || isSending}
        >
          <Text style={[styles.addButtonText, isPending && styles.addButtonTextPending]}>
            {isPending ? 'Pendiente' : 'Añadir'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft color={colors.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Amigos</Text>
      </View>

      <View style={styles.searchContainer}>
        <Search color={colors.textSecondary} size={20} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre de usuario..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
      </View>

      <FlatList
        data={searchQuery.trim() ? searchResults : requests}
        keyExtractor={item => item.id}
        renderItem={searchQuery.trim() ? renderSearchCard : renderRequestCard}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={() => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {searchQuery.trim() ? 'Resultados de búsqueda' : 'Solicitudes pendientes'}
            </Text>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            {searchQuery.trim() ? (
              isSearching ? (
                <ActivityIndicator color={colors.accent} />
              ) : (
                <Text style={styles.emptyText}>No se encontraron usuarios.</Text>
              )
            ) : (
              isRequestsLoading ? (
                <ActivityIndicator color={colors.accent} />
              ) : (
                <Text style={styles.emptyText}>No tienes solicitudes pendientes.</Text>
              )
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 24, paddingTop: 60, paddingBottom: 16 },
  backButton: { marginRight: 16 },
  title: { fontFamily: typography.fontFamily.bold, ...typography.scale.display, fontSize: 24, color: colors.textPrimary },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, marginHorizontal: 24, borderRadius: 12, paddingHorizontal: 16, marginBottom: 24 },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, height: 48, color: colors.textPrimary, fontFamily: typography.fontFamily.regular, ...typography.scale.body },
  listContent: { paddingHorizontal: 24, paddingBottom: 40 },
  sectionHeader: { marginBottom: 16 },
  sectionTitle: { fontFamily: typography.fontFamily.bold, ...typography.scale.title, color: colors.textPrimary },
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surface, padding: 16, borderRadius: 16, marginBottom: 12 },
  userInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatarContainer: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.textPrimary, justifyContent: 'center', alignItems: 'center', marginRight: 16, overflow: 'hidden' },
  avatar: { width: '100%', height: '100%' },
  username: { fontFamily: typography.fontFamily.bold, ...typography.scale.body, color: colors.textPrimary },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  acceptButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.accent, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, gap: 6 },
  acceptText: { fontFamily: typography.fontFamily.bold, color: colors.background, ...typography.scale.caption },
  rejectButton: { padding: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.textSecondary },
  addButton: { backgroundColor: colors.accent, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  addButtonPending: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.textSecondary },
  addButtonText: { fontFamily: typography.fontFamily.bold, color: colors.background, ...typography.scale.caption },
  addButtonTextPending: { color: colors.textSecondary },
  emptyState: { padding: 40, alignItems: 'center' },
  emptyText: { fontFamily: typography.fontFamily.medium, color: colors.textSecondary, textAlign: 'center' },
});
