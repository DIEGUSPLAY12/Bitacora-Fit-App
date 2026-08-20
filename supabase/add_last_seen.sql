-- Este script añade la columna last_seen_at a la tabla profiles
-- Sirve para rastrear la última vez que el usuario abrió la app 
-- y así poder mostrar el doble check gris (Entregado) en los chats.

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ DEFAULT NOW();
