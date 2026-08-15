import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../theme/colors';
import { typography, rs } from '../theme/typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Info } from 'lucide-react-native';

export default function TermsOfUseScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + rs(16) }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeft color={colors.textPrimary} size={rs(24)} />
        </TouchableOpacity>
        <Text style={styles.title}>Términos de Uso</Text>
        <View style={{ width: rs(40) }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.iconContainer}>
          <Info color={colors.accent} size={rs(48)} />
        </View>
        
        <Text style={styles.lastUpdated}>Última actualización: 15 Agosto 2026</Text>

        <Text style={styles.sectionTitle}>1. Aceptación de los términos</Text>
        <Text style={styles.paragraph}>
          Al acceder o utilizar BítacoraFit, aceptas estar sujeto a estos Términos de Uso y a todas las leyes y regulaciones aplicables. Si no estás de acuerdo con alguno de estos términos, tienes prohibido usar o acceder a este servicio.
        </Text>

        <Text style={styles.sectionTitle}>2. Uso de la aplicación</Text>
        <Text style={styles.paragraph}>
          Esta aplicación está diseñada para ayudarte a registrar y gestionar tus entrenamientos personales. Eres responsable de mantener la confidencialidad de tu cuenta y contraseña.
        </Text>

        <Text style={styles.sectionTitle}>3. Contenido del usuario</Text>
        <Text style={styles.paragraph}>
          Conservas todos los derechos sobre el contenido que publicas (tus entrenamientos, notas, etc.). Sin embargo, al compartir contenido públicamente o con amigos, nos otorgas permiso para mostrarlo de acuerdo con tus configuraciones de privacidad. No debes publicar contenido ofensivo o ilegal.
        </Text>

        <Text style={styles.sectionTitle}>4. Descargo de responsabilidad médica</Text>
        <Text style={styles.paragraph}>
          BítacoraFit no proporciona consejos médicos. La información y las herramientas proporcionadas en la aplicación son solo para fines informativos y de seguimiento del estado físico. Consulta siempre a un médico o profesional de la salud antes de comenzar cualquier nuevo programa de ejercicios.
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
