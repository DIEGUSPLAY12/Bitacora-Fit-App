import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { useWorkoutDetail } from '../../hooks/useWorkouts';
import { ArrowLeft, Check, Clock, Weight, Hash, Bookmark } from 'lucide-react-native';
import { useToggleTemplate } from '../../hooks/useTemplates';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';

export default function WorkoutDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: workout, isLoading } = useWorkoutDetail(id);
  const toggleTemplate = useToggleTemplate();

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
        <TouchableOpacity 
          style={styles.templateButton} 
          onPress={() => toggleTemplate.mutate({ id: workout.id, is_template: !workout.is_template })}
          disabled={toggleTemplate.isPending}
          activeOpacity={0.7}
        >
          <Bookmark 
            color={workout.is_template ? colors.accent : colors.textSecondary} 
            size={22} 
            fill={workout.is_template ? colors.accent : 'transparent'} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Resumen Superior Sleek (Stats Strip) */}
        <MotiView 
          style={styles.statsStrip}
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', delay: 100 }}
        >
          <View style={styles.stripStat}>
            <Text style={styles.stripLabel}>Tiempo</Text>
            <View style={styles.stripValueRow}>
              <Clock color={colors.accent} size={14} style={{ marginRight: 6 }} />
              <Text style={styles.stripValue}>{durationMin} m</Text>
            </View>
          </View>
          
          <View style={styles.stripDivider} />
          
          <View style={styles.stripStat}>
            <Text style={styles.stripLabel}>Volumen</Text>
            <View style={styles.stripValueRow}>
              <Weight color={colors.accent} size={14} style={{ marginRight: 6 }} />
              <Text style={styles.stripValue}>{totalVolume} kg</Text>
            </View>
          </View>

          <View style={styles.stripDivider} />
          
          <View style={styles.stripStat}>
            <Text style={styles.stripLabel}>Series</Text>
            <View style={styles.stripValueRow}>
              <Hash color={colors.accent} size={14} style={{ marginRight: 6 }} />
              <Text style={styles.stripValue}>{totalSets}</Text>
            </View>
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
              <View style={styles.exerciseNumberBadge}>
                <Text style={styles.exerciseNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.exerciseTitle}>{we.exercises?.name}</Text>
            </View>

            <View style={styles.tableHeader}>
              <Text style={[styles.columnHeader, styles.colSet]}>SET</Text>
              <Text style={[styles.columnHeader, styles.colKg]}>KG</Text>
              <Text style={[styles.columnHeader, styles.colReps]}>REPS</Text>
            </View>

            {we.sets?.map((set: any, setIndex: number) => (
              <View key={set.id} style={styles.setRow}>
                <View style={styles.colSet}>
                  <View style={styles.setIndexBadge}>
                    <Text style={styles.setIndexText}>{setIndex + 1}</Text>
                  </View>
                </View>
                
                <Text style={styles.setValue}>{set.weight_kg}</Text>
                <Text style={styles.setValue}>{set.reps}</Text>
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
  templateButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 20, paddingBottom: 60 },
  
  // Stats Strip (Sleek)
  statsStrip: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 18,
    paddingHorizontal: 12,
    marginBottom: 24,
  },
  stripStat: { flex: 1, alignItems: 'center' },
  stripDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 4 },
  stripLabel: { fontFamily: typography.fontFamily.medium, fontSize: 11, color: colors.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  stripValueRow: { flexDirection: 'row', alignItems: 'center' },
  stripValue: { fontFamily: typography.fontFamily.bold, fontSize: 18, color: colors.textPrimary },
  
  // Exercise Card
  exerciseCard: { backgroundColor: colors.surface, borderRadius: 24, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  exerciseHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20, paddingRight: 8 },
  exerciseNumberBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center', marginRight: 12, marginTop: 0 },
  exerciseNumberText: { fontFamily: typography.fontFamily.bold, color: colors.textPrimary, fontSize: 13 },
  exerciseTitle: { fontFamily: typography.fontFamily.bold, ...typography.scale.title, fontSize: 18, lineHeight: 26, color: colors.textPrimary, flex: 1, textTransform: 'capitalize' },
  
  // Table
  tableHeader: { flexDirection: 'row', marginBottom: 8, paddingHorizontal: 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  columnHeader: { fontFamily: typography.fontFamily.bold, ...typography.scale.caption, color: colors.textSecondary, letterSpacing: 1 },
  colSet: { width: 50 },
  colKg: { flex: 1, textAlign: 'center' },
  colReps: { flex: 1, textAlign: 'center' },
  
  // Rows
  setRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.02)' },
  setIndexBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(180, 240, 60, 0.1)', justifyContent: 'center', alignItems: 'center' },
  setIndexText: { fontFamily: typography.fontFamily.bold, color: colors.accent, fontSize: 12 },
  
  setValue: { flex: 1, textAlign: 'center', fontFamily: typography.fontFamily.semibold, color: colors.textPrimary, fontSize: 16 },
});
