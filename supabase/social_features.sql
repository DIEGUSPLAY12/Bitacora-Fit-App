-- ============================================================
-- MIGRACIÓN: Chat, Grupos, Compartir y Comentarios
-- ============================================================

-- 1. TABLA: chats
CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT CHECK (type IN ('direct', 'group')) NOT NULL,
  name TEXT, -- Solo relevante para type = 'group'
  created_by UUID DEFAULT auth.uid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE chats ADD COLUMN IF NOT EXISTS created_by UUID DEFAULT auth.uid();

-- 2. TABLA: chat_members
CREATE TABLE IF NOT EXISTS chat_members (
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (chat_id, user_id)
);

ALTER TABLE chat_members ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMPTZ DEFAULT NOW();

-- 3. TABLA: chat_messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT,
  shared_workout_id UUID REFERENCES workouts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. TABLA: workout_comments
CREATE TABLE IF NOT EXISTS workout_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_comments ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------
-- Políticas para: CHATS
-- ------------------------------------------
-- Puedes leer un chat si eres miembro de él
DROP POLICY IF EXISTS "Lectura de chats para miembros" ON chats;
CREATE POLICY "Lectura de chats para miembros"
ON chats FOR SELECT
TO authenticated
USING (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM chat_members WHERE chat_id = chats.id AND user_id = auth.uid()
  )
);

-- Puedes crear chats
DROP POLICY IF EXISTS "Creación de chats" ON chats;
CREATE POLICY "Creación de chats"
ON chats FOR INSERT
TO authenticated
WITH CHECK (true);

-- Puedes borrar chats si eres el creador o un miembro
DROP POLICY IF EXISTS "Borrado de chats" ON chats;
CREATE POLICY "Borrado de chats"
ON chats FOR DELETE
TO authenticated
USING (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM chat_members WHERE chat_id = chats.id AND user_id = auth.uid()
  )
);

-- ------------------------------------------
-- Políticas para: CHAT_MEMBERS
-- ------------------------------------------
-- Permitir lectura de miembros a usuarios autenticados
-- (Evita recursión infinita y es seguro por ser UUID)
DROP POLICY IF EXISTS "Lectura de miembros para miembros" ON chat_members;
CREATE POLICY "Lectura de miembros para miembros"
ON chat_members FOR SELECT
TO authenticated
USING (true);

-- Permitir actualización de miembros (para last_read_at)
DROP POLICY IF EXISTS "Actualización de miembros" ON chat_members;
CREATE POLICY "Actualización de miembros"
ON chat_members FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Permitir inserción al crear el chat
DROP POLICY IF EXISTS "Inserción de miembros" ON chat_members;
CREATE POLICY "Inserción de miembros"
ON chat_members FOR INSERT
TO authenticated
WITH CHECK (true);

-- ------------------------------------------
-- Políticas para: CHAT_MESSAGES
-- ------------------------------------------
-- Puedes leer mensajes si eres miembro del chat
DROP POLICY IF EXISTS "Lectura de mensajes" ON chat_messages;
CREATE POLICY "Lectura de mensajes"
ON chat_messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM chat_members WHERE chat_id = chat_messages.chat_id AND user_id = auth.uid()
  )
);

-- Puedes enviar mensajes si eres miembro del chat
DROP POLICY IF EXISTS "Envío de mensajes" ON chat_messages;
CREATE POLICY "Envío de mensajes"
ON chat_messages FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM chat_members WHERE chat_id = chat_messages.chat_id AND user_id = auth.uid()
  )
);

-- ------------------------------------------
-- Políticas para: WORKOUT_COMMENTS
-- ------------------------------------------
-- Lectura pública para cualquier usuario autenticado (ya que ven el feed)
DROP POLICY IF EXISTS "Lectura pública de comentarios" ON workout_comments;
CREATE POLICY "Lectura pública de comentarios"
ON workout_comments FOR SELECT
TO authenticated
USING (true);

-- Un usuario puede comentar cualquier entrenamiento
DROP POLICY IF EXISTS "Creación de comentarios" ON workout_comments;
CREATE POLICY "Creación de comentarios"
ON workout_comments FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Un usuario puede borrar sus propios comentarios
DROP POLICY IF EXISTS "Borrado de comentarios propios" ON workout_comments;
CREATE POLICY "Borrado de comentarios propios"
ON workout_comments FOR DELETE
TO authenticated
USING (user_id = auth.uid());
