import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { ArrowLeft } from 'lucide-react-native';

export default function EntrenarScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color={colors.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Empezar Entreno</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.text}>Esta pantalla está en construcción.</Text>
        <Text style={styles.subtext}>Aquí elegiremos una rutina o empezaremos un entreno libre.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    ...typography.scale.title,
    color: colors.textPrimary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  text: {
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    ...typography.scale.title,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtext: {
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    ...typography.scale.body,
    textAlign: 'center',
  },
});
