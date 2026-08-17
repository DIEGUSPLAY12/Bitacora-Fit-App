import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persiste el refresh token en AsyncStorage para sobrevivir cierres de la app
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // En React Native no hay URL de redirección OAuth, evita warnings
    detectSessionInUrl: false,
  },
});
