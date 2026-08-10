import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { CheckCircle2, Flame, Clock, Weight, Hash } from 'lucide-react-native';
import { useStreak } from '../hooks/useStreak';

export default function WorkoutCompletedScreen() {
  const router = useRouter();
  const { volume, sets, duration } = useLocalSearchParams<{ volume: string, sets: string, duration: string }>();

  // Racha real
  const { data: streakData } = useStreak();
  const streak = streakData?.current || 0;

  const handleHome = () => {
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <CheckCircle2 color={colors.accent} size={120} style={styles.icon} />
        <Text style={styles.title}>¡Entreno completado!</Text>
        <Text style={styles.subtitle}>Gran trabajo hoy, sigue así.</Text>

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Clock color={colors.accent} size={28} style={styles.statIcon} />
            <Text style={styles.statValue}>{duration || '0'} min</Text>
            <Text style={styles.statLabel}>DURACIÓN</Text>
          </View>
          <View style={styles.statBox}>
            <Weight color={colors.accent} size={28} style={styles.statIcon} />
            <Text style={styles.statValue}>{volume || '0'} kg</Text>
            <Text style={styles.statLabel}>VOLUMEN</Text>
          </View>
          <View style={styles.statBox}>
            <Hash color={colors.accent} size={28} style={styles.statIcon} />
            <Text style={styles.statValue}>{sets || '0'}</Text>
            <Text style={styles.statLabel}>SERIES</Text>
          </View>
        </View>

        <View style={styles.streakContainer}>
          <Flame color={colors.accent} size={32} />
          <Text style={styles.streakText}>¡Racha actual: <Text style={styles.streakHighlight}>{streak} días</Text>!</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleHome}>
          <Text style={styles.primaryButtonText}>Volver al inicio</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  icon: { marginBottom: 24 },
  title: { fontFamily: typography.fontFamily.bold, ...typography.scale.display, fontSize: 32, color: colors.textPrimary, marginBottom: 8, textAlign: 'center' },
  subtitle: { fontFamily: typography.fontFamily.medium, ...typography.scale.body, color: colors.textSecondary, marginBottom: 48, textAlign: 'center' },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 48, gap: 12 },
  statBox: { flex: 1, backgroundColor: colors.surface, padding: 16, borderRadius: 16, alignItems: 'center' },
  statIcon: { marginBottom: 12 },
  statValue: { fontFamily: typography.fontFamily.bold, ...typography.scale.title, color: colors.textPrimary, marginBottom: 4 },
  statLabel: { fontFamily: typography.fontFamily.bold, ...typography.scale.caption, color: colors.textSecondary, letterSpacing: 1 },
  streakContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(180, 240, 60, 0.1)', paddingHorizontal: 24, paddingVertical: 16, borderRadius: 100, gap: 12 },
  streakText: { fontFamily: typography.fontFamily.medium, ...typography.scale.body, color: colors.textPrimary },
  streakHighlight: { fontFamily: typography.fontFamily.bold, color: colors.accent },
  footer: { padding: 24, paddingBottom: 40 },
  primaryButton: { backgroundColor: colors.accent, height: 56, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  primaryButtonText: { fontFamily: typography.fontFamily.bold, ...typography.scale.body, color: colors.background },
});
