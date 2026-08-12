import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { useAuth } from '../../hooks/useAuth';
import { useStreak } from '../../hooks/useStreak';
import { useProfile, useUpdateProfile } from '../../hooks/useProfile';
import { User, LogOut, Edit3, Bell, X, TrendingUp } from 'lucide-react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PerfilScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = useStreak();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { mutateAsync: updateProfile, isPending: isUpdating } = useUpdateProfile();

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [newUsername, setNewUsername] = useState('');

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

  const currentStreak = stats?.current || 0;
  const longestStreak = stats?.longest || 0;
  const totalWorkouts = stats?.total || 0;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.title}>Perfil</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.userSection}>
          <View style={styles.avatarContainer}>
            {profile?.avatar_url ? (
              <Image source={profile.avatar_url} style={styles.avatar} contentFit="cover" />
            ) : (
              <User color={colors.background} size={48} />
            )}
          </View>
          <Text style={styles.username}>
            {profileLoading ? 'Cargando...' : profile?.username || user?.email}
          </Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{statsLoading ? '-' : totalWorkouts}</Text>
            <Text style={styles.statLabel}>ENTRENOS</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{statsLoading ? '-' : longestStreak}</Text>
            <Text style={styles.statLabel}>RACHA MÁX</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: colors.accent }]}>{statsLoading ? '-' : currentStreak}</Text>
            <Text style={[styles.statLabel, { color: colors.accent }]}>ACTUAL</Text>
          </View>
        </View>

        <View style={styles.optionsList}>
          <TouchableOpacity style={styles.optionRow} onPress={() => router.push('/progreso')}>
            <TrendingUp color={colors.textPrimary} size={24} />
            <Text style={styles.optionText}>Mi Progreso</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionRow} onPress={handleEditProfile}>
            <Edit3 color={colors.textPrimary} size={24} />
            <Text style={styles.optionText}>Editar perfil</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionRow} onPress={() => Alert.alert('Notificaciones', 'Próximamente')}>
            <Bell color={colors.textPrimary} size={24} />
            <Text style={styles.optionText}>Notificaciones</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionRow} onPress={handleSignOut}>
            <LogOut color={colors.destructive} size={24} />
            <Text style={[styles.optionText, { color: colors.destructive }]}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={editModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Perfil</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <X color={colors.textPrimary} size={24} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.inputLabel}>Nombre de usuario</Text>
            <TextInput
              style={styles.input}
              value={newUsername}
              onChangeText={setNewUsername}
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
            />
            
            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={saveProfile}
              disabled={isUpdating}
            >
              {isUpdating ? <ActivityIndicator color={colors.background} /> : <Text style={styles.saveButtonText}>Guardar</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 24, paddingTop: 16 },
  title: { fontFamily: typography.fontFamily.bold, ...typography.scale.display, fontSize: 28, color: colors.textPrimary },
  content: { flex: 1, padding: 24 },
  userSection: { alignItems: 'center', marginBottom: 40 },
  avatarContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.textPrimary, justifyContent: 'center', alignItems: 'center', marginBottom: 16, overflow: 'hidden' },
  avatar: { width: '100%', height: '100%' },
  username: { fontFamily: typography.fontFamily.bold, ...typography.scale.title, color: colors.textPrimary, marginBottom: 4 },
  email: { fontFamily: typography.fontFamily.regular, ...typography.scale.body, color: colors.textSecondary },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.surface, borderRadius: 16, padding: 20, marginBottom: 40 },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontFamily: typography.fontFamily.bold, ...typography.scale.display, fontSize: 28, color: colors.textPrimary, marginBottom: 4 },
  statLabel: { fontFamily: typography.fontFamily.bold, ...typography.scale.caption, color: colors.textSecondary, letterSpacing: 1 },
  optionsList: { gap: 8 },
  optionRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: 16, borderRadius: 12, gap: 16 },
  optionText: { fontFamily: typography.fontFamily.medium, ...typography.scale.body, color: colors.textPrimary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.surface, padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontFamily: typography.fontFamily.bold, ...typography.scale.title, color: colors.textPrimary },
  inputLabel: { fontFamily: typography.fontFamily.medium, ...typography.scale.caption, color: colors.textSecondary, marginBottom: 8 },
  input: { backgroundColor: colors.background, color: colors.textPrimary, height: 56, borderRadius: 8, paddingHorizontal: 16, fontFamily: typography.fontFamily.regular, ...typography.scale.body, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  saveButton: { backgroundColor: colors.accent, height: 56, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  saveButtonText: { fontFamily: typography.fontFamily.bold, ...typography.scale.body, color: colors.background },
});
