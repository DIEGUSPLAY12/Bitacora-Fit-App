import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useAlertStore } from '../store/alert-store';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { MotiView, AnimatePresence } from 'moti';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

export function CustomAlert() {
  const { visible, title, message, buttons, hide } = useAlertStore();

  if (!visible) return null;

  // Si no hay botones proporcionados, agregamos un botón de 'OK' por defecto
  const alertButtons = buttons && buttons.length > 0 
    ? buttons 
    : [{ text: 'OK', style: 'default', onPress: () => {} }];

  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
        
        <MotiView
          from={{ opacity: 0, scale: 0.9, translateY: 15 }}
          animate={{ opacity: 1, scale: 1, translateY: 0 }}
          exit={{ opacity: 0, scale: 0.9, translateY: 15 }}
          transition={{ type: 'timing', duration: 200 }}
          style={styles.alertBox}
        >
          {/* Subtle glow border effect */}
          <LinearGradient
            colors={['rgba(255,255,255,0.1)', 'transparent']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            pointerEvents="none"
          />

          <View style={styles.content}>
            <Text style={styles.title}>{title}</Text>
            {!!message && <Text style={styles.message}>{message}</Text>}
          </View>

          <View style={styles.buttonContainer}>
            {alertButtons.map((btn, index) => {
              const isDefault = btn.style === 'default' || !btn.style;
              const isDestructive = btn.style === 'destructive';
              const isCancel = btn.style === 'cancel';

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    isDefault && styles.buttonDefault,
                    isDestructive && styles.buttonDestructive,
                    isCancel && styles.buttonCancel,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => {
                    hide();
                    if (btn.onPress) btn.onPress();
                  }}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      isDefault && styles.buttonTextDefault,
                      isDestructive && styles.buttonTextDestructive,
                      isCancel && styles.buttonTextCancel,
                    ]}
                  >
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </MotiView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  alertBox: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  content: {
    padding: 24,
    paddingBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 20,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 10,
  },
  button: {
    width: '100%',
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 15,
  },
  // Default (Accent Green)
  buttonDefault: {
    backgroundColor: colors.accent,
  },
  buttonTextDefault: {
    color: colors.background,
  },
  // Destructive (Red)
  buttonDestructive: {
    backgroundColor: 'rgba(207, 102, 121, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(207, 102, 121, 0.3)',
  },
  buttonTextDestructive: {
    color: colors.destructive,
  },
  // Cancel (Subtle)
  buttonCancel: {
    backgroundColor: 'transparent',
  },
  buttonTextCancel: {
    color: colors.textSecondary,
  },
});
