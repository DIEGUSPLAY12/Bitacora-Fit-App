-- ============================================================
-- TRIGGERS: Disparar notificaciones push en eventos clave
-- Ejecutar DESPUÉS de push_notifications.sql
-- Requiere: extensión pg_net habilitada + Edge Function desplegada
-- ============================================================

-- ============================================================
-- VARIABLES DE CONFIGURACIÓN
-- Cambia estos valores por los de tu proyecto:
-- SUPABASE_URL: Settings > API > Project URL
-- SERVICE_ROLE_KEY: Settings > API > service_role key (secret)
-- ============================================================

-- ============================================================
-- TRIGGER 1: Notificación de nuevo mensaje en chat
-- Se dispara después de cada INSERT en chat_messages
-- ============================================================

CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tokens TEXT[];
  v_sender_username TEXT;
  v_supabase_url TEXT;
  v_service_role_key TEXT;
BEGIN
  -- Obtener configuración desde secrets de Supabase
  -- (configurar en Dashboard > Settings > Vault)
  v_supabase_url := current_setting('app.supabase_url', true);
  v_service_role_key := current_setting('app.service_role_key', true);

  -- Si no hay URL configurada, usar directamente la URL hardcodeada
  -- IMPORTANTE: sustituye esto por tu URL real de Supabase
  IF v_supabase_url IS NULL OR v_supabase_url = '' THEN
    v_supabase_url := 'https://semregakfjhhhphkmuab.supabase.co';
  END IF;

  -- Obtener el username del remitente
  SELECT username INTO v_sender_username
  FROM profiles
  WHERE id = NEW.user_id;

  -- Obtener los push tokens de los miembros del chat (excepto el remitente)
  SELECT ARRAY_AGG(token)
  INTO v_tokens
  FROM get_chat_member_tokens(NEW.chat_id, NEW.user_id);

  -- Si no hay tokens, salir
  IF v_tokens IS NULL OR array_length(v_tokens, 1) = 0 THEN
    RETURN NEW;
  END IF;

  -- Llamar a la Edge Function via pg_net (HTTP POST async)
  PERFORM net.http_post(
    url := v_supabase_url || '/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_service_role_key
    ),
    body := jsonb_build_object(
      'tokens', v_tokens,
      'title', COALESCE(v_sender_username, 'Nuevo mensaje'),
      'body', CASE 
        WHEN NEW.content IS NOT NULL THEN LEFT(NEW.content, 100)
        ELSE 'Te ha enviado un entrenamiento'
      END,
      'data', jsonb_build_object(
        'type', 'message',
        'chatId', NEW.chat_id::TEXT
      )
    )::TEXT
  );

  RETURN NEW;
END;
$$;

-- Crear el trigger (eliminar si ya existe)
DROP TRIGGER IF EXISTS on_new_chat_message ON chat_messages;
CREATE TRIGGER on_new_chat_message
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();

-- ============================================================
-- TRIGGER 2: Notificación de solicitud de amistad
-- Se dispara después de cada INSERT en friendships con status='pending'
-- ============================================================

CREATE OR REPLACE FUNCTION notify_friend_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tokens TEXT[];
  v_requester_username TEXT;
  v_supabase_url TEXT;
  v_service_role_key TEXT;
BEGIN
  -- Solo notificar cuando el status es 'pending' (nueva solicitud)
  IF NEW.status != 'pending' THEN
    RETURN NEW;
  END IF;

  v_supabase_url := current_setting('app.supabase_url', true);
  v_service_role_key := current_setting('app.service_role_key', true);

  IF v_supabase_url IS NULL OR v_supabase_url = '' THEN
    v_supabase_url := 'https://semregakfjhhhphkmuab.supabase.co';
  END IF;

  -- Obtener el username del que envía la solicitud
  SELECT username INTO v_requester_username
  FROM profiles
  WHERE id = NEW.user_id;

  -- Obtener los push tokens del receptor de la solicitud
  SELECT ARRAY_AGG(token)
  INTO v_tokens
  FROM get_friend_request_tokens(NEW.friend_id);

  IF v_tokens IS NULL OR array_length(v_tokens, 1) = 0 THEN
    RETURN NEW;
  END IF;

  -- Llamar a la Edge Function
  PERFORM net.http_post(
    url := v_supabase_url || '/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_service_role_key
    ),
    body := jsonb_build_object(
      'tokens', v_tokens,
      'title', '¡Nueva solicitud de amistad! 👋',
      'body', COALESCE(v_requester_username, 'Alguien') || ' quiere ser tu amigo',
      'data', jsonb_build_object(
        'type', 'friend_request',
        'requesterId', NEW.user_id::TEXT
      )
    )::TEXT
  );

  RETURN NEW;
END;
$$;

-- Crear el trigger (eliminar si ya existe)
DROP TRIGGER IF EXISTS on_new_friend_request ON friendships;
CREATE TRIGGER on_new_friend_request
  AFTER INSERT ON friendships
  FOR EACH ROW
  EXECUTE FUNCTION notify_friend_request();

-- ============================================================
-- CONFIGURACIÓN DE SECRETS (ejecutar por separado en SQL Editor)
-- Sustituye los valores por los reales de tu proyecto Supabase
-- ============================================================
-- ALTER DATABASE postgres SET app.supabase_url = 'https://semregakfjhhhphkmuab.supabase.co';
-- ALTER DATABASE postgres SET app.service_role_key = 'TU_SERVICE_ROLE_KEY';

-- ============================================================
-- ALTERNATIVA sin pg_net (usando Webhooks del dashboard):
-- Si pg_net no está disponible en tu plan, puedes configurar
-- Database Webhooks en el dashboard de Supabase:
-- Database > Webhooks > Create new webhook
-- Evento: INSERT en chat_messages → URL: tu Edge Function
-- Evento: INSERT en friendships → URL: tu Edge Function
-- ============================================================
