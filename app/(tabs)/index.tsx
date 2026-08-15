import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { Flame, User, Play, ChevronRight, Dumbbell, Activity, Calendar, Bookmark } from 'lucide-react-native';
import { useStreak } from '../../hooks/useStreak';
import { useLastWorkout } from '../../hooks/useWorkouts';
import { useTemplates } from '../../hooks/useTemplates';
import { useWorkoutStore } from '../../store/workout-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProfile } from '../../hooks/useProfile';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';

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
  const { width } = useWindowDimensions();

  const { data: streakData, isLoading: isStreakLoading } = useStreak();
  const streak = streakData?.current || 0;
  
  const { data: profile } = useProfile();
  const { data: lastWorkoutData, isLoading: isLastWorkoutLoading } = useLastWorkout();
  
  const { data: templates } = useTemplates();
  const loadFromTemplate = useWorkoutStore(state => state.loadFromTemplate);

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

  // Responsive: CTA card column needs enough width for text to fit in 1 line
  // On narrow screens reduce startText slightly
  const startFontSize = Math.min(24, Math.max(18, width * 0.058));

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 100 }]} 
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
                  <User color={colors.textPrimary} size={22} />
                </View>
              )}
            </TouchableOpacity>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.greetingText} numberOfLines={1}>
                Hola, {profile?.username ? profile.username : 'Atleta'}
              </Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>¿Listo para sudar?</Text>
            </View>
          </View>
          <View style={styles.iconButton}>
            <Dumbbell color={colors.accent} size={22} />
          </View>
        </View>

        {/* Main action row */}
        <View style={styles.statsRow}>
          {/* Left column: streak + progress */}
          <View style={styles.leftColumn}>
            <View style={styles.streakCard}>
              <LinearGradient
                colors={['rgba(180, 240, 60, 0.15)', 'rgba(180, 240, 60, 0.02)']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <Text style={styles.streakLabel} numberOfLines={1}>RACHA ACTUAL</Text>
              <View style={styles.streakValueRow}>
                <Text style={styles.streakNumber} numberOfLines={1}>
                  {isStreakLoading ? '-' : streak}
                </Text>
                <Text style={styles.streakDays}> DÍAS</Text>
              </View>
              <Flame color={colors.accent} size={22} style={{ position: 'absolute', top: 16, right: 16, opacity: 0.85 }} />
            </View>

            <TouchableOpacity 
              style={styles.progressCard}
              onPress={() => router.push('/progreso')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.01)']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <Activity color={colors.textPrimary} size={20} />
              <Text style={styles.progressCardText} numberOfLines={1}>Mi Progreso</Text>
            </TouchableOpacity>
          </View>

          {/* Right: Start Workout CTA */}
          <View style={styles.startCardContainer}>
            <TouchableOpacity 
              activeOpacity={0.9}
              onPress={() => router.push('/entrenar')}
              style={{ flex: 1 }}
            >
              <LinearGradient
                colors={[colors.accent, '#7CB314']}
                style={styles.startGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.playIconContainer}>
                  <Play color={colors.background} size={28} fill={colors.background} style={{ marginLeft: 3 }} />
                </View>
                <View>
                  <Text style={[styles.startText, { fontSize: startFontSize }]} numberOfLines={1}>
                    Empezar
                  </Text>
                  <Text style={styles.startSubText} numberOfLines={1}>ENTRENAMIENTO</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Templates section */}
        {templates && templates.length > 0 && (
          <View style={styles.sectionWrapper}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Plantillas Rápidas</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 20 }}>
              {templates.map((template: any) => (
                <TouchableOpacity
                  key={template.id}
                  style={styles.templateCard}
                  onPress={() => {
                    loadFromTemplate(template.workout_exercises);
                    router.push('/entrenar');
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.templateIconBg}>
                    <Bookmark color={colors.accent} size={18} fill={colors.accent} />
                  </View>
                  <Text style={styles.templateName} numberOfLines={1}>{template.name}</Text>
                  <Text style={styles.templateDetails}>
                    {template.workout_exercises?.length || 0} ejercicios
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Last Workout section */}
        <View style={styles.sectionWrapper}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Último Entrenamiento</Text>
            {lastWorkout && <Text style={styles.sectionSubtitle}>{lastWorkout.date}</Text>}
          </View>
          
          <View style={styles.lastWorkoutCard}>
            {isLastWorkoutLoading ? (
              <View style={styles.loadingState}>
                <Activity color={colors.textSecondary} size={22} />
                <Text style={styles.emptyText}>Cargando datos...</Text>
              </View>
            ) : lastWorkout ? (
              <View style={styles.lastWorkoutContent}>
                <View style={styles.lastWorkoutTop}>
                  <View style={styles.workoutIconBg}>
                    <Activity color={colors.accent} size={22} />
                  </View>
                  <View style={styles.lastWorkoutDetails}>
                    <Text style={styles.workoutName} numberOfLines={1}>{lastWorkout.name}</Text>
                    <Text style={styles.workoutDuration}>{lastWorkout.duration}</Text>
                  </View>
                </View>
                
                <View style={styles.exercisesContainer}>
                  <Text style={styles.workoutExercisesText} numberOfLines={2}>{lastWorkout.exercises}</Text>
                </View>

                <TouchableOpacity 
                  style={styles.historyButton}
                  onPress={() => router.push('/(tabs)/historial')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.historyButtonText}>Ver historial completo</Text>
                  <ChevronRight color={colors.accent} size={18} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Calendar color={colors.textSecondary} size={40} style={{ marginBottom: 14 }} />
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
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  headerUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerAvatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.accent,
  },
  headerAvatar: {
    width: '100%',
    height: '100%',
  },
  headerAvatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.accent,
  },
  greetingText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 20,
    lineHeight: 26,
    color: colors.textPrimary,
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontFamily: typography.fontFamily.medium,
    ...typography.scale.body,
    color: colors.textSecondary,
    marginTop: 2,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 28,
  },
  leftColumn: {
    flex: 1,
    gap: 12,
  },

  // Streak card
  streakCard: {
    height: 92,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(180, 240, 60, 0.3)',
    backgroundColor: colors.surface,
    padding: 16,
    justifyContent: 'center',
  },
  streakLabel: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 10,
    color: colors.accent,
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  streakValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  streakNumber: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 30,
    lineHeight: 34,
    color: colors.textPrimary,
  },
  streakDays: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },

  // Progress card
  progressCard: {
    height: 92,
    borderRadius: 20,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden',
  },
  progressCardText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 14,
    color: colors.textPrimary,
  },

  // Start CTA card
  startCardContainer: {
    flex: 1,
    height: 196,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(180, 240, 60, 0.45)',
  },
  startGradient: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  playIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  startText: {
    fontFamily: typography.fontFamily.bold,
    color: colors.background,
    marginBottom: 2,
  },
  startSubText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 10,
    color: 'rgba(0,0,0,0.55)',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },

  // Section
  sectionWrapper: {
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 16,
    color: colors.textPrimary,
    letterSpacing: 0.2,
  },
  sectionSubtitle: {
    fontFamily: typography.fontFamily.medium,
    ...typography.scale.caption,
    color: colors.textSecondary,
  },

  // Templates
  templateCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    width: 140,
  },
  templateIconBg: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(180, 240, 60, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  templateName: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  templateDetails: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 11,
    color: colors.textSecondary,
  },

  // Last workout card
  lastWorkoutCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  lastWorkoutContent: {
    flex: 1,
  },
  lastWorkoutTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  workoutIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(180, 240, 60, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  lastWorkoutDetails: {
    flex: 1,
  },
  workoutName: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 3,
  },
  workoutDuration: {
    fontFamily: typography.fontFamily.regular,
    ...typography.scale.caption,
    color: colors.accent,
  },
  exercisesContainer: {
    backgroundColor: colors.surfaceElevated,
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  workoutExercisesText: {
    fontFamily: typography.fontFamily.regular,
    ...typography.scale.body,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    backgroundColor: 'rgba(180, 240, 60, 0.07)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(180, 240, 60, 0.15)',
  },
  historyButtonText: {
    fontFamily: typography.fontFamily.medium,
    ...typography.scale.body,
    color: colors.accent,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
  },
  emptyTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  emptyText: {
    fontFamily: typography.fontFamily.regular,
    ...typography.scale.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    gap: 14,
  }
});
