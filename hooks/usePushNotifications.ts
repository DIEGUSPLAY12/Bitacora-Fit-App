import { useEffect, useRef, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

// Configura cómo se muestran las notificaciones cuando la app está abierta
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Solicita permisos y devuelve el Expo Push Token del dispositivo.
 * Devuelve null si no es un dispositivo físico o si el usuario deniega permisos.
 */
async function registerForPushNotificationsAsync(): Promise<string | null> {
  // Las notificaciones push no funcionan en emuladores/simuladores
  if (!Device.isDevice) {
    console.log('[PushNotifications] No es un dispositivo físico, se omite el registro de push token.');
    return null;
  }

  // Verificar permisos actuales
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Solicitar permisos si no están concedidos aún
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[PushNotifications] Permisos denegados por el usuario.');
    return null;
  }

  // Android requiere un canal de notificaciones
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'BítacoraFit',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#B4F03C',
    });
  }

  // Obtener el Expo Push Token
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      // El projectId de EAS (app.json > extra.eas.projectId)
      projectId: '1613fb70-25f8-4b75-9303-ed905a6ecac7',
    });
    return tokenData.data;
  } catch (error) {
    // En Expo Go sin build nativo esto puede fallar — es esperado
    console.log('[PushNotifications] No se pudo obtener el push token (normal en Expo Go):', error);
    return null;
  }
}

/**
 * Guarda el push token en Supabase asociado al usuario actual.
 * Usa UPSERT para evitar duplicados (unique constraint: user_id + token).
 */
async function savePushTokenToSupabase(userId: string, token: string): Promise<void> {
  const platform = Platform.OS === 'ios' ? 'ios' : 'android';

  const { error } = await supabase
    .from('push_tokens')
    .upsert(
      { user_id: userId, token, platform },
      { onConflict: 'user_id,token', ignoreDuplicates: true }
    );

  if (error) {
    console.warn('[PushNotifications] Error guardando push token:', error.message);
  } else {
    console.log('[PushNotifications] Push token registrado correctamente.');
  }
}

/**
 * Elimina el push token del dispositivo actual de Supabase.
 * Llamar en el momento del logout para evitar notificaciones en dispositivos no autenticados.
 */
export async function removePushToken(userId: string): Promise<void> {
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: '1613fb70-25f8-4b75-9303-ed905a6ecac7',
    });
    const token = tokenData.data;

    await supabase
      .from('push_tokens')
      .delete()
      .eq('user_id', userId)
      .eq('token', token);

    console.log('[PushNotifications] Push token eliminado al cerrar sesión.');
  } catch {
    // Si no hay token (Expo Go), no hay nada que eliminar
  }
}

/**
 * Hook principal de notificaciones push.
 * Debe usarse dentro de RootLayoutNav, donde ya existe la sesión.
 */
export function usePushNotifications() {
  const { user } = useAuth();
  const router = useRouter();
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  // Manejar tap en notificación → navegar a la pantalla correcta
  const handleNotificationResponse = useCallback((response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data as Record<string, string>;

    if (data?.type === 'message' && data?.chatId) {
      // Navegar al chat específico
      router.push(`/chats/${data.chatId}`);
    } else if (data?.type === 'friend_request') {
      // Navegar a la sección de amigos (tab Solicitudes)
      router.push('/amigos');
    }
  }, [router]);

  useEffect(() => {
    if (!user) return;

    // 1. Registrar push token en Supabase
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        savePushTokenToSupabase(user.id, token);
      }
    });

    // 2. Listener para notificaciones recibidas con la app en primer plano
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      // La notificación ya se muestra automáticamente (setNotificationHandler arriba)
      // Aquí podríamos actualizar badges, invalidar queries, etc. si fuera necesario
      console.log('[PushNotifications] Notificación recibida en primer plano:', notification.request.content.title);
    });

    // 3. Listener para cuando el usuario pulsa una notificación
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse
    );

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [user, handleNotificationResponse]);

  // También manejar el caso en que la app se abre desde una notificación pulsada estando cerrada
  useEffect(() => {
    Notifications.getLastNotificationResponseAsync().then(response => {
      if (response) {
        handleNotificationResponse(response);
      }
    });
  }, [handleNotificationResponse]);
}
