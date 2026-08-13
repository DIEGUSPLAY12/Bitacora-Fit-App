import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { useWorkoutDetail } from '../../hooks/useWorkouts';
import { ArrowLeft, Check, Clock, Weight, Hash } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';

export default function WorkoutDetailScreen() {
  const insets = useSafeAreaInsets();
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
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeft color={colors.textPrimary} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{workout.name}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Resumen Superior Bento-like */}
        <MotiView 
          style={styles.summaryContainer}
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', delay: 100 }}
        >
          <View style={styles.statBox}>
            <Clock color={colors.accent} size={20} style={styles.statIcon} />
            <Text style={styles.statValue}>{durationMin} m</Text>
          </View>
          <View style={styles.statBox}>
            <Weight color={colors.accent} size={20} style={styles.statIcon} />
            <Text style={styles.statValue}>{totalVolume} kg</Text>
          </View>
          <View style={styles.statBox}>
            <Hash color={colors.accent} size={20} style={styles.statIcon} />
            <Text style={styles.statValue}>{totalSets} s</Text>
          </View>
        </MotiView>

        {workout.workout_exercises?.map((we: any, index: number) => (
          <MotiView 
            key={we.id} 
            style={styles.exerciseCard}
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', delay: 200 + (index * 100) }}
          >
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
                  <Check color={colors.background} size={16} strokeWidth={3} />
                </View>
              </View>
            ))}
          </MotiView>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { justifyContent: 'center', alignItems: 'center' },
  errorText: { fontFamily: typography.fontFamily.medium, color: colors.destructive },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  backButton: { marginRight: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontFamily: typography.fontFamily.bold, ...typography.scale.title, fontSize: 22, color: colors.textPrimary, flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 60 },
  summaryContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32, gap: 12 },
  statBox: { flex: 1, backgroundColor: 'rgba(180, 240, 60, 0.1)', padding: 16, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(180, 240, 60, 0.2)' },
  statIcon: { marginBottom: 8 },
  statValue: { fontFamily: typography.fontFamily.bold, ...typography.scale.title, fontSize: 20, color: colors.textPrimary },
  
  exerciseCard: { backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 24, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  exerciseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  exerciseTitle: { fontFamily: typography.fontFamily.bold, ...typography.scale.title, fontSize: 20, color: colors.textPrimary, textTransform: 'capitalize', flex: 1 },
  
  tableHeader: { flexDirection: 'row', marginBottom: 12, paddingHorizontal: 8 },
  columnHeader: { fontFamily: typography.fontFamily.bold, ...typography.scale.caption, color: colors.textSecondary, textAlign: 'center', letterSpacing: 1 },
  colSet: { width: 40 },
  colKg: { flex: 1 },
  colReps: { flex: 1 },
  colCheck: { width: 40 },
  
  setRowCompleted: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8, borderRadius: 12, marginBottom: 8, backgroundColor: 'rgba(180, 240, 60, 0.05)', borderWidth: 1, borderColor: 'rgba(180, 240, 60, 0.2)' },
  setIndexCompleted: { width: 40, fontFamily: typography.fontFamily.bold, color: colors.accent, textAlign: 'center', fontSize: 16 },
  
  controlGroup: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 12, marginHorizontal: 6, paddingVertical: 10 },
  controlValue: { textAlign: 'center', fontFamily: typography.fontFamily.bold, color: colors.textSecondary, fontSize: 16 },
  
  checkboxActive: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.accent, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
});
