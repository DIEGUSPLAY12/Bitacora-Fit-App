import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

export default function HistoryScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Historial</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    ...typography.scale.title,
  },
});
