import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useWorkoutStore } from '../store/workout-store';
import { Plus, Minus, Check, Clock, Trash2, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useReduceMotion } from '../hooks/useReduceMotion';
import { MotiView, AnimatePresence } from 'moti';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

function formatTime(ms: number) {
  if (ms < 0) return '00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function EntrenarScreen() {
  const insets = useSafeAreaInsets();
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
    let interval: ReturnType<typeof setInterval>;
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

  const handleFinish = async () => {
    try {
      const finishedAt = Date.now();
      const st = startedAt || Date.now();
      
      const totalVolume = exercises.reduce((acc, ex) => 
        acc + ex.sets.filter(s => s.completed).reduce((sAcc, s) => sAcc + (s.weight * s.reps), 0)
      , 0);

      const totalSets = exercises.reduce((acc, ex) => 
        acc + ex.sets.filter(s => s.completed).length
      , 0);

      if (totalSets === 0) {
        Alert.alert(
          'Entrenamiento vacío',
          'No has completado ninguna serie. ¿Qué quieres hacer?',
          [
            { text: 'Seguir entrenando', style: 'cancel' },
            { 
              text: 'Descartar entreno', 
              style: 'destructive', 
              onPress: () => {
                endWorkout();
                router.back();
              }
            }
          ]
        );
        return;
      }

      const durationMs = finishedAt - st;
      const m = Math.floor(durationMs / 60000);
      
      router.replace({
        pathname: '/entreno-completado',
        params: { volume: totalVolume.toString(), sets: totalSets.toString(), duration: m.toString() }
      });

    } catch (error: any) {
      Alert.alert('Error', 'No se pudo finalizar el entreno: ' + error.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()} activeOpacity={0.7}>
          <X color={colors.textPrimary} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sesión Activa</Text>
        
        <View style={styles.headerRight}>
          {restTimerEndsAt && timeLeft > 0 && (
            <MotiView 
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={styles.timerBadge}
            >
              <Clock color={colors.accent} size={16} />
              <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
            </MotiView>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {exercises.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBg}>
              <Plus color={colors.accent} size={32} />
            </View>
            <Text style={styles.emptyText}>Añade ejercicios para comenzar tu rutina.</Text>
          </View>
        ) : (
          exercises.map((ex, index) => (
            <MotiView 
              key={ex.exercise.id} 
              style={styles.exerciseCard}
              from={{ opacity: 0, translateY: reduceMotion ? 0 : 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'spring', delay: index * 100 }}
            >
              <View style={styles.exerciseHeader}>
                <Text style={styles.exerciseTitle}>{index + 1}. {ex.exercise.name}</Text>
                <TouchableOpacity onPress={() => removeExercise(ex.exercise.id)} style={styles.trashButton}>
                  <Trash2 color={colors.destructive} size={20} />
                </TouchableOpacity>
              </View>

              <View style={styles.tableHeader}>
                <Text style={[styles.columnHeader, styles.colSet]}>SET</Text>
                <Text style={[styles.columnHeader, styles.colKg]}>KG</Text>
                <Text style={[styles.columnHeader, styles.colReps]}>REPS</Text>
                <Text style={[styles.columnHeader, styles.colCheck]}>{/* Check */}</Text>
              </View>

              {ex.sets.map((set, setIndex) => {
                const isCompleted = set.completed;
                return (
                  <MotiView 
                    key={set.id} 
                    style={[styles.setRow, isCompleted && styles.setRowCompleted]}
                    animate={{
                      backgroundColor: isCompleted ? 'rgba(180, 240, 60, 0.05)' : 'transparent',
                      borderColor: isCompleted ? 'rgba(180, 240, 60, 0.2)' : 'transparent'
                    }}
                    transition={{ type: 'timing', duration: 200 }}
                  >
                    <Text style={[styles.setIndex, isCompleted && styles.setIndexCompleted]}>{setIndex + 1}</Text>
                    
                    <View style={[styles.controlGroup, isCompleted && styles.controlGroupCompleted]}>
                      <TouchableOpacity onPress={() => updateSet(ex.exercise.id, set.id, 'weight', -2.5)} style={styles.controlBtn}>
                        <Minus color={isCompleted ? colors.textSecondary : colors.textPrimary} size={16} />
                      </TouchableOpacity>
                      <Text style={[styles.controlValue, isCompleted && styles.controlValueCompleted]}>{set.weight}</Text>
                      <TouchableOpacity onPress={() => updateSet(ex.exercise.id, set.id, 'weight', 2.5)} style={styles.controlBtn}>
                        <Plus color={isCompleted ? colors.textSecondary : colors.textPrimary} size={16} />
                      </TouchableOpacity>
                    </View>

                    <View style={[styles.controlGroup, isCompleted && styles.controlGroupCompleted]}>
                      <TouchableOpacity onPress={() => updateSet(ex.exercise.id, set.id, 'reps', -1)} style={styles.controlBtn}>
                        <Minus color={isCompleted ? colors.textSecondary : colors.textPrimary} size={16} />
                      </TouchableOpacity>
                      <Text style={[styles.controlValue, isCompleted && styles.controlValueCompleted]}>{set.reps}</Text>
                      <TouchableOpacity onPress={() => updateSet(ex.exercise.id, set.id, 'reps', 1)} style={styles.controlBtn}>
                        <Plus color={isCompleted ? colors.textSecondary : colors.textPrimary} size={16} />
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity 
                      style={[styles.checkbox, isCompleted && styles.checkboxActive]} 
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        toggleSetComplete(ex.exercise.id, set.id);
                      }}
                      activeOpacity={0.8}
                    >
                      {isCompleted && (
                        <MotiView
                          from={{ scale: reduceMotion ? 1 : 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                        >
                          <Check color={colors.background} size={16} strokeWidth={3} />
                        </MotiView>
                      )}
                    </TouchableOpacity>
                  </MotiView>
                );
              })}

              <TouchableOpacity style={styles.addSetButton} onPress={() => addSet(ex.exercise.id)} activeOpacity={0.7}>
                <Plus color={colors.textSecondary} size={18} />
                <Text style={styles.addSetText}>Añadir Serie</Text>
              </TouchableOpacity>
            </MotiView>
          ))
        )}

        <TouchableOpacity 
          style={styles.addExerciseButton} 
          onPress={() => router.push('/ejercicios')}
          activeOpacity={0.8}
        >
          <Plus color={colors.accent} size={24} />
          <Text style={styles.addExerciseText}>Añadir ejercicio</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom > 0 ? insets.bottom + 8 : 24 }]}>
        <TouchableOpacity 
          style={styles.finishButton} 
          onPress={handleFinish}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[colors.accent, '#90D41C']}
            style={styles.finishButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.finishButtonText}>Finalizar entreno</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  closeButton: { marginRight: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontFamily: typography.fontFamily.bold, ...typography.scale.title, fontSize: 22, color: colors.textPrimary, flex: 1 },
  headerRight: { width: 100, alignItems: 'flex-end' },
  timerBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(180, 240, 60, 0.1)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, gap: 8, borderWidth: 1, borderColor: 'rgba(180, 240, 60, 0.2)' },
  timerText: { fontFamily: typography.fontFamily.bold, color: colors.accent, ...typography.scale.body, fontSize: 16 },
  scrollContent: { padding: 24, paddingBottom: 140 },
  emptyState: { padding: 40, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  emptyIconBg: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(180, 240, 60, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyText: { fontFamily: typography.fontFamily.medium, color: colors.textSecondary, textAlign: 'center', lineHeight: 24 },
  
  exerciseCard: { backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 24, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  exerciseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  exerciseTitle: { fontFamily: typography.fontFamily.bold, ...typography.scale.title, fontSize: 20, lineHeight: 28, color: colors.textPrimary, textTransform: 'capitalize', flex: 1, marginRight: 16, paddingTop: 4 },
  trashButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(207, 102, 121, 0.1)', justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  
  tableHeader: { flexDirection: 'row', marginBottom: 12, paddingHorizontal: 8 },
  columnHeader: { fontFamily: typography.fontFamily.bold, ...typography.scale.caption, color: colors.textSecondary, textAlign: 'center', letterSpacing: 1 },
  colSet: { width: 40 },
  colKg: { flex: 1 },
  colReps: { flex: 1 },
  colCheck: { width: 40 },
  
  setRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: 'transparent' },
  setRowCompleted: { backgroundColor: 'rgba(180, 240, 60, 0.05)', borderColor: 'rgba(180, 240, 60, 0.2)' },
  setIndex: { width: 40, fontFamily: typography.fontFamily.bold, color: colors.textPrimary, textAlign: 'center', fontSize: 16 },
  setIndexCompleted: { color: colors.accent },
  
  controlGroup: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, marginHorizontal: 6, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.02)' },
  controlGroupCompleted: { backgroundColor: 'rgba(0,0,0,0.2)', borderColor: 'transparent' },
  controlBtn: { padding: 8 },
  controlValue: { width: 36, textAlign: 'center', fontFamily: typography.fontFamily.bold, color: colors.textPrimary, fontSize: 16 },
  controlValueCompleted: { color: colors.textSecondary },
  
  checkbox: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  checkboxActive: { backgroundColor: colors.accent, borderColor: colors.accent, shadowColor: colors.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  
  addSetButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, marginTop: 8, gap: 8, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  addSetText: { fontFamily: typography.fontFamily.bold, color: colors.textSecondary, fontSize: 15 },
  
  addExerciseButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, backgroundColor: 'rgba(180, 240, 60, 0.1)', borderRadius: 16, gap: 10, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(180, 240, 60, 0.2)' },
  addExerciseText: { fontFamily: typography.fontFamily.bold, color: colors.accent, ...typography.scale.body, fontSize: 18 },
  
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.background, paddingHorizontal: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  finishButton: { height: 60, borderRadius: 16, overflow: 'hidden', shadowColor: colors.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 4 },
  finishButtonGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  finishButtonText: { fontFamily: typography.fontFamily.bold, ...typography.scale.title, fontSize: 18, color: colors.background },
});
