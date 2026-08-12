import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, FlatList, ActivityIndicator, Dimensions, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { ArrowLeft, ChevronDown, Search, X, TrendingUp } from 'lucide-react-native';
import { useExercises } from '../hooks/useExercises';
import { useExerciseProgress, Timeframe } from '../hooks/useExerciseProgress';
import { useMuscleGroupProgress } from '../hooks/useMuscleGroupProgress';
import { LineChart } from 'react-native-gifted-charts';
import { RadarChart } from '../components/RadarChart';

const { width } = Dimensions.get('window');

const TIMEFRAMES: { label: string; value: Timeframe }[] = [
  { label: 'Semana', value: 'Semana' },
  { label: 'Mes', value: 'Mes' },
  { label: 'Año', value: 'Año' },
];

export default function ProgresoScreen() {
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'ejercicio' | 'musculo'>('ejercicio');

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
  const [timeframe, setTimeframe] = useState<Timeframe>('Mes'); // Default to Mes
  const { data: progressData, isLoading: isProgressLoading } = useExerciseProgress(selectedExercise?.id || null, timeframe);
  
  // Muscle Group Data
  const { data: muscleData, isLoading: isMuscleLoading } = useMuscleGroupProgress(timeframe);

  // Statistics for Exercise
  const stats = useMemo(() => {
    if (!progressData || progressData.length === 0) return { pr: 0, improvement: null };
    
    const pr = Math.max(...progressData.map(d => d.maxWeight));
    
    // Calcular mejora este periodo
    const now = new Date().getTime();
    const periodDays = timeframe === 'Semana' ? 7 : timeframe === 'Mes' ? 30 : 365;
    const periodMs = periodDays * 24 * 60 * 60 * 1000;
    
    const currentPeriod = progressData.filter(d => (now - d.date.getTime()) <= periodMs);
    const previousPeriod = progressData.filter(d => {
      const diff = now - d.date.getTime();
      return diff > periodMs && diff <= (periodMs * 2);
    });

    const maxCurrent = currentPeriod.length > 0 ? Math.max(...currentPeriod.map(d => d.maxWeight)) : 0;
    const maxPrev = previousPeriod.length > 0 ? Math.max(...previousPeriod.map(d => d.maxWeight)) : 0;
    
    let improvement = null;
    if (maxPrev > 0 && maxCurrent > 0) {
      improvement = ((maxCurrent - maxPrev) / maxPrev) * 100;
    }

    return { pr, improvement };
  }, [progressData, timeframe]);

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

  // Statistics for Muscle
  const totalVolume = useMemo(() => {
    if (!muscleData) return 0;
    return Object.values(muscleData).reduce((sum, val) => sum + val, 0);
  }, [muscleData]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft color={colors.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Progreso</Text>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'ejercicio' && styles.activeTab]}
          onPress={() => setActiveTab('ejercicio')}
        >
          <Text style={[styles.tabText, activeTab === 'ejercicio' && styles.activeTabText]}>Por ejercicio</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'musculo' && styles.activeTab]}
          onPress={() => setActiveTab('musculo')}
        >
          <Text style={[styles.tabText, activeTab === 'musculo' && styles.activeTabText]}>Por grupo muscular</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
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

        {activeTab === 'ejercicio' ? (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
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
                      <Text style={styles.statLabel}>MEJORA</Text>
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
          </ScrollView>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            {isMuscleLoading ? (
               <View style={styles.centered}>
                 <ActivityIndicator color={colors.accent} size="large" />
               </View>
            ) : muscleData && totalVolume > 0 ? (
               <View style={styles.resultsContainer}>
                 <View style={styles.chartContainer}>
                   <RadarChart data={muscleData} size={width - 80} />
                 </View>
                 
                 <View style={styles.statsRow}>
                    <View style={[styles.statBox, { flex: 1 }]}>
                      <Text style={styles.statValue}>{totalVolume.toLocaleString()} kg</Text>
                      <Text style={styles.statLabel}>VOLUMEN TOTAL</Text>
                    </View>
                  </View>
               </View>
            ) : (
              <View style={styles.emptyState}>
                <TrendingUp color={colors.textSecondary} size={48} style={styles.emptyIcon} />
                <Text style={styles.emptyText}>No hay datos de entrenamiento en este periodo.</Text>
              </View>
            )}
          </ScrollView>
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
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: colors.surface, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: colors.accent },
  tabText: { fontFamily: typography.fontFamily.medium, color: colors.textSecondary, ...typography.scale.body },
  activeTabText: { color: colors.textPrimary, fontFamily: typography.fontFamily.bold },
  content: { flex: 1, paddingHorizontal: 24 },
  selector: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: 16, borderRadius: 12, marginBottom: 20 },
  selectorTextContainer: { flex: 1 },
  selectorLabel: { fontFamily: typography.fontFamily.medium, ...typography.scale.caption, color: colors.textSecondary, marginBottom: 4 },
  selectorValue: { fontFamily: typography.fontFamily.bold, ...typography.scale.body, color: colors.textPrimary, textTransform: 'capitalize' },
  filtersContainer: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.surface },
  chipActive: { backgroundColor: colors.accent },
  chipText: { fontFamily: typography.fontFamily.bold, ...typography.scale.caption, color: colors.textSecondary },
  chipTextActive: { color: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  resultsContainer: { flex: 1 },
  chartContainer: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, paddingVertical: 24, marginBottom: 24, alignItems: 'center', justifyContent: 'center' },
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
