import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

export function PerfilStats({ statsLoading, totalWorkouts, currentStreak, longestStreak }: any) {
  return (
    <View style={styles.statsCard}>
      <View style={styles.statItem}>
        <Text style={styles.statNumber} adjustsFontSizeToFit numberOfLines={1}>
          {statsLoading ? '-' : totalWorkouts}
        </Text>
        <Text style={styles.statLabel}>Entrenos</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={[styles.statNumber, { color: colors.accent }]} adjustsFontSizeToFit numberOfLines={1}>
          {statsLoading ? '-' : currentStreak}
        </Text>
        <Text style={styles.statLabel}>Racha actual</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={styles.statNumber} adjustsFontSizeToFit numberOfLines={1}>
          {statsLoading ? '-' : longestStreak}
        </Text>
        <Text style={styles.statLabel}>Racha máx.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statsCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 4,
  },
  statNumber: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 26,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
