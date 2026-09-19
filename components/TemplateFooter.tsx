import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Save } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

export const TemplateFooter = ({ insets, isSaving, onPress, label = 'Guardar Plantilla' }: any) => (
  <View style={[styles.footer, { paddingBottom: insets.bottom > 0 ? insets.bottom + 8 : 24 }]}>
    <TouchableOpacity 
      style={styles.finishButton} 
      onPress={onPress}
      activeOpacity={0.9}
      disabled={isSaving}
    >
      <LinearGradient
        colors={[colors.accent, '#90D41C']}
        style={styles.finishButtonGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {isSaving ? (
          <ActivityIndicator color={colors.background} />
        ) : (
          <>
            <Save color={colors.background} size={20} style={{ marginRight: 8 }} />
            <Text style={styles.finishButtonText}>{label}</Text>
          </>
        )}
      </LinearGradient>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  footer: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    backgroundColor: colors.background, 
    paddingHorizontal: 20, 
    paddingTop: 14, 
    borderTopWidth: 1, 
    borderTopColor: 'rgba(255,255,255,0.05)' 
  },
  finishButton: { 
    height: 56, 
    borderRadius: 16, 
    overflow: 'hidden', 
    boxShadow: '0px 4px 12px rgba(180, 240, 60, 0.2)' 
  },
  finishButtonGradient: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    flexDirection: 'row' 
  },
  finishButtonText: { 
    fontFamily: typography.fontFamily.semibold, 
    fontSize: 16, 
    color: colors.background 
  },
});
