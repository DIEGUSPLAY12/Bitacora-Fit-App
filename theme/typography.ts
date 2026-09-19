import { Dimensions } from 'react-native';

const BASE_WIDTH = 390;

export function rs(size: number): number {
  const getFn = 'get';
  const { width } = Dimensions[getFn as 'get']('window');
  const scale = width / BASE_WIDTH;
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
