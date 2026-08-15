-- ============================================================
-- MIGRACIÓN COMPLETA — Bitácora Fit App — Nuevas Features
-- Ejecutar de UNA VEZ en el SQL Editor de Supabase
-- ============================================================

-- 1. Ampliar tabla profiles
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS birth_date DATE,
  ADD COLUMN IF NOT EXISTS goal TEXT CHECK (goal IN ('muscle', 'weight_loss', 'endurance', 'wellness')),
  ADD COLUMN IF NOT EXISTS experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
  ADD COLUMN IF NOT EXISTS weight_unit TEXT DEFAULT 'kg' CHECK (weight_unit IN ('kg', 'lbs')),
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

-- 2. Campo de plantilla en workouts
ALTER TABLE workouts
  ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT false;

-- 3. Tabla de registros de peso corporal
CREATE TABLE IF NOT EXISTS body_weight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  weight_kg NUMERIC NOT NULL,
  logged_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE body_weight_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gestión completa de pesos propios"
ON body_weight_logs FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Actualizar política de perfiles para respetar privacidad
DROP POLICY IF EXISTS "Lectura pública de perfiles" ON profiles;

CREATE POLICY "Lectura de perfiles"
ON profiles FOR SELECT
TO authenticated
USING (
  is_public = true
  OR id = auth.uid()
);
