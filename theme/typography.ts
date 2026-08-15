import { Dimensions } from 'react-native';

// --- Responsive scale ---
// Reference width: 390 dp (iPhone 14 / most common Android mid-range)
// Fonts will scale proportionally on smaller/larger screens, clamped so they
// never exceed 100 % on large devices or drop below ~85 % on small ones.
const BASE_WIDTH = 390;

function rs(size: number): number {
  const { width } = Dimensions.get('window');
  const scale = width / BASE_WIDTH;
  // Clamp: minimum 85 % of design size, maximum 100 %
  const clamped = Math.min(1, Math.max(0.85, scale));
  return Math.round(size * clamped);
}

export const typography = {
  fontFamily: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semibold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
  },
  scale: {
    display: {
      fontSize: rs(30),
      lineHeight: rs(38),
    },
    title: {
      fontSize: rs(22),
      lineHeight: rs(30),
    },
    body: {
      fontSize: rs(15),
      lineHeight: rs(22),
    },
    caption: {
      fontSize: rs(12),
      lineHeight: rs(16),
    },
  },
};
