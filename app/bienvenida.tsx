import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView, MotiText } from 'moti';
import { Image } from 'expo-image';

const { width, height } = Dimensions.get('window');

export default function BienvenidaScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.background, '#1A2312', colors.background]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Fondo degradado principal */}

      <View style={[styles.content, { paddingTop: insets.top + 24 }]}>
        <View style={styles.logoContainer}>
          <MotiView
            from={{ opacity: 0, translateY: -30 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', delay: 200, damping: 15 }}
          >
            <View style={[styles.iconWrapper, { backgroundColor: 'transparent', shadowColor: 'transparent', elevation: 0, transform: [] }]}>
              <Image 
                source={require('../assets/images/logo.png')} 
                style={{ width: 140, height: 140, borderRadius: 32 }} 
                contentFit="contain" 
              />
            </View>
          </MotiView>
          
          <MotiText 
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', delay: 400, duration: 600 }}
            style={styles.wordmark}
          >
            BítacoraFit
          </MotiText>
          
          <MotiText 
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', delay: 700, duration: 600 }}
            style={styles.tagline}
          >
            Tu entrenamiento, bajo control
          </MotiText>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        <MotiView
          from={{ opacity: 0, translateY: 50 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', delay: 800, damping: 14 }}
        >
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/(auth)/register')}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[colors.accent, '#90D41C']}
              style={styles.primaryButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.primaryButtonText}>Empezar ahora</Text>
            </LinearGradient>
          </TouchableOpacity>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 30 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', delay: 1000, damping: 14 }}
        >
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/(auth)/login')}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryButtonText}>
              ¿Ya tienes cuenta? <Text style={styles.linkText}>Inicia sesión</Text>
            </Text>
          </TouchableOpacity>
        </MotiView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
  },
  iconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 40,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
    transform: [{ rotate: '-10deg' }]
  },
  wordmark: {
    fontFamily: typography.fontFamily.bold,
    ...typography.scale.display,
    fontSize: 48,
    lineHeight: 56,
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -1,
  },
  tagline: {
    fontFamily: typography.fontFamily.medium,
    ...typography.scale.title,
    fontSize: 20,
    color: colors.textSecondary,
    marginTop: 12,
    textAlign: 'center',
  },
  footer: {
    width: '100%',
    paddingHorizontal: 24,
    gap: 16,
  },
  primaryButton: {
    height: 64,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontFamily: typography.fontFamily.bold,
    ...typography.scale.title,
    fontSize: 20,
    color: colors.background,
  },
  secondaryButton: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  secondaryButtonText: {
    fontFamily: typography.fontFamily.regular,
    ...typography.scale.body,
    fontSize: 16,
    color: colors.textSecondary,
  },
  linkText: {
    fontFamily: typography.fontFamily.bold,
    color: colors.accent,
  },
});
