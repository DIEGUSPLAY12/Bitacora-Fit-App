import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Image, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { ArrowLeft, Check, User, AtSign, Calendar, ArrowRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView, AnimatePresence, MotiText } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

WebBrowser.maybeCompleteAuthSession();

// Types for Step 3
type Goal = 'muscle' | 'weight_loss' | 'endurance' | 'wellness';
type Level = 'beginner' | 'intermediate' | 'advanced';

const GOALS: { value: Goal; label: string; emoji: string; desc: string }[] = [
  { value: 'muscle', label: 'Ganar músculo', emoji: '💪', desc: 'Construir masa muscular y fuerza' },
  { value: 'weight_loss', label: 'Perder peso', emoji: '🔥', desc: 'Reducir grasa y mejorar composición' },
  { value: 'endurance', label: 'Resistencia', emoji: '🏃', desc: 'Mejorar capacidad cardiovascular' },
  { value: 'wellness', label: 'Bienestar', emoji: '🧘', desc: 'Salud general y calidad de vida' },
];

const LEVELS: { value: Level; label: string; desc: string }[] = [
  { value: 'beginner', label: 'Principiante', desc: 'Menos de 1 año entrenando' },
  { value: 'intermediate', label: 'Intermedio', desc: '1–3 años de experiencia' },
  { value: 'advanced', label: 'Avanzado', desc: 'Más de 3 años de entrenamiento' },
];

function formatDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function parseDateToISO(ddmmyyyy: string): string | null {
  const parts = ddmmyyyy.split('/');
  if (parts.length !== 3 || parts[2].length !== 4) return null;
  const [dd, mm, yyyy] = parts;
  const d = parseInt(dd), m = parseInt(mm) - 1, y = parseInt(yyyy);
  const date = new Date(y, m, d);
  if (isNaN(date.getTime()) || date.getFullYear() !== y) return null;
  const minAge = new Date();
  minAge.setFullYear(minAge.getFullYear() - 13);
  if (date > minAge) return null;
  return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
}

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Wizard state
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Step 1: Account
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  // Step 2: Identity
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [birthDate, setBirthDate] = useState('');

  // Step 3: Goals
  const [goal, setGoal] = useState<Goal | null>(null);
  const [level, setLevel] = useState<Level | null>(null);

  const passwordReqs = [
    { id: 'length', text: 'Mínimo 7 caracteres', regex: /.{7,}/ },
    { id: 'uppercase', text: 'Una mayúscula', regex: /[A-Z]/ },
    { id: 'lowercase', text: 'Una minúscula', regex: /[a-z]/ },
    { id: 'number', text: 'Un número', regex: /[0-9]/ },
  ];

  const handleNextStep1 = () => {
    setErrorMsg('');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setErrorMsg('Introduce un correo válido.');
      return;
    }
    const isPasswordValid = passwordReqs.every(req => req.regex.test(password));
    if (!isPasswordValid) {
      setErrorMsg('La contraseña no cumple los requisitos.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }
    setStep(2);
  };

  const handleNextStep2 = async () => {
    setErrorMsg('');
    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMsg('Introduce tu nombre completo.');
      return;
    }
    if (!username.trim() || username.trim().length < 3) {
      setErrorMsg('El alias debe tener al menos 3 caracteres.');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      setErrorMsg('El alias solo puede contener letras, números y guiones bajos (_).');
      return;
    }
    if (!parseDateToISO(birthDate)) {
      setErrorMsg('Fecha inválida o debes tener al menos 13 años.');
      return;
    }

    setLoading(true);
    // Check if username is taken
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.trim().toLowerCase())
      .maybeSingle();

    setLoading(false);

    if (error && error.code !== 'PGRST116') {
      setErrorMsg('Error al verificar disponibilidad del alias.');
      return;
    }

    if (data) {
      setErrorMsg('Este alias ya está en uso. Por favor, elige otro.');
      return;
    }

    setStep(3);
  };

  const handleRegister = async () => {
    setErrorMsg('');
    if (!goal || !level) {
      setErrorMsg('Selecciona tu objetivo y nivel.');
      return;
    }

    setLoading(true);
    
    // 1. Sign Up User
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setLoading(false);
      if (authError.message.includes('User already registered') || authError.message.includes('already exists')) {
        setErrorMsg('Este correo ya está registrado.');
        setStep(1); // Go back to step 1 to fix email
      } else {
        setErrorMsg('Ocurrió un error al registrarse: ' + authError.message);
      }
      return;
    }

    if (!authData.user) {
      setLoading(false);
      setErrorMsg('Ocurrió un error inesperado al registrarse.');
      return;
    }

    // Check if email confirmation is required (session is null)
    if (!authData.session) {
      const pendingProfile = {
        fullName: fullName.trim(),
        username: username.trim().toLowerCase(),
        birthDate: parseDateToISO(birthDate),
        goal: goal,
        level: level,
      };
      await AsyncStorage.setItem('pending_profile', JSON.stringify(pendingProfile));
      
      setLoading(false);
      Alert.alert(
        '¡Casi listo!',
        'Hemos enviado un enlace de confirmación a tu correo. Por favor, haz clic en él para verificar tu cuenta antes de iniciar sesión.'
      );
      router.replace('/(auth)/login');
      return;
    }

    // If session is present (email confirmation disabled in Supabase), update profile immediately
    // Wait a moment for trigger to create profile, then update profile
    setTimeout(async () => {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          username: username.trim().toLowerCase(),
          birth_date: parseDateToISO(birthDate),
          goal: goal,
          experience_level: level,
        })
        .eq('id', authData.user!.id);

      setLoading(false);

      if (profileError) {
        Alert.alert('Registro completado con advertencias', 'Tu cuenta fue creada pero hubo un problema guardando tus detalles. Puedes editarlos luego en tu perfil.');
      }
      // Redirigido automáticamente por _layout.tsx
    }, 1000);
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

  // Render Steps
  const renderStep1 = () => (
    <MotiView 
      from={{ opacity: 0, translateX: 20 }}
      animate={{ opacity: 1, translateX: 0 }}
      style={styles.form}
    >
      <Text style={styles.title}>Crear cuenta</Text>
      <Text style={styles.formSubtitle}>Paso 1 de 3: Credenciales</Text>
      
      <View style={[styles.inputContainer, focusedInput === 'email' && styles.inputFocused]}>
        <TextInput
          style={styles.input}
          placeholder="Correo electrónico"
          placeholderTextColor={colors.textSecondary}
          value={email}
          onChangeText={(val) => { setEmail(val); setErrorMsg(''); }}
          autoCapitalize="none"
          keyboardType="email-address"
          onFocus={() => setFocusedInput('email')}
          onBlur={() => setFocusedInput(null)}
        />
      </View>

      <View style={[styles.inputContainer, focusedInput === 'password' && styles.inputFocused]}>
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
      
      <View style={styles.reqsContainer}>
        {passwordReqs.map((req, index) => {
          const isMet = req.regex.test(password);
          return (
            <View key={req.id} style={[styles.reqRow, { opacity: password.length === 0 ? 0.5 : 1 }]}>
              <View style={[styles.reqIconWrapper, { backgroundColor: isMet ? colors.accent : 'rgba(255,255,255,0.1)' }]}>
                {isMet ? <Check color={colors.background} size={10} strokeWidth={4} /> : <View style={styles.reqDot} />}
              </View>
              <Text style={[styles.reqText, { color: isMet ? colors.textPrimary : colors.textSecondary }]}>
                {req.text}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={[styles.inputContainer, focusedInput === 'confirmPassword' && styles.inputFocused, { marginTop: 8 }]}>
        <TextInput
          style={styles.input}
          placeholder="Repetir contraseña"
          placeholderTextColor={colors.textSecondary}
          value={confirmPassword}
          onChangeText={(val) => { setConfirmPassword(val); setErrorMsg(''); }}
          secureTextEntry
          onFocus={() => setFocusedInput('confirmPassword')}
          onBlur={() => setFocusedInput(null)}
        />
      </View>

      {!!errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

      <TouchableOpacity style={styles.primaryButton} onPress={handleNextStep1} activeOpacity={0.9}>
        <LinearGradient colors={[colors.accent, '#90D41C']} style={styles.primaryButtonGradient}>
          <Text style={styles.primaryButtonText}>Siguiente paso</Text>
          <ArrowRight color={colors.background} size={20} style={{ marginLeft: 8 }} />
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>o entra con</Text>
        <View style={styles.dividerLine} />
      </View>

      <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin} disabled={googleLoading} activeOpacity={0.7}>
        {googleLoading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <>
            <Image source={require('../../assets/images/google-logo.png')} style={styles.googleIcon} />
            <Text style={styles.googleButtonText}>Continuar con Google</Text>
          </>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.loginLinkButton} onPress={() => router.back()} activeOpacity={0.7}>
        <Text style={styles.loginLinkText}>
          ¿Ya tienes cuenta? <Text style={styles.loginLinkTextBold}>Inicia sesión</Text>
        </Text>
      </TouchableOpacity>
    </MotiView>
  );

  const renderStep2 = () => (
    <MotiView 
      from={{ opacity: 0, translateX: 20 }}
      animate={{ opacity: 1, translateX: 0 }}
      style={styles.form}
    >
      <Text style={styles.title}>Identidad</Text>
      <Text style={styles.formSubtitle}>Paso 2 de 3: Cuéntanos sobre ti</Text>
      
      <View style={styles.fieldGroup}>
        <View style={styles.fieldLabel}>
          <User color={colors.accent} size={15} />
          <Text style={styles.labelText}>Nombre completo</Text>
        </View>
        <View style={[styles.inputContainer, focusedInput === 'name' && styles.inputFocused]}>
          <TextInput
            style={styles.input}
            placeholder="Tu nombre real"
            placeholderTextColor={colors.textSecondary}
            value={fullName}
            onChangeText={(v) => { setFullName(v); setErrorMsg(''); }}
            onFocus={() => setFocusedInput('name')}
            onBlur={() => setFocusedInput(null)}
            autoCapitalize="words"
          />
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <View style={styles.fieldLabel}>
          <AtSign color={colors.accent} size={15} />
          <Text style={styles.labelText}>Alias (Username)</Text>
        </View>
        <View style={[styles.inputContainer, focusedInput === 'username' && styles.inputFocused, { flexDirection: 'row', alignItems: 'center' }]}>
          <Text style={styles.atPrefix}>@</Text>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="tu_alias"
            placeholderTextColor={colors.textSecondary}
            value={username}
            onChangeText={(v) => { setUsername(v.toLowerCase()); setErrorMsg(''); }}
            onFocus={() => setFocusedInput('username')}
            onBlur={() => setFocusedInput(null)}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <View style={styles.fieldLabel}>
          <Calendar color={colors.accent} size={15} />
          <Text style={styles.labelText}>Fecha de nacimiento</Text>
        </View>
        <View style={[styles.inputContainer, focusedInput === 'date' && styles.inputFocused]}>
          <TextInput
            style={styles.input}
            placeholder="DD/MM/AAAA"
            placeholderTextColor={colors.textSecondary}
            value={birthDate}
            onChangeText={(v) => { setBirthDate(formatDateInput(v)); setErrorMsg(''); }}
            onFocus={() => setFocusedInput('date')}
            onBlur={() => setFocusedInput(null)}
            keyboardType="numeric"
          />
        </View>
      </View>

      {!!errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

      <TouchableOpacity style={styles.primaryButton} onPress={handleNextStep2} disabled={loading} activeOpacity={0.9}>
        <LinearGradient colors={loading ? ['#888', '#666'] : [colors.accent, '#90D41C']} style={styles.primaryButtonGradient}>
          {loading ? <ActivityIndicator color={colors.background} /> : (
            <>
              <Text style={styles.primaryButtonText}>Siguiente paso</Text>
              <ArrowRight color={colors.background} size={20} style={{ marginLeft: 8 }} />
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </MotiView>
  );

  const renderStep3 = () => (
    <MotiView 
      from={{ opacity: 0, translateX: 20 }}
      animate={{ opacity: 1, translateX: 0 }}
      style={styles.form}
    >
      <Text style={styles.title}>Metas y Nivel</Text>
      <Text style={styles.formSubtitle}>Paso 3 de 3: Tu perfil atlético</Text>
      
      <Text style={styles.sectionLabel}>¿Cuál es tu objetivo principal?</Text>
      <View style={styles.goalGrid}>
        {GOALS.map((g) => {
          const selected = goal === g.value;
          return (
            <TouchableOpacity
              key={g.value}
              style={[styles.goalCard, selected && styles.goalCardSelected]}
              onPress={() => { setGoal(g.value); setErrorMsg(''); }}
              activeOpacity={0.8}
            >
              {selected && <LinearGradient colors={['rgba(180,240,60,0.12)', 'rgba(180,240,60,0.04)']} style={StyleSheet.absoluteFill} />}
              <Text style={styles.goalEmoji}>{g.emoji}</Text>
              <Text style={[styles.goalLabel, selected && styles.goalLabelSelected]}>{g.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[styles.sectionLabel, { marginTop: 24 }]}>¿Cuál es tu nivel de experiencia?</Text>
      <View style={styles.levelList}>
        {LEVELS.map((l) => {
          const selected = level === l.value;
          return (
            <TouchableOpacity
              key={l.value}
              style={[styles.levelRow, selected && styles.levelRowSelected]}
              onPress={() => { setLevel(l.value); setErrorMsg(''); }}
              activeOpacity={0.8}
            >
              <View style={[styles.levelRadio, selected && styles.levelRadioSelected]}>
                {selected && <View style={styles.levelRadioDot} />}
              </View>
              <Text style={[styles.levelLabel, selected && styles.levelLabelSelected]}>{l.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {!!errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

      <TouchableOpacity style={styles.primaryButton} onPress={handleRegister} disabled={loading} activeOpacity={0.9}>
        <LinearGradient colors={loading ? ['#888', '#666'] : [colors.accent, '#90D41C']} style={styles.primaryButtonGradient}>
          {loading ? <ActivityIndicator color={colors.background} /> : <Text style={styles.primaryButtonText}>¡Crear cuenta y Empezar!</Text>}
        </LinearGradient>
      </TouchableOpacity>
    </MotiView>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => {
            if (step > 1) setStep(step - 1);
            else router.back();
          }} 
          activeOpacity={0.7}
        >
          <ArrowLeft color={colors.textPrimary} size={28} />
        </TouchableOpacity>
        
        {/* Progress indicator */}
        <View style={styles.stepIndicator}>
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <View style={[styles.stepDot, step >= s ? styles.stepDotActive : null]} />
              {s < 3 && <View style={[styles.stepLine, step > s ? styles.stepLineActive : null]} />}
            </React.Fragment>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  backButton: {
    marginRight: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepIndicator: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 44, // balance back button
  },
  stepDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  stepDotActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  stepLine: {
    flex: 1, height: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  stepLineActive: {
    backgroundColor: colors.accent,
  },
  scrollContent: {
    flexGrow: 1,
  },
  form: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 16,
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    ...typography.scale.display,
    fontSize: 32,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  formSubtitle: {
    fontFamily: typography.fontFamily.regular,
    ...typography.scale.body,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  inputContainer: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    marginBottom: 16,
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
  atPrefix: {
    fontFamily: typography.fontFamily.bold,
    color: colors.textSecondary,
    paddingLeft: 16,
    fontSize: 16,
  },
  primaryButton: {
    height: 60,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 16,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryButtonGradient: {
    flex: 1,
    flexDirection: 'row',
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
    marginTop: 4,
  },
  reqsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  reqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reqIconWrapper: {
    width: 16, height: 16, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
  },
  reqDot: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: colors.background,
  },
  reqText: {
    fontFamily: typography.fontFamily.medium,
    ...typography.scale.caption,
  },
  divider: {
    flexDirection: 'row', alignItems: 'center', marginVertical: 24,
  },
  dividerLine: {
    flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dividerText: {
    color: colors.textSecondary, paddingHorizontal: 16,
    fontFamily: typography.fontFamily.medium, ...typography.scale.caption,
  },
  googleButton: {
    backgroundColor: '#FFFFFF', height: 60, borderRadius: 16,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
  },
  googleIcon: { width: 24, height: 24, marginRight: 12 },
  googleButtonText: {
    fontFamily: typography.fontFamily.bold, ...typography.scale.body, color: '#000000',
  },
  loginLinkButton: {
    marginTop: 24, alignItems: 'center', paddingVertical: 8,
  },
  loginLinkText: {
    fontFamily: typography.fontFamily.regular, fontSize: 14, color: colors.textSecondary,
  },
  loginLinkTextBold: {
    fontFamily: typography.fontFamily.bold, color: colors.accent,
  },
  fieldGroup: { marginBottom: 12 },
  fieldLabel: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8,
  },
  labelText: {
    fontFamily: typography.fontFamily.semibold, fontSize: 13, color: colors.textPrimary,
  },
  sectionLabel: {
    fontFamily: typography.fontFamily.semibold, fontSize: 15, color: colors.textPrimary, marginBottom: 14,
  },
  goalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  goalCard: {
    flex: 1, minWidth: '45%',
    backgroundColor: colors.surface, borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden',
  },
  goalCardSelected: { borderColor: colors.accent },
  goalEmoji: { fontSize: 24, marginBottom: 8 },
  goalLabel: {
    fontFamily: typography.fontFamily.semibold, fontSize: 14, color: colors.textPrimary,
  },
  goalLabelSelected: { color: colors.accent },
  levelList: { gap: 10 },
  levelRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.surface, padding: 16, borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  levelRowSelected: { borderColor: colors.accent, backgroundColor: 'rgba(180,240,60,0.05)' },
  levelRadio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  levelRadioSelected: { borderColor: colors.accent },
  levelRadioDot: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent,
  },
  levelLabel: {
    fontFamily: typography.fontFamily.semibold, fontSize: 15, color: colors.textPrimary,
  },
  levelLabelSelected: { color: colors.accent },
});
