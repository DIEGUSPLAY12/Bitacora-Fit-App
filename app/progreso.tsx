import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, FlatList, ActivityIndicator, Dimensions, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { ArrowLeft, ChevronDown, Search, X, TrendingUp, Zap, Weight, Target } from 'lucide-react-native';
import { useExercises } from '../hooks/useExercises';
import { useExerciseProgress, Timeframe } from '../hooks/useExerciseProgress';
import { useMuscleGroupProgress } from '../hooks/useMuscleGroupProgress';
import { LineChart } from 'react-native-gifted-charts';
import { RadarChart } from '../components/RadarChart';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';

const { width } = Dimensions.get('window');

const TIMEFRAMES: { label: string; value: Timeframe }[] = [
  { label: 'Semana', value: 'Semana' },
  { label: 'Mes', value: 'Mes' },
  { label: 'Año', value: 'Año' },
];

export default function ProgresoScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'ejercicio' | 'musculo'>('ejercicio');

  // Exercise Selection
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  const { data: exercises, isLoading: isExercisesLoading } = useExercises();
  
  const filteredExercises = useMemo(() => {
    if (!exercises) return [];
    if (!searchQuery.trim()) return exercises;
    const lowerQuery = searchQuery.toLowerCase();
    return exercises.filter(e => e.name.toLowerCase().includes(lowerQuery));
  }, [exercises, searchQuery]);

  // Chart Data
  const [timeframe, setTimeframe] = useState<Timeframe>('Mes');
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
      textColor: colors.textPrimary, // Make the number stand out more
      textFontSize: 12,
      textShiftY: -15, // Shift above the point
      textShiftX: -8,
      labelTextStyle: { color: colors.textSecondary, fontSize: 11 },
    }));
  }, [progressData]);

  // Calculate dynamic spacing so the chart spans the available width
  const chartWidth = width - 110; // Account for Y-axis text
  const chartSpacing = useMemo(() => {
    if (!progressData || progressData.length <= 1) return chartWidth - 40;
    return Math.max(30, (chartWidth - 40) / (progressData.length - 1));
  }, [progressData, chartWidth]);

  // Statistics for Muscle
  const totalVolume = useMemo(() => {
    if (!muscleData) return 0;
    return Object.values(muscleData).reduce((sum, val) => sum + val, 0);
  }, [muscleData]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft color={colors.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Progreso</Text>
      </View>

      <View style={styles.tabsContainer}>
        <View style={styles.tabsWrapper}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'ejercicio' && styles.activeTab]}
            onPress={() => setActiveTab('ejercicio')}
          >
            <Text style={[styles.tabText, activeTab === 'ejercicio' && styles.activeTabText]}>Por Ejercicio</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'musculo' && styles.activeTab]}
            onPress={() => setActiveTab('musculo')}
          >
            <Text style={[styles.tabText, activeTab === 'musculo' && styles.activeTabText]}>Por Músculo</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
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
            <TouchableOpacity style={styles.selector} onPress={() => setModalVisible(true)} activeOpacity={0.8}>
              <View style={styles.selectorTextContainer}>
                <Text style={styles.selectorLabel}>Ejercicio a analizar</Text>
                <Text style={styles.selectorValue}>
                  {selectedExercise ? selectedExercise.name : 'Selecciona un ejercicio'}
                </Text>
              </View>
              <ChevronDown color={colors.accent} size={24} />
            </TouchableOpacity>

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
                      width={chartWidth}
                      spacing={chartSpacing}
                      height={220}
                      thickness={3}
                      color={colors.accent}
                      hideRules
                      yAxisColor={colors.textSecondary}
                      xAxisColor={colors.textSecondary}
                      yAxisTextStyle={{ color: colors.textSecondary, fontSize: 11 }}
                      xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 11 }}
                      dataPointsColor={colors.accent}
                      dataPointsRadius={5}
                      curved
                      isAnimated
                      animationDuration={1200}
                      initialSpacing={20}
                      endSpacing={20}
                    />
                  </View>

                  <View style={styles.bentoGrid}>
                    <View style={[styles.bentoCard, { flex: 1 }]}>
                      <View style={styles.bentoIconBg}>
                        <Zap color={colors.accent} size={20} fill={colors.accent} />
                      </View>
                      <Text style={styles.bentoValue} adjustsFontSizeToFit numberOfLines={1}>{stats.pr} kg</Text>
                      <Text style={styles.bentoLabel}>RÉCORD ACTUAL</Text>
                    </View>
                    <View style={[styles.bentoCard, { flex: 1, backgroundColor: 'rgba(180, 240, 60, 0.05)', borderColor: 'rgba(180, 240, 60, 0.2)' }]}>
                      <View style={[styles.bentoIconBg, { backgroundColor: 'rgba(180, 240, 60, 0.15)' }]}>
                        <TrendingUp color={colors.accent} size={20} />
                      </View>
                      {stats.improvement !== null ? (
                        <Text style={[styles.bentoValue, { color: stats.improvement >= 0 ? colors.accent : colors.destructive }]} adjustsFontSizeToFit numberOfLines={1}>
                          {stats.improvement >= 0 ? '+' : ''}{stats.improvement.toFixed(1)}%
                        </Text>
                      ) : (
                        <Text style={[styles.bentoValue, { color: colors.textSecondary }]} adjustsFontSizeToFit numberOfLines={1}>N/A</Text>
                      )}
                      <Text style={[styles.bentoLabel, { color: colors.accent }]}>MEJORA</Text>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconBg}>
                    <TrendingUp color={colors.accent} size={32} />
                  </View>
                  <Text style={styles.emptyText}>Necesitas al menos 2 sesiones con este ejercicio para ver gráficos.</Text>
                </View>
              )
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconBg}>
                  <Target color={colors.accent} size={32} />
                </View>
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
                 
                 <View style={styles.bentoGrid}>
                    <View style={[styles.bentoCard, { flex: 1 }]}>
                      <View style={styles.bentoIconBg}>
                        <Weight color={colors.accent} size={20} />
                      </View>
                      <Text style={styles.bentoValue} adjustsFontSizeToFit numberOfLines={1}>{totalVolume.toLocaleString()} kg</Text>
                      <Text style={styles.bentoLabel}>VOLUMEN GLOBAL MOVIDO</Text>
                    </View>
                  </View>
               </View>
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconBg}>
                  <TrendingUp color={colors.accent} size={32} />
                </View>
                <Text style={styles.emptyText}>No hay datos de entrenamiento en este periodo.</Text>
              </View>
            )}
          </ScrollView>
        )}
      </View>

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleccionar Ejercicio</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
              <X color={colors.textPrimary} size={24} />
            </TouchableOpacity>
          </View>
          
          <View style={[styles.searchContainer, isSearchFocused && styles.searchContainerFocused]}>
            <Search color={isSearchFocused ? colors.accent : colors.textSecondary} size={20} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar ejercicio..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
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
  header: { flexDirection: 'row', alignItems: 'center', padding: 24, paddingTop: 16, paddingBottom: 16 },
  backButton: { marginRight: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  title: { fontFamily: typography.fontFamily.semibold, fontSize: 22, letterSpacing: 0.3, color: colors.textPrimary },
  
  tabsContainer: { paddingHorizontal: 24, marginBottom: 24 },
  tabsWrapper: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: 'rgba(255,255,255,0.1)' },
  tabText: { fontFamily: typography.fontFamily.medium, color: colors.textSecondary, ...typography.scale.body, fontSize: 14 },
  activeTabText: { color: colors.textPrimary, fontFamily: typography.fontFamily.bold },
  
  content: { flex: 1, paddingHorizontal: 24 },
  filtersContainer: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  chip: { flex: 1, paddingVertical: 10, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  chipActive: { backgroundColor: 'rgba(180, 240, 60, 0.1)', borderColor: 'rgba(180, 240, 60, 0.3)' },
  chipText: { fontFamily: typography.fontFamily.bold, ...typography.scale.caption, color: colors.textSecondary },
  chipTextActive: { color: colors.accent },
  
  selector: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  selectorTextContainer: { flex: 1 },
  selectorLabel: { fontFamily: typography.fontFamily.medium, ...typography.scale.caption, color: colors.textSecondary, marginBottom: 4 },
  selectorValue: { fontFamily: typography.fontFamily.bold, ...typography.scale.body, fontSize: 18, color: colors.textPrimary, textTransform: 'capitalize' },
  
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 200 },
  resultsContainer: { flex: 1 },
  chartContainer: { backgroundColor: colors.surface, borderRadius: 20, padding: 16, paddingVertical: 24, marginBottom: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  
  bentoGrid: { flexDirection: 'row', gap: 14 },
  bentoCard: { backgroundColor: colors.surface, padding: 20, borderRadius: 18, alignItems: 'flex-start', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', justifyContent: 'center' },
  bentoIconBg: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(180, 240, 60, 0.12)', justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  bentoValue: { fontFamily: typography.fontFamily.bold, fontSize: 22, color: colors.textPrimary, marginBottom: 4 },
  bentoLabel: { fontFamily: typography.fontFamily.medium, fontSize: 11, color: colors.textSecondary, letterSpacing: 0.8 },
  
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 36, backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', minHeight: 240 },
  emptyIconBg: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(180, 240, 60, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyText: { fontFamily: typography.fontFamily.medium, ...typography.scale.body, color: colors.textSecondary, textAlign: 'center', lineHeight: 24 },
  
  modalContainer: { flex: 1, backgroundColor: colors.surface },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingTop: 32 },
  modalTitle: { fontFamily: typography.fontFamily.semibold, fontSize: 20, letterSpacing: 0.2, color: colors.textPrimary },
  closeButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceElevated, marginHorizontal: 24, borderRadius: 14, paddingHorizontal: 16, marginBottom: 16, height: 52, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  searchContainerFocused: { borderColor: colors.accent, backgroundColor: 'rgba(180, 240, 60, 0.05)' },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, height: 56, color: colors.textPrimary, fontFamily: typography.fontFamily.regular, fontSize: 16 },
  
  listContent: { paddingHorizontal: 24, paddingBottom: 40 },
  exerciseItem: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  exerciseName: { fontFamily: typography.fontFamily.bold, ...typography.scale.body, fontSize: 18, color: colors.textPrimary, textTransform: 'capitalize', marginBottom: 4 },
  muscleGroup: { fontFamily: typography.fontFamily.medium, ...typography.scale.caption, color: colors.accent, textTransform: 'uppercase' },
});
