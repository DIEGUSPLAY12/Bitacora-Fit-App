import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { ArrowLeft, User, Search, Check, X as XIcon, UserPlus } from 'lucide-react-native';
import { useSearchUsers, useFriendRequests, useSendFriendRequest, useAcceptFriendRequest, useRejectFriendRequest, useFriends } from '../hooks/useFriends';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';

export default function AmigosScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const searchInputRef = useRef<TextInput>(null);
  
  const [activeTab, setActiveTab] = useState<'amigos' | 'solicitudes'>('amigos');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
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

  const renderRequestCard = ({ item, index }: { item: any; index: number }) => (
    <View style={styles.card}>
      <View style={styles.userInfo}>
        <View style={styles.avatarContainer}>
          {item.profiles?.avatar_url ? (
            <Image source={item.profiles.avatar_url} style={styles.avatar} contentFit="cover" />
          ) : (
            <User color={colors.accent} size={24} />
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
          <Check color={colors.background} size={18} strokeWidth={3} />
          <Text style={styles.acceptText}>Aceptar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.rejectButton} 
          onPress={() => rejectRequest(item.id)}
          disabled={isAccepting || isRejecting}
        >
          <XIcon color={colors.textSecondary} size={20} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSearchCard = ({ item, index }: { item: any; index: number }) => {
    const isPending = pendingUserIds.has(item.id);
    
    return (
      <View style={styles.card}>
        <TouchableOpacity 
          style={styles.userInfo}
          onPress={() => router.push(`/perfil-usuario/${item.id}`)}
          activeOpacity={0.7}
        >
          <View style={styles.avatarContainer}>
            {item.avatar_url ? (
              <Image source={item.avatar_url} style={styles.avatar} contentFit="cover" />
            ) : (
              <User color={colors.accent} size={24} />
            )}
          </View>
          <Text style={styles.username}>{item.username}</Text>
        </TouchableOpacity>
        
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
  
  const renderFriendCard = ({ item, index }: { item: any; index: number }) => {
    return (
      <View style={styles.card}>
        <TouchableOpacity 
          style={styles.userInfo}
          onPress={() => router.push(`/perfil-usuario/${item.id}`)}
          activeOpacity={0.7}
        >
          <View style={styles.avatarContainer}>
            {item.avatar_url ? (
              <Image source={item.avatar_url} style={styles.avatar} contentFit="cover" />
            ) : (
              <User color={colors.accent} size={24} />
            )}
          </View>
          <Text style={styles.username}>{item.username}</Text>
        </TouchableOpacity>
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

      <View style={[styles.searchContainer, isSearchFocused && styles.searchContainerFocused]}>
        <Search color={isSearchFocused ? colors.accent : colors.textSecondary} size={20} style={styles.searchIcon} />
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
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
          autoCapitalize="none"
        />
      </View>

      <View style={styles.tabsContainer}>
        <View style={styles.tabsWrapper}>
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.tabText, activeTab === 'solicitudes' && styles.activeTabText]}>Solicitudes</Text>
              {requests && requests.length > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{requests.length}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === 'amigos' ? (
        <FlatList
          data={searchQuery.trim() ? searchResults : friends}
          keyExtractor={item => item.id}
          renderItem={searchQuery.trim() ? renderSearchCard : renderFriendCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              {searchQuery.trim() ? (
                isSearching ? (
                  <ActivityIndicator color={colors.accent} size="large" />
                ) : (
                  <Text style={styles.emptyText}>No se encontraron usuarios.</Text>
                )
              ) : (
                isFriendsLoading ? (
                  <ActivityIndicator color={colors.accent} size="large" />
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
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              {isRequestsLoading ? (
                <ActivityIndicator color={colors.accent} size="large" />
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
  backButton: { marginRight: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  title: { fontFamily: typography.fontFamily.bold, ...typography.scale.title, fontSize: 24, color: colors.textPrimary },
  headerRightButton: { padding: 8, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', marginHorizontal: 24, borderRadius: 16, paddingHorizontal: 16, marginBottom: 20, height: 56, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  searchContainerFocused: { borderColor: colors.accent, backgroundColor: 'rgba(180, 240, 60, 0.05)' },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, height: 56, color: colors.textPrimary, fontFamily: typography.fontFamily.regular, fontSize: 16 },
  
  tabsContainer: { paddingHorizontal: 24, marginBottom: 20 },
  tabsWrapper: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: 'rgba(255,255,255,0.1)' },
  tabText: { fontFamily: typography.fontFamily.medium, color: colors.textSecondary, ...typography.scale.body, fontSize: 14 },
  activeTabText: { color: colors.textPrimary, fontFamily: typography.fontFamily.bold },
  
  badge: { backgroundColor: colors.accent, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, minWidth: 20, alignItems: 'center' },
  badgeText: { fontFamily: typography.fontFamily.bold, fontSize: 10, color: colors.background },
  
  listContent: { paddingHorizontal: 24, paddingBottom: 40 },
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  userInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatarContainer: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(180, 240, 60, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(180, 240, 60, 0.3)' },
  avatar: { width: '100%', height: '100%' },
  username: { fontFamily: typography.fontFamily.bold, ...typography.scale.body, fontSize: 16, color: colors.textPrimary },
  
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  acceptButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.accent, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, gap: 6 },
  acceptText: { fontFamily: typography.fontFamily.bold, color: colors.background, fontSize: 14 },
  rejectButton: { padding: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)' },
  
  addButton: { backgroundColor: colors.accent, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  addButtonPending: { backgroundColor: 'rgba(255,255,255,0.05)' },
  addButtonText: { fontFamily: typography.fontFamily.bold, color: colors.background, fontSize: 14 },
  addButtonTextPending: { color: colors.textSecondary },
  
  emptyState: { padding: 40, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginTop: 20 },
  emptyText: { fontFamily: typography.fontFamily.medium, color: colors.textSecondary, textAlign: 'center', fontSize: 16 },
});
