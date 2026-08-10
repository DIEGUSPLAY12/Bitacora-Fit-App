import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { useWorkoutDetail } from '../../hooks/useWorkouts';
import { ArrowLeft, Check, Clock, Weight, Hash } from 'lucide-react-native';

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: workout, isLoading } = useWorkoutDetail(id);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!workout) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Entreno no encontrado</Text>
      </View>
    );
  }

  const durationMs = new Date(workout.finished_at).getTime() - new Date(workout.started_at).getTime();
  const durationMin = Math.max(1, Math.floor(durationMs / 60000));
  
  let totalVolume = 0;
  let totalSets = 0;
  workout.workout_exercises?.forEach((we: any) => {
    we.sets?.forEach((s: any) => {
      totalVolume += (Number(s.weight_kg) * Number(s.reps));
      totalSets++;
    });
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft color={colors.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{workout.name}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Resumen Superior */}
        <View style={styles.summaryContainer}>
          <View style={styles.statBox}>
            <Clock color={colors.accent} size={20} style={styles.statIcon} />
            <Text style={styles.statValue}>{durationMin} min</Text>
          </View>
          <View style={styles.statBox}>
            <Weight color={colors.accent} size={20} style={styles.statIcon} />
            <Text style={styles.statValue}>{totalVolume} kg</Text>
          </View>
          <View style={styles.statBox}>
            <Hash color={colors.accent} size={20} style={styles.statIcon} />
            <Text style={styles.statValue}>{totalSets} series</Text>
          </View>
        </View>

        {workout.workout_exercises?.map((we: any, index: number) => (
          <View key={we.id} style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <Text style={styles.exerciseTitle}>{index + 1}. {we.exercises?.name}</Text>
            </View>

            <View style={styles.tableHeader}>
              <Text style={[styles.columnHeader, styles.colSet]}>SET</Text>
              <Text style={[styles.columnHeader, styles.colKg]}>KG</Text>
              <Text style={[styles.columnHeader, styles.colReps]}>REPS</Text>
              <Text style={[styles.columnHeader, styles.colCheck]}>{/* Check */}</Text>
            </View>

            {we.sets?.map((set: any, setIndex: number) => (
              <View key={set.id} style={styles.setRowCompleted}>
                <Text style={styles.setIndexCompleted}>{setIndex + 1}</Text>
                
                <View style={styles.controlGroup}>
                  <Text style={styles.controlValue}>{set.weight_kg}</Text>
                </View>

                <View style={styles.controlGroup}>
                  <Text style={styles.controlValue}>{set.reps}</Text>
                </View>

                <View style={styles.checkboxActive}>
                  <Check color={colors.background} size={16} />
                </View>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { justifyContent: 'center', alignItems: 'center' },
  errorText: { fontFamily: typography.fontFamily.medium, color: colors.destructive },
  header: { flexDirection: 'row', alignItems: 'center', padding: 24, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: colors.surface },
  backButton: { marginRight: 16 },
  headerTitle: { fontFamily: typography.fontFamily.bold, ...typography.scale.title, color: colors.textPrimary, flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 60 },
  summaryContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32, gap: 12 },
  statBox: { flex: 1, backgroundColor: 'rgba(180, 240, 60, 0.1)', padding: 16, borderRadius: 12, alignItems: 'center' },
  statIcon: { marginBottom: 8 },
  statValue: { fontFamily: typography.fontFamily.bold, ...typography.scale.body, color: colors.textPrimary },
  exerciseCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 24 },
  exerciseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  exerciseTitle: { fontFamily: typography.fontFamily.bold, ...typography.scale.body, color: colors.textPrimary, textTransform: 'capitalize', flex: 1 },
  tableHeader: { flexDirection: 'row', marginBottom: 8, paddingHorizontal: 8 },
  columnHeader: { fontFamily: typography.fontFamily.bold, ...typography.scale.caption, color: colors.textSecondary, textAlign: 'center' },
  colSet: { width: 40 },
  colKg: { flex: 1 },
  colReps: { flex: 1 },
  colCheck: { width: 40 },
  setRowCompleted: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8, borderRadius: 8, marginBottom: 4, backgroundColor: 'rgba(255,255,255,0.02)' },
  setIndexCompleted: { width: 40, fontFamily: typography.fontFamily.bold, color: colors.textSecondary, textAlign: 'center' },
  controlGroup: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  controlValue: { textAlign: 'center', fontFamily: typography.fontFamily.bold, color: colors.textPrimary },
  checkboxActive: { width: 32, height: 32, borderRadius: 8, backgroundColor: colors.accent, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
});
