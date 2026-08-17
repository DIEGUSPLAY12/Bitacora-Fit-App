import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// =====================================================================
// Tipos del payload que envía Supabase Database Webhooks
// =====================================================================
interface SupabaseWebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
  record: Record<string, unknown> | null;
  old_record: Record<string, unknown> | null;
}

// Tipos de la Expo Push API
interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  channelId?: string;
}

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

// =====================================================================
// Envía notificaciones a través de la Expo Push API
// =====================================================================
async function sendExpoPushNotifications(messages: ExpoPushMessage[]) {
  if (messages.length === 0) return;

  // Filtrar solo tokens válidos de Expo
  const validMessages = messages.filter(m =>
    m.to.startsWith('ExponentPushToken[') || m.to.startsWith('ExpoPushToken[')
  );
  if (validMessages.length === 0) return;

  const response = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(validMessages),
  });

  if (!response.ok) {
    console.error('[push] Expo API error:', response.status, await response.text());
  } else {
    const result = await response.json();
    console.log('[push] Expo API response:', JSON.stringify(result));
  }
}

// =====================================================================
// Manejador principal
// =====================================================================
serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    // Supabase Database Webhooks incluyen automáticamente el header Authorization
    // con el service_role_key — no necesitamos validarlo nosotros
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const payload = await req.json() as SupabaseWebhookPayload;
    const { table, record } = payload;

    console.log(`[push] Webhook recibido: table=${table}`);

    if (!record) {
      return new Response(JSON.stringify({ ok: true, message: 'No record' }), { status: 200 });
    }

    // ------------------------------------------------------------------
    // CASO 1: Nuevo mensaje en chat
    // ------------------------------------------------------------------
    if (table === 'chat_messages') {
      const chatId = record.chat_id as string;
      const senderId = record.user_id as string;
      const content = record.content as string | null;
      const sharedWorkoutId = record.shared_workout_id as string | null;

      // Obtener username del remitente
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', senderId)
        .single();

      const senderName = senderProfile?.username || 'Alguien';
      const messageBody = content ? content.substring(0, 100) : 'Te ha enviado un entrenamiento 💪';

      // Obtener los push tokens de los miembros del chat (excepto el remitente)
      const { data: members } = await supabase
        .from('chat_members')
        .select('user_id')
        .eq('chat_id', chatId)
        .neq('user_id', senderId);

      if (!members || members.length === 0) {
        return new Response(JSON.stringify({ ok: true, message: 'No members to notify' }), { status: 200 });
      }

      const memberIds = members.map((m: { user_id: string }) => m.user_id);

      const { data: tokens } = await supabase
        .from('push_tokens')
        .select('token')
        .in('user_id', memberIds);

      if (!tokens || tokens.length === 0) {
        return new Response(JSON.stringify({ ok: true, message: 'No tokens' }), { status: 200 });
      }

      const messages: ExpoPushMessage[] = tokens.map((t: { token: string }) => ({
        to: t.token,
        title: senderName,
        body: messageBody,
        data: { type: 'message', chatId },
        sound: 'default',
        channelId: 'default',
      }));

      await sendExpoPushNotifications(messages);
    }

    // ------------------------------------------------------------------
    // CASO 2: Nueva solicitud de amistad
    // ------------------------------------------------------------------
    if (table === 'friendships') {
      // Solo procesar cuando se crea una nueva solicitud (status = 'pending')
      const status = record.status as string;
      if (status !== 'pending') {
        return new Response(JSON.stringify({ ok: true, message: 'Not a pending request' }), { status: 200 });
      }

      const requesterId = record.user_id as string;
      const recipientId = record.friend_id as string;

      // Obtener username del que envía la solicitud
      const { data: requesterProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', requesterId)
        .single();

      const requesterName = requesterProfile?.username || 'Alguien';

      // Obtener los push tokens del receptor
      const { data: tokens } = await supabase
        .from('push_tokens')
        .select('token')
        .eq('user_id', recipientId);

      if (!tokens || tokens.length === 0) {
        return new Response(JSON.stringify({ ok: true, message: 'No tokens for recipient' }), { status: 200 });
      }

      const messages: ExpoPushMessage[] = tokens.map((t: { token: string }) => ({
        to: t.token,
        title: '¡Nueva solicitud de amistad! 👋',
        body: `${requesterName} quiere ser tu amigo`,
        data: { type: 'friend_request', requesterId },
        sound: 'default',
        channelId: 'default',
      }));

      await sendExpoPushNotifications(messages);
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[push] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
