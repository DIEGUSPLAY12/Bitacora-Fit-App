import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { customAlert as Alert } from '../store/alert-store';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { typography, rs } from '../theme/typography';
import { colors } from '../theme/colors';
import { CheckCircle2, Flame, Weight, Hash, Globe, Users } from 'lucide-react-native';
import { useStreak } from '../hooks/useStreak';
import { useReduceMotion } from '../hooks/useReduceMotion';
import { MotiView } from 'moti';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWorkoutStore } from '../store/workout-store';
import { useSaveWorkout } from '../hooks/useSaveWorkout';
import { LinearGradient } from 'expo-linear-gradient';
import { customAlert } from '../store/alert-store';

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
  const [visibility, setVisibility] = useState<'friends' | 'public'>('friends');
  const [focusedInput, setFocusedInput] = useState<'name' | 'duration' | null>(null);

  const handleSaveAndHome = async () => {
    try {
      const durMins = parseInt(durationStrState, 10) || 0;
      const st = startedAt || Date.now();
      const finishedAt = st + (durMins * 60000);

      await saveWorkout({
        name: workoutName.trim() || 'Entrenamiento Libre',
        startedAt: st,
        finishedAt,
        exercises,
        visibility
      });

      // Limpiar store y volver a casa
      endWorkout();
      router.replace('/(tabs)');
    } catch (error: any) {
      customAlert('Error', 'No se pudo guardar el entreno: ' + error.message);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + rs(24) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Compact header — icon + title + subtitle */}
        <MotiView
          style={styles.header}
          from={{ opacity: 0, translateY: reduceMotion ? 0 : rs(-16) }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', delay: 50 }}
        >
          <View style={styles.iconWrapper}>
            <CheckCircle2 color={colors.accent} size={rs(48)} strokeWidth={2} />
          </View>
          <Text style={styles.title}>¡Entreno completado!</Text>
          <Text style={styles.subtitle}>Gran trabajo hoy, revisa y guarda tu progreso.</Text>
        </MotiView>

        <EntrenoForm focusedInput={focusedInput} setFocusedInput={setFocusedInput} workoutName={workoutName} setWorkoutName={setWorkoutName} durationStrState={durationStrState} setDurationStrState={setDurationStrState} visibility={visibility} setVisibility={setVisibility} styles={styles} colors={colors} />
  <EntrenoStatsStrip volume={volume} sets={sets} streak={streak} styles={styles} colors={colors} />
  </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom > 0 ? insets.bottom + rs(8) : rs(24) }]}>
        <TouchableOpacity 
          style={styles.primaryButton} 
          onPress={handleSaveAndHome}
          disabled={isSaving}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={isSaving ? ['#888', '#666'] : [colors.accent, '#90D41C']}
            style={styles.primaryButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.primaryButtonText}>
              {isSaving ? 'Guardando...' : 'Guardar y finalizar'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingHorizontal: rs(20), paddingBottom: rs(130) },

  // Compact header (no more giant icon + huge title)
  header: {
    alignItems: 'center',
    marginBottom: rs(28),
  },
  iconWrapper: {
    width: rs(88),
    height: rs(88),
    borderRadius: rs(44),
    backgroundColor: 'rgba(180, 240, 60, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: rs(16),
    borderWidth: 1,
    borderColor: 'rgba(180, 240, 60, 0.2)',
  },
  title: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: rs(22),
    color: colors.textPrimary,
    marginBottom: rs(6),
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  subtitle: {
    fontFamily: typography.fontFamily.medium,
    ...typography.scale.body,
    fontSize: rs(14),
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: rs(21),
  },

  // Form
  formContainer: { marginBottom: rs(24), gap: rs(16) },
  inputGroup: { gap: rs(6) },
  inputLabel: {
    fontFamily: typography.fontFamily.bold,
    fontSize: rs(11),
    color: colors.textSecondary,
    letterSpacing: 1.2,
    marginLeft: rs(2),
  },
  inputWrapper: {
    backgroundColor: colors.surface,
    borderRadius: rs(14),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  inputFocused: { borderColor: colors.accent, backgroundColor: 'rgba(180, 240, 60, 0.05)' },
  textInput: {
    color: colors.textPrimary,
    fontFamily: typography.fontFamily.regular,
    fontSize: rs(16),
    height: rs(56),
    paddingHorizontal: rs(16),
  },
  visibilitySelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: rs(14),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    height: rs(56),
  },
  visibilityOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(8),
  },
  visibilityOptionActive: {
    backgroundColor: 'rgba(180, 240, 60, 0.05)',
  },
  visibilityOptionText: {
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    fontSize: rs(15),
  },
  visibilityOptionTextActive: {
    color: colors.textPrimary,
    fontFamily: typography.fontFamily.bold,
  },

  // Stats strip — Symmetry style: all 3 stats in one horizontal card
  statsStrip: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: rs(20),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingVertical: rs(18),
    paddingHorizontal: rs(12),
  },
  stripStat: {
    flex: 1,
    alignItems: 'center',
  },
  stripStatAccent: {
    // slight accent tint for streak cell
  },
  stripDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: rs(4),
  },
  stripLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: rs(11),
    color: colors.textSecondary,
    marginBottom: rs(6),
  },
  stripValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stripValue: {
    fontFamily: typography.fontFamily.bold,
    fontSize: rs(16),
    color: colors.textPrimary,
  },

  // Footer CTA
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: rs(20),
    paddingTop: rs(14),
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  primaryButton: {
    height: rs(56),
    borderRadius: rs(16),
    overflow: 'hidden',
    boxShadow: '0px 4px 12px rgba(180, 240, 60, 0.25)',
  },
  primaryButtonGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  primaryButtonText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: rs(17),
    color: colors.background,
  },
});

const EntrenoForm = ({ focusedInput, setFocusedInput, workoutName, setWorkoutName, durationStrState, setDurationStrState, visibility, setVisibility, styles, colors }: any) => {
  const { TextInput, View, Text, TouchableOpacity } = require('react-native');
  const { Users, Globe } = require('lucide-react-native');
  const { rs } = require('../utils/responsive');
  return (
{/* Form fields */}
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>NOMBRE DEL ENTRENO</Text>
            <View style={[styles.inputWrapper, focusedInput === 'name' && styles.inputFocused]}>
              <TextInput 
                style={styles.textInput}
                value={workoutName}
                onChangeText={setWorkoutName}
                placeholder="Ej. Día de Pecho"
                placeholderTextColor={colors.textSecondary}
                onFocus={() => setFocusedInput('name')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>
          </View>


);
};

const EntrenoStatsStrip = ({ volume, sets, streak, styles, colors }: any) => {
  const { View, Text } = require('react-native');
  const { Flame, Hash, Weight } = require('lucide-react-native');
  const { rs } = require('../utils/responsive');
  return (
{/* Stats row — Symmetry style: label top, value bottom, all in a single horizontal strip */}
        <View style={styles.statsStrip}>
          <View style={styles.stripStat}>
            <Text style={styles.stripLabel}>Volumen</Text>
            <View style={styles.stripValueRow}>
              <Weight color={colors.accent} size={rs(14)} style={{ marginRight: rs(4) }} />
              <Text style={styles.stripValue} adjustsFontSizeToFit numberOfLines={1}>{volume || '0'} kg</Text>
            </View>

);
};
