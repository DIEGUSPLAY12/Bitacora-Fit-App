import { Stack, useRouter, useSegments } from 'expo-router';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { PaperProvider, MD3DarkTheme } from 'react-native-paper';
import { colors } from '../theme/colors';
import { AuthProvider, useAuth } from '../hooks/useAuth';
import { View, ActivityIndicator } from 'react-native';

SplashScreen.preventAutoHideAsync();

const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: colors.accent,
    background: colors.background,
    surface: colors.surface,
    error: colors.destructive,
  },
};

function RootLayoutNav() {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)' || segments[0] === 'bienvenida';

    if (session && inAuthGroup) {
      // Redirigir a tabs si hay sesión y está en bienvenida/auth
      router.replace('/(tabs)');
    } else if (!session && !inAuthGroup) {
      // Redirigir a bienvenida si no hay sesión
      router.replace('/bienvenida');
    }
  }, [session, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="bienvenida" options={{ headerShown: false, animation: 'fade' }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false, animation: 'fade' }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: 'fade' }} />
      <Stack.Screen name="entrenar" options={{ headerShown: false, presentation: 'modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <PaperProvider theme={theme}>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </PaperProvider>
  );
}
