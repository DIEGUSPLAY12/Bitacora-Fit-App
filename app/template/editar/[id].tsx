import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput, useWindowDimensions, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { useTemplateBuilderStore } from '../../../store/template-builder-store';
import { Plus, Minus, Trash2, ArrowLeft, Save } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { useWorkoutDetail } from '../../../hooks/useWorkouts';
import { customAlert } from '../../../store/alert-store';

export default function EditarPlantillaScreen() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: template, isLoading: isLoadingTemplate } = useWorkoutDetail(id as string);

  const {
    name,
    exercises,
    setName,
    addSet,
    updateSet,
    removeSet,
    removeExercise,
    reset,
  } = useTemplateBuilderStore();

  const [isSaving, setIsSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (template && !initialized) {
      const storeExercises = (template.workout_exercises || []).map((we: any) => ({
        exercise: {
          id: we.exercises.id,
          name: we.exercises.name,
          category: we.exercises.category ?? '',
          equipment: we.exercises.equipment ?? '',
          target: we.exercises.target ?? '',
          muscle_group: we.exercises.muscle_group,
          secondary_muscles: we.exercises.secondary_muscles ?? [],
          instructions_es: we.exercises.instructions_es ?? '',
          image_url: we.exercises.image_url,
          gif_url: we.exercises.gif_url,
        },
        sets: (we.sets || []).map((s: any) => ({
          id: Math.random().toString(),
          weight: s.weight_kg ?? 0,
          reps: s.reps ?? 0,
          completed: false,
        })),
      }));
      useTemplateBuilderStore.setState({ name: template.name, exercises: storeExercises });
      setInitialized(true);
    }
  }, [template, initialized]);

  useEffect(() => {
    return () => { reset(); };
  }, []);

  const handleSave = async () => {
    if (!name.trim()) { customAlert('Error', 'Debes darle un nombre a la plantilla.'); return; }
    if (exercises.length === 0) { customAlert('Error', 'Debes anadir al menos un ejercicio.'); return; }
    if (!user || !id) { customAlert('Error', 'Datos invalidos.'); return; }
    try {
      setIsSaving(true);
      const { error: workoutError } = await supabase.from('workouts').update({ name: name.trim() }).eq('id', id);
      if (workoutError) throw workoutError;
      const { error: deleteError } = await supabase.from('workout_exercises').delete().eq('workout_id', id);
      if (deleteError) throw deleteError;
      const workoutExercisesToInsert = exercises.map((ex, idx) => ({ workout_id: id, exercise_id: ex.exercise.id, order_index: idx }));
      const { data: insertedExercises, error: weError } = await supabase.from('workout_exercises').insert(workoutExercisesToInsert).select();
      if (weError) throw weError;
      const setsToInsert: any[] = [];
      exercises.forEach((ex, exIdx) => {
        const weId = insertedExercises[exIdx].id;
        ex.sets.forEach((s, sIdx) => { setsToInsert.push({ workout_exercise_id: weId, set_number: sIdx + 1, weight_kg: s.weight, reps: s.reps }); });
      });
      if (setsToInsert.length > 0) {
        const { error: setsError } = await supabase.from('sets').insert(setsToInsert);
        if (setsError) throw setsError;
      }
      queryClient.invalidateQueries({ queryKey: ['templates', user.id] });
      queryClient.invalidateQueries({ queryKey: ['workout', id] });
      reset();
      router.back();
    } catch (error: any) {
      customAlert('Error', 'No se pudo guardar la plantilla: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const controlMargin = width < 370 ? 3 : 6;

  if (isLoadingTemplate || !initialized) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Cargando plantilla...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity style={styles.closeButton} onPress={() => { reset(); router.back(); }} activeOpacity={0.7}>
          <ArrowLeft color={colors.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Editar Plantilla</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.nameContainer}>
          <Text style={styles.label}>Nombre de la rutina</Text>
          <TextInput
            style={styles.nameInput}
            placeholder="Ej. Traccion, Pierna pesada..."
            placeholderTextColor={colors.textSecondary}
            value={name}
            onChangeText={setName}
            maxLength={30}
          />
        </View>

        {exercises.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBg}><Plus color={colors.accent} size={28} /></View>
            <Text style={styles.emptyText}>Anade ejercicios para construir tu plantilla.</Text>
          </View>
        ) : (
          exercises.map((ex, index) => (
            <View key={ex.exercise.id} style={styles.exerciseCard}>
              <View style={styles.exerciseHeader}>
                <View style={styles.titleContainer}>
                  <View style={styles.indexBadge}><Text style={styles.indexText}>{index + 1}</Text></View>
                  <Text style={styles.exerciseTitle} numberOfLines={2}>{ex.exercise.name}</Text>
                </View>
                <TouchableOpacity onPress={() => removeExercise(ex.exercise.id)} style={styles.trashButton}>
                  <Trash2 color={'rgba(255, 255, 255, 0.4)'} size={17} />
                </TouchableOpacity>
              </View>

              <View style={styles.tableHeader}>
                <Text style={[styles.columnHeader, styles.colSet]}>SET</Text>
                <Text style={[styles.columnHeader, styles.colKg]}>KG</Text>
                <Text style={[styles.columnHeader, styles.colReps]}>REPS</Text>
              </View>

              {ex.sets.map((set, setIndex) => (
                <View key={set.id} style={styles.setRow}>
                  <Text style={styles.setIndex}>{setIndex + 1}</Text>
                  <View style={[styles.controlGroup, { marginHorizontal: controlMargin }]}>
                    <TouchableOpacity onPress={() => updateSet(ex.exercise.id, set.id, 'weight', -2.5)} style={styles.controlBtn}><Minus color={colors.textPrimary} size={15} /></TouchableOpacity>
                    <Text style={styles.controlValue}>{set.weight}</Text>
                    <TouchableOpacity onPress={() => updateSet(ex.exercise.id, set.id, 'weight', 2.5)} style={styles.controlBtn}><Plus color={colors.textPrimary} size={15} /></TouchableOpacity>
                  </View>
                  <View style={[styles.controlGroup, { marginHorizontal: controlMargin }]}>
                    <TouchableOpacity onPress={() => updateSet(ex.exercise.id, set.id, 'reps', -1)} style={styles.controlBtn}><Minus color={colors.textPrimary} size={15} /></TouchableOpacity>
                    <Text style={styles.controlValue}>{set.reps}</Text>
                    <TouchableOpacity onPress={() => updateSet(ex.exercise.id, set.id, 'reps', 1)} style={styles.controlBtn}><Plus color={colors.textPrimary} size={15} /></TouchableOpacity>
                  </View>
                  <TouchableOpacity onPress={() => removeSet(ex.exercise.id, set.id)} style={styles.removeSetBtn}>
                    <Trash2 color={colors.textSecondary} size={14} />
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity style={styles.addSetButton} onPress={() => addSet(ex.exercise.id)} activeOpacity={0.7}>
                <Plus color={colors.textSecondary} size={16} />
                <Text style={styles.addSetText}>Anadir Serie</Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        <TouchableOpacity style={styles.addExerciseButton} onPress={() => router.push({ pathname: '/ejercicios', params: { isTemplate: 'true' } })} activeOpacity={0.8}>
          <Plus color={colors.accent} size={22} />
          <Text style={styles.addExerciseText}>Anadir ejercicio</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom > 0 ? insets.bottom + 8 : 24 }]}>
        <TouchableOpacity style={styles.finishButton} onPress={handleSave} activeOpacity={0.9} disabled={isSaving}>
          <LinearGradient colors={[colors.accent, '#90D41C']} style={styles.finishButtonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            {isSaving ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <>
                <Save color={colors.background} size={20} style={{ marginRight: 8 }} />
                <Text style={styles.finishButtonText}>Guardar Cambios</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingText: { fontFamily: typography.fontFamily.medium, color: colors.textSecondary, marginTop: 12, fontSize: 15 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  closeButton: { marginRight: 14, width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontFamily: typography.fontFamily.semibold, fontSize: 20, color: colors.textPrimary, flex: 1, letterSpacing: 0.2 },
  scrollContent: { padding: 20, paddingBottom: 140 },
  nameContainer: { marginBottom: 24 },
  label: { fontFamily: typography.fontFamily.medium, fontSize: 14, color: colors.textSecondary, marginBottom: 8 },
  nameInput: { backgroundColor: colors.surface, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 16, paddingHorizontal: 16, height: 56, color: colors.textPrimary, fontFamily: typography.fontFamily.semibold, fontSize: 16 },
  emptyState: { padding: 36, alignItems: 'center', backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginBottom: 20 },
  emptyIconBg: { width: 58, height: 58, borderRadius: 29, backgroundColor: 'rgba(180, 240, 60, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  emptyText: { fontFamily: typography.fontFamily.medium, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  exerciseCard: { backgroundColor: colors.surface, borderRadius: 20, padding: 18, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  exerciseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  titleContainer: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 },
  indexBadge: { width: 26, height: 26, borderRadius: 8, backgroundColor: 'rgba(180, 240, 60, 0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 10, flexShrink: 0 },
  indexText: { fontFamily: typography.fontFamily.bold, color: colors.accent, fontSize: 12 },
  exerciseTitle: { fontFamily: typography.fontFamily.semibold, fontSize: 15, color: colors.textPrimary, textTransform: 'capitalize', flex: 1 },
  trashButton: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.surfaceElevated, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  tableHeader: { flexDirection: 'row', marginBottom: 10, paddingHorizontal: 4 },
  columnHeader: { fontFamily: typography.fontFamily.bold, fontSize: 11, color: colors.textSecondary, textAlign: 'center', letterSpacing: 1 },
  colSet: { width: 36 },
  colKg: { flex: 1 },
  colReps: { flex: 1 },
  setRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, paddingHorizontal: 4, borderRadius: 12, marginBottom: 6, borderWidth: 1, borderColor: 'transparent' },
  setIndex: { width: 36, fontFamily: typography.fontFamily.bold, color: colors.textPrimary, textAlign: 'center', fontSize: 15 },
  controlGroup: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceElevated, borderRadius: 10, paddingVertical: 7, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  controlBtn: { padding: 7 },
  controlValue: { width: 32, textAlign: 'center', fontFamily: typography.fontFamily.bold, color: colors.textPrimary, fontSize: 15 },
  removeSetBtn: { width: 34, height: 34, justifyContent: 'center', alignItems: 'center' },
  addSetButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 13, marginTop: 6, gap: 7, backgroundColor: colors.surfaceElevated, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  addSetText: { fontFamily: typography.fontFamily.medium, color: colors.textSecondary, fontSize: 14 },
  addExerciseButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, backgroundColor: 'rgba(180, 240, 60, 0.08)', borderRadius: 16, gap: 8, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(180, 240, 60, 0.2)' },
  addExerciseText: { fontFamily: typography.fontFamily.semibold, color: colors.accent, fontSize: 16 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.background, paddingHorizontal: 20, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  finishButton: { height: 56, borderRadius: 16, overflow: 'hidden', shadowColor: colors.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 4 },
  finishButtonGradient: { flex: 1, justifyContent: 'center', alignItems: 'center', flexDirection: 'row' },
  finishButtonText: { fontFamily: typography.fontFamily.semibold, fontSize: 16, color: colors.background },
});