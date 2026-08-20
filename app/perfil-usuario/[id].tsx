import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { User, Weight, ArrowLeft, Flame, Trophy } from 'lucide-react-native';
import { Image } from 'expo-image';
import { useProfile } from '../../hooks/useProfile';
import { useStreak } from '../../hooks/useStreak';
import { useRecentWorkouts } from '../../hooks/useWorkouts';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';

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

  const { data: profile, isLoading: profileLoading, isError } = useProfile(id);
  const { data: stats, isLoading: statsLoading } = useStreak(id);
  const { data: recentWorkouts, isLoading: workoutsLoading } = useRecentWorkouts(id, 5);

  const renderWorkoutCard = useCallback((item: any, index: number) => {
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
      <View key={item.id}>
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
            <View style={styles.statGroup}>
              <View style={styles.statValueContainer}>
                <Text style={styles.statValueHighlight}>{exerciseCount}</Text>
                <Text style={styles.statLabelSmall}>ejer.</Text>
              </View>
            </View>
            <View style={styles.statGroup}>
              <View style={styles.statValueContainer}>
                <Text style={styles.statValueHighlight}>{totalSets}</Text>
                <Text style={styles.statLabelSmall}>series</Text>
              </View>
            </View>
            <View style={styles.statGroup}>
              <View style={styles.statValueContainer}>
                <Weight color={colors.accent} size={14} style={{ marginRight: 4 }} />
                <Text style={styles.statValueHighlight}>{totalVolume}</Text>
                <Text style={styles.statLabelSmall}>kg</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  }, [router]);

  if (profileLoading || id === 'undefined') {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (isError || !profile) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <User color={colors.textSecondary} size={48} style={{ marginBottom: 16 }} />
        <Text style={{ color: colors.textPrimary, fontSize: 18, fontFamily: typography.fontFamily.bold, marginBottom: 24 }}>Perfil no encontrado</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ backgroundColor: colors.accent, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 }}>
          <Text style={{ color: colors.background, fontFamily: typography.fontFamily.bold, fontSize: 16 }}>Volver</Text>
        </TouchableOpacity>
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
        <Text style={styles.headerTitle}>Perfil de Amigo</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.userSection}>
          <View style={styles.avatarRing}>
            <View style={styles.avatarContainer}>
              {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatar} contentFit="cover" />
              ) : (
                <User color={colors.accent} size={48} />
              )}
            </View>
          </View>
          <Text style={styles.username}>
            {profile?.username || 'Usuario'}
          </Text>
        </View>

        <View style={styles.bentoGrid}>
          <View style={[styles.bentoCard, { flex: 1 }]}>
            <View style={styles.bentoIconBg}>
              <Trophy color={colors.textPrimary} size={20} />
            </View>
            <Text style={styles.bentoValue} adjustsFontSizeToFit numberOfLines={1}>{statsLoading ? '-' : stats?.total || 0}</Text>
            <Text style={styles.bentoLabel}>ENTRENOS</Text>
          </View>
          
          <View style={[styles.bentoCard, { flex: 1.2, backgroundColor: 'rgba(180, 240, 60, 0.05)', borderColor: 'rgba(180, 240, 60, 0.2)' }]}>
            <View style={[styles.bentoIconBg, { backgroundColor: 'rgba(180, 240, 60, 0.15)' }]}>
              <Flame color={colors.accent} size={20} />
            </View>
            <Text style={[styles.bentoValue, { color: colors.accent }]} adjustsFontSizeToFit numberOfLines={1}>{statsLoading ? '-' : stats?.longest || 0}</Text>
            <Text style={[styles.bentoLabel, { color: colors.accent }]}>RACHA MÁXIMA</Text>
          </View>
        </View>

        <View>
          <Text style={styles.sectionTitle}>Últimos entrenos</Text>
          
          {workoutsLoading ? (
            <ActivityIndicator size="small" color={colors.accent} style={{ marginTop: 20 }} />
          ) : recentWorkouts && recentWorkouts.length > 0 ? (
            recentWorkouts.map((workout, idx) => renderWorkoutCard(workout, idx))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Este usuario aún no ha registrado entrenos.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingBottom: 16 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontFamily: typography.fontFamily.bold, ...typography.scale.title, fontSize: 22, color: colors.textPrimary },
  
  scrollContent: { padding: 24, paddingBottom: 100 },
  userSection: { alignItems: 'center', marginBottom: 32 },
  avatarRing: { width: 112, height: 112, borderRadius: 56, borderWidth: 2, borderColor: colors.accent, justifyContent: 'center', alignItems: 'center', marginBottom: 16, backgroundColor: 'rgba(180, 240, 60, 0.1)' },
  avatarContainer: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  avatar: { width: '100%', height: '100%' },
  username: { fontFamily: typography.fontFamily.bold, ...typography.scale.display, fontSize: 28, color: colors.textPrimary },
  
  bentoGrid: { flexDirection: 'row', gap: 12, marginBottom: 40 },
  bentoCard: { backgroundColor: 'rgba(255,255,255,0.02)', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'flex-start' },
  bentoIconBg: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  bentoValue: { fontFamily: typography.fontFamily.bold, ...typography.scale.title, fontSize: 26, color: colors.textPrimary, marginBottom: 4 },
  bentoLabel: { fontFamily: typography.fontFamily.bold, ...typography.scale.caption, color: colors.textSecondary, letterSpacing: 1 },
  
  sectionTitle: { fontFamily: typography.fontFamily.bold, ...typography.scale.title, fontSize: 22, color: colors.textPrimary, marginBottom: 20 },
  
  card: { backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  cardTitle: { flex: 1, fontFamily: typography.fontFamily.bold, ...typography.scale.title, fontSize: 18, color: colors.textPrimary },
  cardDate: { fontFamily: typography.fontFamily.medium, ...typography.scale.caption, color: colors.textSecondary, backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  tag: { backgroundColor: 'rgba(180, 240, 60, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(180, 240, 60, 0.2)' },
  tagText: { fontFamily: typography.fontFamily.bold, fontSize: 10, color: colors.accent, textTransform: 'uppercase', letterSpacing: 0.5 },
  
  statsContainer: { flexDirection: 'row', gap: 16, backgroundColor: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 12 },
  statGroup: { flex: 1, alignItems: 'center' },
  statValueContainer: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  statValueHighlight: { fontFamily: typography.fontFamily.bold, ...typography.scale.body, fontSize: 16, color: colors.textPrimary },
  statLabelSmall: { fontFamily: typography.fontFamily.medium, fontSize: 12, color: colors.textSecondary },
  
  emptyState: { padding: 40, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginTop: 10 },
  emptyText: { fontFamily: typography.fontFamily.medium, ...typography.scale.body, color: colors.textSecondary, textAlign: 'center' },
});
