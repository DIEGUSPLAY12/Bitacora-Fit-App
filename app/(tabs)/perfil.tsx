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

  const AVATAR_SEEDS = ['Felix', 'Aneka', 'Oreo', 'Zoey', 'Bella', 'Charlie', 'Molly', 'Simba'];

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
      contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 24 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.title}>Mi Perfil</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.userSection}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarOuterRing}>
              <View style={styles.avatarContainer}>
                {profile?.avatar_url ? (
                  <Image source={{ uri: profile.avatar_url }} style={styles.avatar} contentFit="cover" />
                ) : (
                  <User color={colors.background} size={48} />
                )}
              </View>
            </View>
            <TouchableOpacity style={styles.editAvatarButton} onPress={handleEditAvatar} activeOpacity={0.8}>
              <Edit2 color={colors.background} size={16} />
            </TouchableOpacity>
          </View>
          <Text style={styles.username}>
            {profileLoading ? 'Cargando...' : profile?.username || user?.email}
          </Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        {/* Bento Grid Stats */}
        <View style={styles.bentoGrid}>
          <View style={[styles.bentoCard, styles.bentoCardLarge]}>
            <View style={styles.bentoIconContainer}>
              <Activity color={colors.accent} size={24} />
            </View>
            <Text style={styles.bentoValue} adjustsFontSizeToFit numberOfLines={1}>{statsLoading ? '-' : totalWorkouts}</Text>
            <Text style={styles.bentoLabel}>Entrenos Totales</Text>
          </View>
          
          <View style={styles.bentoCol}>
            <View style={[styles.bentoCard, styles.bentoCardSmall, { backgroundColor: 'rgba(180, 240, 60, 0.05)' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={styles.bentoLabel}>Racha Actual</Text>
                <Zap color={colors.accent} size={16} fill={colors.accent} />
              </View>
              <Text style={[styles.bentoValue, { color: colors.accent }]} adjustsFontSizeToFit numberOfLines={1}>{statsLoading ? '-' : currentStreak}</Text>
            </View>

            <View style={[styles.bentoCard, styles.bentoCardSmall]}>
              <Text style={styles.bentoLabel}>Racha Máxima</Text>
              <Text style={styles.bentoValue} adjustsFontSizeToFit numberOfLines={1}>{statsLoading ? '-' : longestStreak}</Text>
            </View>
          </View>
        </View>

        <View style={styles.optionsList}>
          <TouchableOpacity style={styles.optionRow} onPress={() => router.push('/progreso')} activeOpacity={0.7}>
            <View style={styles.optionIconBg}>
              <TrendingUp color={colors.textPrimary} size={20} />
            </View>
            <Text style={styles.optionText}>Mi Progreso</Text>
            <ChevronRight color={colors.textSecondary} size={20} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.optionRow} onPress={handleEditProfile} activeOpacity={0.7}>
            <View style={styles.optionIconBg}>
              <Edit3 color={colors.textPrimary} size={20} />
            </View>
            <Text style={styles.optionText}>Editar perfil</Text>
            <ChevronRight color={colors.textSecondary} size={20} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionRow} onPress={() => Alert.alert('Notificaciones', 'Próximamente')} activeOpacity={0.7}>
            <View style={styles.optionIconBg}>
              <Bell color={colors.textPrimary} size={20} />
            </View>
            <Text style={styles.optionText}>Notificaciones</Text>
            <ChevronRight color={colors.textSecondary} size={20} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.optionRow, styles.optionRowDanger]} onPress={handleSignOut} activeOpacity={0.7}>
            <View style={[styles.optionIconBg, { backgroundColor: 'rgba(207, 102, 121, 0.1)' }]}>
              <LogOut color={colors.destructive} size={20} />
            </View>
            <Text style={[styles.optionText, { color: colors.destructive }]}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
      </View>

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
                const url = `https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}`;
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
  header: { paddingHorizontal: 24, paddingBottom: 16 },
  title: { fontFamily: typography.fontFamily.bold, ...typography.scale.display, fontSize: 28, color: colors.textPrimary },
  content: { paddingHorizontal: 24, flexGrow: 1 },
  userSection: { alignItems: 'center', marginBottom: 32, marginTop: 16 },
  avatarWrapper: { position: 'relative', marginBottom: 16 },
  avatarOuterRing: { width: 112, height: 112, borderRadius: 56, borderWidth: 2, borderColor: colors.accent, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(180, 240, 60, 0.05)' },
  avatarContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  editAvatarButton: { position: 'absolute', bottom: 0, right: 0, backgroundColor: colors.accent, width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: colors.background },
  avatar: { width: '100%', height: '100%' },
  username: { fontFamily: typography.fontFamily.bold, ...typography.scale.title, fontSize: 24, color: colors.textPrimary, marginBottom: 4 },
  email: { fontFamily: typography.fontFamily.medium, ...typography.scale.body, color: colors.textSecondary },
  
  bentoGrid: { flexDirection: 'row', gap: 16, marginBottom: 32 },
  bentoCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  bentoCardLarge: { flex: 1, justifyContent: 'center' },
  bentoCol: { flex: 1, gap: 16 },
  bentoCardSmall: { flex: 1, justifyContent: 'center' },
  bentoIconContainer: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(180, 240, 60, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  bentoValue: { fontFamily: typography.fontFamily.bold, ...typography.scale.display, fontSize: 26, color: colors.textPrimary, marginBottom: 4 },
  bentoLabel: { fontFamily: typography.fontFamily.bold, ...typography.scale.caption, color: colors.textSecondary, letterSpacing: 0.5, textTransform: 'uppercase' },
  
  optionsList: { gap: 12 },
  optionRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  optionRowDanger: { borderColor: 'rgba(207, 102, 121, 0.2)', backgroundColor: 'rgba(207, 102, 121, 0.02)' },
  optionIconBg: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  optionText: { flex: 1, fontFamily: typography.fontFamily.bold, ...typography.scale.body, fontSize: 16, color: colors.textPrimary },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.surface, padding: 24, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingBottom: 40, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontFamily: typography.fontFamily.bold, ...typography.scale.title, fontSize: 22, color: colors.textPrimary },
  closeButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  inputLabel: { fontFamily: typography.fontFamily.medium, ...typography.scale.caption, color: colors.textSecondary, marginBottom: 8, marginLeft: 4 },
  inputContainer: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden', marginBottom: 24 },
  inputFocused: { borderColor: colors.accent, backgroundColor: 'rgba(180, 240, 60, 0.05)' },
  input: { color: colors.textPrimary, height: 60, paddingHorizontal: 16, fontFamily: typography.fontFamily.regular, ...typography.scale.body },
  
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 32, justifyContent: 'center' },
  avatarOption: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 3, borderColor: 'transparent', overflow: 'hidden' },
  avatarOptionSelected: { borderColor: colors.accent, backgroundColor: 'rgba(180, 240, 60, 0.1)' },
  avatarOptionImage: { width: '100%', height: '100%' },
  
  saveButton: { height: 60, borderRadius: 16, overflow: 'hidden', shadowColor: colors.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 4 },
  saveButtonGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  saveButtonText: { fontFamily: typography.fontFamily.bold, ...typography.scale.title, fontSize: 18, color: colors.background },
});
