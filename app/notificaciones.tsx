import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, } from 'react-native';
import { customAlert as Alert } from '../store/alert-store';
import { useRouter } from 'expo-router';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useFriendRequests, useAcceptFriendRequest, useRejectFriendRequest, useSendFriendRequest } from '../hooks/useFriends';
import { useSuggestedUsers } from '../hooks/useSuggestedUsers';
import { ArrowLeft, Check, X, UserPlus, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MotiView } from 'moti';

export default function NotificacionesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { data: requests, isLoading: loadingReqs } = useFriendRequests();
  const { data: suggestions, isLoading: loadingSuggs } = useSuggestedUsers();

  const acceptReq = useAcceptFriendRequest();
  const rejectReq = useRejectFriendRequest();
  const sendReq = useSendFriendRequest();

  const handleAccept = async (id: string) => {
    try { await acceptReq.mutateAsync(id); }
    catch (e: any) { Alert.alert('Error', e.message); }
  };

  const handleReject = async (id: string) => {
    try { await rejectReq.mutateAsync(id); }
    catch (e: any) { Alert.alert('Error', e.message); }
  };

  const handleSendRequest = async (userId: string) => {
    try {
      await sendReq.mutateAsync(userId);
      Alert.alert('Solicitud enviada', 'Se ha enviado la solicitud de seguimiento.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeft color={colors.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Notificaciones</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* === Solicitudes pendientes === */}
        <Text style={styles.sectionTitle}>Solicitudes pendientes</Text>
        {loadingReqs ? (
          <ActivityIndicator color={colors.accent} style={{ marginVertical: 20 }} />
        ) : requests && requests.length > 0 ? (
          <View style={styles.list}>
            {requests.map((req: any) => (
              <MotiView
                key={req.id}
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                style={styles.card}
              >
                <View style={styles.avatarContainer}>
                  {req.profiles?.avatar_url ? (
                    <Image source={{ uri: req.profiles.avatar_url }} style={styles.avatar} />
                  ) : (
                    <User color={colors.background} size={16} />
                  )}
                </View>
                <View style={styles.info}>
                  <Text style={styles.username}>@{req.profiles?.username}</Text>
                  <Text style={styles.subtitle}>Quiere seguirte</Text>
                </View>
                <View style={styles.actions}>
                  <TouchableOpacity 
                    style={[styles.actionBtn, styles.actionReject]}
                    onPress={() => handleReject(req.id)}
                    disabled={rejectReq.isPending}
                  >
                    <X color={colors.destructive} size={16} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionBtn, styles.actionAccept]}
                    onPress={() => handleAccept(req.id)}
                    disabled={acceptReq.isPending}
                  >
                    <Check color={colors.background} size={16} strokeWidth={3} />
                  </TouchableOpacity>
                </View>
              </MotiView>
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No tienes solicitudes pendientes.</Text>
          </View>
        )}

        {/* === Sugerencias de amistad === */}
        <Text style={[styles.sectionTitle, { marginTop: 32 }]}>Quizás conozcas a</Text>
        {loadingSuggs ? (
          <ActivityIndicator color={colors.accent} style={{ marginVertical: 20 }} />
        ) : suggestions && suggestions.length > 0 ? (
          <View style={styles.list}>
            {suggestions.map((sugg: any, index: number) => (
              <MotiView
                key={sugg.id}
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: index * 50 }}
                style={styles.card}
              >
                <View style={styles.avatarContainer}>
                  {sugg.avatar_url ? (
                    <Image source={{ uri: sugg.avatar_url }} style={styles.avatar} />
                  ) : (
                    <User color={colors.background} size={16} />
                  )}
                </View>
                <View style={styles.info}>
                  <Text style={styles.name} numberOfLines={1}>{sugg.full_name || sugg.username}</Text>
                  <Text style={styles.subtitle}>@{sugg.username}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.addBtn}
                  onPress={() => handleSendRequest(sugg.id)}
                  disabled={sendReq.isPending}
                  activeOpacity={0.7}
                >
                  <UserPlus color={colors.textPrimary} size={16} />
                  <Text style={styles.addBtnText}>Añadir</Text>
                </TouchableOpacity>
              </MotiView>
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No hay sugerencias en este momento.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center', alignItems: 'center',
  },
  title: {
    flex: 1, textAlign: 'center',
    fontFamily: typography.fontFamily.semibold,
    fontSize: 18, color: colors.textPrimary, letterSpacing: 0.2,
  },
  scroll: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 60 },

  sectionTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 16, color: colors.textPrimary,
    marginBottom: 16, marginLeft: 4,
  },
  list: { gap: 12 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 14, borderRadius: 18,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  avatarContainer: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.accent,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 12, overflow: 'hidden',
  },
  avatar: { width: '100%', height: '100%' },
  info: { flex: 1 },
  username: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 15, color: colors.textPrimary, marginBottom: 2,
  },
  name: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 15, color: colors.textPrimary, marginBottom: 2,
  },
  subtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 12, color: colors.textSecondary,
  },
  
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1,
  },
  actionReject: {
    backgroundColor: 'rgba(207,102,121,0.1)',
    borderColor: 'rgba(207,102,121,0.2)',
  },
  actionAccept: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },

  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  addBtnText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 13, color: colors.textPrimary,
  },

  emptyCard: {
    backgroundColor: colors.surface,
    padding: 24, borderRadius: 18,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 14, color: colors.textSecondary,
  },
});
