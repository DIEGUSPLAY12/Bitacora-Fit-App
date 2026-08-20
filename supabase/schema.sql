-- ==========================================
-- 1. CREACIÓN DE TABLAS
-- ==========================================

-- Tabla de perfiles, vinculada 1 a 1 con auth.users de Supabase
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Tabla de catálogo de ejercicios (datos estáticos, poblados por admin/script)
CREATE TABLE exercises (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  equipment TEXT,
  target TEXT,
  muscle_group TEXT,
  secondary_muscles TEXT[],
  instructions_es TEXT,
  image_url TEXT,
  gif_url TEXT
);

-- Tabla de entrenamientos registrados
CREATE TABLE workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  finished_at TIMESTAMPTZ,
  notes TEXT
);

-- Tabla intermedia que vincula un ejercicio al entrenamiento
CREATE TABLE workout_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE NOT NULL,
  exercise_id TEXT REFERENCES exercises(id) ON DELETE CASCADE NOT NULL,
  order_index INT NOT NULL
);

-- Tabla de las series (sets) para cada ejercicio de un entrenamiento
CREATE TABLE sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_exercise_id UUID REFERENCES workout_exercises(id) ON DELETE CASCADE NOT NULL,
  set_number INT NOT NULL,
  weight_kg NUMERIC NOT NULL,
  reps INT NOT NULL,
  rpe NUMERIC
);

-- Tabla de amistades para la capa social
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  friend_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'accepted')) NOT NULL,
  UNIQUE(user_id, friend_id) -- Evitar solicitudes duplicadas
);

-- ==========================================
-- 2. TRIGGERS
-- ==========================================

-- Función que inserta un registro en "profiles" tras un nuevo registro en Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (new.id, new.email); -- Usamos el email como username provisional
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger disparado "on insert" en auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==========================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Activar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------
-- Políticas para: PROFILES
-- ------------------------------------------
-- Permite a cualquier usuario autenticado ver todos los perfiles (necesario para el feed social y buscar amigos)
CREATE POLICY "Lectura pública de perfiles" 
ON profiles FOR SELECT 
TO authenticated 
USING (true);

-- Un usuario solo puede actualizar su propio perfil
CREATE POLICY "Actualización de perfil propio" 
ON profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);

-- ------------------------------------------
-- Políticas para: EXERCISES
-- ------------------------------------------
-- Cualquier usuario autenticado puede leer el catálogo de ejercicios
CREATE POLICY "Lectura pública de ejercicios" 
ON exercises FOR SELECT 
TO authenticated 
USING (true);
-- (No se añaden políticas de INSERT/UPDATE/DELETE intencionalmente, solo lectura desde la app)

-- ------------------------------------------
-- Políticas para: FRIENDSHIPS
-- ------------------------------------------
-- Permite leer y escribir a los usuarios que son parte de la amistad (ya sea como user_id o friend_id)
CREATE POLICY "Gestión completa de amistades involucradas" 
ON friendships FOR ALL 
TO authenticated 
USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- ------------------------------------------
-- Políticas para: WORKOUTS
-- ------------------------------------------
-- Un usuario puede insertar, actualizar o borrar solo sus propios entrenamientos
CREATE POLICY "Gestión completa de entrenamientos propios" 
ON workouts FOR ALL 
TO authenticated 
USING (auth.uid() = user_id);

-- Un usuario puede leer entrenamientos propios (ya cubierto por la anterior, pero Supabase lo requiere si son distintas) y los de sus amigos aceptados
CREATE POLICY "Lectura de entrenamientos de amigos" 
ON workouts FOR SELECT 
TO authenticated 
USING (
  user_id IN (
    -- Busca todos los UUIDs de personas con las que el usuario actual tiene una amistad 'accepted'
    SELECT friend_id FROM friendships WHERE user_id = auth.uid() AND status = 'accepted'
    UNION
    SELECT user_id FROM friendships WHERE friend_id = auth.uid() AND status = 'accepted'
  )
);

-- ------------------------------------------
-- Políticas para: WORKOUT_EXERCISES
-- ------------------------------------------
-- Un usuario puede gestionar los ejercicios dentro de sus propios entrenamientos
CREATE POLICY "Gestión completa de workout_exercises propios" 
ON workout_exercises FOR ALL 
TO authenticated 
USING (
  workout_id IN (
    SELECT id FROM workouts WHERE user_id = auth.uid()
  )
);

-- Un usuario puede leer los ejercicios de los entrenamientos de sus amigos
CREATE POLICY "Lectura de workout_exercises de amigos" 
ON workout_exercises FOR SELECT 
TO authenticated 
USING (
  workout_id IN (
    SELECT id FROM workouts WHERE user_id IN (
      SELECT friend_id FROM friendships WHERE user_id = auth.uid() AND status = 'accepted'
      UNION
      SELECT user_id FROM friendships WHERE friend_id = auth.uid() AND status = 'accepted'
    )
  )
);

-- ------------------------------------------
-- Políticas para: SETS
-- ------------------------------------------
-- Un usuario puede gestionar las series de sus propios ejercicios y entrenamientos
CREATE POLICY "Gestión completa de sets propios" 
ON sets FOR ALL 
TO authenticated 
USING (
  workout_exercise_id IN (
    SELECT id FROM workout_exercises WHERE workout_id IN (
      SELECT id FROM workouts WHERE user_id = auth.uid()
    )
  )
);

-- Un usuario puede leer las series de los entrenamientos de sus amigos
CREATE POLICY "Lectura de sets de amigos" 
ON sets FOR SELECT 
TO authenticated 
USING (
  workout_exercise_id IN (
    SELECT id FROM workout_exercises WHERE workout_id IN (
      SELECT id FROM workouts WHERE user_id IN (
        SELECT friend_id FROM friendships WHERE user_id = auth.uid() AND status = 'accepted'
        UNION
        SELECT user_id FROM friendships WHERE friend_id = auth.uid() AND status = 'accepted'
      )
    )
  )
);
