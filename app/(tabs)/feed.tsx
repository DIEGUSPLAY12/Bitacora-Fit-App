import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { UserPlus, User, Users, Activity, Dumbbell, Repeat } from 'lucide-react-native';
import { useFriendsFeed, useFriends } from '../../hooks/useFriends';
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
  const { data: workouts, isLoading } = useFriendsFeed();
  const { data: friends } = useFriends();
  const reduceMotion = useReduceMotion();
  const hasFriends = friends && friends.length > 0;

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

    const tags = Array.from(muscleGroups).slice(0, 3);

    return (
      <MotiView
        from={{ opacity: 0, translateY: reduceMotion ? 0 : 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 250, delay: reduceMotion ? 0 : index * 40 }}
      >
        <View style={styles.card}>
          {/* Author row */}
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

          {/* Workout name — main hero text (Symmetry: bold, largest element) */}
          <TouchableOpacity 
            activeOpacity={0.7}
            onPress={() => router.push(`/entrenos/${item.id}`)}
          >
            <Text style={styles.cardTitle} numberOfLines={2}>{item.name}</Text>

            {tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {tags.map(tag => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
                {muscleGroups.size > 3 && (
                  <View style={styles.tag}><Text style={styles.tagText}>+{muscleGroups.size - 3}</Text></View>
                )}
              </View>
            )}

            {/* Stats strip — Symmetry style: label on top, value on bottom */}
            <View style={styles.statsStrip}>
              <View style={styles.stripStat}>
                <Text style={styles.stripLabel}>Ejercicios</Text>
                <View style={styles.stripValueRow}>
                  <Dumbbell color={colors.accent} size={13} style={{ marginRight: 4 }} />
                  <Text style={styles.stripValue}>{exerciseCount}</Text>
                </View>
              </View>
              <View style={styles.stripDivider} />
              <View style={styles.stripStat}>
                <Text style={styles.stripLabel}>Series</Text>
                <View style={styles.stripValueRow}>
                  <Repeat color={colors.accent} size={13} style={{ marginRight: 4 }} />
                  <Text style={styles.stripValue}>{totalSets}</Text>
                </View>
              </View>
              <View style={styles.stripDivider} />
              <View style={styles.stripStat}>
                <Text style={styles.stripLabel}>Volumen</Text>
                <View style={styles.stripValueRow}>
                  <Activity color={colors.accent} size={13} style={{ marginRight: 4 }} />
                  <Text style={styles.stripValue} numberOfLines={1}>{totalVolume} kg</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </MotiView>
    );
  }, [router, reduceMotion]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View>
          <Text style={styles.title}>Actividad</Text>
          <Text style={styles.subtitle}>Explora lo que hacen tus amigos</Text>
        </View>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.push('/amigos')} activeOpacity={0.7}>
          <UserPlus color={colors.textPrimary} size={22} />
        </TouchableOpacity>
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
                {hasFriends ? (
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
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  title: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 26,
    letterSpacing: 0.3,
    color: colors.textPrimary,
  },
  subtitle: {
    fontFamily: typography.fontFamily.medium,
    ...typography.scale.body,
    color: colors.textSecondary,
    marginTop: 3,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingBottom: 100, paddingTop: 20 },

  // Card
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  authorHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  avatarContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    overflow: 'hidden',
    flexShrink: 0,
  },
  avatar: { width: '100%', height: '100%' },
  authorInfo: { flex: 1 },
  authorName: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  cardDate: {
    fontFamily: typography.fontFamily.medium,
    ...typography.scale.caption,
    color: colors.textSecondary,
  },

  // Workout title — the hero element (Symmetry: bold, prominent)
  cardTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: 12,
    lineHeight: 24,
  },

  // Tags
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  tag: {
    backgroundColor: 'rgba(180, 240, 60, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(180, 240, 60, 0.18)',
  },
  tagText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 10,
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Symmetry-style stats strip
  statsStrip: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  stripStat: {
    flex: 1,
    alignItems: 'center',
  },
  stripDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
    marginVertical: 4,
  },
  stripLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 5,
  },
  stripValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stripValue: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 13,
    color: colors.textPrimary,
  },

  // Empty
  emptyState: {
    padding: 36,
    alignItems: 'center',
    marginTop: 40,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  emptyIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(180, 240, 60, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 17,
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    fontSize: 14,
    lineHeight: 21,
  },
  emptyButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  emptyButtonText: {
    fontFamily: typography.fontFamily.semibold,
    color: colors.background,
    fontSize: 15,
  },
});
