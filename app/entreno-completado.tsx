import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { typography } from '../theme/typography';
import { colors } from '../theme/colors';
import { CheckCircle2, Flame, Clock, Weight, Hash } from 'lucide-react-native';
import { useStreak } from '../hooks/useStreak';
import { useReduceMotion } from '../hooks/useReduceMotion';
import { MotiView } from 'moti';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWorkoutStore } from '../store/workout-store';
import { useSaveWorkout } from '../hooks/useSaveWorkout';

export default function WorkoutCompletedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { volume, sets, duration } = useLocalSearchParams<{ volume: string, sets: string, duration: string }>();

  const { data: streakData } = useStreak();
  const streak = streakData?.current || 0;
  
  const reduceMotion = useReduceMotion();

  // Store & Saving
  const { startedAt, exercises, endWorkout } = useWorkoutStore();
  const { mutateAsync: saveWorkout, isPending: isSaving } = useSaveWorkout();

  // Local state for editable fields
  const [workoutName, setWorkoutName] = useState('Entrenamiento Libre');
  const [durationStrState, setDurationStrState] = useState(duration || '0');

  const handleSaveAndHome = async () => {
    try {
      const durMins = parseInt(durationStrState, 10) || 0;
      const st = startedAt || Date.now();
      const finishedAt = st + (durMins * 60000);

      await saveWorkout({
        name: workoutName.trim() || 'Entrenamiento Libre',
        startedAt: st,
        finishedAt,
        exercises
      });

      // Limpiar store y volver a casa
      endWorkout();
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo guardar el entreno: ' + error.message);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 24 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <MotiView
            from={{ scale: reduceMotion ? 1 : 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 100 }}
          >
            <CheckCircle2 color={colors.accent} size={80} style={styles.icon} />
          </MotiView>
          <Text style={styles.title}>¡Entreno completado!</Text>
          <Text style={styles.subtitle}>Gran trabajo hoy, revisa y guarda tu progreso.</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>NOMBRE DEL ENTRENO</Text>
            <TextInput 
              style={styles.textInput}
              value={workoutName}
              onChangeText={setWorkoutName}
              placeholder="Ej. Día de Pecho"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>DURACIÓN (MINUTOS)</Text>
            <TextInput 
              style={styles.textInput}
              value={durationStrState}
              onChangeText={setDurationStrState}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Weight color={colors.accent} size={24} style={styles.statIcon} />
            <Text style={styles.statValue}>{volume || '0'} kg</Text>
            <Text style={styles.statLabel}>VOLUMEN</Text>
          </View>
          <View style={styles.statBox}>
            <Hash color={colors.accent} size={24} style={styles.statIcon} />
            <Text style={styles.statValue}>{sets || '0'}</Text>
            <Text style={styles.statLabel}>SERIES</Text>
          </View>
        </View>

        <View style={styles.streakContainer}>
          <Flame color={colors.accent} size={32} />
          <Text style={styles.streakText}>¡Racha actual: <Text style={styles.streakHighlight}>{streak} días</Text>!</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.primaryButton, isSaving && { opacity: 0.7 }]} 
          onPress={handleSaveAndHome}
          disabled={isSaving}
        >
          <Text style={styles.primaryButtonText}>
            {isSaving ? 'Guardando...' : 'Guardar y volver'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: 24, paddingBottom: 100 },
  header: { alignItems: 'center', marginBottom: 32 },
  icon: { marginBottom: 16 },
  title: { fontFamily: typography.fontFamily.bold, ...typography.scale.display, fontSize: 28, color: colors.textPrimary, marginBottom: 8, textAlign: 'center' },
  subtitle: { fontFamily: typography.fontFamily.medium, ...typography.scale.body, color: colors.textSecondary, textAlign: 'center' },
  formContainer: { marginBottom: 32, gap: 16 },
  inputGroup: { gap: 8 },
  inputLabel: { fontFamily: typography.fontFamily.bold, ...typography.scale.caption, color: colors.textSecondary, letterSpacing: 1 },
  textInput: { backgroundColor: colors.surface, color: colors.textPrimary, fontFamily: typography.fontFamily.medium, fontSize: 16, padding: 16, borderRadius: 12 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 32, gap: 12 },
  statBox: { flex: 1, backgroundColor: colors.surface, padding: 16, borderRadius: 16, alignItems: 'center' },
  statIcon: { marginBottom: 8 },
  statValue: { fontFamily: typography.fontFamily.bold, ...typography.scale.title, color: colors.textPrimary, marginBottom: 4 },
  statLabel: { fontFamily: typography.fontFamily.bold, ...typography.scale.caption, color: colors.textSecondary, letterSpacing: 1 },
  streakContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(180, 240, 60, 0.1)', paddingHorizontal: 24, paddingVertical: 16, borderRadius: 100, gap: 12, alignSelf: 'center' },
  streakText: { fontFamily: typography.fontFamily.medium, ...typography.scale.body, color: colors.textPrimary },
  streakHighlight: { fontFamily: typography.fontFamily.bold, color: colors.accent },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, paddingBottom: 40, backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.surface },
  primaryButton: { backgroundColor: colors.accent, height: 56, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  primaryButtonText: { fontFamily: typography.fontFamily.bold, ...typography.scale.body, color: colors.background },
});
