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
        from={{ opacity: 0, translateY: reduceMotion ? 0 : 30, scale: 0.95 }}
        animate={{ opacity: 1, translateY: 0, scale: 1 }}
        transition={{ type: 'spring', damping: 20, delay: reduceMotion ? 0 : index * 100 }}
      >
        <View style={styles.card}>
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
              <Text style={styles.authorName}>{item.profiles?.username}</Text>
              <Text style={styles.cardDate}>{getRelativeTime(item.started_at)}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            activeOpacity={0.7}
            onPress={() => router.push(`/entrenos/${item.id}`)}
          >
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

            <View style={styles.statsContainer}>
              <View style={styles.stat}>
                <View style={styles.statIconBg}>
                  <Dumbbell color={colors.accent} size={16} />
                </View>
                <View>
                  <Text style={styles.statTextHighlight}>{exerciseCount}</Text>
                  <Text style={styles.statText}>Ejercicios</Text>
                </View>
              </View>
              <View style={styles.stat}>
                <View style={styles.statIconBg}>
                  <Repeat color={colors.accent} size={16} />
                </View>
                <View>
                  <Text style={styles.statTextHighlight}>{totalSets}</Text>
                  <Text style={styles.statText}>Series</Text>
                </View>
              </View>
              <View style={styles.stat}>
                <View style={styles.statIconBg}>
                  <Activity color={colors.accent} size={16} />
                </View>
                <View>
                  <Text style={styles.statTextHighlight}>{totalVolume}</Text>
                  <Text style={styles.statText}>Vol (kg)</Text>
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
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View>
          <Text style={styles.title}>Actividad</Text>
          <Text style={styles.subtitle}>Explora lo que hacen tus amigos</Text>
        </View>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.push('/amigos')} activeOpacity={0.7}>
          <UserPlus color={colors.textPrimary} size={24} />
        </TouchableOpacity>
      </View>

      <View style={styles.listContainer}>
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 60 }} />
        ) : (
          <FlashList
            data={workouts || []}
            renderItem={renderItem}
            estimatedItemSize={250}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <MotiView 
                from={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={styles.emptyState}
              >
                <View style={styles.emptyIconContainer}>
                  <Users color={colors.accent} size={48} />
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingBottom: 16 },
  title: { fontFamily: typography.fontFamily.bold, ...typography.scale.display, fontSize: 28, color: colors.textPrimary },
  subtitle: { fontFamily: typography.fontFamily.medium, ...typography.scale.body, color: colors.textSecondary, marginTop: 4 },
  headerButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  listContainer: { flex: 1 },
  listContent: { paddingHorizontal: 24, paddingBottom: 100, paddingTop: 16 },
  card: { backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 24, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  authorHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatarContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accent, justifyContent: 'center', alignItems: 'center', marginRight: 12, overflow: 'hidden' },
  avatar: { width: '100%', height: '100%' },
  authorInfo: { flex: 1 },
  authorName: { fontFamily: typography.fontFamily.bold, ...typography.scale.body, fontSize: 16, color: colors.textPrimary },
  cardTitle: { fontFamily: typography.fontFamily.bold, ...typography.scale.title, fontSize: 20, color: colors.textPrimary, marginBottom: 12 },
  cardDate: { fontFamily: typography.fontFamily.medium, ...typography.scale.caption, color: colors.textSecondary },
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
  emptyText: { fontFamily: typography.fontFamily.regular, color: colors.textSecondary, textAlign: 'center', marginBottom: 24, fontSize: 16, lineHeight: 24 },
  emptyButton: { backgroundColor: colors.accent, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 16, shadowColor: colors.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  emptyButtonText: { fontFamily: typography.fontFamily.bold, color: colors.background, ...typography.scale.body, fontSize: 16 }
});
