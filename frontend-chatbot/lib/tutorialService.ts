import { AuthService } from './authService';
import { supabase } from './supabaseClient';

export interface TutorialEstado {
  user_id: string;
  visto: boolean;
  fecha?: string;
}

export class TutorialService {
  /**
   * Verifica si el usuario ya vio el tutorial
   */
  static async hasSeenTutorial(): Promise<boolean> {
    try {
      const sessionData = await AuthService.loadSession();
      
      if (!sessionData?.user) {
        return false;
      }

      const userId = sessionData.user.id;

      const { data, error } = await supabase
        .from('tutorial_estado')
        .select('visto')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error checking tutorial status:', error);
        return false;
      }

      const hasSeen = data?.visto === true;
      return hasSeen;
    } catch (error) {
      console.error('Error in hasSeenTutorial:', error);
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

      const userId = sessionData.user.id;

      // Primero intentar insertar
      const { error: insertError } = await supabase
        .from('tutorial_estado')
        .insert({
          user_id: userId,
          visto: true,
          fecha: new Date().toISOString()
        });

      // Si falla por duplicado, hacer update
      if (insertError && insertError.code === '23505') {
        const { error: updateError } = await supabase
          .from('tutorial_estado')
          .update({
            visto: true,
            fecha: new Date().toISOString()
          })
          .eq('user_id', userId);

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

      const userId = sessionData.user.id;

      const { error } = await supabase
        .from('tutorial_estado')
        .upsert({
          user_id: userId,
          visto: false,
          fecha: new Date().toISOString()
        }, {
          onConflict: 'user_id'
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
