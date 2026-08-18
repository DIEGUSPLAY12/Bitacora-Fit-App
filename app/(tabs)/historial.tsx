import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { useWorkouts } from '../../hooks/useWorkouts';
import { useReduceMotion } from '../../hooks/useReduceMotion';
import { FlashList } from '@shopify/flash-list';
import { Clock, Dumbbell, Repeat, History, Send } from 'lucide-react-native';
import { MotiView } from 'moti';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

function getRelativeTime(dateString: string) {
  const diffInDays = Math.round((new Date().getTime() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24));
  if (diffInDays === 0) return 'Hoy';
  if (diffInDays === 1) return 'Ayer';
  if (diffInDays < 7) return `Hace ${diffInDays} días`;
  if (diffInDays < 30) return `Hace ${Math.floor(diffInDays/7)} semanas`;
  return new Date(dateString).toLocaleDateString('es-ES');
}

export default function HistorialScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { 
    data, 
    isLoading, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useWorkouts();

  const reduceMotion = useReduceMotion();
  const workouts = data?.pages.flat() || [];

  const renderItem = useCallback(({ item, index }: { item: any, index: number }) => {
    let totalSets = 0;
    let exerciseCount = item.workout_exercises?.length || 0;

    item.workout_exercises?.forEach((we: any) => {
      we.sets?.forEach(() => { totalSets += 1; });
    });

    const durationMs = new Date(item.finished_at).getTime() - new Date(item.started_at).getTime();
    const durationMin = Math.max(1, Math.floor(durationMs / 60000));
    const h = Math.floor(durationMin / 60);
    const m = durationMin % 60;
    const durationText = h > 0 ? `${h}h ${m}m` : `${m}m`;

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
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.88}
          onPress={() => router.push(`/entrenos/${item.id}`)}
        >
          {/* Gradient background */}
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
            {/* Badge + Date row */}
            <View style={styles.cardTopRow}>
              <View style={styles.cardBadge}>
                <Text style={styles.cardBadgeText}>Entreno</Text>
              </View>
              <Text style={styles.cardDate}>{getRelativeTime(item.started_at)}</Text>
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
              <View style={styles.stripDot} />
              <View style={styles.stripStat}>
                <Clock color={colors.accent} size={13} style={{ marginRight: 5 }} />
                <Text style={styles.stripValue}>{durationText}</Text>
              </View>
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

            {/* Footer */}
            <View style={styles.cardFooter}>
              <TouchableOpacity
                style={styles.shareButton}
                activeOpacity={0.7}
                onPress={() => router.push(`/compartir?workoutId=${item.id}`)}
              >
                <Send size={18} color="rgba(255,255,255,0.5)" />
                <Text style={styles.shareButtonText}>Compartir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </MotiView>
    );
  }, [router, reduceMotion]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.title}>Historial</Text>
        <Text style={styles.subtitle}>Todos tus entrenamientos</Text>
      </View>

      <View style={styles.listContainer}>
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 60 }} />
        ) : (
          <FlashList
            data={workouts}
            renderItem={renderItem}
            estimatedItemSize={210}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onEndReached={() => {
              if (hasNextPage) fetchNextPage();
            }}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              isFetchingNextPage ? <ActivityIndicator color={colors.accent} style={{ margin: 20 }} /> : null
            }
            ListEmptyComponent={
              <MotiView 
                from={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={styles.emptyState}
              >
                <View style={styles.emptyIconContainer}>
                  <History color={colors.accent} size={40} />
                </View>
                <Text style={styles.emptyTitle}>Empieza a entrenar</Text>
                <Text style={styles.emptyText}>No has registrado ningún entrenamiento aún. Tus sesiones completadas aparecerán aquí.</Text>
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
  header: { paddingHorizontal: 20, paddingBottom: 8 },
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
    marginTop: 4,
  },
  listContainer: { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingBottom: 100, paddingTop: 20 },

  // Card (premium gradient style, matching feed — compact height)
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 14,
  },
  cardContent: {
    flex: 1,
    padding: 16,
    gap: 10,
    zIndex: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardBadge: {
    backgroundColor: 'rgba(180, 240, 60, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(180, 240, 60, 0.25)',
  },
  cardBadgeText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 10,
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  cardTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 20,
    color: colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    lineHeight: 26,
  },
  cardDate: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
  },
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  exerciseList: {
    gap: 3,
  },
  exerciseListItem: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    textTransform: 'capitalize',
  },
  exerciseListExtra: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 11,
    color: colors.accent,
    marginTop: 2,
  },
  cardFooter: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shareButtonText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
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
    fontSize: 14,
    lineHeight: 21,
  },
});
