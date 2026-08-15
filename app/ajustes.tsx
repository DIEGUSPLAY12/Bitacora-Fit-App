import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Switch, Alert, ActivityIndicator, Modal, TextInput,
  KeyboardAvoidingView, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useAuth } from '../hooks/useAuth';
import { useProfile, useUpdateProfile } from '../hooks/useProfile';
import { supabase } from '../lib/supabase';
import {
  ArrowLeft, User, Lock, LogOut, Bell, Scale,
  Globe, ShieldCheck, Info, ChevronRight, X, Eye, EyeOff
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';

const APP_VERSION = '1.0.0';

export default function AjustesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { mutateAsync: updateProfile, isPending } = useUpdateProfile();

  // Password change modal
  const [pwModal, setPwModal] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  const weightUnit = profile?.weight_unit || 'kg';
  const isPublic = profile?.is_public !== false;

  const handleToggleUnit = async () => {
    const next = weightUnit === 'kg' ? 'lbs' : 'kg';
    try {
      await updateProfile({ weight_unit: next });
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleTogglePrivacy = async () => {
    try {
      await updateProfile({ is_public: !isPublic });
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleChangePassword = async () => {
    if (!newPw || newPw.length < 7) {
      Alert.alert('Contraseña débil', 'La contraseña debe tener al menos 7 caracteres.');
      return;
    }
    setPwLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setPwLoading(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('¡Listo!', 'Contraseña actualizada correctamente.');
      setPwModal(false);
      setCurrentPw(''); setNewPw('');
    }
  };

  const handleSignOut = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro de que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: () => supabase.auth.signOut() }
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeft color={colors.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Ajustes</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* === Perfil y cuenta === */}
        <Text style={styles.sectionLabel}>PERFIL Y CUENTA</Text>
        <View style={styles.section}>
          <SettingRow
            icon={<User color={colors.textPrimary} size={19} />}
            label="Editar perfil"
            onPress={() => router.push('/(tabs)/perfil')}
          />
          <View style={styles.rowDivider} />
          <SettingRow
            icon={<Lock color={colors.textPrimary} size={19} />}
            label="Cambiar contraseña"
            onPress={() => setPwModal(true)}
          />
          <View style={styles.rowDivider} />
          <SettingRow
            icon={<Scale color={colors.textPrimary} size={19} />}
            label="Registro de peso"
            onPress={() => router.push('/peso')}
          />
        </View>

        {/* === Preferencias === */}
        <Text style={styles.sectionLabel}>PREFERENCIAS</Text>
        <View style={styles.section}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleIconBg}>
              <Scale color={colors.textPrimary} size={19} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Unidad de peso</Text>
              <Text style={styles.rowSubLabel}>{weightUnit === 'kg' ? 'Kilogramos (kg)' : 'Libras (lbs)'}</Text>
            </View>
            <TouchableOpacity
              style={[styles.unitToggle, weightUnit === 'lbs' && styles.unitToggleRight]}
              onPress={handleToggleUnit}
              activeOpacity={0.8}
            >
              <View style={styles.unitOption}>
                <Text style={[styles.unitText, weightUnit === 'kg' && styles.unitTextActive]}>kg</Text>
              </View>
              <View style={styles.unitOption}>
                <Text style={[styles.unitText, weightUnit === 'lbs' && styles.unitTextActive]}>lbs</Text>
              </View>
            </TouchableOpacity>
          </View>
          <View style={styles.rowDivider} />
          <View style={styles.toggleRow}>
            <View style={styles.toggleIconBg}>
              <Globe color={colors.textPrimary} size={19} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Perfil público</Text>
              <Text style={styles.rowSubLabel}>
                {isPublic ? 'Visible en búsquedas y feed de amigos' : 'Perfil privado — no apareces en búsquedas'}
              </Text>
            </View>
            <Switch
              value={isPublic}
              onValueChange={handleTogglePrivacy}
              trackColor={{ false: colors.surfaceElevated, true: 'rgba(180,240,60,0.4)' }}
              thumbColor={isPublic ? colors.accent : colors.textSecondary}
              ios_backgroundColor={colors.surfaceElevated}
            />
          </View>
          <View style={styles.rowDivider} />
          <View style={styles.toggleRow}>
            <View style={styles.toggleIconBg}>
              <Bell color={colors.textPrimary} size={19} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Notificaciones push</Text>
              <Text style={styles.rowSubLabel}>Solicitudes de amistad y actividad</Text>
            </View>
            <Switch
              value={true}
              onValueChange={() => Alert.alert('Pronto', 'Esta función estará disponible próximamente.')}
              trackColor={{ false: colors.surfaceElevated, true: 'rgba(180,240,60,0.4)' }}
              thumbColor={colors.accent}
              ios_backgroundColor={colors.surfaceElevated}
            />
          </View>
        </View>

        {/* === Información === */}
        <Text style={styles.sectionLabel}>INFORMACIÓN</Text>
        <View style={styles.section}>
          <SettingRow
            icon={<ShieldCheck color={colors.textPrimary} size={19} />}
            label="Política de privacidad"
            onPress={() => Alert.alert('Política', 'Disponible próximamente.')}
          />
          <View style={styles.rowDivider} />
          <SettingRow
            icon={<Info color={colors.textPrimary} size={19} />}
            label="Términos de uso"
            onPress={() => Alert.alert('Términos', 'Disponible próximamente.')}
          />
          <View style={styles.rowDivider} />
          <View style={styles.infoRow}>
            <Text style={styles.rowLabel}>Versión de la app</Text>
            <Text style={styles.versionText}>{APP_VERSION}</Text>
          </View>
        </View>

        {/* Cerrar sesión */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut} activeOpacity={0.8}>
          <LogOut color={colors.destructive} size={19} />
          <Text style={styles.signOutText}>Cerrar sesión</Text>
        </TouchableOpacity>

        <Text style={styles.emailInfo}>Sesión activa: {user?.email}</Text>
      </ScrollView>

      {/* === Password Modal === */}
      <Modal visible={pwModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cambiar contraseña</Text>
              <TouchableOpacity onPress={() => setPwModal(false)} style={styles.closeButton}>
                <X color={colors.textPrimary} size={20} />
              </TouchableOpacity>
            </View>
            <Text style={styles.inputLabel}>NUEVA CONTRASEÑA</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={newPw}
                onChangeText={setNewPw}
                placeholder="Mínimo 7 caracteres"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry={!showPw}
              />
              <TouchableOpacity onPress={() => setShowPw(p => !p)} style={{ paddingRight: 14 }}>
                {showPw ? <EyeOff color={colors.textSecondary} size={18} /> : <Eye color={colors.textSecondary} size={18} />}
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleChangePassword}
              disabled={pwLoading}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={pwLoading ? ['#888', '#666'] : [colors.accent, '#90D41C']}
                style={styles.saveButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {pwLoading ? <ActivityIndicator color={colors.background} /> : <Text style={styles.saveButtonText}>Actualizar contraseña</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function SettingRow({ icon, label, onPress }: { icon: React.ReactNode; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.settingRow} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.toggleIconBg}>{icon}</View>
      <Text style={styles.rowLabel}>{label}</Text>
      <ChevronRight color={colors.textSecondary} size={18} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center', alignItems: 'center',
  },
  title: {
    flex: 1, textAlign: 'center',
    fontFamily: typography.fontFamily.semibold,
    fontSize: 18, color: colors.textPrimary, letterSpacing: 0.2,
  },
  scroll: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 60 },

  sectionLabel: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 11, color: colors.textSecondary,
    letterSpacing: 1.2, marginBottom: 10, marginLeft: 4,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 18, marginBottom: 24,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 16, gap: 14,
  },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 16, gap: 14,
  },
  infoRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 16,
  },
  toggleIconBg: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  rowLabel: {
    flex: 1,
    fontFamily: typography.fontFamily.medium,
    fontSize: 15, color: colors.textPrimary,
  },
  rowSubLabel: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 12, color: colors.textSecondary, marginTop: 1,
  },
  rowDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginLeft: 66,
  },
  versionText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 14, color: colors.textSecondary,
  },

  unitToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 10, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  unitToggleRight: {},
  unitOption: { paddingHorizontal: 12, paddingVertical: 7 },
  unitText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 13, color: colors.textSecondary,
  },
  unitTextActive: { color: colors.accent },

  signOutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 16,
    backgroundColor: 'rgba(207,102,121,0.06)',
    borderRadius: 16, marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(207,102,121,0.2)',
  },
  signOutText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 16, color: colors.destructive,
  },
  emailInfo: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 12, color: colors.textSecondary,
    textAlign: 'center', marginBottom: 8,
  },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.surface,
    padding: 24, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: 40,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 20, color: colors.textPrimary,
  },
  closeButton: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center', alignItems: 'center',
  },
  inputLabel: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 11, color: colors.textSecondary,
    letterSpacing: 1.2, marginBottom: 8, marginLeft: 2,
  },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 14, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)', marginBottom: 20,
  },
  input: {
    flex: 1, height: 54, paddingHorizontal: 16,
    color: colors.textPrimary,
    fontFamily: typography.fontFamily.regular, fontSize: 16,
  },
  saveButton: {
    height: 54, borderRadius: 14, overflow: 'hidden',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 10, elevation: 4,
  },
  saveButtonGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  saveButtonText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 16, color: colors.background,
  },
});
