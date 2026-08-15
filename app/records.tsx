import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { usePersonalRecords } from '../hooks/usePersonalRecords';
import { useProfile } from '../hooks/useProfile';
import { ArrowLeft, Trophy, Dumbbell } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';

export default function RecordsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const { data: records, isLoading } = usePersonalRecords();
  const { data: profile } = useProfile();
  
  const isLbs = profile?.weight_unit === 'lbs';
  const displayWeight = (kg: number) => isLbs ? kg * 2.20462 : kg;
  const unitLabel = isLbs ? 'lbs' : 'kg';

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeft color={colors.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Récords Personales (PRs)</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} size="large" />
        ) : records && records.length > 0 ? (
          <View style={styles.list}>
            {records.map((record, index) => (
              <MotiView
                key={record.exercise.id}
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: index * 40 }}
                style={styles.card}
              >
                <View style={styles.iconContainer}>
                  {index === 0 || index === 1 || index === 2 ? (
                    <Trophy color={index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32'} size={24} />
                  ) : (
                    <Dumbbell color={colors.textSecondary} size={20} />
                  )}
                </View>
                
                <View style={styles.info}>
                  <Text style={styles.exerciseName} numberOfLines={1}>{record.exercise.name}</Text>
                  <Text style={styles.muscleGroup}>{record.exercise.muscle_group}</Text>
                </View>

                <View style={styles.stats}>
                  <Text style={styles.weight}>{displayWeight(record.maxWeight).toFixed(1)} {unitLabel}</Text>
                  <Text style={styles.reps}>x {record.maxRepsAtWeight} reps</Text>
                </View>
              </MotiView>
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Trophy color={colors.textSecondary} size={48} style={{ marginBottom: 16 }} />
            <Text style={styles.emptyTitle}>Aún no hay récords</Text>
            <Text style={styles.emptyText}>Registra entrenamientos con peso para ver tus máximos históricos aquí.</Text>
          </View>
        )}
      </ScrollView>
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

  list: { gap: 12 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16, borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  iconContainer: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 14,
  },
  info: { flex: 1 },
  exerciseName: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 16, color: colors.textPrimary, marginBottom: 4, textTransform: 'capitalize'
  },
  muscleGroup: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 12, color: colors.textSecondary, textTransform: 'uppercase'
  },
  stats: { alignItems: 'flex-end', marginLeft: 12 },
  weight: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 18, color: colors.accent, marginBottom: 2,
  },
  reps: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 12, color: colors.textSecondary,
  },

  emptyCard: {
    backgroundColor: colors.surface,
    padding: 32, borderRadius: 24,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', marginTop: 20,
  },
  emptyTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 18, color: colors.textPrimary, marginBottom: 8,
  },
  emptyText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 22,
  },
});
