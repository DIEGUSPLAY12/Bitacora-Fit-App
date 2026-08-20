import { Stack, useRouter, useSegments } from 'expo-router';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';
import { PaperProvider, MD3DarkTheme } from 'react-native-paper';
import { colors } from '../theme/colors';
import { AuthProvider, useAuth } from '../hooks/useAuth';
import { View, ActivityIndicator, AppState } from 'react-native';
import { useProfile } from '../hooks/useProfile';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';

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
  const { session, isLoading, authEvent } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { data: profile, isLoading: isProfileLoading } = useProfile();
  const url = Linking.useURL();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (!session?.user?.id) return;

    // Update on initial load
    supabase.from('profiles').update({ last_seen_at: new Date().toISOString() }).eq('id', session.user.id);

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to the foreground
        supabase.from('profiles').update({ last_seen_at: new Date().toISOString() }).eq('id', session.user.id);
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [session?.user?.id]);

  useEffect(() => {
    if (url) {
      const parseDeepLink = async () => {
        if (url.includes('access_token') && url.includes('refresh_token')) {
          const hashMatch = url.match(/#(.+)/);
          if (hashMatch) {
            // Replace all & with & to avoid URLSearchParams issues in React Native, 
            // though standard parsing is safer by splitting
            const paramsString = hashMatch[1];
            const params = new URLSearchParams(paramsString);
            
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');
            const type = params.get('type');
            
            if (accessToken && refreshToken) {
              await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
              
              if (type === 'recovery') {
                router.replace('/(auth)/reset-password');
              }
            }
          }
        }
      };
      parseDeepLink();
    }
  }, [url]);

  useEffect(() => {
    if (isLoading || isProfileLoading) return;

    if (authEvent === 'PASSWORD_RECOVERY') {
      router.replace('/(auth)/reset-password');
      return;
    }

    const inAuthGroup = segments[0] === '(auth)' || segments[0] === 'bienvenida';
    const isResetting = segments[0] === '(auth)' && segments[1] === 'reset-password';

    if (!session && !inAuthGroup) {
      // No session → go to welcome screen
      router.replace('/bienvenida');
    } else if (session && inAuthGroup && !isResetting) {
      // Just logged in → go to tabs
      router.replace('/(tabs)');
    }
  }, [session, isLoading, isProfileLoading, segments, authEvent]);

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
      <Stack.Screen name="entrenos/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="entreno-completado" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="ejercicios/index" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="ejercicios/[id]" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="ajustes" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="notificaciones" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="peso" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="records" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="chats/[id]" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="chats/nuevo" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="compartir" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="entrenos/[id]/comentarios" options={{ headerShown: false, presentation: 'modal' }} />
    </Stack>
  );
}

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CustomAlert } from '../components/CustomAlert';

const queryClient = new QueryClient();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
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
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <RootLayoutNav />
          <CustomAlert />
        </AuthProvider>
      </PaperProvider>
    </QueryClientProvider>
  );
}
