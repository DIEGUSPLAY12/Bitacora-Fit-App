import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { ArrowLeft, KeyRound } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { makeRedirectUri } from 'expo-auth-session';
import { MotiView, AnimatePresence, MotiText } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';

export default function RecoverScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [focusedInput, setFocusedInput] = useState<'email' | null>(null);

  const handleRecover = async () => {
    setEmailError(false);
    setErrorMsg('');
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setEmailError(true);
      return;
    }

    setLoading(true);
    
    const redirectUrl = makeRedirectUri({ scheme: 'bitacorafitapp', path: 'reset-password' });
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    
    setLoading(false);

    if (error) {
      if (error.message.includes('rate limit')) {
        setErrorMsg('Has pedido demasiados correos. Espera unos minutos.');
      } else {
        setErrorMsg('Ocurrió un error al enviar el correo. Inténtalo de nuevo.');
      }
    } else {
      setSuccess(true);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeft color={colors.textPrimary} size={28} />
        </TouchableOpacity>
      </View>

      <MotiView 
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        style={styles.form}
      >
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <KeyRound color={colors.accent} size={32} />
          </View>
        </View>

        <Text style={styles.title}>Recuperar Contraseña</Text>
        
        {success ? (
          <MotiView 
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={styles.successContainer}
          >
            <Text style={styles.successText}>
              Te hemos enviado un correo a <Text style={{ fontFamily: typography.fontFamily.bold }}>{email}</Text>. 
              Revisa tu bandeja de entrada y pulsa en el enlace para crear tu nueva contraseña.
            </Text>
            <TouchableOpacity 
              style={[styles.primaryButton, { marginTop: 32 }]} 
              onPress={() => router.back()}
              activeOpacity={0.9}
            >
              <LinearGradient colors={[colors.accent, '#90D41C']} style={styles.primaryButtonGradient}>
                <Text style={styles.primaryButtonText}>Volver al Inicio de Sesión</Text>
              </LinearGradient>
            </TouchableOpacity>
          </MotiView>
        ) : (
          <>
            <Text style={styles.formSubtitle}>
              Introduce el correo asociado a tu cuenta y te enviaremos instrucciones para recuperarla.
            </Text>
            
            <View style={[
              styles.inputContainer, 
              focusedInput === 'email' && styles.inputFocused,
              emailError && styles.inputError
            ]}>
              <TextInput
                style={styles.input}
                placeholder="Correo electrónico"
                placeholderTextColor={colors.textSecondary}
                value={email}
                onChangeText={(val) => { setEmail(val); setEmailError(false); setErrorMsg(''); }}
                autoCapitalize="none"
                keyboardType="email-address"
                onFocus={() => setFocusedInput('email')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>
            <AnimatePresence>
              {emailError && (
                <MotiText 
                  from={{ opacity: 0, height: 0, translateY: -10 }}
                  animate={{ opacity: 1, height: 'auto', translateY: 0 }}
                  exit={{ opacity: 0, height: 0, translateY: -10 }}
                  style={styles.validationErrorText}
                >
                  Introduce un correo válido
                </MotiText>
              )}
            </AnimatePresence>

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
              onPress={handleRecover}
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
                  <Text style={styles.primaryButtonText}>Enviar correo</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}
      </MotiView>
    </KeyboardAvoidingView>
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
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  form: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
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
  inputError: {
    borderColor: colors.destructive,
    backgroundColor: 'rgba(207, 102, 121, 0.05)',
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
  validationErrorText: {
    color: colors.destructive,
    fontFamily: typography.fontFamily.medium,
    ...typography.scale.caption,
    marginTop: 8,
  },
  successContainer: {
    marginTop: 16,
  },
  successText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  }
});
