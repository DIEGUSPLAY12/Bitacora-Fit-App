import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { useWorkouts } from '../../hooks/useWorkouts';
import { useReduceMotion } from '../../hooks/useReduceMotion';
import { FlashList } from '@shopify/flash-list';
import { Clock, Weight, ChevronRight } from 'lucide-react-native';
import { MotiView } from 'moti';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
    let totalVolume = 0;
    let exerciseCount = item.workout_exercises?.length || 0;
    let muscleGroups = new Set<string>();

    item.workout_exercises?.forEach((we: any) => {
      if (we.exercises?.muscle_group) {
        muscleGroups.add(we.exercises.muscle_group);
      }
      we.sets?.forEach((s: any) => {
        totalVolume += (Number(s.weight_kg) * Number(s.reps));
      });
    });

    const tags = Array.from(muscleGroups).slice(0, 3);

    const durationMs = new Date(item.finished_at).getTime() - new Date(item.started_at).getTime();
    const durationMin = Math.max(1, Math.floor(durationMs / 60000));

    return (
      <MotiView
        from={{ opacity: 0, translateY: reduceMotion ? 0 : 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400, delay: reduceMotion ? 0 : index * 100 }}
      >
        <TouchableOpacity 
          style={styles.card} 
          activeOpacity={0.7}
          onPress={() => router.push(`/entrenos/${item.id}`)}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardDate}>{getRelativeTime(item.started_at)}</Text>
          </View>

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

          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Clock color={colors.textSecondary} size={16} />
              <Text style={styles.statText}>{durationMin} min</Text>
            </View>
            <View style={styles.stat}>
              <Weight color={colors.textSecondary} size={16} />
              <Text style={styles.statText}>{totalVolume} kg</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statTextHighlight}>{exerciseCount}</Text>
              <Text style={styles.statText}>ejercicios</Text>
            </View>
          </View>
          
          <View style={styles.chevronContainer}>
            <ChevronRight color={colors.textSecondary} size={20} />
          </View>
        </TouchableOpacity>
      </MotiView>
    );
  }, [router, reduceMotion]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.title}>Historial</Text>
      </View>

      <View style={styles.listContainer}>
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 40 }} />
        ) : (
          <FlashList
            data={workouts}
            renderItem={renderItem}
            estimatedItemSize={150}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            onEndReached={() => {
              if (hasNextPage) fetchNextPage();
            }}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              isFetchingNextPage ? <ActivityIndicator color={colors.accent} style={{ margin: 20 }} /> : null
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No has registrado ningún entreno aún.</Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 24, paddingTop: 16, paddingBottom: 16 },
  title: { fontFamily: typography.fontFamily.bold, ...typography.scale.display, fontSize: 28, color: colors.textPrimary },
  listContainer: { flex: 1 },
  listContent: { paddingHorizontal: 24, paddingBottom: 100 },
  card: { backgroundColor: colors.surface, borderRadius: 16, padding: 20, marginBottom: 16, position: 'relative' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, paddingRight: 24 },
  cardTitle: { fontFamily: typography.fontFamily.bold, ...typography.scale.title, fontSize: 20, color: colors.textPrimary, flex: 1 },
  cardDate: { fontFamily: typography.fontFamily.regular, ...typography.scale.caption, color: colors.textSecondary },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  tag: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  tagText: { fontFamily: typography.fontFamily.medium, fontSize: 10, color: colors.textSecondary, textTransform: 'uppercase' },
  statsContainer: { flexDirection: 'row', gap: 24 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { fontFamily: typography.fontFamily.medium, ...typography.scale.caption, color: colors.textSecondary },
  statTextHighlight: { fontFamily: typography.fontFamily.bold, ...typography.scale.body, color: colors.accent },
  chevronContainer: { position: 'absolute', right: 16, top: '50%', marginTop: -10 },
  emptyState: { padding: 40, alignItems: 'center' },
  emptyText: { fontFamily: typography.fontFamily.regular, color: colors.textSecondary },
});
