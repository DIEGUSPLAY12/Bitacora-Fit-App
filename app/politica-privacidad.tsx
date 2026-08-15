import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../theme/colors';
import { typography, rs } from '../theme/typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ShieldCheck } from 'lucide-react-native';

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + rs(16) }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeft color={colors.textPrimary} size={rs(24)} />
        </TouchableOpacity>
        <Text style={styles.title}>Política de Privacidad</Text>
        <View style={{ width: rs(40) }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.iconContainer}>
          <ShieldCheck color={colors.accent} size={rs(48)} />
        </View>
        
        <Text style={styles.lastUpdated}>Última actualización: 15 Agosto 2026</Text>

        <Text style={styles.sectionTitle}>1. Información que recopilamos</Text>
        <Text style={styles.paragraph}>
          Recopilamos la información que nos proporcionas directamente, como cuando creas una cuenta (nombre, correo electrónico, fecha de nacimiento), completas tu perfil o registras tus entrenamientos y medidas corporales.
        </Text>

        <Text style={styles.sectionTitle}>2. Cómo usamos tu información</Text>
        <Text style={styles.paragraph}>
          Utilizamos tu información para proporcionarte, mantener y mejorar nuestros servicios, así como para personalizar tu experiencia, procesar tus transacciones y enviarte notificaciones relacionadas con tu progreso y las interacciones con tus amigos.
        </Text>

        <Text style={styles.sectionTitle}>3. Interacciones sociales</Text>
        <Text style={styles.paragraph}>
          Dependiendo de tu configuración de privacidad, cierta información (como tu nombre de usuario, foto de perfil y los entrenamientos que marques como "públicos" o para "amigos") será visible para otros usuarios de la aplicación.
        </Text>

        <Text style={styles.sectionTitle}>4. Seguridad de los datos</Text>
        <Text style={styles.paragraph}>
          Nos tomamos muy en serio la seguridad de tus datos. Empleamos medidas de seguridad estándar de la industria para proteger tu información personal contra acceso, alteración, divulgación o destrucción no autorizada.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: rs(20), paddingBottom: rs(16),
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backButton: {
    width: rs(40), height: rs(40), borderRadius: rs(20),
    backgroundColor: colors.surface,
    justifyContent: 'center', alignItems: 'center',
  },
  title: {
    flex: 1, textAlign: 'center',
    fontFamily: typography.fontFamily.semibold,
    fontSize: rs(18), color: colors.textPrimary, letterSpacing: 0.2,
  },
  scroll: { paddingHorizontal: rs(24), paddingTop: rs(32), paddingBottom: rs(60) },
  iconContainer: {
    width: rs(88), height: rs(88), borderRadius: rs(44),
    backgroundColor: 'rgba(180, 240, 60, 0.1)',
    justifyContent: 'center', alignItems: 'center',
    alignSelf: 'center', marginBottom: rs(16),
    borderWidth: 1, borderColor: 'rgba(180, 240, 60, 0.2)',
  },
  lastUpdated: {
    fontFamily: typography.fontFamily.medium,
    fontSize: rs(14), color: colors.textSecondary,
    textAlign: 'center', marginBottom: rs(32),
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: rs(18), color: colors.textPrimary,
    marginBottom: rs(12), marginTop: rs(24),
  },
  paragraph: {
    fontFamily: typography.fontFamily.regular,
    fontSize: rs(15), color: colors.textSecondary,
    lineHeight: rs(24),
  },
});
