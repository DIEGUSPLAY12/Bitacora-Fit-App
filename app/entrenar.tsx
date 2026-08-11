import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useWorkoutStore } from '../store/workout-store';
import { Plus, Minus, Check, Clock, Trash2, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSaveWorkout } from '../hooks/useSaveWorkout';
import { useReduceMotion } from '../hooks/useReduceMotion';
import { MotiView } from 'moti';

function formatTime(ms: number) {
  if (ms < 0) return '00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function EntrenarScreen() {
  const router = useRouter();
  const { 
    exercises, 
    isActive, 
    startedAt,
    startWorkout, 
    endWorkout,
    addSet, 
    updateSet, 
    toggleSetComplete, 
    removeSet, 
    removeExercise,
    restTimerEndsAt,
    clearRestTimer 
  } = useWorkoutStore();

  const [timeLeft, setTimeLeft] = useState(0);
  const notifiedRef = useRef(false);
  const reduceMotion = useReduceMotion();

  useEffect(() => {
    if (!isActive) {
      startWorkout();
    }
  }, [isActive, startWorkout]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (restTimerEndsAt) {
      notifiedRef.current = false;
      interval = setInterval(() => {
        const now = Date.now();
        const remaining = restTimerEndsAt - now;
        
        if (remaining <= 0) {
          setTimeLeft(0);
          clearRestTimer();
          if (!notifiedRef.current) {
            notifiedRef.current = true;
            // Vibración haptic al terminar el descanso (funciona en Expo Go)
            // Para notificaciones push usa un development build (SDK 53+)
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        } else {
          setTimeLeft(remaining);
        }
      }, 1000);
    } else {
      setTimeLeft(0);
    }
    return () => clearInterval(interval);
  }, [restTimerEndsAt, clearRestTimer]);

  const { mutateAsync: saveWorkout, isPending: isSaving } = useSaveWorkout();

  const handleFinish = async () => {
    try {
      const finishedAt = Date.now();
      const st = startedAt || Date.now();
      
      await saveWorkout({
        name: 'Entrenamiento Libre',
        startedAt: st,
        finishedAt,
        exercises
      });
      
      const totalVolume = exercises.reduce((acc, ex) => 
        acc + ex.sets.filter(s => s.completed).reduce((sAcc, s) => sAcc + (s.weight * s.reps), 0)
      , 0);

      const totalSets = exercises.reduce((acc, ex) => 
        acc + ex.sets.filter(s => s.completed).length
      , 0);

      const durationMs = finishedAt - st;
      const m = Math.floor(durationMs / 60000);
      
      router.replace({
        pathname: '/entreno-completado',
        params: { volume: totalVolume.toString(), sets: totalSets.toString(), duration: m.toString() }
      });

      setTimeout(() => {
        endWorkout();
      }, 500);

    } catch (error: any) {
      Alert.alert('Error', 'No se pudo guardar el entreno: ' + error.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <X color={colors.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sesión Activa</Text>
        
        <View style={styles.headerRight}>
          {restTimerEndsAt && timeLeft > 0 && (
            <View style={styles.timerBadge}>
              <Clock color={colors.accent} size={16} />
              <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {exercises.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Añade ejercicios para comenzar tu rutina.</Text>
          </View>
        ) : (
          exercises.map((ex, index) => (
            <View key={ex.exercise.id} style={styles.exerciseCard}>
              <View style={styles.exerciseHeader}>
                <Text style={styles.exerciseTitle}>{index + 1}. {ex.exercise.name}</Text>
                <TouchableOpacity onPress={() => removeExercise(ex.exercise.id)}>
                  <Trash2 color={colors.destructive} size={20} />
                </TouchableOpacity>
              </View>

              <View style={styles.tableHeader}>
                <Text style={[styles.columnHeader, styles.colSet]}>SET</Text>
                <Text style={[styles.columnHeader, styles.colKg]}>KG</Text>
                <Text style={[styles.columnHeader, styles.colReps]}>REPS</Text>
                <Text style={[styles.columnHeader, styles.colCheck]}>{/* Check */}</Text>
              </View>

              {ex.sets.map((set, setIndex) => (
                <View key={set.id} style={[styles.setRow, set.completed && styles.setRowCompleted]}>
                  <Text style={[styles.setIndex, set.completed && styles.setIndexCompleted]}>{setIndex + 1}</Text>
                  
                  <View style={styles.controlGroup}>
                    <TouchableOpacity onPress={() => updateSet(ex.exercise.id, set.id, 'weight', -2.5)} style={styles.controlBtn}>
                      <Minus color={colors.textPrimary} size={16} />
                    </TouchableOpacity>
                    <Text style={styles.controlValue}>{set.weight}</Text>
                    <TouchableOpacity onPress={() => updateSet(ex.exercise.id, set.id, 'weight', 2.5)} style={styles.controlBtn}>
                      <Plus color={colors.textPrimary} size={16} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.controlGroup}>
                    <TouchableOpacity onPress={() => updateSet(ex.exercise.id, set.id, 'reps', -1)} style={styles.controlBtn}>
                      <Minus color={colors.textPrimary} size={16} />
                    </TouchableOpacity>
                    <Text style={styles.controlValue}>{set.reps}</Text>
                    <TouchableOpacity onPress={() => updateSet(ex.exercise.id, set.id, 'reps', 1)} style={styles.controlBtn}>
                      <Plus color={colors.textPrimary} size={16} />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity 
                    style={[styles.checkbox, set.completed && styles.checkboxActive]} 
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      toggleSetComplete(ex.exercise.id, set.id);
                    }}
                  >
                    {set.completed && (
                      <MotiView
                        from={{ scale: reduceMotion ? 1 : 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                      >
                        <Check color={colors.background} size={16} />
                      </MotiView>
                    )}
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity style={styles.addSetButton} onPress={() => addSet(ex.exercise.id)}>
                <Plus color={colors.textSecondary} size={16} />
                <Text style={styles.addSetText}>Añadir Serie</Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        <TouchableOpacity 
          style={styles.addExerciseButton} 
          onPress={() => router.push('/ejercicios')}
        >
          <Plus color={colors.accent} size={24} />
          <Text style={styles.addExerciseText}>Añadir ejercicio</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.finishButton, isSaving && { opacity: 0.7 }]} 
          onPress={handleFinish}
          disabled={isSaving}
        >
          <Text style={styles.finishButtonText}>
            {isSaving ? 'Guardando...' : 'Finalizar entreno'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 24, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: colors.surface },
  closeButton: { marginRight: 16 },
  headerTitle: { fontFamily: typography.fontFamily.bold, ...typography.scale.title, color: colors.textPrimary, flex: 1 },
  headerRight: { width: 100, alignItems: 'flex-end' },
  timerBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(180, 240, 60, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
  timerText: { fontFamily: typography.fontFamily.bold, color: colors.accent, ...typography.scale.body },
  scrollContent: { padding: 24, paddingBottom: 120 },
  emptyState: { padding: 40, alignItems: 'center', backgroundColor: colors.surface, borderRadius: 16 },
  emptyText: { fontFamily: typography.fontFamily.medium, color: colors.textSecondary },
  exerciseCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 24 },
  exerciseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  exerciseTitle: { fontFamily: typography.fontFamily.bold, ...typography.scale.body, color: colors.textPrimary, textTransform: 'capitalize', flex: 1, marginRight: 16 },
  tableHeader: { flexDirection: 'row', marginBottom: 8, paddingHorizontal: 8 },
  columnHeader: { fontFamily: typography.fontFamily.bold, ...typography.scale.caption, color: colors.textSecondary, textAlign: 'center' },
  colSet: { width: 40 },
  colKg: { flex: 1 },
  colReps: { flex: 1 },
  colCheck: { width: 40 },
  setRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 8, borderRadius: 8, marginBottom: 4 },
  setRowCompleted: { backgroundColor: 'rgba(255,255,255,0.02)' },
  setIndex: { width: 40, fontFamily: typography.fontFamily.bold, color: colors.textPrimary, textAlign: 'center' },
  setIndexCompleted: { color: colors.textSecondary },
  controlGroup: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, borderRadius: 8, marginHorizontal: 4, paddingVertical: 4 },
  controlBtn: { padding: 8 },
  controlValue: { width: 36, textAlign: 'center', fontFamily: typography.fontFamily.bold, color: colors.textPrimary },
  checkbox: { width: 32, height: 32, borderRadius: 8, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.textSecondary, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  checkboxActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  addSetButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, marginTop: 8, gap: 8 },
  addSetText: { fontFamily: typography.fontFamily.medium, color: colors.textSecondary },
  addExerciseButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, backgroundColor: 'rgba(180, 240, 60, 0.1)', borderRadius: 12, gap: 8, marginBottom: 24 },
  addExerciseText: { fontFamily: typography.fontFamily.bold, color: colors.accent, ...typography.scale.body },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.background, padding: 24, borderTopWidth: 1, borderTopColor: colors.surface },
  finishButton: { backgroundColor: colors.accent, height: 56, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  finishButtonText: { fontFamily: typography.fontFamily.bold, ...typography.scale.body, color: colors.background },
});
