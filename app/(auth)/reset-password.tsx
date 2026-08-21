import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, } from 'react-native';
import { customAlert as Alert } from '../../store/alert-store';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { KeyRound } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView, AnimatePresence, MotiText } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../hooks/useAuth';

export default function ResetPasswordScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  // The user should already have a session thanks to the deep link interceptor in _layout.tsx
  const { session } = useAuth();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [focusedInput, setFocusedInput] = useState<'password' | 'confirm' | null>(null);

  const handleReset = async () => {
    setErrorMsg('');
    
    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    
    if (password !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }

    if (!session) {
      setErrorMsg('No tienes autorización para cambiar la contraseña. Vuelve a iniciar sesión.');
      return;
    }

    setLoading(true);
    
    const { error } = await supabase.auth.updateUser({
      password: password
    });
    
    setLoading(false);

    if (error) {
      setErrorMsg('No se pudo actualizar la contraseña. Inténtalo de nuevo.');
    } else {
      Alert.alert(
        '¡Contraseña actualizada!',
        'Tu contraseña se ha cambiado correctamente.',
        [{ text: 'Entrar', onPress: () => router.replace('/(tabs)') }]
      );
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <MotiView 
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        style={[styles.form, { paddingTop: insets.top + 40 }]}
      >
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <KeyRound color={colors.accent} size={32} />
          </View>
        </View>

        <Text style={styles.title}>Nueva Contraseña</Text>
        <Text style={styles.formSubtitle}>
          Crea una nueva contraseña segura para tu cuenta.
        </Text>
        
        <View style={[
          styles.inputContainer, 
          focusedInput === 'password' && styles.inputFocused,
        ]}>
          <TextInput
            style={styles.input}
            placeholder="Nueva contraseña"
            placeholderTextColor={colors.textSecondary}
            value={password}
            onChangeText={(val) => { setPassword(val); setErrorMsg(''); }}
            secureTextEntry
            onFocus={() => setFocusedInput('password')}
            onBlur={() => setFocusedInput(null)}
          />
        </View>

        <View style={[
          styles.inputContainer, 
          { marginTop: 16 },
          focusedInput === 'confirm' && styles.inputFocused,
        ]}>
          <TextInput
            style={styles.input}
            placeholder="Repetir contraseña"
            placeholderTextColor={colors.textSecondary}
            value={confirmPassword}
            onChangeText={(val) => { setConfirmPassword(val); setErrorMsg(''); }}
            secureTextEntry
            onFocus={() => setFocusedInput('confirm')}
            onBlur={() => setFocusedInput(null)}
          />
        </View>

        <AnimatePresence>
          {!!errorMsg && (
            <MotiText 
              from={{ opacity: 0, height: 0, translateY: -10 }}
              animate={{ opacity: 1, height: 'auto', translateY: 0 }}
              exit={{ opacity: 0, height: 0, translateY: -10 }}
              style={styles.errorText}
            >
              {errorMsg}
            </MotiText>
          )}
        </AnimatePresence>

        <TouchableOpacity 
          style={styles.primaryButton} 
          onPress={handleReset}
          disabled={loading}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={loading ? ['#888', '#666'] : [colors.accent, '#90D41C']}
            style={styles.primaryButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {loading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={styles.primaryButtonText}>Guardar contraseña</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </MotiView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  form: {
    flex: 1,
    paddingHorizontal: 24,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(180, 240, 60, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(180, 240, 60, 0.3)',
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    ...typography.scale.display,
    fontSize: 28,
    color: colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  formSubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 22,
  },
  inputContainer: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  inputFocused: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(180, 240, 60, 0.05)',
  },
  input: {
    color: colors.textPrimary,
    height: 60,
    paddingHorizontal: 16,
    fontFamily: typography.fontFamily.regular,
    ...typography.scale.body,
  },
  primaryButton: {
    height: 60,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 24,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontFamily: typography.fontFamily.bold,
    ...typography.scale.title,
    fontSize: 18,
    color: colors.background,
  },
  errorText: {
    color: colors.destructive,
    fontFamily: typography.fontFamily.medium,
    ...typography.scale.caption,
    marginTop: 8,
  },
});
