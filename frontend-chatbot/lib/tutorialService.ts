import { AuthService } from './authService';
import { supabase } from './supabaseClient';

export interface TutorialStatus {
  id: number;
  rut: string;  // Cambiar de user_id a rut (TEXT)
  seen: boolean;
  date: string;
}

export class TutorialService {
  /**
   * Verifica si el usuario ya vio el tutorial
   * Consulta: SELECT * FROM tutorial_status WHERE rut = ?
   * Si no hay registro → usuario nunca vio el tutorial → retorna false
   * Si existe registro con seen = true → retorna true
   * Si existe registro con seen = false → retorna false
   */
  static async hasSeenTutorial(): Promise<boolean> {
    try {
      const sessionData = await AuthService.loadSession();
      
      if (!sessionData?.user) {
        console.log('❌ No hay sesión de usuario');
        return false;
      }

      const userRut = sessionData.user.user_metadata?.rut || sessionData.user.id;
      console.log('🔍 Verificando tutorial para usuario:', userRut);

      // SELECT * FROM tutorial_status WHERE rut = ?
      const { data, error } = await supabase
        .from('Tutorial_status')
        .select('*')
        .eq('rut', userRut)
        .limit(1);

      if (error) {
        console.error('❌ Error checking tutorial status:', error);
        return false;
      }

      console.log('📊 Datos de tutorial:', data);
      
      // Si no hay registro → el usuario nunca vio el tutorial
      if (!data || data.length === 0) {
        console.log('📝 No existe registro - usuario nunca vio el tutorial');
        return false;
      }

      // Si existe registro, verificar si seen = true
      const hasSeen = data[0].seen === true;
      console.log('✅ Tutorial visto:', hasSeen);
      return hasSeen;
    } catch (error) {
      console.error('❌ Error in hasSeenTutorial:', error);
      return false;
    }
  }

  /**
   * Marca el tutorial como visto para el usuario actual
   */
  static async markTutorialAsSeen(): Promise<{ success: boolean; error?: string }> {
    try {
      const sessionData = await AuthService.loadSession();
      
      if (!sessionData?.user) {
        return { success: false, error: 'Usuario no autenticado' };
      }

      const userRut = sessionData.user.user_metadata?.rut || sessionData.user.id;

      // Primero intentar insertar
      const { error: insertError } = await supabase
        .from('Tutorial_status')
        .insert({
          rut: userRut,
          seen: true,
          date: new Date().toISOString()
        });

      // Si falla por duplicado, hacer update
      if (insertError && insertError.code === '23505') {
        const { error: updateError } = await supabase
          .from('Tutorial_status')
          .update({
            seen: true,
            date: new Date().toISOString()
          })
          .eq('rut', userRut);

        if (updateError) {
          console.error('Error updating tutorial status:', updateError);
          return { success: false, error: updateError.message };
        }
      } else if (insertError) {
        console.error('Error inserting tutorial status:', insertError);
        return { success: false, error: insertError.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in markTutorialAsSeen:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  /**
   * Resetea el estado del tutorial (para testing o si el usuario quiere verlo de nuevo)
   */
  static async resetTutorialStatus(): Promise<{ success: boolean; error?: string }> {
    try {
      const sessionData = await AuthService.loadSession();
      
      if (!sessionData?.user) {
        return { success: false, error: 'Usuario no autenticado' };
      }

      const userRut = sessionData.user.user_metadata?.rut || sessionData.user.id;

      const { error } = await supabase
        .from('Tutorial_status')
        .upsert({
          rut: userRut,
          seen: false,
          date: new Date().toISOString()
        }, {
          onConflict: 'rut'
        });

      if (error) {
        console.error('Error resetting tutorial status:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in resetTutorialStatus:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }
}
