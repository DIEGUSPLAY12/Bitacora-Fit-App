import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { customAlert as Alert } from '../store/alert-store';
import { useRouter } from 'expo-router';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useBodyWeightLogs, useAddBodyWeight, useDeleteBodyWeight } from '../hooks/useBodyWeight';
import { useProfile } from '../hooks/useProfile';
import { ArrowLeft, Plus, Scale, Trash2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-gifted-charts';
import { MotiView } from 'moti';

export default function PesoScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const { data: profile } = useProfile();
  const { data: logs, isLoading } = useBodyWeightLogs();
  const { mutateAsync: addLog, isPending: isAdding } = useAddBodyWeight();
  const { mutateAsync: deleteLog, isPending: isDeleting } = useDeleteBodyWeight();

  const [weightInput, setWeightInput] = useState('');
  
  const isLbs = profile?.weight_unit === 'lbs';
  const unitLabel = isLbs ? 'lbs' : 'kg';

  // Helper to convert DB kg to user preference
  const displayWeight = (kg: number) => isLbs ? kg * 2.20462 : kg;
  // Helper to convert user input to DB kg
  const storeWeight = (val: number) => isLbs ? val / 2.20462 : val;

  const handleAdd = async () => {
    const val = parseFloat(weightInput.replace(',', '.'));
    if (isNaN(val) || val <= 0) {
      Alert.alert('Error', 'Introduce un peso válido.');
      return;
    }
    try {
      await addLog(storeWeight(val));
      setWeightInput('');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Eliminar registro', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => deleteLog(id) }
    ]);
  };

  const chartData = useMemo(() => {
    if (!logs || logs.length === 0) return [];
    return logs.map((log: any) => ({
      value: parseFloat(displayWeight(log.weight_kg).toFixed(1)),
      label: new Date(log.logged_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
      dataPointText: displayWeight(log.weight_kg).toFixed(1)
    }));
  }, [logs, isLbs]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeft color={colors.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Registro de Peso</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          
          {/* Chart Section */}
          <View style={styles.chartCard}>
            <Text style={styles.sectionTitle}>Evolución ({unitLabel})</Text>
            {isLoading ? (
              <View style={styles.chartPlaceholder}>
                <ActivityIndicator color={colors.accent} />
              </View>
            ) : chartData.length > 1 ? (
              <View style={{ marginLeft: -10 }}>
                <LineChart
                  data={chartData}
                  width={300}
                  height={180}
                  thickness={3}
                  color={colors.accent}
                  hideDataPoints={false}
                  dataPointsColor={colors.accent}
                  dataPointsRadius={4}
                  hideRules
                  yAxisColor="transparent"
                  xAxisColor="rgba(255,255,255,0.1)"
                  yAxisTextStyle={{ color: colors.textSecondary, fontSize: 10, fontFamily: typography.fontFamily.medium }}
                  xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 10, fontFamily: typography.fontFamily.medium }}
                  textFontSize={10}
                  textColor={colors.textPrimary}
                  initialSpacing={20}
                  endSpacing={20}
                  yAxisOffset={Math.max(0, Math.min(...chartData.map(d => d.value)) - 5)}
                />
              </View>
            ) : (
              <View style={styles.chartPlaceholder}>
                <Scale color={colors.textSecondary} size={32} style={{ marginBottom: 10 }} />
                <Text style={styles.emptyText}>Añade al menos 2 registros para ver tu evolución gráfica.</Text>
              </View>
            )}
          </View>

          {/* Add Log Section */}
          <View style={styles.addCard}>
            <Text style={styles.sectionTitle}>Registrar hoy</Text>
            <View style={styles.inputRow}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder={`Ej. ${isLbs ? '160' : '75.5'}`}
                  placeholderTextColor={colors.textSecondary}
                  value={weightInput}
                  onChangeText={setWeightInput}
                  keyboardType="numeric"
                />
                <Text style={styles.unitText}>{unitLabel}</Text>
              </View>
              <TouchableOpacity 
                style={styles.addButton} 
                onPress={handleAdd}
                disabled={isAdding || !weightInput}
              >
                {isAdding ? <ActivityIndicator color={colors.background} size="small" /> : <Plus color={colors.background} size={24} />}
              </TouchableOpacity>
            </View>
          </View>

          {/* History Section */}
          <Text style={[styles.sectionTitle, { marginLeft: 4, marginTop: 10 }]}>Historial</Text>
          {logs && logs.length > 0 ? (
            <View style={styles.historyList}>
              {/* Show in reverse order (newest first) */}
              {[...logs].reverse().map((log: any, index: number) => (
                <MotiView
                  key={log.id}
                  from={{ opacity: 0, translateY: 10 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ delay: index * 40 }}
                  style={styles.historyRow}
                >
                  <View style={styles.historyIconBg}>
                    <Scale color={colors.textPrimary} size={16} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyValue}>
                      {displayWeight(log.weight_kg).toFixed(1)} {unitLabel}
                    </Text>
                    <Text style={styles.historyDate}>
                      {new Date(log.logged_at).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDelete(log.id)} style={styles.deleteBtn}>
                    <Trash2 color={colors.destructive} size={18} />
                  </TouchableOpacity>
                </MotiView>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>No hay registros todavía.</Text>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center', alignItems: 'center',
  },
  title: {
    flex: 1, textAlign: 'center',
    fontFamily: typography.fontFamily.semibold,
    fontSize: 18, color: colors.textPrimary, letterSpacing: 0.2,
  },
  scroll: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 60 },

  sectionTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 16, color: colors.textPrimary,
    marginBottom: 16,
  },
  
  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: 20, padding: 20, marginBottom: 24,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
  },
  chartPlaceholder: {
    height: 180, width: '100%',
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12, padding: 20,
  },
  emptyText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 13, color: colors.textSecondary,
    textAlign: 'center',
  },

  addCard: {
    backgroundColor: colors.surface,
    borderRadius: 20, padding: 20, marginBottom: 32,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  inputRow: { flexDirection: 'row', gap: 12 },
  inputWrapper: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 16,
  },
  input: {
    flex: 1, height: 56,
    color: colors.textPrimary,
    fontFamily: typography.fontFamily.semibold, fontSize: 18,
  },
  unitText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 14, color: colors.textSecondary, marginLeft: 8,
  },
  addButton: {
    width: 56, height: 56, borderRadius: 14,
    backgroundColor: colors.accent,
    justifyContent: 'center', alignItems: 'center',
  },

  historyList: { gap: 10 },
  historyRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16, borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  historyIconBg: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 14,
  },
  historyValue: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 16, color: colors.textPrimary, marginBottom: 2,
  },
  historyDate: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 12, color: colors.textSecondary, textTransform: 'capitalize',
  },
  deleteBtn: { padding: 8 },
});
