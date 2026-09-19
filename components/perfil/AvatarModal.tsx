import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Modal, StyleSheet } from 'react-native';
import { X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

const AVATAR_SEEDS = ['Power', 'Energy', 'Focus', 'Strength', 'Agility', 'Speed', 'Endurance', 'Balance'];

export function AvatarModal({ 
  visible, 
  onClose, 
  newAvatarUrl, 
  setNewAvatarUrl, 
  onSave, 
  isUpdating 
}: any) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Cambiar Avatar</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
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
              {isUpdating ? <ActivityIndicator color={colors.background} /> : <Text style={styles.saveButtonText}>Guardar avatar</Text>}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
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
    boxShadow: '0px 4px 10px rgba(180, 240, 60, 0.2)',
  },
  saveButtonGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  saveButtonText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 16,
    color: colors.background,
  },
});
