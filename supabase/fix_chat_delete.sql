-- Permite a los miembros de un chat (o a su creador) eliminar el chat
-- Esto es útil para borrar chats con usuarios eliminados.

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
