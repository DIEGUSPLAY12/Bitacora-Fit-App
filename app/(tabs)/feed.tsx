import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { UserPlus } from 'lucide-react-native';

export default function FeedScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Feed</Text>
        <TouchableOpacity onPress={() => router.push('/amigos')}>
          <UserPlus color={colors.textPrimary} size={28} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.emptyText}>El feed de actividad estará disponible pronto.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingTop: 60, paddingBottom: 16 },
  title: { fontFamily: typography.fontFamily.bold, ...typography.scale.display, fontSize: 28, color: colors.textPrimary },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { fontFamily: typography.fontFamily.medium, ...typography.scale.body, color: colors.textSecondary, textAlign: 'center' }
});
