import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { ArrowLeft, User, Search, Check, X as XIcon, UserPlus } from 'lucide-react-native';
import { useSearchUsers, useFriendRequests, useSendFriendRequest, useAcceptFriendRequest, useRejectFriendRequest, useFriends } from '../hooks/useFriends';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AmigosScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const searchInputRef = useRef<TextInput>(null);
  
  const [activeTab, setActiveTab] = useState<'amigos' | 'solicitudes'>('amigos');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: searchResults, isLoading: isSearching } = useSearchUsers(searchQuery);
  const { data: requests, isLoading: isRequestsLoading } = useFriendRequests();
  const { data: friends, isLoading: isFriendsLoading } = useFriends();
  
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
  
  const renderFriendCard = ({ item }: { item: any }) => {
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
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft color={colors.textPrimary} size={24} />
          </TouchableOpacity>
          <Text style={styles.title}>Amigos</Text>
        </View>
        <TouchableOpacity 
          style={styles.headerRightButton}
          onPress={() => {
            setActiveTab('amigos');
            searchInputRef.current?.focus();
          }}
        >
          <UserPlus color={colors.textPrimary} size={24} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Search color={colors.textSecondary} size={20} style={styles.searchIcon} />
        <TextInput
          ref={searchInputRef}
          style={styles.searchInput}
          placeholder="Buscar usuarios..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            if (text.trim().length > 0 && activeTab !== 'amigos') {
              setActiveTab('amigos');
            }
          }}
          autoCapitalize="none"
        />
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'amigos' && styles.activeTab]}
          onPress={() => setActiveTab('amigos')}
        >
          <Text style={[styles.tabText, activeTab === 'amigos' && styles.activeTabText]}>Amigos</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'solicitudes' && styles.activeTab]}
          onPress={() => setActiveTab('solicitudes')}
        >
          <Text style={[styles.tabText, activeTab === 'solicitudes' && styles.activeTabText]}>Solicitudes</Text>
          {requests && requests.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{requests.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {activeTab === 'amigos' ? (
        <FlatList
          data={searchQuery.trim() ? searchResults : friends}
          keyExtractor={item => item.id}
          renderItem={searchQuery.trim() ? renderSearchCard : renderFriendCard}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              {searchQuery.trim() ? (
                isSearching ? (
                  <ActivityIndicator color={colors.accent} />
                ) : (
                  <Text style={styles.emptyText}>No se encontraron usuarios.</Text>
                )
              ) : (
                isFriendsLoading ? (
                  <ActivityIndicator color={colors.accent} />
                ) : (
                  <Text style={styles.emptyText}>Aún no tienes amigos añadidos.</Text>
                )
              )}
            </View>
          )}
        />
      ) : (
        <FlatList
          data={requests}
          keyExtractor={item => item.id}
          renderItem={renderRequestCard}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              {isRequestsLoading ? (
                <ActivityIndicator color={colors.accent} />
              ) : (
                <Text style={styles.emptyText}>No tienes solicitudes pendientes.</Text>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 24, paddingTop: 16, paddingBottom: 16 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  backButton: { marginRight: 16 },
  title: { fontFamily: typography.fontFamily.bold, ...typography.scale.display, fontSize: 24, color: colors.textPrimary },
  headerRightButton: { padding: 8 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, marginHorizontal: 24, borderRadius: 12, paddingHorizontal: 16, marginBottom: 16 },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, height: 48, color: colors.textPrimary, fontFamily: typography.fontFamily.regular, ...typography.scale.body },
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: colors.surface, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: colors.accent },
  tabText: { fontFamily: typography.fontFamily.medium, color: colors.textSecondary, ...typography.scale.body },
  activeTabText: { color: colors.textPrimary, fontFamily: typography.fontFamily.bold },
  badge: { backgroundColor: colors.accent, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, minWidth: 20, alignItems: 'center' },
  badgeText: { fontFamily: typography.fontFamily.bold, fontSize: 10, color: colors.background },
  listContent: { paddingHorizontal: 24, paddingBottom: 40 },
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
