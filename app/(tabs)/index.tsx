import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { Flame, User, ChevronRight, Dumbbell, Activity, Calendar, Folder, Sparkles, Edit2 } from 'lucide-react-native';
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

        {/* Stats row (Streak & Progress) */}
        <View style={styles.statsRow}>
          <View style={[styles.streakCard, { flex: 1 }]}>
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
            style={[styles.progressCard, { flex: 1 }]}
            onPress={() => router.push('/progreso')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.01)']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Activity color={colors.textPrimary} size={24} style={{ marginBottom: 4 }} />
            <Text style={styles.progressCardText} numberOfLines={1}>Mi Progreso</Text>
          </TouchableOpacity>
        </View>

        {/* Tu Plan (Templates) */}
        <View style={styles.sectionWrapper}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tu Plan</Text>
            {templates && templates.length > 0 && (
              <TouchableOpacity onPress={() => router.push('/plantillas')}>
                <Text style={styles.sectionSubtitle}>Más planes <ChevronRight size={14} color={colors.textSecondary} /></Text>
              </TouchableOpacity>
            )}
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingRight: 20 }}>
            {templates && templates.length > 0 ? (
              templates.map((template: any) => (
                <TouchableOpacity
                  key={template.id}
                  style={styles.templateCardLarge}
                  onPress={() => router.push(`/template/${template.id}`)}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={['#1F2514', '#10140A']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={StyleSheet.absoluteFill}
                    locations={[0.3, 1]}
                  />
                  
                  <View style={styles.templateCardContent}>
                    <View style={styles.templateCardBadge}>
                      <Text style={styles.templateCardBadgeText}>Plantilla</Text>
                    </View>
                    
                    <View>
                      <Text style={styles.templateCardTitle} numberOfLines={2}>{template.name}</Text>
                      <Text style={styles.templateCardDetails}>
                        45 min · {template.workout_exercises?.length || 0} ejercicios
                      </Text>
                      
                      <View style={styles.templateCardButton}>
                        <Text style={styles.templateCardButtonText}>Ver</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={[styles.templateCardLarge, styles.templateCardEmpty]}>
                <Text style={styles.emptyTitle}>Sin plantillas</Text>
                <Text style={styles.emptyText}>Crea tu primera rutina para empezar.</Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Action Rows */}
        <View style={styles.sectionWrapper}>
          <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>Crear plantilla para otro momento</Text>
          
          <TouchableOpacity 
            style={styles.actionRow} 
            onPress={() => router.push('/template/crear')}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(180, 240, 60, 0.1)' }]}>
              <Folder color={colors.accent} size={22} />
            </View>
            <View style={styles.actionTextContainer}>
              <Text style={styles.actionTitle}>Crear plantilla</Text>
              <Text style={styles.actionDesc}>Créala ahora y úsala cuando quieras</Text>
            </View>
          </TouchableOpacity>

          <Text style={[styles.sectionTitle, { marginTop: 24, marginBottom: 16 }]}>¿Buscas otra forma de entrenar?</Text>
          

          <TouchableOpacity 
            style={styles.actionRow} 
            onPress={() => router.push('/entrenar')}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(180, 240, 60, 0.1)' }]}>
              <Edit2 color={colors.accent} size={22} />
            </View>
            <View style={styles.actionTextContainer}>
              <Text style={styles.actionTitle}>Empezar entrenamiento libre</Text>
              <Text style={styles.actionDesc}>Añade ejercicios a medida que entrenas</Text>
            </View>
          </TouchableOpacity>
        </View>

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
    marginBottom: 32,
  },
  
  // Streak card
  streakCard: {
    height: 96,
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
    fontSize: 32,
    lineHeight: 36,
    color: colors.textPrimary,
  },
  streakDays: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 12,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },

  // Progress card
  progressCard: {
    height: 96,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden',
  },
  progressCardText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 15,
    color: colors.textPrimary,
    marginTop: 4,
  },

  // Section
  sectionWrapper: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 18,
    color: colors.textPrimary,
    letterSpacing: 0.2,
  },
  sectionSubtitle: {
    fontFamily: typography.fontFamily.medium,
    ...typography.scale.caption,
    color: colors.textSecondary,
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Templates Large Card (Symmetry style)
  templateCardLarge: {
    width: 240,
    height: 320,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  templateCardEmpty: {
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.2)',
  },
  templateCardContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
    zIndex: 2,
  },
  templateCardBadge: {
    backgroundColor: 'rgba(180, 240, 60, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    backdropFilter: 'blur(10px)',
  },
  templateCardBadgeText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 12,
    color: colors.accent,
  },
  templateCardTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 26,
    color: colors.textPrimary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  templateCardDetails: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  templateCardButton: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: 100,
    alignItems: 'center',
  },
  templateCardButtonText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 15,
    color: colors.background,
  },

  // Action Rows
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  actionDesc: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 13,
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
