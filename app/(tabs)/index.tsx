import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { Flame, User, Play, ChevronRight, Dumbbell } from 'lucide-react-native';
import { useStreak } from '../../hooks/useStreak';
import { useLastWorkout } from '../../hooks/useWorkouts';

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
  const router = useRouter();

  // Datos reales de racha
  const { data: streakData, isLoading: isStreakLoading } = useStreak();
  const streak = streakData?.current || 0;

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
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <Dumbbell color={colors.accent} size={28} />
            <Text style={styles.headerTitle}>Bitácora Fit</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(tabs)/perfil')}>
            <User color={colors.textPrimary} size={28} />
          </TouchableOpacity>
        </View>

        {/* Streak Counter */}
        <View style={styles.streakContainer}>
          <Flame color={colors.accent} size={64} />
          <Text style={styles.streakNumber}>{isStreakLoading ? '-' : streak}</Text>
          <Text style={styles.streakLabel}>CURRENT STREAK</Text>
        </View>

        {/* Start Workout Button */}
        <TouchableOpacity 
          style={styles.startButton}
          activeOpacity={0.8}
          onPress={() => router.push('/entrenar')}
        >
          <Play color={colors.background} size={24} fill={colors.background} style={styles.startIcon} />
          <Text style={styles.startButtonText}>Empezar entreno</Text>
        </TouchableOpacity>

        {/* Last Workout Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Último entreno</Text>
            {lastWorkout && <Text style={styles.cardDate}>{lastWorkout.date}</Text>}
          </View>
          
          {isLastWorkoutLoading ? (
            <Text style={styles.emptyText}>Cargando...</Text>
          ) : lastWorkout ? (
            <>
              <Text style={styles.workoutName}>{lastWorkout.name}</Text>
              <Text style={styles.workoutDetails}>{lastWorkout.duration} • {lastWorkout.exercises}</Text>
              
              <TouchableOpacity 
                style={styles.cardButton}
                onPress={() => router.push('/(tabs)/historial')}
              >
                <Text style={styles.cardButtonText}>Ver historial completo</Text>
                <ChevronRight color={colors.accent} size={20} />
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Aún no has registrado ningún entreno</Text>
              <TouchableOpacity 
                style={[styles.cardButton, { borderTopWidth: 0, paddingTop: 12 }]}
                onPress={() => router.push('/entrenar')}
              >
                <Text style={styles.cardButtonText}>Empezar uno ahora</Text>
                <ChevronRight color={colors.accent} size={20} />
              </TouchableOpacity>
            </View>
          )}
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
    padding: 24,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontFamily: typography.fontFamily.bold,
    ...typography.scale.title,
    color: colors.textPrimary,
  },
  streakContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  streakNumber: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 80,
    lineHeight: 90,
    color: colors.textPrimary,
    marginTop: 8,
  },
  streakLabel: {
    fontFamily: typography.fontFamily.medium,
    ...typography.scale.caption,
    color: colors.textSecondary,
    letterSpacing: 2,
  },
  startButton: {
    backgroundColor: colors.accent,
    height: 64,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  startIcon: {
    marginRight: 12,
  },
  startButtonText: {
    fontFamily: typography.fontFamily.bold,
    ...typography.scale.title,
    fontSize: 20,
    color: colors.background,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontFamily: typography.fontFamily.bold,
    ...typography.scale.body,
    color: colors.textPrimary,
  },
  cardDate: {
    fontFamily: typography.fontFamily.regular,
    ...typography.scale.caption,
    color: colors.textSecondary,
  },
  workoutName: {
    fontFamily: typography.fontFamily.bold,
    ...typography.scale.title,
    fontSize: 22,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  workoutDetails: {
    fontFamily: typography.fontFamily.regular,
    ...typography.scale.body,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  cardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: 16,
  },
  cardButtonText: {
    fontFamily: typography.fontFamily.medium,
    ...typography.scale.body,
    color: colors.accent,
  },
  emptyState: {
    paddingVertical: 12,
  },
  emptyText: {
    fontFamily: typography.fontFamily.regular,
    ...typography.scale.body,
    color: colors.textSecondary,
    marginBottom: 8,
  }
});
