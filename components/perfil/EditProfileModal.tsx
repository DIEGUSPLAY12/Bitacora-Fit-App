import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

export function EditProfileModal({
  visible,
  onClose,
  newUsername,
  setNewUsername,
  onSave,
  isUpdating
}: any) {
  const [focusedInput, setFocusedInput] = useState(false);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Editar Perfil</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
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
            onPress={onSave}
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
  );
}

const styles = StyleSheet.create({
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
  saveButton: {
    height: 56,
    borderRadius: 14,
    overflow: 'hidden',
    boxShadow: '0px 4px 10px rgba(180, 240, 60, 0.2)',
  },
  saveButtonGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  saveButtonText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 16,
    color: colors.background,
  },
});
