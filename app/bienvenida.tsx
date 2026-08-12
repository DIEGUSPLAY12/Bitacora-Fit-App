import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { Dumbbell } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function BienvenidaScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 24 }]}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Dumbbell color={colors.accent} size={64} />
          <Text style={styles.wordmark}>Bitácora Fit</Text>
          <Text style={styles.tagline}>Tu entrenamiento, bajo control</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push('/(auth)/register')}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>Empezar ahora</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push('/(auth)/login')}
        >
          <Text style={styles.secondaryButtonText}>
            ¿Ya tienes cuenta? <Text style={styles.linkText}>Inicia sesión</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  wordmark: {
    fontFamily: typography.fontFamily.bold,
    ...typography.scale.display,
    color: colors.textPrimary,
    marginTop: 16,
    textAlign: 'center',
  },
  tagline: {
    fontFamily: typography.fontFamily.regular,
    ...typography.scale.body,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  footer: {
    width: '100%',
    paddingBottom: 24,
    gap: 16,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    height: 56,
    borderRadius: 8, // radio de 8px según requerimiento
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontFamily: typography.fontFamily.bold,
    ...typography.scale.body,
    color: colors.background, // texto oscuro sobre verde lima
  },
  secondaryButton: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontFamily: typography.fontFamily.regular,
    ...typography.scale.body,
    color: colors.textSecondary,
  },
  linkText: {
    fontFamily: typography.fontFamily.bold,
    color: colors.accent,
  },
});
