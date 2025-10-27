import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const { 
  EXPO_PUBLIC_SUPABASE_URL, 
  EXPO_PUBLIC_SUPABASE_ANON_KEY,
  EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY 
} = Constants.expoConfig.extra;

if (!EXPO_PUBLIC_SUPABASE_URL || !EXPO_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Faltan variables de entorno para Supabase');
}

// Cliente para operaciones normales (con clave anónima)
export const supabase = createClient(EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY);

// Cliente para operaciones de administración (con service role key)
export const supabaseAdmin = createClient(
  EXPO_PUBLIC_SUPABASE_URL, 
  EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || EXPO_PUBLIC_SUPABASE_ANON_KEY
);

export const testConnection = async () => {
  try {
    const { data, error } = await supabase.from("User").select("*").limit(1);
    if (error) throw error;
    console.log('✅ Conexión Supabase OK:', data);
    return data;
  } catch (err) {
    console.error('❌ Error testConnection:', err);
    return null;
  }
};
