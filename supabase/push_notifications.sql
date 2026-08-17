-- ============================================================
-- MIGRACIÓN: Push Notifications — BítacoraFit
-- Ejecutar en el SQL Editor de Supabase (una sola vez)
-- ============================================================

-- 1. TABLA: push_tokens
-- Almacena el Expo Push Token de cada dispositivo, asociado al usuario.
-- Un mismo usuario puede tener múltiples tokens (varios dispositivos).
CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  token TEXT NOT NULL,
  platform TEXT CHECK (platform IN ('ios', 'android')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Evita guardar el mismo token dos veces para el mismo usuario
  UNIQUE(user_id, token)
);

ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- Solo el propio usuario puede leer y gestionar sus tokens
CREATE POLICY "Gestión de push tokens propios"
ON push_tokens FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Permitir a Edge Functions leer todos los tokens (necesario para enviar notificaciones)
-- Las Edge Functions se ejecutan con el rol service_role, que bypasea RLS
-- No es necesaria una policy adicional para service_role

-- ============================================================
-- 2. EXTENSIÓN pg_net (necesaria para llamar a URLs externas)
-- Habilitar si no está ya habilitada en Database > Extensions
-- ============================================================
-- CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================================
-- 3. FUNCIÓN AUXILIAR: get_chat_member_tokens
-- Obtiene los push tokens de todos los miembros de un chat,
-- EXCEPTO el que envió el mensaje (para no notificarte a ti mismo).
-- ============================================================
CREATE OR REPLACE FUNCTION get_chat_member_tokens(p_chat_id UUID, p_sender_id UUID)
RETURNS TABLE(token TEXT, user_id UUID) 
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT pt.token, pt.user_id
  FROM push_tokens pt
  INNER JOIN chat_members cm ON cm.user_id = pt.user_id
  WHERE cm.chat_id = p_chat_id
    AND cm.user_id != p_sender_id;
$$;

-- ============================================================
-- 4. FUNCIÓN AUXILIAR: get_friendship_request_tokens
-- Obtiene los push tokens del usuario que recibe una solicitud.
-- ============================================================
CREATE OR REPLACE FUNCTION get_friend_request_tokens(p_friend_id UUID)
RETURNS TABLE(token TEXT, user_id UUID)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT pt.token, pt.user_id
  FROM push_tokens pt
  WHERE pt.user_id = p_friend_id;
$$;

-- ============================================================
-- INSTRUCCIONES PARA CONFIGURAR LAS EDGE FUNCTIONS
-- ============================================================
-- Después de ejecutar este SQL, debes crear la Edge Function
-- en el dashboard de Supabase: Functions > New Function
-- Nombre: "send-push-notification"
-- El código de la función está en:
-- supabase/functions/send-push-notification/index.ts
-- ============================================================
