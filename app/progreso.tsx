import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, FlatList, ActivityIndicator, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { ArrowLeft, ChevronDown, Search, X, TrendingUp } from 'lucide-react-native';
import { useExercises } from '../hooks/useExercises';
import { useExerciseProgress, Timeframe } from '../hooks/useExerciseProgress';
import { LineChart } from 'react-native-gifted-charts';

const { width } = Dimensions.get('window');

const TIMEFRAMES: { label: string; value: Timeframe }[] = [
  { label: '1M', value: '1M' },
  { label: '3M', value: '3M' },
  { label: '6M', value: '6M' },
  { label: 'Todo', value: 'Todo' },
];

export default function ProgresoScreen() {
  const router = useRouter();
  
  // Exercise Selection
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  
  const { data: exercises, isLoading: isExercisesLoading } = useExercises();
  
  const filteredExercises = useMemo(() => {
    if (!exercises) return [];
    if (!searchQuery.trim()) return exercises;
    const lowerQuery = searchQuery.toLowerCase();
    return exercises.filter(e => e.name.toLowerCase().includes(lowerQuery));
  }, [exercises, searchQuery]);

  // Chart Data
  const [timeframe, setTimeframe] = useState<Timeframe>('Todo');
  const { data: progressData, isLoading: isProgressLoading } = useExerciseProgress(selectedExercise?.id || null, timeframe);

  // Statistics
  const stats = useMemo(() => {
    if (!progressData || progressData.length === 0) return { pr: 0, improvement: null };
    
    const pr = Math.max(...progressData.map(d => d.maxWeight));
    
    // Calcular mejora este mes (últimos 30 días vs los 30 anteriores)
    const now = new Date().getTime();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    
    const thisMonth = progressData.filter(d => (now - d.date.getTime()) <= thirtyDays);
    const lastMonth = progressData.filter(d => {
      const diff = now - d.date.getTime();
      return diff > thirtyDays && diff <= (thirtyDays * 2);
    });

    const maxThisMonth = thisMonth.length > 0 ? Math.max(...thisMonth.map(d => d.maxWeight)) : 0;
    const maxLastMonth = lastMonth.length > 0 ? Math.max(...lastMonth.map(d => d.maxWeight)) : 0;
    
    let improvement = null;
    if (maxLastMonth > 0 && maxThisMonth > 0) {
      improvement = ((maxThisMonth - maxLastMonth) / maxLastMonth) * 100;
    }

    return { pr, improvement };
  }, [progressData]);

  const chartData = useMemo(() => {
    if (!progressData) return [];
    return progressData.map(p => ({
      value: p.maxWeight,
      label: p.label,
      dataPointText: p.maxWeight.toString(),
      textColor: colors.textSecondary,
      textFontSize: 10,
    }));
  }, [progressData]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft color={colors.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Progreso</Text>
      </View>

      <View style={styles.content}>
        {/* Selector de ejercicio */}
        <TouchableOpacity style={styles.selector} onPress={() => setModalVisible(true)}>
          <View style={styles.selectorTextContainer}>
            <Text style={styles.selectorLabel}>Ejercicio a analizar</Text>
            <Text style={styles.selectorValue}>
              {selectedExercise ? selectedExercise.name : 'Selecciona un ejercicio'}
            </Text>
          </View>
          <ChevronDown color={colors.textSecondary} size={24} />
        </TouchableOpacity>

        {/* Filtros de tiempo */}
        <View style={styles.filtersContainer}>
          {TIMEFRAMES.map(tf => (
            <TouchableOpacity 
              key={tf.value} 
              style={[styles.chip, timeframe === tf.value && styles.chipActive]}
              onPress={() => setTimeframe(tf.value)}
            >
              <Text style={[styles.chipText, timeframe === tf.value && styles.chipTextActive]}>
                {tf.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Gráfico y Estadísticas */}
        {selectedExercise ? (
          isProgressLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator color={colors.accent} size="large" />
            </View>
          ) : progressData && progressData.length >= 2 ? (
            <View style={styles.resultsContainer}>
              <View style={styles.chartContainer}>
                <LineChart
                  data={chartData}
                  width={width - 80}
                  height={220}
                  thickness={3}
                  color={colors.accent}
                  hideRules
                  hideYAxisText
                  yAxisColor={colors.textSecondary}
                  xAxisColor={colors.textSecondary}
                  dataPointsColor={colors.accent}
                  dataPointsRadius={4}
                  curved
                  isAnimated
                  animationDuration={1200}
                  initialSpacing={20}
                  endSpacing={20}
                  textColor={colors.textSecondary}
                />
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{stats.pr} kg</Text>
                  <Text style={styles.statLabel}>PR ACTUAL</Text>
                </View>
                <View style={styles.statBox}>
                  {stats.improvement !== null ? (
                    <Text style={[styles.statValue, { color: stats.improvement >= 0 ? colors.accent : colors.destructive }]}>
                      {stats.improvement >= 0 ? '+' : ''}{stats.improvement.toFixed(1)}%
                    </Text>
                  ) : (
                    <Text style={[styles.statValue, { color: colors.textSecondary }]}>N/A</Text>
                  )}
                  <Text style={styles.statLabel}>MEJORA ESTE MES</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <TrendingUp color={colors.textSecondary} size={48} style={styles.emptyIcon} />
              <Text style={styles.emptyText}>Necesitas al menos 2 sesiones con este ejercicio para mostrar tu progreso.</Text>
            </View>
          )
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Selecciona un ejercicio arriba para ver tu historial de levantamientos.</Text>
          </View>
        )}
      </View>

      {/* Modal Selector */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleccionar Ejercicio</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <X color={colors.textPrimary} size={24} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.searchContainer}>
            <Search color={colors.textSecondary} size={20} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar ejercicio..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {isExercisesLoading ? (
            <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={filteredExercises}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.exerciseItem}
                  onPress={() => {
                    setSelectedExercise(item);
                    setModalVisible(false);
                    setSearchQuery('');
                  }}
                >
                  <Text style={styles.exerciseName}>{item.name}</Text>
                  <Text style={styles.muscleGroup}>{item.muscle_group}</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 24, paddingTop: 60, paddingBottom: 16 },
  backButton: { marginRight: 16 },
  title: { fontFamily: typography.fontFamily.bold, ...typography.scale.display, fontSize: 24, color: colors.textPrimary },
  content: { flex: 1, paddingHorizontal: 24 },
  selector: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: 16, borderRadius: 12, marginBottom: 20 },
  selectorTextContainer: { flex: 1 },
  selectorLabel: { fontFamily: typography.fontFamily.medium, ...typography.scale.caption, color: colors.textSecondary, marginBottom: 4 },
  selectorValue: { fontFamily: typography.fontFamily.bold, ...typography.scale.body, color: colors.textPrimary, textTransform: 'capitalize' },
  filtersContainer: { flexDirection: 'row', gap: 8, marginBottom: 32 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.surface },
  chipActive: { backgroundColor: colors.accent },
  chipText: { fontFamily: typography.fontFamily.bold, ...typography.scale.caption, color: colors.textSecondary },
  chipTextActive: { color: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  resultsContainer: { flex: 1 },
  chartContainer: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, paddingVertical: 24, marginBottom: 24, alignItems: 'center' },
  statsRow: { flexDirection: 'row', gap: 16 },
  statBox: { flex: 1, backgroundColor: colors.surface, padding: 20, borderRadius: 16, alignItems: 'center' },
  statValue: { fontFamily: typography.fontFamily.bold, ...typography.scale.title, fontSize: 24, color: colors.textPrimary, marginBottom: 8 },
  statLabel: { fontFamily: typography.fontFamily.bold, ...typography.scale.caption, color: colors.textSecondary, letterSpacing: 1 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { marginBottom: 16 },
  emptyText: { fontFamily: typography.fontFamily.medium, ...typography.scale.body, color: colors.textSecondary, textAlign: 'center' },
  modalContainer: { flex: 1, backgroundColor: colors.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingTop: 32 },
  modalTitle: { fontFamily: typography.fontFamily.bold, ...typography.scale.title, color: colors.textPrimary },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, marginHorizontal: 24, borderRadius: 12, paddingHorizontal: 16, marginBottom: 16 },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, height: 48, color: colors.textPrimary, fontFamily: typography.fontFamily.regular, ...typography.scale.body },
  listContent: { paddingHorizontal: 24, paddingBottom: 40 },
  exerciseItem: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.surface },
  exerciseName: { fontFamily: typography.fontFamily.bold, ...typography.scale.body, color: colors.textPrimary, textTransform: 'capitalize', marginBottom: 4 },
  muscleGroup: { fontFamily: typography.fontFamily.medium, ...typography.scale.caption, color: colors.textSecondary, textTransform: 'uppercase' },
});
