import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { useWorkouts } from '../../hooks/useWorkouts';
import { useReduceMotion } from '../../hooks/useReduceMotion';
import { FlashList } from '@shopify/flash-list';
import { Clock, Weight, Dumbbell, ChevronRight, History } from 'lucide-react-native';
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
        from={{ opacity: 0, translateY: reduceMotion ? 0 : 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 250, delay: reduceMotion ? 0 : index * 40 }}
      >
        <TouchableOpacity 
          style={styles.card} 
          activeOpacity={0.7}
          onPress={() => router.push(`/entrenos/${item.id}`)}
        >
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardDate}>{getRelativeTime(item.started_at)}</Text>
            </View>
            <View style={styles.chevronBg}>
              <ChevronRight color={colors.accent} size={20} />
            </View>
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
              <View style={styles.statIconBg}>
                <Clock color={colors.accent} size={16} />
              </View>
              <View>
                <Text style={styles.statTextHighlight}>{durationMin}</Text>
                <Text style={styles.statText}>Minutos</Text>
              </View>
            </View>
            <View style={styles.stat}>
              <View style={styles.statIconBg}>
                <Weight color={colors.accent} size={16} />
              </View>
              <View>
                <Text style={styles.statTextHighlight}>{totalVolume}</Text>
                <Text style={styles.statText}>Vol (kg)</Text>
              </View>
            </View>
            <View style={styles.stat}>
              <View style={styles.statIconBg}>
                <Dumbbell color={colors.accent} size={16} />
              </View>
              <View>
                <Text style={styles.statTextHighlight}>{exerciseCount}</Text>
                <Text style={styles.statText}>Ejercicios</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </MotiView>
    );
  }, [router, reduceMotion]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
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
            estimatedItemSize={200}
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
                from={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={styles.emptyState}
              >
                <View style={styles.emptyIconContainer}>
                  <History color={colors.accent} size={48} />
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
  header: { paddingHorizontal: 24, paddingBottom: 16 },
  title: { fontFamily: typography.fontFamily.bold, ...typography.scale.display, fontSize: 28, color: colors.textPrimary },
  subtitle: { fontFamily: typography.fontFamily.medium, ...typography.scale.body, color: colors.textSecondary, marginTop: 4 },
  listContainer: { flex: 1 },
  listContent: { paddingHorizontal: 24, paddingBottom: 100, paddingTop: 16 },
  card: { backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 24, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontFamily: typography.fontFamily.bold, ...typography.scale.title, fontSize: 20, color: colors.textPrimary, marginBottom: 4 },
  cardDate: { fontFamily: typography.fontFamily.medium, ...typography.scale.caption, color: colors.textSecondary },
  chevronBg: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(180, 240, 60, 0.1)', justifyContent: 'center', alignItems: 'center' },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  tag: { backgroundColor: 'rgba(180, 240, 60, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(180, 240, 60, 0.2)' },
  tagText: { fontFamily: typography.fontFamily.bold, fontSize: 10, color: colors.accent, textTransform: 'uppercase', letterSpacing: 0.5 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 16, padding: 16 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statIconBg: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  statText: { fontFamily: typography.fontFamily.medium, fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  statTextHighlight: { fontFamily: typography.fontFamily.bold, fontSize: 14, color: colors.textPrimary },
  emptyState: { padding: 40, alignItems: 'center', marginTop: 40, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  emptyIconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(180, 240, 60, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  emptyTitle: { fontFamily: typography.fontFamily.bold, ...typography.scale.title, color: colors.textPrimary, marginBottom: 8, textAlign: 'center' },
  emptyText: { fontFamily: typography.fontFamily.regular, color: colors.textSecondary, textAlign: 'center', fontSize: 16, lineHeight: 24 },
});
