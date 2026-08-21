import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../theme/colors';
import { typography, rs } from '../../theme/typography';
import { UserPlus, User, Users, Activity, Dumbbell, Repeat, Bell, Heart, MessageCircle, Send, Clock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFriendsFeed, useFriends, useFriendRequests } from '../../hooks/useFriends';
import { useDiscoverFeed } from '../../hooks/useDiscoverFeed';
import { useToggleLike } from '../../hooks/useWorkoutLikes';
import { useAuth } from '../../hooks/useAuth';
import { useReduceMotion } from '../../hooks/useReduceMotion';
import { FlashList } from '@shopify/flash-list';
import { MotiView, AnimatePresence } from 'moti';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function getRelativeTime(dateString: string) {
  const diffInMs = new Date().getTime() - new Date(dateString).getTime();
  const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) {
    const diffInHours = Math.round(diffInMs / (1000 * 60 * 60));
    if (diffInHours === 0) return 'Hace un momento';
    return `Hace ${diffInHours}h`;
  }
  if (diffInDays === 1) return 'Ayer';
  if (diffInDays < 7) return `Hace ${diffInDays} días`;
  if (diffInDays < 30) return `Hace ${Math.floor(diffInDays/7)} semanas`;
  return new Date(dateString).toLocaleDateString('es-ES');
}

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'amigos' | 'descubrir'>('amigos');
  
  const { data: friendsWorkouts, isLoading: isFriendsLoading } = useFriendsFeed();
  const { data: discoverWorkouts, isLoading: isDiscoverLoading } = useDiscoverFeed();
  
  const workouts = activeTab === 'amigos' ? friendsWorkouts : discoverWorkouts;
  const isLoading = activeTab === 'amigos' ? isFriendsLoading : isDiscoverLoading;

  const { data: friends } = useFriends();
  const { data: requests } = useFriendRequests();
  const pendingCount = requests?.length || 0;
  
  const reduceMotion = useReduceMotion();
  const hasFriends = friends && friends.length > 0;
  
  const { user } = useAuth();
  const { mutate: toggleLike } = useToggleLike();

  const renderItem = useCallback(({ item, index }: { item: any, index: number }) => {
    let totalVolume = 0;
    let totalSets = 0;
    let exerciseCount = item.workout_exercises?.length || 0;
    let muscleGroups = new Set<string>();

    item.workout_exercises?.forEach((we: any) => {
      if (we.exercises?.muscle_group) {
        muscleGroups.add(we.exercises.muscle_group);
      }
      we.sets?.forEach((s: any) => {
        totalVolume += (Number(s.weight_kg) * Number(s.reps));
        totalSets += 1;
      });
    });

    // Duration
    let durationText = '';
    if (item.started_at && item.finished_at) {
      const diffMs = new Date(item.finished_at).getTime() - new Date(item.started_at).getTime();
      const diffMins = Math.max(1, Math.floor(diffMs / 60000));
      const h = Math.floor(diffMins / 60);
      const m = diffMins % 60;
      durationText = h > 0 ? `${h}h ${m}m` : `${m}m`;
    }

    const likesCount = item.likes?.length || 0;
    const hasLiked = item.likes?.some((l: any) => l.user_id === user?.id);

    // First 3 exercise names for preview
    const exerciseNames = (item.workout_exercises || [])
      .slice(0, 3)
      .map((we: any) => we.exercises?.name)
      .filter(Boolean);
    const extraCount = exerciseCount - 3;

    return (
      <MotiView
        from={{ opacity: 0, translateY: reduceMotion ? 0 : 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 250, delay: reduceMotion ? 0 : index * 40 }}
      >
        {/* Author row above the card */}
        <TouchableOpacity
          style={styles.authorHeader}
          activeOpacity={0.7}
          onPress={() => router.push(`/perfil-usuario/${item.user_id}`)}
        >
          <View style={styles.avatarContainer}>
            {item.profiles?.avatar_url ? (
              <Image source={{ uri: item.profiles.avatar_url }} style={styles.avatar} contentFit="cover" />
            ) : (
              <User color={colors.background} size={16} />
            )}
          </View>
          <View style={styles.authorInfo}>
            <Text style={styles.authorName} numberOfLines={1}>{item.profiles?.username}</Text>
            <Text style={styles.cardDate}>{getRelativeTime(item.started_at)}</Text>
          </View>
        </TouchableOpacity>

        {/* Premium gradient card */}
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.88}
          onPress={() => router.push(`/entrenos/${item.id}`)}
        >
          <LinearGradient
            colors={['#1F2514', '#10140A']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={StyleSheet.absoluteFill}
            locations={[0.3, 1]}
          />

          <View style={styles.cardContent}>
            {/* Badge */}
            <View style={styles.cardBadge}>
              <Text style={styles.cardBadgeText}>Entreno</Text>
            </View>

            {/* Title */}
            <Text style={styles.cardTitle} numberOfLines={2}>{item.name}</Text>

            {/* Stats strip */}
            <View style={styles.statsStrip}>
              <View style={styles.stripStat}>
                <Dumbbell color={colors.accent} size={13} style={{ marginRight: 5 }} />
                <Text style={styles.stripValue}>{exerciseCount} ejerc.</Text>
              </View>
              <View style={styles.stripDot} />
              <View style={styles.stripStat}>
                <Repeat color={colors.accent} size={13} style={{ marginRight: 5 }} />
                <Text style={styles.stripValue}>{totalSets} series</Text>
              </View>
              {durationText ? (
                <>
                  <View style={styles.stripDot} />
                  <View style={styles.stripStat}>
                    <Clock color={colors.accent} size={13} style={{ marginRight: 5 }} />
                    <Text style={styles.stripValue}>{durationText}</Text>
                  </View>
                </>
              ) : null}
            </View>

            {/* Exercise preview list */}
            {exerciseNames.length > 0 && (
              <View style={styles.exerciseList}>
                {exerciseNames.map((name: string, i: number) => (
                  <Text key={i} style={styles.exerciseListItem} numberOfLines={1}>
                    · {name}
                  </Text>
                ))}
                {extraCount > 0 && (
                  <Text style={styles.exerciseListExtra}>+{extraCount} más</Text>
                )}
              </View>
            )}

            {/* Footer: likes, comments, share */}
            <View style={styles.cardFooter}>
              <TouchableOpacity
                style={styles.actionButton}
                activeOpacity={0.7}
                onPress={() => toggleLike({ workoutId: item.id, hasLiked })}
              >
                <Heart
                  size={20}
                  color={hasLiked ? colors.accent : 'rgba(255,255,255,0.5)'}
                  fill={hasLiked ? colors.accent : 'transparent'}
                />
                <Text style={[styles.actionText, hasLiked && styles.actionTextActive]}>
                  {likesCount}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                activeOpacity={0.7}
                onPress={() => router.push(`/entrenos/${item.id}/comentarios`)}
              >
                <MessageCircle size={20} color="rgba(255,255,255,0.5)" />
                <Text style={styles.actionText}>
                  {item.comments?.length > 0 ? item.comments.length : 'Comentar'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { marginLeft: 'auto' }]}
                activeOpacity={0.7}
                onPress={() => router.push(`/compartir?workoutId=${item.id}`)}
              >
                <Send size={18} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </MotiView>
    );
  }, [router, reduceMotion, user?.id, toggleLike]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View>
          <Text style={styles.title}>Actividad</Text>
          <Text style={styles.subtitle}>Explora lo que hacen tus amigos</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.push('/notificaciones')} activeOpacity={0.7}>
            <View style={{ position: 'relative' }}>
              <Bell color={colors.textPrimary} size={20} />
              {pendingCount > 0 && (
                <View style={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  backgroundColor: colors.destructive,
                  minWidth: 16,
                  height: 16,
                  borderRadius: 8,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 2,
                  borderColor: colors.background,
                  zIndex: 10,
                }}>
                  <Text style={{
                    color: 'white',
                    fontSize: 9,
                    fontFamily: typography.fontFamily.bold,
                    paddingHorizontal: 3,
                  }}>
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.push('/amigos')} activeOpacity={0.7}>
            <UserPlus color={colors.textPrimary} size={20} />
          </TouchableOpacity>
        </View>
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
            style={[styles.tab, activeTab === 'descubrir' && styles.activeTab]}
            onPress={() => setActiveTab('descubrir')}
          >
            <Text style={[styles.tabText, activeTab === 'descubrir' && styles.activeTabText]}>Descubrir</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.listContainer}>
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 60 }} />
        ) : (
          <FlashList
            data={workouts || []}
            renderItem={renderItem}
            estimatedItemSize={260}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <MotiView 
                from={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={styles.emptyState}
              >
                <View style={styles.emptyIconContainer}>
                  <Users color={colors.accent} size={40} />
                </View>
                {activeTab === 'descubrir' ? (
                  <>
                    <Text style={styles.emptyTitle}>Sin descubrimientos</Text>
                    <Text style={styles.emptyText}>Aún no hay entrenos públicos de otros usuarios para mostrar.</Text>
                  </>
                ) : hasFriends ? (
                  <>
                    <Text style={styles.emptyTitle}>Sin actividad reciente</Text>
                    <Text style={styles.emptyText}>Tus amigos no han registrado entrenos últimamente.</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.emptyTitle}>Comienza a socializar</Text>
                    <Text style={styles.emptyText}>Añade amigos para motivarte viendo su progreso.</Text>
                    <TouchableOpacity style={styles.emptyButton} onPress={() => router.push('/amigos')} activeOpacity={0.9}>
                      <Text style={styles.emptyButtonText}>Buscar amigos</Text>
                    </TouchableOpacity>
                  </>
                )}
              </MotiView>
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: rs(20),
    paddingBottom: rs(8),
  },
  title: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: rs(26),
    letterSpacing: 0.3,
    color: colors.textPrimary,
  },
  subtitle: {
    fontFamily: typography.fontFamily.medium,
    ...typography.scale.body,
    fontSize: rs(15),
    color: colors.textSecondary,
    marginTop: rs(3),
  },
  headerButton: {
    width: rs(44),
    height: rs(44),
    borderRadius: rs(22),
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: { paddingHorizontal: rs(20), marginBottom: rs(12) },
  tabsWrapper: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: rs(12), padding: rs(4), borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  tab: { flex: 1, paddingVertical: rs(10), alignItems: 'center', borderRadius: rs(8) },
  activeTab: { backgroundColor: 'rgba(255,255,255,0.1)' },
  tabText: { fontFamily: typography.fontFamily.medium, color: colors.textSecondary, ...typography.scale.body, fontSize: rs(14) },
  activeTabText: { color: colors.textPrimary, fontFamily: typography.fontFamily.bold },
  listContainer: { flex: 1 },
  listContent: { paddingHorizontal: rs(20), paddingBottom: rs(100), paddingTop: rs(10) },

  // Card (premium gradient style)
  card: {
    borderRadius: rs(24),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: rs(20),
    minHeight: 280,
  },
  cardContent: {
    flex: 1,
    padding: rs(20),
    justifyContent: 'space-between',
    zIndex: 2,
    gap: rs(14),
  },
  cardBadge: {
    backgroundColor: 'rgba(180, 240, 60, 0.15)',
    paddingHorizontal: rs(12),
    paddingVertical: rs(6),
    borderRadius: rs(20),
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(180, 240, 60, 0.25)',
  },
  cardBadgeText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: rs(11),
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  authorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: rs(8),
    paddingHorizontal: rs(4),
  },
  avatarContainer: {
    width: rs(36),
    height: rs(36),
    borderRadius: rs(18),
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: rs(10),
    overflow: 'hidden',
    flexShrink: 0,
    borderWidth: 2,
    borderColor: 'rgba(180, 240, 60, 0.4)',
  },
  avatar: { width: '100%', height: '100%' },
  authorInfo: { flex: 1 },
  authorName: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: rs(14),
    color: colors.textPrimary,
    marginBottom: rs(2),
  },
  cardDate: {
    fontFamily: typography.fontFamily.medium,
    fontSize: rs(12),
    color: colors.textSecondary,
  },
  cardTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: rs(26),
    color: colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    lineHeight: rs(32),
  },
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(12),
    flexWrap: 'wrap',
  },
  stripStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stripDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  stripValue: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: rs(13),
    color: 'rgba(255,255,255,0.7)',
  },
  exerciseList: {
    gap: rs(4),
  },
  exerciseListItem: {
    fontFamily: typography.fontFamily.medium,
    fontSize: rs(13),
    color: 'rgba(255,255,255,0.55)',
    textTransform: 'capitalize',
  },
  exerciseListExtra: {
    fontFamily: typography.fontFamily.medium,
    fontSize: rs(12),
    color: colors.accent,
    marginTop: rs(2),
  },
  cardFooter: {
    marginTop: rs(4),
    paddingTop: rs(14),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    gap: rs(20),
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(7),
  },
  actionText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: rs(14),
    color: 'rgba(255,255,255,0.5)',
  },
  actionTextActive: {
    color: colors.accent,
    fontFamily: typography.fontFamily.semibold,
  },

  // Empty
  emptyState: {
    alignItems: 'center',
    padding: rs(40),
    marginTop: rs(40),
    backgroundColor: colors.surface,
    borderRadius: rs(20),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  emptyIconContainer: {
    width: rs(80),
    height: rs(80),
    borderRadius: rs(40),
    backgroundColor: 'rgba(180, 240, 60, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: rs(20),
    borderWidth: 1,
    borderColor: 'rgba(180, 240, 60, 0.2)',
  },
  emptyTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: rs(20),
    color: colors.textPrimary,
    marginBottom: rs(8),
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: typography.fontFamily.medium,
    ...typography.scale.body,
    fontSize: rs(15),
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: rs(24),
  },
  emptyButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: rs(24),
    paddingVertical: rs(12),
    borderRadius: rs(20),
  },
  emptyButtonText: {
    fontFamily: typography.fontFamily.semibold,
    color: colors.background,
    fontSize: 15,
  },
});
