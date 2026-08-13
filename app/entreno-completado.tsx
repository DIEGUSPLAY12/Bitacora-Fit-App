import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { typography } from '../theme/typography';
import { colors } from '../theme/colors';
import { CheckCircle2, Flame, Clock, Weight, Hash, Zap } from 'lucide-react-native';
import { useStreak } from '../hooks/useStreak';
import { useReduceMotion } from '../hooks/useReduceMotion';
import { MotiView } from 'moti';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWorkoutStore } from '../store/workout-store';
import { useSaveWorkout } from '../hooks/useSaveWorkout';
import { LinearGradient } from 'expo-linear-gradient';

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
          <View>
            <View style={styles.iconWrapper}>
              <CheckCircle2 color={colors.accent} size={72} strokeWidth={2.5} />
            </View>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.title}>¡Entreno completado!</Text>
            <Text style={styles.subtitle}>Gran trabajo hoy, revisa y guarda tu progreso.</Text>
          </View>
        </View>

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

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>DURACIÓN (MINUTOS)</Text>
            <View style={[styles.inputWrapper, focusedInput === 'duration' && styles.inputFocused]}>
              <TextInput 
                style={styles.textInput}
                value={durationStrState}
                onChangeText={setDurationStrState}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
                onFocus={() => setFocusedInput('duration')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>
          </View>
        </View>

        <View style={styles.bentoGrid}>
          <View style={[styles.bentoCard, { flex: 1 }]}>
            <View style={styles.bentoIconBg}>
              <Weight color={colors.accent} size={20} />
            </View>
            <Text style={styles.bentoValue} adjustsFontSizeToFit numberOfLines={1}>{volume || '0'} kg</Text>
            <Text style={styles.bentoLabel}>VOLUMEN TOTAL</Text>
          </View>

          <View style={[styles.bentoCol, { flex: 1 }]}>
            <View style={[styles.bentoCard, styles.bentoCardSmall]}>
              <View style={styles.bentoIconBgSmall}>
                <Hash color={colors.accent} size={16} />
              </View>
              <View>
                <Text style={styles.bentoValueSmall}>{sets || '0'}</Text>
                <Text style={styles.bentoLabel}>SERIES</Text>
              </View>
            </View>

            <View style={[styles.bentoCard, styles.bentoCardSmall, { backgroundColor: 'rgba(180, 240, 60, 0.05)', borderColor: 'rgba(180, 240, 60, 0.2)' }]}>
              <View style={styles.bentoIconBgSmallAccented}>
                <Flame color={colors.accent} size={16} fill={colors.accent} />
              </View>
              <View>
                <Text style={[styles.bentoValueSmall, { color: colors.accent }]}>{streak} días</Text>
                <Text style={[styles.bentoLabel, { color: colors.accent }]}>RACHA ACTUAL</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom > 0 ? insets.bottom + 8 : 24 }]}>
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
  scrollContent: { padding: 24, paddingBottom: 140 },
  header: { alignItems: 'center', marginBottom: 40 },
  iconWrapper: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(180, 240, 60, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 24, borderWidth: 2, borderColor: 'rgba(180, 240, 60, 0.2)' },
  title: { fontFamily: typography.fontFamily.bold, ...typography.scale.display, fontSize: 32, color: colors.textPrimary, marginBottom: 8, textAlign: 'center' },
  subtitle: { fontFamily: typography.fontFamily.medium, ...typography.scale.body, color: colors.textSecondary, textAlign: 'center', fontSize: 16 },
  
  formContainer: { marginBottom: 32, gap: 20 },
  inputGroup: { gap: 8 },
  inputLabel: { fontFamily: typography.fontFamily.bold, ...typography.scale.caption, color: colors.textSecondary, letterSpacing: 1, marginLeft: 4 },
  inputWrapper: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  inputFocused: { borderColor: colors.accent, backgroundColor: 'rgba(180, 240, 60, 0.05)' },
  textInput: { color: colors.textPrimary, fontFamily: typography.fontFamily.regular, fontSize: 18, height: 64, paddingHorizontal: 20 },
  
  bentoGrid: { flexDirection: 'row', gap: 16 },
  bentoCard: { backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', justifyContent: 'center' },
  bentoCol: { flex: 1, gap: 16 },
  bentoCardSmall: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  
  bentoIconBg: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  bentoIconBgSmall: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  bentoIconBgSmallAccented: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(180, 240, 60, 0.1)', justifyContent: 'center', alignItems: 'center' },
  
  bentoValue: { fontFamily: typography.fontFamily.bold, ...typography.scale.display, fontSize: 26, color: colors.textPrimary, marginBottom: 4 },
  bentoValueSmall: { fontFamily: typography.fontFamily.bold, ...typography.scale.title, fontSize: 22, color: colors.textPrimary },
  bentoLabel: { fontFamily: typography.fontFamily.bold, ...typography.scale.caption, color: colors.textSecondary, letterSpacing: 0.5 },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingTop: 16, backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  primaryButton: { height: 64, borderRadius: 16, overflow: 'hidden', shadowColor: colors.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  primaryButtonGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  primaryButtonText: { fontFamily: typography.fontFamily.bold, ...typography.scale.title, fontSize: 20, color: colors.background },
});
