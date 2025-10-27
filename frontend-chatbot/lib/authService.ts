import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, supabaseAdmin } from './supabaseClient';

// Interfaces de TypeScript
interface User {
  id: number;
  first_name: string;
  last_name: string;
  institutional_email: string;
  rut: string;
  gender: boolean;
  phone: string;
  created_at: string;
  modality_id: number;
}

interface AuthResult {
  success: boolean;
  error?: string;
  user?: User;
  email?: string;
  message?: string;
  data?: any;
  session?: any;
  password?: string;
}

interface SessionData {
  session?: {
    access_token?: string;
    refresh_token?: string;
    expires_at?: number;
  };
  user?: any;
}

// Claves para AsyncStorage
const STORAGE_KEYS = {
  USER_SESSION: 'user_session',
  USER_DATA: 'user_data',
  LAST_LOGIN: 'last_login'
};

export class AuthService {

  // Normalizar RUT: quita puntos pero mantiene guión y dígito verificador en minúscula
  static normalizeRut(rut: string): string {
    let cleaned = rut.replace(/[^0-9kK-]/g, '');
    // DV siempre en minúscula
    cleaned = cleaned.replace(/K$/, 'k');
    return cleaned;
  }

  // Buscar usuario en BD por RUT
  static async findUserByRut(rut: string): Promise<AuthResult> {
    try {
      const cleanRut = this.normalizeRut(rut);
      const { data, error } = await supabase
        .from('User')
        .select('id, first_name, last_name, institutional_email, rut, gender, phone, created_at, modality_id')
        .eq('rut', cleanRut)
        .single();

      if (error) {
        console.error('❌ Error en Supabase:', error);
        return { success: false, error: 'Usuario no encontrado. Verifica que el RUT sea correcto.' };
      }

      return { success: true, user: data };
    } catch (err) {
      console.error('❌ Error interno en findUserByRut:', err);
      return { success: false, error: 'Error interno' };
    }
  }

  // Verificar si existe en Supabase Auth; si no, crear
  static async ensureAuthUser(email: string, user: User): Promise<AuthResult> {
    try {
      console.log(`🔧 Intentando crear usuario ${email} en Supabase Auth...`);
      // Intentar crear usuario directamente (si ya existe, fallará)
      const password = Math.random().toString(36).slice(-8);
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: user.first_name,
          last_name: user.last_name,
          rut: user.rut,
          gender: user.gender,
          phone: user.phone,
          modality_id: user.modality_id
        }
      });

      if (error) {
        console.log(`⚠️ Error al crear usuario: ${error.message}`);
        console.log(`🔍 Código de error: ${error.status}`);
        // Si el error es que el usuario ya existe, está bien
        if (error.message.includes('already registered') || 
            error.message.includes('already exists') ||
            error.message.includes('User already registered') ||
            error.message.includes('A user with this email address has already been registered') ||
            error.status === 422) {
          console.log(`✅ Usuario ${email} ya existe en Supabase Auth`);
          // Para usuarios existentes, necesitamos usar una contraseña temporal
          // En un caso real, podrías usar un token temporal o resetear la contraseña
          return { success: true, password: 'temp_password_' + Math.random().toString(36).slice(-8) };
        }
        console.error(`❌ Error creando usuario: ${error.message}`);
        return { success: false, error: error.message };
      }
      
      console.log(`✅ Usuario ${email} creado en Supabase Auth`);
      return { success: true, password };
    } catch (err) {
      console.error('❌ Error inesperado en ensureAuthUser:', err);
      return { success: false, error: 'Error interno' };
    }
  }

  // Crear sesión automática sin correo
  static async createAutomaticSession(user: User): Promise<AuthResult> {
    try {
      console.log(`🔐 Creando sesión automática para: ${user.institutional_email}`);
      
      // Crear una sesión simulada con los datos del usuario
      const mockSession = {
        access_token: 'mock_token_' + Math.random().toString(36).slice(-8),
        refresh_token: 'mock_refresh_' + Math.random().toString(36).slice(-8),
        expires_at: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 horas
        user: {
          id: user.id,
          email: user.institutional_email,
          user_metadata: {
            first_name: user.first_name,
            last_name: user.last_name,
            rut: user.rut,
            gender: user.gender,
            phone: user.phone,
            modality_id: user.modality_id
          }
        }
      };

      // Guardar la sesión simulada
      await this.saveSession({ session: mockSession, user: mockSession.user });
      
      console.log(`✅ Sesión automática creada exitosamente`);
      return { success: true, session: mockSession, user: mockSession.user as any };
    } catch (err) {
      console.error('❌ Error inesperado en createAutomaticSession:', err);
      return { success: false, error: 'Error interno' };
    }
  }

  // Flujo completo: autenticar por RUT
  static async authenticateByRut(rut: string): Promise<AuthResult> {
    try {
      console.log(`🔍 Paso 1: Buscando usuario en BD con RUT: ${rut}`);
      const userResult = await this.findUserByRut(rut);
      if (!userResult.success || !userResult.user) {
        console.log(`❌ Paso 1 falló: Usuario no encontrado`);
        return { success: false, error: 'Usuario no encontrado. Verifica que el RUT sea correcto.' };
      }
      console.log(`✅ Paso 1 exitoso: Usuario encontrado: ${userResult.user.institutional_email}`);

      const user = userResult.user;

      console.log(`🔍 Paso 2: Asegurando usuario en Supabase Auth`);
      // Validar o crear en Supabase Auth
      const authUser = await this.ensureAuthUser(user.institutional_email, user);
      if (!authUser.success) {
        console.log(`❌ Paso 2 falló: ${authUser.error}`);
        return { success: false, error: authUser.error };
      }
      console.log(`✅ Paso 2 exitoso: Usuario verificado/creado en Auth`);

      console.log(`🔍 Paso 3: Creando sesión automática`);
      // Crear sesión automática sin correo
      const sessionResult = await this.createAutomaticSession(user);
      if (!sessionResult.success) {
        console.log(`❌ Paso 3 falló: ${sessionResult.error}`);
        return { success: false, error: sessionResult.error };
      }
      console.log(`✅ Paso 3 exitoso: Sesión creada automáticamente`);

      return {
        success: true,
        message: 'Sesión iniciada correctamente',
        user,
        email: user.institutional_email,
        session: sessionResult.session
      };
    } catch (err) {
      console.error('❌ Error inesperado en authenticateByRut:', err);
      return { success: false, error: 'Error interno' };
    }
  }

  // Guardar sesión en AsyncStorage
  static async saveSession(session: SessionData): Promise<void> {
    try {
      const sessionData = {
        access_token: session.session?.access_token,
        refresh_token: session.session?.refresh_token,
        expires_at: session.session?.expires_at,
        user: session.user,
        timestamp: Date.now()
      };
      await AsyncStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(sessionData));
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_LOGIN, Date.now().toString());
    } catch (err) {
      console.error('Error guardando sesión:', err);
    }
  }

  // Cargar sesión
  static async loadSession(): Promise<SessionData | null> {
    try {
      const sessionData = await AsyncStorage.getItem(STORAGE_KEYS.USER_SESSION);
      if (!sessionData) return null;
      const session = JSON.parse(sessionData);
      if (session.expires_at && Date.now() > session.expires_at * 1000) {
        await this.clearSession();
        return null;
      }
      return session;
    } catch (err) {
      return null;
    }
  }

  // Verificar sesión válida
  static async checkValidSession(): Promise<{ isValid: boolean; session: any }> {
    try {
      const session = await this.loadSession();
      if (!session) return { isValid: false, session: null };
      
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) {
        await this.clearSession();
        return { isValid: false, session: null };
      }
      
      return { isValid: true, session: data.session };
    } catch (err) {
      console.error('❌ Error verificando sesión:', err);
      return { isValid: false, session: null };
    }
  }

  // Cerrar sesión
  static async logout(): Promise<AuthResult> {
    try {
      await supabase.auth.signOut();
      await this.clearSession();
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Error interno' };
    }
  }

  // Limpiar AsyncStorage
  static async clearSession(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.USER_SESSION,
        STORAGE_KEYS.USER_DATA,
        STORAGE_KEYS.LAST_LOGIN
      ]);
    } catch (err) {
      console.error('Error limpiando sesión:', err);
    }
  }

  // Obtener usuario actual
  static async getCurrentUser() {
    try {
      const session = await this.loadSession();
      return session?.user || null;
    } catch {
      return null;
    }
  }

  // Test conexión
  static async testConnection() {
    try {
      const { data, error } = await supabase.from("User").select("*").limit(1);
      return !error;
    } catch {
      return false;
    }
  }
}
