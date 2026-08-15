import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { useAuth } from '../../hooks/useAuth';
import { useStreak } from '../../hooks/useStreak';
import { useProfile, useUpdateProfile } from '../../hooks/useProfile';
import { User, LogOut, Edit3, Edit2, Bell, X, TrendingUp, ChevronRight, Activity, Zap } from 'lucide-react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

export default function PerfilScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = useStreak();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { mutateAsync: updateProfile, isPending: isUpdating } = useUpdateProfile();

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newAvatarUrl, setNewAvatarUrl] = useState('');

  const [focusedInput, setFocusedInput] = useState(false);

  const AVATAR_SEEDS = ['Power', 'Energy', 'Focus', 'Strength', 'Agility', 'Speed', 'Endurance', 'Balance'];

  const handleSignOut = async () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro de que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: () => supabase.auth.signOut() }
    ]);
  };

  const handleEditProfile = () => {
    setNewUsername(profile?.username || '');
    setEditModalVisible(true);
  };

  const saveProfile = async () => {
    if (!newUsername.trim()) return;
    try {
      await updateProfile({ username: newUsername.trim() });
      setEditModalVisible(false);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleEditAvatar = () => {
    setNewAvatarUrl(profile?.avatar_url || '');
    setAvatarModalVisible(true);
  };

  const saveAvatar = async () => {
    try {
      await updateProfile({ avatar_url: newAvatarUrl || null });
      setAvatarModalVisible(false);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const currentStreak = stats?.current || 0;
  const longestStreak = stats?.longest || 0;
  const totalWorkouts = stats?.total || 0;

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 32 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.title}>Mi Perfil</Text>
      </View>

      <View style={styles.content}>
        {/* === User Hero Section === */}
        <View style={styles.userHero}>
          {/* Avatar */}
          <View style={styles.avatarWrapper}>
            <LinearGradient 
              colors={[colors.accent, '#90D41C']} 
              style={styles.avatarOuterRing}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.avatarContainer}>
                {profile?.avatar_url ? (
                  <Image source={{ uri: profile.avatar_url }} style={styles.avatar} contentFit="cover" />
                ) : (
                  <User color={colors.textSecondary} size={44} />
                )}
              </View>
            </LinearGradient>
            <TouchableOpacity style={styles.editAvatarButton} onPress={handleEditAvatar} activeOpacity={0.8}>
              <Edit2 color={colors.background} size={14} />
            </TouchableOpacity>
          </View>

          {/* Username + email */}
          <View style={styles.userInfo}>
            <Text style={styles.username} numberOfLines={1}>
              {profileLoading ? 'Cargando...' : profile?.username || user?.email}
            </Text>
            <Text style={styles.email} numberOfLines={1}>{user?.email}</Text>
          </View>
        </View>

        {/* === Inline Stats Row (Symmetry style) === */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber} adjustsFontSizeToFit numberOfLines={1}>
              {statsLoading ? '-' : totalWorkouts}
            </Text>
            <Text style={styles.statLabel}>Entrenos</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.accent }]} adjustsFontSizeToFit numberOfLines={1}>
              {statsLoading ? '-' : currentStreak}
            </Text>
            <Text style={styles.statLabel}>Racha actual</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber} adjustsFontSizeToFit numberOfLines={1}>
              {statsLoading ? '-' : longestStreak}
            </Text>
            <Text style={styles.statLabel}>Racha máx.</Text>
          </View>
        </View>

        {/* === Options List === */}
        <View style={styles.optionsList}>
          <TouchableOpacity style={styles.optionRow} onPress={() => router.push('/progreso')} activeOpacity={0.7}>
            <View style={styles.optionIconBg}>
              <TrendingUp color={colors.textPrimary} size={19} />
            </View>
            <Text style={styles.optionText}>Mi Progreso</Text>
            <ChevronRight color={colors.textSecondary} size={18} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.optionRow} onPress={handleEditProfile} activeOpacity={0.7}>
            <View style={styles.optionIconBg}>
              <Edit3 color={colors.textPrimary} size={19} />
            </View>
            <Text style={styles.optionText}>Editar perfil</Text>
            <ChevronRight color={colors.textSecondary} size={18} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionRow} onPress={() => Alert.alert('Notificaciones', 'Próximamente')} activeOpacity={0.7}>
            <View style={styles.optionIconBg}>
              <Bell color={colors.textPrimary} size={19} />
            </View>
            <Text style={styles.optionText}>Notificaciones</Text>
            <ChevronRight color={colors.textSecondary} size={18} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.optionRow, styles.optionRowDanger]} onPress={handleSignOut} activeOpacity={0.7}>
            <View style={[styles.optionIconBg, { backgroundColor: 'rgba(207, 102, 121, 0.1)' }]}>
              <LogOut color={colors.destructive} size={19} />
            </View>
            <Text style={[styles.optionText, { color: colors.destructive }]}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* === Edit Profile Modal === */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Perfil</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} style={styles.closeButton}>
                <X color={colors.textPrimary} size={20} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.inputLabel}>Nombre de usuario</Text>
            <View style={[styles.inputContainer, focusedInput && styles.inputFocused]}>
              <TextInput
                style={styles.input}
                value={newUsername}
                onChangeText={setNewUsername}
                placeholder="Escribe un alias único"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => setFocusedInput(true)}
                onBlur={() => setFocusedInput(false)}
              />
            </View>

            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={saveProfile}
              disabled={isUpdating}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={isUpdating ? ['#888', '#666'] : [colors.accent, '#90D41C']}
                style={styles.saveButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {isUpdating ? <ActivityIndicator color={colors.background} /> : <Text style={styles.saveButtonText}>Guardar cambios</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* === Avatar Modal === */}
      <Modal visible={avatarModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cambiar Avatar</Text>
              <TouchableOpacity onPress={() => setAvatarModalVisible(false)} style={styles.closeButton}>
                <X color={colors.textPrimary} size={20} />
              </TouchableOpacity>
            </View>

            <View style={styles.avatarGrid}>
              {AVATAR_SEEDS.map((seed) => {
                const url = `https://api.dicebear.com/9.x/shapes/svg?seed=${seed}&backgroundColor=transparent&shape1Color=b4f03c&shape2Color=90d41c&shape3Color=ffffff`;
                const isSelected = newAvatarUrl === url;
                return (
                  <TouchableOpacity
                    key={seed}
                    style={[styles.avatarOption, isSelected && styles.avatarOptionSelected]}
                    onPress={() => setNewAvatarUrl(url)}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri: url }} style={styles.avatarOptionImage} contentFit="contain" />
                  </TouchableOpacity>
                );
              })}
            </View>
            
            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={saveAvatar}
              disabled={isUpdating}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={isUpdating ? ['#888', '#666'] : [colors.accent, '#90D41C']}
                style={styles.saveButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {isUpdating ? <ActivityIndicator color={colors.background} /> : <Text style={styles.saveButtonText}>Guardar avatar</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  title: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 26,
    letterSpacing: 0.3,
    color: colors.textPrimary,
  },
  content: { paddingHorizontal: 20, flexGrow: 1 },

  // --- User hero ---
  userHero: {
    alignItems: 'center',
    marginBottom: 28,
  },
  avatarWrapper: { position: 'relative', marginBottom: 16 },
  avatarOuterRing: {
    width: 108,
    height: 108,
    borderRadius: 54,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: colors.background,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.accent,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.background,
  },
  avatar: { width: '100%', height: '100%' },
  userInfo: { alignItems: 'center' },
  username: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 22,
    color: colors.textPrimary,
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  email: {
    fontFamily: typography.fontFamily.medium,
    ...typography.scale.body,
    color: colors.textSecondary,
  },

  // --- Inline stats card (Symmetry style) ---
  statsCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 4,
  },
  statNumber: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 26,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // --- Options list ---
  optionsList: { gap: 10 },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  optionRowDanger: {
    borderColor: 'rgba(207, 102, 121, 0.2)',
    backgroundColor: 'rgba(207, 102, 121, 0.03)',
  },
  optionIconBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  optionText: {
    flex: 1,
    fontFamily: typography.fontFamily.medium,
    fontSize: 15,
    color: colors.textPrimary,
  },

  // --- Modals ---
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.surface,
    padding: 24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 20,
    color: colors.textPrimary,
    letterSpacing: 0.2,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputLabel: {
    fontFamily: typography.fontFamily.medium,
    ...typography.scale.caption,
    color: colors.textSecondary,
    marginBottom: 8,
    marginLeft: 2,
  },
  inputContainer: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    marginBottom: 24,
  },
  inputFocused: { borderColor: colors.accent, backgroundColor: 'rgba(180, 240, 60, 0.05)' },
  input: {
    color: colors.textPrimary,
    height: 56,
    paddingHorizontal: 16,
    fontFamily: typography.fontFamily.regular,
    ...typography.scale.body,
  },

  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28, justifyContent: 'center' },
  avatarOption: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  avatarOptionSelected: { borderColor: colors.accent, backgroundColor: 'rgba(180, 240, 60, 0.1)' },
  avatarOptionImage: { width: '100%', height: '100%' },

  saveButton: {
    height: 56,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  saveButtonGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  saveButtonText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 16,
    color: colors.background,
  },
});
