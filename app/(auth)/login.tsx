import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { customAlert as Alert } from '../../store/alert-store';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView, AnimatePresence, MotiText } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [emailError, setEmailError] = useState(false);
  
  // Para los efectos de focus (Glassmorphism + Border highlight)
  const [focusedInput, setFocusedInput] = useState<'email' | 'password' | null>(null);

  const handleLogin = async () => {
    setEmailError(false);
    setErrorMsg('');
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let hasError = false;

    if (!email || !emailRegex.test(email)) {
      setEmailError(true);
      hasError = true;
    }
    if (!password) {
      setErrorMsg('Por favor, ingresa tu contraseña.');
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      setLoading(false);
      if (error.message.includes('Invalid login credentials')) {
        setErrorMsg('Correo o contraseña incorrectos.');
      } else if (error.message.includes('Email not confirmed')) {
        Alert.alert(
          'Cuenta no verificada',
          'Revisa tu bandeja de entrada (o carpeta de spam) y haz clic en el enlace de confirmación.'
        );
      } else {
        setErrorMsg('Ocurrió un error al iniciar sesión. Inténtalo de nuevo.');
      }
      return;
    }

    if (data?.session && data.user) {
      try {
        const pendingStr = await AsyncStorage.getItem('pending_profile');
        if (pendingStr) {
          const profileData = JSON.parse(pendingStr);
          await supabase
            .from('profiles')
            .update({
              full_name: profileData.fullName,
              username: profileData.username,
              birth_date: profileData.birthDate,
              goal: profileData.goal,
              experience_level: profileData.level,
            })
            .eq('id', data.user.id);
          
          await AsyncStorage.removeItem('pending_profile');
        }
      } catch (e) {
        console.error('Error aplicando perfil pendiente', e);
      }
    }
    
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setErrorMsg('');
    try {
      const redirectUrl = makeRedirectUri({ scheme: 'bitacorafitapp' });
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) throw error;
      if (data?.url) {
        const res = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
        if (res?.type === 'success' && res.url) {
          const { params, errorCode } = QueryParams.getQueryParams(res.url);
          if (errorCode) throw new Error(errorCode);
          
          if (params?.access_token && params?.refresh_token) {
            await supabase.auth.setSession({
              access_token: params.access_token,
              refresh_token: params.refresh_token,
            });
          }
        }
      }
    } catch (e) {
      setErrorMsg('Ocurrió un error con Google.');
    } finally {
      setGoogleLoading(false);
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
        transition={{ type: 'timing', duration: 500, delay: 100 }}
        style={styles.form}
      >
        <Text style={styles.title}>Inicio de Sesión</Text>
        <Text style={styles.formSubtitle}>Inicia sesión para continuar</Text>
        
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
            onChangeText={(val) => { setEmail(val); setEmailError(false); }}
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
        
        <View style={[
          styles.inputContainer, 
          focusedInput === 'password' && styles.inputFocused,
          !!errorMsg && styles.inputError
        ]}>
          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            placeholderTextColor={colors.textSecondary}
            value={password}
            onChangeText={(val) => { setPassword(val); setErrorMsg(''); }}
            secureTextEntry
            onFocus={() => setFocusedInput('password')}
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
          style={styles.forgotPassword} 
          onPress={() => router.push('/(auth)/recover')}
          activeOpacity={0.7}
        >
          <Text style={styles.forgotPasswordText}>¿Has olvidado tu contraseña?</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.primaryButton} 
          onPress={handleLogin}
          disabled={loading || googleLoading}
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
              <Text style={styles.primaryButtonText}>Iniciar sesión</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>o entra con</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity 
          style={styles.googleButton} 
          onPress={handleGoogleLogin}
          disabled={loading || googleLoading}
          activeOpacity={0.7}
        >
          {googleLoading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <>
              <Image 
                source={require('../../assets/images/google-logo.png')} 
                style={styles.googleIcon} 
              />
              <Text style={styles.googleButtonText}>Continuar con Google</Text>
            </>
          )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  backButton: {
    marginRight: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    ...typography.scale.display,
    fontSize: 32,
    color: colors.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  form: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 16,
    paddingBottom: 40,
  },
  formSubtitle: {
    fontFamily: typography.fontFamily.regular,
    ...typography.scale.body,
    color: colors.textSecondary,
    marginBottom: 8,
    textAlign: 'center',
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 8,
  },
  forgotPasswordText: {
    fontFamily: typography.fontFamily.medium,
    ...typography.scale.caption,
    color: colors.accent,
  },
  primaryButton: {
    height: 60,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
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
  googleButton: {
    backgroundColor: '#FFFFFF',
    height: 60,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  googleButtonText: {
    fontFamily: typography.fontFamily.bold,
    ...typography.scale.body,
    color: '#000000',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dividerText: {
    color: colors.textSecondary,
    paddingHorizontal: 16,
    fontFamily: typography.fontFamily.medium,
    ...typography.scale.caption,
  },
  errorText: {
    color: colors.destructive,
    fontFamily: typography.fontFamily.medium,
    ...typography.scale.caption,
  },
  validationErrorText: {
    color: colors.destructive,
    fontFamily: typography.fontFamily.medium,
    ...typography.scale.caption,
  },
});
