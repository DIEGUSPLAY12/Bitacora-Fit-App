import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { ArrowLeft, Play, LayoutGrid } from 'lucide-react-native';
import { useWorkoutDetail } from '../../hooks/useWorkouts';
import { useWorkoutStore, WorkoutExercise } from '../../store/workout-store';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';

export default function TemplateDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: template, isLoading } = useWorkoutDetail(id as string);
  const loadFromTemplate = useWorkoutStore(state => state.loadFromTemplate);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!template) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>No se encontró la plantilla</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: colors.accent }}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const numExercises = template.workout_exercises?.length || 0;
  // Calculate distribution
  const distribution: Record<string, number> = {};
  let totalEx = 0;
  
  template.workout_exercises?.forEach((we: any) => {
    const group = we.exercises?.muscle_group;
    if (group) {
      distribution[group] = (distribution[group] || 0) + 1;
      totalEx++;
    }
  });

  const distArray = Object.entries(distribution).map(([group, count]) => ({
    group,
    percentage: Math.round((count / totalEx) * 100)
  })).sort((a, b) => b.percentage - a.percentage);

  const handleStart = () => {
    // Convert to Zustand format
    const exercisesForStore: WorkoutExercise[] = (template.workout_exercises || []).map((we: any) => ({
      exercise: {
        id: we.exercises.id,
        name: we.exercises.name,
        category: we.exercises.category,
        equipment: '', 
        target: '',
        muscle_group: we.exercises.muscle_group,
        secondary_muscles: [],
        instructions_es: '',
        image_url: we.exercises.image_url,
        gif_url: we.exercises.gif_url,
      },
      sets: (we.sets || []).map((s: any) => ({
        id: Math.random().toString(),
        weight: s.weight_kg,
        reps: s.reps,
        completed: false
      }))
    }));

    loadFromTemplate(exercisesForStore);
    router.replace('/entrenar');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header Spacer */}
        <View style={{ height: insets.top + 20 }} />

        {/* Top Nav */}
        <View style={styles.navRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
            <ArrowLeft color={colors.textPrimary} size={24} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.adaptButton}>
            <SparklesIcon />
            <Text style={styles.adaptButtonText}>Adaptar</Text>
          </TouchableOpacity>
        </View>

        {/* Title Area */}
        <View style={styles.headerArea}>
          <Text style={styles.title}>{template.name}</Text>
          <Text style={styles.subtitle}>{numExercises} Ejercicios, ~45 min</Text>
        </View>

        {/* Muscle Distribution */}
        {distArray.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Distribución Muscular</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingHorizontal: 20 }}>
              {distArray.map((item, index) => (
                <View key={index} style={styles.distItem}>
                  <View style={styles.distIconWrapper}>
                     <LayoutGrid color={colors.accent} size={20} />
                  </View>
                  <View>
                    <Text style={styles.distName}>{item.group}</Text>
                    <Text style={styles.distValue}>{item.percentage}%</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Exercises List */}
        <View style={[styles.section, { paddingHorizontal: 20 }]}>
          <View style={styles.exercisesHeaderRow}>
            <Text style={styles.sectionTitle}>{numExercises} Ejercicios</Text>
          </View>
          
          {template.workout_exercises?.map((we: any, index: number) => {
            const numSets = we.sets?.length || 0;
            const firstReps = we.sets?.[0]?.reps || 0;
            
            return (
              <View key={we.id} style={styles.exerciseRow}>
                <View style={styles.exImageContainer}>
                  {we.exercises?.image_url ? (
                    <Image source={{ uri: we.exercises.image_url }} style={styles.exImage} />
                  ) : (
                    <View style={styles.exImageFallback}><Text style={styles.exImageFallbackText}>{index + 1}</Text></View>
                  )}
                </View>
                <View style={styles.exDetails}>
                  <Text style={styles.exSets}>{numSets} series x {firstReps} reps</Text>
                  <Text style={styles.exName}>{we.exercises?.name}</Text>
                </View>
              </View>
            );
          })}
        </View>

      </ScrollView>

      {/* Floating Start Button */}
      <View style={[styles.floatingFooter, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity 
          style={styles.startButton} 
          onPress={handleStart}
          activeOpacity={0.9}
        >
          <View style={styles.startButtonContent}>
            <Play color={colors.background} size={20} fill={colors.background} style={{ marginLeft: 4 }} />
            <Text style={styles.startButtonText}>Empezar Entrenamiento</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function SparklesIcon() {
  return (
    <View style={{ marginRight: 6 }}>
       <Text style={{ fontSize: 14 }}>✨</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.medium,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  adaptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(60, 140, 255, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(60, 140, 255, 0.3)',
  },
  adaptButtonText: {
    color: '#6495ED',
    fontFamily: typography.fontFamily.semibold,
    fontSize: 14,
  },
  headerArea: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 32,
    color: colors.textPrimary,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 15,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: 36,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: 16,
  },
  distItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  distIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(180, 240, 60, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  distName: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 2,
    textTransform: 'capitalize',
  },
  distValue: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 14,
    color: colors.textSecondary,
  },
  exercisesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  exImageContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    marginRight: 16,
  },
  exImage: {
    width: '100%',
    height: '100%',
  },
  exImageFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  exImageFallbackText: {
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.bold,
    fontSize: 18,
  },
  exDetails: {
    flex: 1,
  },
  exSets: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  exName: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 16,
    color: colors.textPrimary,
    textTransform: 'capitalize',
  },
  floatingFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: colors.background, // 'rgba(10, 14, 7, 0.9)'
  },
  startButton: {
    backgroundColor: colors.textPrimary,
    borderRadius: 16,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  startButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  startButtonText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 16,
    color: colors.background,
  }
});
