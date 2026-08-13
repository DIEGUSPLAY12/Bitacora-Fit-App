import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { Flame, User, Play, ChevronRight, Dumbbell, Activity, Calendar } from 'lucide-react-native';
import { useStreak } from '../../hooks/useStreak';
import { useLastWorkout } from '../../hooks/useWorkouts';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProfile } from '../../hooks/useProfile';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';

const { width } = Dimensions.get('window');

function getRelativeTime(dateString: string) {
  const diffInDays = Math.round((new Date().getTime() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24));
  if (diffInDays === 0) return 'Hoy';
  if (diffInDays === 1) return 'Ayer';
  if (diffInDays < 7) return `Hace ${diffInDays} días`;
  if (diffInDays < 30) return `Hace ${Math.floor(diffInDays/7)} semanas`;
  return new Date(dateString).toLocaleDateString('es-ES');
}

function formatDuration(start: string, end: string) {
  if (!start || !end) return '';
  const diffMs = new Date(end).getTime() - new Date(start).getTime();
  const diffMins = Math.max(1, Math.floor(diffMs / 60000));
  const h = Math.floor(diffMins / 60);
  const m = diffMins % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { data: streakData, isLoading: isStreakLoading } = useStreak();
  const streak = streakData?.current || 0;
  
  const { data: profile } = useProfile();
  const { data: lastWorkoutData, isLoading: isLastWorkoutLoading } = useLastWorkout();

  let lastWorkout = null;
  if (lastWorkoutData) {
    const exercisesText = (lastWorkoutData.workout_exercises || [])
      .sort((a: any, b: any) => a.order_index - b.order_index)
      .map((we: any) => we.exercises?.name)
      .filter(Boolean)
      .join(', ');

    lastWorkout = {
      name: lastWorkoutData.name,
      duration: formatDuration(lastWorkoutData.started_at, lastWorkoutData.finished_at),
      date: getRelativeTime(lastWorkoutData.started_at),
      exercises: exercisesText.length > 35 ? exercisesText.substring(0, 35) + '...' : exercisesText,
    };
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 }]} 
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerUser}>
            <TouchableOpacity onPress={() => router.push('/(tabs)/perfil')}>
              {profile?.avatar_url ? (
                <View style={styles.headerAvatarContainer}>
                  <Image source={{ uri: profile.avatar_url }} style={styles.headerAvatar} contentFit="cover" />
                </View>
              ) : (
                <View style={styles.headerAvatarFallback}>
                  <User color={colors.textPrimary} size={24} />
                </View>
              )}
            </TouchableOpacity>
            <View>
              <Text style={styles.greetingText}>
                Hola, {profile?.username ? profile.username : 'Atleta'}
              </Text>
              <Text style={styles.headerSubtitle}>¿Listo para sudar?</Text>
            </View>
          </View>
          <View style={styles.iconButton}>
            <Dumbbell color={colors.accent} size={24} />
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.leftColumn}>
            {/* Main Streak Card (Compact) */}
            <View style={styles.streakCardContainerSmall}>
              <LinearGradient
                colors={['rgba(180, 240, 60, 0.15)', 'rgba(180, 240, 60, 0.02)']}
                style={styles.streakCardGradientSmall}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.streakContentSmall}>
                  <View>
                    <Text style={[styles.streakLabel, { fontSize: 11, marginBottom: 2 }]}>RACHA ACTUAL</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                      <Text style={[styles.streakNumber, { fontSize: 32, lineHeight: 36 }]}>{isStreakLoading ? '-' : streak}</Text>
                      <Text style={[styles.streakDays, { fontSize: 12 }]}>DÍAS</Text>
                    </View>
                  </View>
                  <Flame color={colors.accent} size={28} style={{ opacity: 0.9 }} />
                </View>
              </LinearGradient>
            </View>

            {/* Progress Card (Compact) */}
            <TouchableOpacity 
              style={styles.progressCardContainer}
              onPress={() => router.push('/progreso')}
              activeOpacity={0.8}
            >
              <Activity color={colors.accent} size={20} />
              <Text style={styles.progressCardText}>Mi Progreso</Text>
            </TouchableOpacity>
          </View>

          {/* Start Workout Button (Main CTA) */}
          <View style={styles.startCardContainer}>
            <TouchableOpacity 
              activeOpacity={0.9}
              onPress={() => router.push('/entrenar')}
              style={{ flex: 1 }}
            >
              <LinearGradient
                colors={[colors.accent, '#90D41C']}
                style={styles.startGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.playIconContainer}>
                  <Play color={colors.background} size={32} fill={colors.background} />
                </View>
                <Text style={styles.startText}>Empezar</Text>
                <Text style={styles.startSubText}>Entrenamiento</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ marginTop: 64 }}>
          {/* Last Workout Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Último Entrenamiento</Text>
            {lastWorkout && <Text style={styles.sectionSubtitle}>{lastWorkout.date}</Text>}
          </View>
          
          <View style={styles.lastWorkoutCard}>
            {isLastWorkoutLoading ? (
              <View style={styles.loadingState}>
                <Activity color={colors.textSecondary} size={24} />
                <Text style={styles.emptyText}>Cargando datos...</Text>
              </View>
            ) : lastWorkout ? (
              <View style={styles.lastWorkoutContent}>
                <View style={styles.lastWorkoutTop}>
                  <View style={styles.workoutIconBg}>
                    <Activity color={colors.accent} size={24} />
                  </View>
                  <View style={styles.lastWorkoutDetails}>
                    <Text style={styles.workoutName}>{lastWorkout.name}</Text>
                    <Text style={styles.workoutDuration}>{lastWorkout.duration}</Text>
                  </View>
                </View>
                
                <View style={styles.exercisesContainer}>
                  <Text style={styles.workoutExercisesText}>{lastWorkout.exercises}</Text>
                </View>

                <TouchableOpacity 
                  style={styles.historyButton}
                  onPress={() => router.push('/(tabs)/historial')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.historyButtonText}>Ver historial completo</Text>
                  <ChevronRight color={colors.accent} size={20} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Calendar color={colors.textSecondary} size={48} style={{ marginBottom: 16 }} />
                <Text style={styles.emptyTitle}>Aún no hay registros</Text>
                <Text style={styles.emptyText}>Inicia tu primer entrenamiento hoy</Text>
              </View>
            )}
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  headerUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerAvatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.accent,
  },
  headerAvatar: {
    width: '100%',
    height: '100%',
  },
  headerAvatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.accent,
  },
  greetingText: {
    fontFamily: typography.fontFamily.bold,
    ...typography.scale.title,
    fontSize: 22,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontFamily: typography.fontFamily.medium,
    ...typography.scale.body,
    color: colors.textSecondary,
    marginTop: 2,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: 16,
  },
  leftColumn: {
    flex: 1,
    justifyContent: 'space-between',
    height: 200,
  },
  streakCardContainerSmall: {
    height: 92,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(180, 240, 60, 0.2)',
    backgroundColor: colors.surface,
  },
  streakCardGradientSmall: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  streakContentSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  streakLabel: {
    fontFamily: typography.fontFamily.bold,
    ...typography.scale.caption,
    color: colors.accent,
    letterSpacing: 1,
  },
  streakNumber: {
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  streakDays: {
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },
  progressCardContainer: {
    height: 92,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.03)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  progressCardText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  startCardContainer: {
    flex: 1,
    height: 200,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  startGradient: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  playIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  startText: {
    fontFamily: typography.fontFamily.bold,
    ...typography.scale.title,
    color: colors.background,
    marginBottom: 4,
  },
  startSubText: {
    fontFamily: typography.fontFamily.medium,
    ...typography.scale.caption,
    color: 'rgba(0,0,0,0.6)',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.bold,
    ...typography.scale.body,
    fontSize: 18,
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    fontFamily: typography.fontFamily.medium,
    ...typography.scale.caption,
    color: colors.textSecondary,
  },
  lastWorkoutCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  lastWorkoutContent: {
    flex: 1,
  },
  lastWorkoutTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  workoutIconBg: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(180, 240, 60, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lastWorkoutDetails: {
    flex: 1,
  },
  workoutName: {
    fontFamily: typography.fontFamily.bold,
    ...typography.scale.body,
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  workoutDuration: {
    fontFamily: typography.fontFamily.regular,
    ...typography.scale.caption,
    color: colors.accent,
  },
  exercisesContainer: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  workoutExercisesText: {
    fontFamily: typography.fontFamily.regular,
    ...typography.scale.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
  },
  historyButtonText: {
    fontFamily: typography.fontFamily.medium,
    ...typography.scale.body,
    color: colors.accent,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    fontFamily: typography.fontFamily.bold,
    ...typography.scale.body,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: typography.fontFamily.regular,
    ...typography.scale.body,
    color: colors.textSecondary,
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 16,
  }
});
