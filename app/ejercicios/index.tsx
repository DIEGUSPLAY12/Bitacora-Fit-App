import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { useExercises } from '../../hooks/useExercises';
import { useWorkoutStore, Exercise } from '../../store/workout-store';
import { useTemplateBuilderStore } from '../../store/template-builder-store';
import { useReduceMotion } from '../../hooks/useReduceMotion';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { Search, ArrowLeft, Plus } from 'lucide-react-native';
import { MotiView } from 'moti';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const FILTERS = ['Todos', 'Pecho', 'Espalda', 'Piernas', 'Hombro', 'Brazo', 'Core'];

export default function ExerciseSelectorScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isTemplate } = useLocalSearchParams();
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('Todos');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  const reduceMotion = useReduceMotion();
  const { data: exercises, isLoading } = useExercises(search, selectedFilter);
  
  const addExercise = useWorkoutStore(state => state.addExercise);
  const addTemplateExercise = useTemplateBuilderStore(state => state.addExercise);

  const handleAdd = useCallback((exercise: Exercise) => {
    if (isTemplate === 'true') {
      addTemplateExercise(exercise);
      router.navigate('/template/crear');
    } else {
      addExercise(exercise);
      router.navigate('/entrenar');
    }
  }, [addExercise, addTemplateExercise, router, isTemplate]);

  const renderItem = useCallback(({ item, index }: { item: Exercise, index: number }) => (
    <MotiView
      from={{ opacity: 0, translateY: reduceMotion ? 0 : 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 250, delay: reduceMotion ? 0 : index * 30 }}
    >
      <TouchableOpacity 
        style={styles.card} 
        activeOpacity={0.7}
        onPress={() => router.push(`/ejercicios/${item.id}`)}
      >
        <Image 
          source={item.image_url} 
          style={styles.image} 
          contentFit="cover" 
          transition={200}
        />
        <View style={styles.cardContent}>
          <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
          <View style={styles.tagsContainer}>
            <View style={styles.tag}><Text style={styles.tagText}>{item.muscle_group}</Text></View>
            <View style={styles.tag}><Text style={styles.tagText}>{item.equipment}</Text></View>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => handleAdd(item)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.accent, '#90D41C']}
            style={styles.addButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Plus color={colors.background} size={20} strokeWidth={3} />
          </LinearGradient>
        </TouchableOpacity>
      </TouchableOpacity>
    </MotiView>
  ), [router, handleAdd, reduceMotion]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft color={colors.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Añadir ejercicio</Text>
      </View>

      <View style={[styles.searchContainer, isSearchFocused && styles.searchContainerFocused]}>
        <Search color={isSearchFocused ? colors.accent : colors.textSecondary} size={20} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar ejercicio..."
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={setSearch}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
        />
      </View>

      <View style={styles.filtersWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContainer}>
          {FILTERS.map(f => {
            const isActive = selectedFilter === f;
            return (
              <TouchableOpacity 
                key={f}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setSelectedFilter(f)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>{f}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.listContainer}>
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 40 }} />
        ) : (
          <FlashList
            data={exercises || []}
            renderItem={renderItem}
            estimatedItemSize={100}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 24, paddingTop: 16 },
  backButton: { marginRight: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  title: { fontFamily: typography.fontFamily.bold, ...typography.scale.title, fontSize: 22, color: colors.textPrimary },
  
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', marginHorizontal: 24, borderRadius: 16, paddingHorizontal: 16, height: 56, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  searchContainerFocused: { borderColor: colors.accent, backgroundColor: 'rgba(180, 240, 60, 0.05)' },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, color: colors.textPrimary, fontFamily: typography.fontFamily.regular, fontSize: 16 },
  
  filtersWrapper: { marginTop: 20, marginBottom: 12 },
  filtersContainer: { paddingHorizontal: 24, gap: 10 },
  filterChip: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  filterChipActive: { backgroundColor: 'rgba(180, 240, 60, 0.15)', borderColor: 'rgba(180, 240, 60, 0.3)' },
  filterText: { fontFamily: typography.fontFamily.medium, ...typography.scale.body, fontSize: 14, color: colors.textSecondary },
  filterTextActive: { color: colors.accent, fontFamily: typography.fontFamily.bold },
  
  listContainer: { flex: 1 },
  listContent: { paddingHorizontal: 24, paddingBottom: 100, paddingTop: 8 },
  card: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 20, overflow: 'hidden', marginBottom: 16, alignItems: 'center', paddingRight: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  image: { width: 90, height: 90, backgroundColor: 'rgba(255,255,255,0.02)' },
  cardContent: { flex: 1, padding: 16 },
  cardName: { fontFamily: typography.fontFamily.bold, ...typography.scale.body, fontSize: 16, color: colors.textPrimary, marginBottom: 8, textTransform: 'capitalize' },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  tagText: { fontFamily: typography.fontFamily.bold, fontSize: 10, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  addButton: { width: 44, height: 44, borderRadius: 12, overflow: 'hidden' },
  addButtonGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
