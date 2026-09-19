import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { typography, rs } from '../theme/typography';

export const ExerciseHeader = ({ index, name, onRemove }: { index: number, name: string, onRemove?: () => void }) => (
  <View style={styles.exerciseHeader}>
    <View style={styles.titleContainer}>
      <View style={styles.indexBadge}>
        <Text style={styles.indexText}>{index + 1}</Text>
      </View>
      <Text style={styles.exerciseTitle} numberOfLines={2}>{name}</Text>
    </View>
    {onRemove && (
      <TouchableOpacity onPress={onRemove} style={styles.trashButton}>
        <Trash2 color={'rgba(255, 255, 255, 0.4)'} size={17} />
      </TouchableOpacity>
    )}
  </View>
);

export const TableHeader = ({ showCheck = true }: { showCheck?: boolean }) => (
  <View style={styles.tableHeader}>
    <Text style={[styles.columnHeader, styles.colSet]}>SET</Text>
    <Text style={[styles.columnHeader, styles.colKg]}>KG</Text>
    <Text style={[styles.columnHeader, styles.colReps]}>REPS</Text>
    {showCheck ? (
      <Text style={[styles.columnHeader, styles.colCheck]}>{/* Check */}</Text>
    ) : (
      <View style={styles.colCheck} />
    )}
  </View>
);

const styles = StyleSheet.create({
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  indexBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  indexText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontFamily: typography.fontFamily.bold,
  },
  exerciseTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontFamily: typography.fontFamily.semibold,
    flex: 1,
    paddingRight: 8,
  },
  trashButton: {
    padding: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  columnHeader: {
    color: colors.textSecondary,
    fontSize: 11,
    fontFamily: typography.fontFamily.medium,
  },
  colSet: { width: 40, textAlign: 'center' },
  colKg: { flex: 1, textAlign: 'center' },
  colReps: { flex: 1, textAlign: 'center' },
  colCheck: { width: 44 },
});
