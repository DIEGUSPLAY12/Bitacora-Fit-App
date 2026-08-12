import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { UserPlus, User, Users } from 'lucide-react-native';
import { useFriendsFeed, useFriends } from '../../hooks/useFriends';
import { useReduceMotion } from '../../hooks/useReduceMotion';
import { FlashList } from '@shopify/flash-list';
import { MotiView } from 'moti';
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
    let muscleGroups = new Set<string>();

    item.workout_exercises?.forEach((we: any) => {
      if (we.exercises?.muscle_group) {
        muscleGroups.add(we.exercises.muscle_group);
      }
    });

    const tags = Array.from(muscleGroups).slice(0, 3);

    return (
      <MotiView
        from={{ opacity: 0, translateY: reduceMotion ? 0 : 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400, delay: reduceMotion ? 0 : index * 100 }}
      >
        <View style={styles.card}>
          <View style={styles.authorHeader}>
            <View style={styles.avatarContainer}>
              {item.profiles?.avatar_url ? (
                <Image source={item.profiles.avatar_url} style={styles.avatar} />
              ) : (
                <User color={colors.background} size={16} />
              )}
            </View>
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>{item.profiles?.username}</Text>
              <Text style={styles.cardDate}>{getRelativeTime(item.started_at)}</Text>
            </View>
          </View>

          <Text style={styles.cardTitle}>{item.name}</Text>

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

          <View style={styles.detailsContainer}>
            {item.workout_exercises?.map((we: any, weIndex: number) => (
              <View key={we.id} style={styles.exerciseBlock}>
                <Text style={styles.exerciseTitle}>{weIndex + 1}. {we.exercises?.name}</Text>
                
                <View style={styles.tableHeader}>
                  <Text style={[styles.columnHeader, styles.colSet]}>SET</Text>
                  <Text style={[styles.columnHeader, styles.colKg]}>KG</Text>
                  <Text style={[styles.columnHeader, styles.colReps]}>REPS</Text>
                </View>

                {we.sets?.map((set: any, setIndex: number) => (
                  <View key={set.id} style={styles.setRow}>
                    <Text style={styles.setIndex}>{setIndex + 1}</Text>
                    <Text style={styles.controlValue}>{set.weight_kg}</Text>
                    <Text style={styles.controlValue}>{set.reps}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </View>
      </MotiView>
    );
  }, [reduceMotion]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.title}>Actividad de tus amigos</Text>
        <TouchableOpacity onPress={() => router.push('/amigos')}>
          <UserPlus color={colors.textPrimary} size={28} />
        </TouchableOpacity>
      </View>

      <View style={styles.listContainer}>
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 40 }} />
        ) : (
          <FlashList
            data={workouts || []}
            renderItem={renderItem}
            estimatedItemSize={300}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Users color={colors.textSecondary} size={48} style={styles.emptyIcon} />
                {hasFriends ? (
                  <Text style={styles.emptyText}>Tus amigos aún no han subido ningún entreno</Text>
                ) : (
                  <>
                    <Text style={styles.emptyText}>Añade amigos para ver su actividad aquí</Text>
                    <TouchableOpacity style={styles.emptyButton} onPress={() => router.push('/amigos')}>
                      <Text style={styles.emptyButtonText}>Buscar amigos</Text>
                    </TouchableOpacity>
                  </>
                )}
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingTop: 16, paddingBottom: 16 },
  title: { fontFamily: typography.fontFamily.bold, ...typography.scale.title, fontSize: 22, color: colors.textPrimary },
  listContainer: { flex: 1 },
  listContent: { paddingHorizontal: 24, paddingBottom: 100 },
  card: { backgroundColor: colors.surface, borderRadius: 16, padding: 20, marginBottom: 16 },
  authorHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatarContainer: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.textPrimary, justifyContent: 'center', alignItems: 'center', marginRight: 12, overflow: 'hidden' },
  avatar: { width: '100%', height: '100%' },
  authorInfo: { flex: 1 },
  authorName: { fontFamily: typography.fontFamily.bold, ...typography.scale.body, color: colors.textPrimary },
  cardTitle: { fontFamily: typography.fontFamily.bold, ...typography.scale.title, fontSize: 18, color: colors.textPrimary, marginBottom: 12 },
  cardDate: { fontFamily: typography.fontFamily.regular, ...typography.scale.caption, color: colors.textSecondary },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  tag: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  tagText: { fontFamily: typography.fontFamily.medium, fontSize: 10, color: colors.textSecondary, textTransform: 'uppercase' },
  detailsContainer: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 16 },
  exerciseBlock: { marginBottom: 16 },
  exerciseTitle: { fontFamily: typography.fontFamily.bold, ...typography.scale.body, color: colors.textPrimary, textTransform: 'capitalize', marginBottom: 12 },
  tableHeader: { flexDirection: 'row', marginBottom: 8, paddingHorizontal: 8 },
  columnHeader: { fontFamily: typography.fontFamily.bold, ...typography.scale.caption, color: colors.textSecondary, textAlign: 'center' },
  colSet: { width: 40 },
  colKg: { flex: 1 },
  colReps: { flex: 1 },
  setRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 8, borderRadius: 8, marginBottom: 4, backgroundColor: 'rgba(255,255,255,0.02)' },
  setIndex: { width: 40, fontFamily: typography.fontFamily.bold, color: colors.textSecondary, textAlign: 'center' },
  controlValue: { flex: 1, textAlign: 'center', fontFamily: typography.fontFamily.bold, color: colors.textPrimary },
  emptyState: { padding: 40, alignItems: 'center', marginTop: 40 },
  emptyIcon: { marginBottom: 16 },
  emptyText: { fontFamily: typography.fontFamily.medium, color: colors.textSecondary, textAlign: 'center', marginBottom: 24, fontSize: 16 },
  emptyButton: { backgroundColor: colors.accent, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  emptyButtonText: { fontFamily: typography.fontFamily.bold, color: colors.background, ...typography.scale.body }
});
