import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Activity, ChevronRight } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { useRouter } from 'expo-router';

export function RecentWorkoutsMini({ recentWorkouts }: { recentWorkouts: any[] | undefined }) {
  const router = useRouter();

  if (!recentWorkouts || recentWorkouts.length === 0) {
    return (
      <View style={styles.recentEmpty}>
        <Text style={styles.recentEmptyText}>Aún no has registrado entrenamientos.</Text>
      </View>
    );
  }

  return (
    <View style={styles.recentList}>
      {recentWorkouts.map((workout: any) => (
        <TouchableOpacity 
          key={workout.id} 
          style={styles.recentCard}
          onPress={() => router.push(`/entrenos/${workout.id}`)}
          activeOpacity={0.7}
        >
          <View style={styles.recentIconBg}>
            <Activity color={colors.accent} size={16} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.recentName} numberOfLines={1}>{workout.name}</Text>
            <Text style={styles.recentDate}>
              {new Date(workout.started_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
            </Text>
          </View>
          <ChevronRight color={colors.textSecondary} size={16} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  recentList: { gap: 10 },
  recentCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 14, borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  recentIconBg: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(180,240,60,0.1)',
    justifyContent: 'center', alignItems: 'center',
    marginRight: 12,
  },
  recentName: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 14, color: colors.textPrimary,
    marginBottom: 2,
  },
  recentDate: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 12, color: colors.textSecondary,
  },
  recentEmpty: {
    backgroundColor: colors.surface,
    padding: 24, borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
  },
  recentEmptyText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 13, color: colors.textSecondary,
  },
});
