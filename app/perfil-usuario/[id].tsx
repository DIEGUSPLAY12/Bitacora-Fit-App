import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { User, Weight, ArrowLeft } from 'lucide-react-native';
import { Image } from 'expo-image';
import { useProfile } from '../../hooks/useProfile';
import { useStreak } from '../../hooks/useStreak';
import { useRecentWorkouts } from '../../hooks/useWorkouts';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function getRelativeTime(dateString: string) {
  const diffInDays = Math.round((new Date().getTime() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24));
  if (diffInDays === 0) return 'Hoy';
  if (diffInDays === 1) return 'Ayer';
  if (diffInDays < 7) return `Hace ${diffInDays} días`;
  if (diffInDays < 30) return `Hace ${Math.floor(diffInDays/7)} semanas`;
  return new Date(dateString).toLocaleDateString('es-ES');
}

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: profile, isLoading: profileLoading } = useProfile(id);
  const { data: stats, isLoading: statsLoading } = useStreak(id);
  const { data: recentWorkouts, isLoading: workoutsLoading } = useRecentWorkouts(id, 5);

  const renderWorkoutCard = useCallback((item: any) => {
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
      <TouchableOpacity 
        key={item.id}
        style={styles.card} 
        activeOpacity={0.7}
        onPress={() => router.push(`/entrenos/${item.id}`)}
      >
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardDate}>{getRelativeTime(item.started_at)}</Text>

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
            <Text style={styles.statTextHighlight}>{exerciseCount}</Text>
            <Text style={styles.statText}>ejercicios</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statTextHighlight}>{totalSets}</Text>
            <Text style={styles.statText}>series</Text>
          </View>
          <View style={styles.stat}>
            <Weight color={colors.textSecondary} size={16} />
            <Text style={styles.statText}>{totalVolume} kg</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [router]);

  if (profileLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color={colors.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Perfil de usuario</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.userSection}>
          <View style={styles.avatarContainer}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} contentFit="cover" />
            ) : (
              <User color={colors.background} size={48} />
            )}
          </View>
          <Text style={styles.username}>
            {profile?.username || 'Usuario'}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{statsLoading ? '-' : stats?.total || 0}</Text>
            <Text style={styles.statLabel}>ENTRENOS</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: colors.accent }]}>{statsLoading ? '-' : stats?.longest || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.accent }]}>RACHA MÁX</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Últimos entrenos</Text>
        
        {workoutsLoading ? (
          <ActivityIndicator size="small" color={colors.accent} style={{ marginTop: 20 }} />
        ) : recentWorkouts && recentWorkouts.length > 0 ? (
          recentWorkouts.map(workout => renderWorkoutCard(workout))
        ) : (
          <Text style={styles.emptyText}>Este usuario aún no ha registrado entrenos.</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingBottom: 16 },
  backButton: { padding: 4, marginLeft: -4 },
  headerTitle: { fontFamily: typography.fontFamily.bold, ...typography.scale.title, color: colors.textPrimary },
  scrollContent: { padding: 24, paddingBottom: 100 },
  userSection: { alignItems: 'center', marginBottom: 40 },
  avatarContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.textPrimary, justifyContent: 'center', alignItems: 'center', marginBottom: 16, overflow: 'hidden' },
  avatar: { width: '100%', height: '100%' },
  username: { fontFamily: typography.fontFamily.bold, ...typography.scale.title, color: colors.textPrimary },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.surface, borderRadius: 16, padding: 20, marginBottom: 40 },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontFamily: typography.fontFamily.bold, ...typography.scale.display, fontSize: 28, color: colors.textPrimary, marginBottom: 4 },
  statLabel: { fontFamily: typography.fontFamily.bold, ...typography.scale.caption, color: colors.textSecondary, letterSpacing: 1 },
  sectionTitle: { fontFamily: typography.fontFamily.bold, ...typography.scale.title, color: colors.textPrimary, marginBottom: 16 },
  card: { backgroundColor: colors.surface, borderRadius: 16, padding: 20, marginBottom: 16 },
  cardTitle: { fontFamily: typography.fontFamily.bold, ...typography.scale.title, fontSize: 18, color: colors.textPrimary, marginBottom: 4 },
  cardDate: { fontFamily: typography.fontFamily.regular, ...typography.scale.caption, color: colors.textSecondary, marginBottom: 12 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  tag: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  tagText: { fontFamily: typography.fontFamily.medium, fontSize: 10, color: colors.textSecondary, textTransform: 'uppercase' },
  statsContainer: { flexDirection: 'row', gap: 24 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { fontFamily: typography.fontFamily.medium, ...typography.scale.caption, color: colors.textSecondary },
  statTextHighlight: { fontFamily: typography.fontFamily.bold, ...typography.scale.body, color: colors.accent },
  emptyText: { fontFamily: typography.fontFamily.regular, ...typography.scale.body, color: colors.textSecondary, textAlign: 'center', marginTop: 20 },
});
