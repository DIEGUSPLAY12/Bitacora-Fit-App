import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { useExercise } from '../../hooks/useExercises';
import { useWorkoutStore } from '../../store/workout-store';
import { Image } from 'expo-image';
import { ArrowLeft } from 'lucide-react-native';

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
  const { data: exercise, isLoading } = useExercise(id);
  const addExercise = useWorkoutStore(state => state.addExercise);

  const handleAdd = () => {
    if (exercise) {
      addExercise(exercise);
      router.navigate('/entrenar');
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!exercise) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Ejercicio no encontrado</Text>
      </View>
    );
  }

  // Las instrucciones en este JSON suelen venir como un bloque de texto largo, 
  // pero intentamos separarlas si hay puntos y seguidos claros.
  const instructionsList = exercise.instructions_es 
    ? exercise.instructions_es.split('. ').filter(i => i.trim().length > 0)
    : [];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <Image 
            source={exercise.gif_url || exercise.image_url} 
            style={styles.heroImage} 
            contentFit="cover" 
            transition={300}
          />
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft color={colors.textPrimary} size={24} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{exercise.name}</Text>
          
          <View style={styles.tagsContainer}>
            <View style={styles.tag}><Text style={styles.tagText}>{exercise.muscle_group}</Text></View>
            <View style={styles.tag}><Text style={styles.tagText}>{exercise.equipment}</Text></View>
            <View style={styles.tag}><Text style={styles.tagText}>{exercise.target}</Text></View>
          </View>

          <Text style={styles.sectionTitle}>Instrucciones</Text>
          {instructionsList.length > 0 ? (
            instructionsList.map((instruction, index) => (
              <View key={index} style={styles.instructionRow}>
                <Text style={styles.instructionNumber}>{index + 1}.</Text>
                <Text style={styles.instructionText}>{instruction.trim()}{instruction.endsWith('.') ? '' : '.'}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.instructionText}>Sin instrucciones disponibles.</Text>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleAdd} activeOpacity={0.8}>
          <Text style={styles.primaryButtonText}>Añadir a mi entreno</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { justifyContent: 'center', alignItems: 'center' },
  errorText: { fontFamily: typography.fontFamily.medium, color: colors.destructive },
  scrollContent: { paddingBottom: 100 },
  imageContainer: { width: '100%', height: 350, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  backButton: { position: 'absolute', top: 60, left: 24, width: 44, height: 44, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 24 },
  title: { fontFamily: typography.fontFamily.bold, ...typography.scale.display, fontSize: 28, color: colors.textPrimary, marginBottom: 16, textTransform: 'capitalize' },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 32 },
  tag: { backgroundColor: colors.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  tagText: { fontFamily: typography.fontFamily.medium, ...typography.scale.caption, color: colors.accent, textTransform: 'uppercase' },
  sectionTitle: { fontFamily: typography.fontFamily.bold, ...typography.scale.title, color: colors.textPrimary, marginBottom: 16 },
  instructionRow: { flexDirection: 'row', marginBottom: 12, paddingRight: 16 },
  instructionNumber: { fontFamily: typography.fontFamily.bold, ...typography.scale.body, color: colors.accent, width: 24 },
  instructionText: { flex: 1, fontFamily: typography.fontFamily.regular, ...typography.scale.body, color: colors.textSecondary, lineHeight: 24 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.background, padding: 24, borderTopWidth: 1, borderTopColor: colors.surface },
  primaryButton: { backgroundColor: colors.accent, height: 56, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  primaryButtonText: { fontFamily: typography.fontFamily.bold, ...typography.scale.body, color: colors.background },
});
