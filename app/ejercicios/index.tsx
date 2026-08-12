import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { useExercises } from '../../hooks/useExercises';
import { useWorkoutStore, Exercise } from '../../store/workout-store';
import { useReduceMotion } from '../../hooks/useReduceMotion';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { Search, ArrowLeft, Plus } from 'lucide-react-native';
import { MotiView } from 'moti';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const FILTERS = ['Todos', 'Pecho', 'Espalda', 'Piernas', 'Hombro', 'Brazo', 'Core'];

export default function ExerciseSelectorScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('Todos');
  
  const reduceMotion = useReduceMotion();
  const { data: exercises, isLoading } = useExercises(search, selectedFilter);
  const addExercise = useWorkoutStore(state => state.addExercise);

  const handleAdd = useCallback((exercise: Exercise) => {
    addExercise(exercise);
    router.navigate('/entrenar');
  }, [addExercise, router]);

  const renderItem = useCallback(({ item, index }: { item: Exercise, index: number }) => (
    <MotiView
      from={{ opacity: 0, translateY: reduceMotion ? 0 : 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 400, delay: reduceMotion ? 0 : index * 50 }}
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
        >
          <Plus color={colors.background} size={20} />
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

      <View style={styles.searchContainer}>
        <Search color={colors.textSecondary} size={20} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar ejercicio..."
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.filtersWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContainer}>
          {FILTERS.map(f => (
            <TouchableOpacity 
              key={f}
              style={[styles.filterChip, selectedFilter === f && styles.filterChipActive]}
              onPress={() => setSelectedFilter(f)}
            >
              <Text style={[styles.filterText, selectedFilter === f && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
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
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 24, paddingTop: 16 },
  backButton: { marginRight: 16 },
  title: { fontFamily: typography.fontFamily.bold, ...typography.scale.title, color: colors.textPrimary },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, marginHorizontal: 24, borderRadius: 12, paddingHorizontal: 16, height: 48 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: colors.textPrimary, fontFamily: typography.fontFamily.regular, ...typography.scale.body },
  filtersWrapper: { marginTop: 16, marginBottom: 8 },
  filtersContainer: { paddingHorizontal: 24, gap: 8 },
  filterChip: { backgroundColor: colors.surface, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  filterChipActive: { backgroundColor: colors.accent },
  filterText: { fontFamily: typography.fontFamily.medium, ...typography.scale.caption, color: colors.textSecondary },
  filterTextActive: { color: colors.background, fontFamily: typography.fontFamily.bold },
  listContainer: { flex: 1 },
  listContent: { padding: 24, paddingBottom: 100 },
  card: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 12, overflow: 'hidden', marginBottom: 12, alignItems: 'center', paddingRight: 12 },
  image: { width: 80, height: 80, backgroundColor: '#2A2A2A' },
  cardContent: { flex: 1, padding: 12 },
  cardName: { fontFamily: typography.fontFamily.bold, ...typography.scale.body, color: colors.textPrimary, marginBottom: 8, textTransform: 'capitalize' },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  tagText: { fontFamily: typography.fontFamily.regular, fontSize: 10, color: colors.textSecondary, textTransform: 'uppercase' },
  addButton: { width: 40, height: 40, backgroundColor: colors.accent, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
});
