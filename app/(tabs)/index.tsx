import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { Flame, User, Play, ChevronRight, Dumbbell } from 'lucide-react-native';
import { useStreak } from '../../hooks/useStreak';

export default function HomeScreen() {
  const router = useRouter();

  // Datos reales de racha
  const { data: realStreak, isLoading: isStreakLoading } = useStreak();
  const streak = realStreak || 0;

  // Datos estáticos para último entreno (se conectarán después)
    name: 'Pecho y Tríceps',
    duration: '1h 15m',
    date: 'Ayer',
    exercises: 'Press banca, Fondos, Extensiones...',
  };

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
            <Text style={styles.cardDate}>{lastWorkout.date}</Text>
          </View>
          <Text style={styles.workoutName}>{lastWorkout.name}</Text>
          <Text style={styles.workoutDetails}>{lastWorkout.duration} • {lastWorkout.exercises}</Text>
          
          <TouchableOpacity 
            style={styles.cardButton}
            onPress={() => router.push('/(tabs)/historial')}
          >
            <Text style={styles.cardButtonText}>Ver historial completo</Text>
            <ChevronRight color={colors.accent} size={20} />
          </TouchableOpacity>
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
});
