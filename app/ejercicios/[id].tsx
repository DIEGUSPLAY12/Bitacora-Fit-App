import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { useExercise } from '../../hooks/useExercises';
import { useWorkoutStore } from '../../store/workout-store';
import { Image } from 'expo-image';
import { ArrowLeft, Target, Dumbbell, Zap } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';

export default function ExerciseDetailScreen() {
  const insets = useSafeAreaInsets();
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

  const instructionsList = exercise.instructions_es 
    ? exercise.instructions_es.split('. ').filter(i => i.trim().length > 0)
    : [];

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top }]} 
        showsVerticalScrollIndicator={false} 
        bounces={false}
      >
        <View style={styles.imageContainer}>
          <Image 
            source={exercise.gif_url || exercise.image_url} 
            style={styles.heroImage} 
            contentFit="cover" 
            transition={300}
          />
          {/* Capa oscura superior para que el botón back siempre se vea */}
          <LinearGradient
            colors={['rgba(0,0,0,0.8)', 'transparent']}
            style={styles.imageTopGradient}
          />
          {/* Capa oscura inferior para que el título no se pierda */}
          <LinearGradient
            colors={['transparent', colors.background]}
            style={styles.imageBottomGradient}
          />
          <TouchableOpacity style={[styles.backButton, { top: 16 }]} onPress={() => router.back()}>
            <ArrowLeft color={colors.textPrimary} size={24} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 20, delay: 100 }}
          >
            <Text style={styles.title}>{exercise.name}</Text>
          </MotiView>

          <MotiView 
            style={styles.bentoGrid}
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 20, delay: 200 }}
          >
            <View style={[styles.bentoCard, { flex: 1.5 }]}>
              <View style={styles.bentoIconBg}>
                <Target color={colors.accent} size={20} />
              </View>
              <Text style={styles.bentoLabel}>MÚSCULO</Text>
              <Text style={styles.bentoValue}>{exercise.muscle_group}</Text>
            </View>
            
            <View style={[styles.bentoCol, { flex: 1 }]}>
              <View style={[styles.bentoCard, styles.bentoCardSmall]}>
                <Dumbbell color={colors.textSecondary} size={16} />
                <View style={{ flex: 1, overflow: 'hidden' }}>
                  <Text style={styles.bentoLabelSmall} numberOfLines={1}>EQUIPO</Text>
                  <Text style={styles.bentoValueSmall} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>{exercise.equipment}</Text>
                </View>
              </View>
              
              <View style={[styles.bentoCard, styles.bentoCardSmall, { backgroundColor: 'rgba(180, 240, 60, 0.05)', borderColor: 'rgba(180, 240, 60, 0.1)' }]}>
                <Zap color={colors.accent} size={16} />
                <View style={{ flex: 1, overflow: 'hidden' }}>
                  <Text style={[styles.bentoLabelSmall, { color: colors.accent }]} numberOfLines={1}>OBJETIVO</Text>
                  <Text style={[styles.bentoValueSmall, { color: colors.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>{exercise.target}</Text>
                </View>
              </View>
            </View>
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 20, delay: 300 }}
          >
            <Text style={styles.sectionTitle}>Instrucciones</Text>
            <View style={styles.instructionsContainer}>
              {instructionsList.length > 0 ? (
                instructionsList.map((instruction, index) => (
                  <View key={index} style={styles.instructionRow}>
                    <View style={styles.instructionNumberBg}>
                      <Text style={styles.instructionNumber}>{index + 1}</Text>
                    </View>
                    <Text style={styles.instructionText}>{instruction.trim()}{instruction.endsWith('.') ? '' : '.'}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.instructionText}>Sin instrucciones detalladas disponibles.</Text>
              )}
            </View>
          </MotiView>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom > 0 ? insets.bottom + 8 : 24 }]}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleAdd} activeOpacity={0.9}>
          <LinearGradient
            colors={[colors.accent, '#90D41C']}
            style={styles.primaryButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.primaryButtonText}>Añadir a mi entreno</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontFamily: typography.fontFamily.medium, color: colors.destructive },
  scrollContent: { paddingBottom: 120 },
  
  imageContainer: { width: '100%', height: 400, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  imageTopGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 100 },
  imageBottomGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 150 },
  backButton: { position: 'absolute', left: 24, width: 44, height: 44, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  
  content: { padding: 24, marginTop: -40 },
  title: { fontFamily: typography.fontFamily.bold, ...typography.scale.display, fontSize: 32, color: colors.textPrimary, marginBottom: 24, textTransform: 'capitalize' },
  
  bentoGrid: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  bentoCard: { backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', justifyContent: 'center' },
  bentoCol: { flex: 1, gap: 12 },
  bentoCardSmall: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, flex: 1 },
  
  bentoIconBg: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(180, 240, 60, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  bentoLabel: { fontFamily: typography.fontFamily.bold, ...typography.scale.caption, color: colors.textSecondary, letterSpacing: 1, marginBottom: 4 },
  bentoValue: { fontFamily: typography.fontFamily.bold, ...typography.scale.title, fontSize: 20, color: colors.textPrimary, textTransform: 'capitalize' },
  
  bentoLabelSmall: { fontFamily: typography.fontFamily.bold, fontSize: 9, color: colors.textSecondary, letterSpacing: 0.5, marginBottom: 2 },
  bentoValueSmall: { fontFamily: typography.fontFamily.bold, ...typography.scale.body, fontSize: 14, color: colors.textPrimary, textTransform: 'capitalize' },

  sectionTitle: { fontFamily: typography.fontFamily.bold, ...typography.scale.title, fontSize: 22, color: colors.textPrimary, marginBottom: 20 },
  instructionsContainer: { backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  instructionRow: { flexDirection: 'row', marginBottom: 16, paddingRight: 8 },
  instructionNumberBg: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(180, 240, 60, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12, marginTop: -2 },
  instructionNumber: { fontFamily: typography.fontFamily.bold, fontSize: 12, color: colors.accent },
  instructionText: { flex: 1, fontFamily: typography.fontFamily.regular, ...typography.scale.body, fontSize: 16, color: colors.textSecondary, lineHeight: 24 },
  
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.background, paddingHorizontal: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  primaryButton: { height: 60, borderRadius: 16, overflow: 'hidden', shadowColor: colors.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 4 },
  primaryButtonGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  primaryButtonText: { fontFamily: typography.fontFamily.bold, ...typography.scale.title, fontSize: 18, color: colors.background },
});
