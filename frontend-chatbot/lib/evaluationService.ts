import { AuthService } from './authService';
import { supabase } from './supabaseClient';

export interface EvaluationData {
  nombre: string;
  correo: string;
  modalidad: 'Sede' | '100% Online';
  calificacion: number;
  comentario?: string;
}

export class EvaluationService {
  /**
   * Inserta una nueva evaluación en la base de datos con validación automática
   */
  static async submitEvaluation(evaluationData: EvaluationData): Promise<{ success: boolean; error?: string }> {
    try {
      // Validar sesión y obtener usuario actual
      const sessionData = await AuthService.loadSession();
      
      if (!sessionData?.user) {
        return { success: false, error: 'Usuario no autenticado' };
      }

      // Validar que el correo coincida con el usuario en sesión
      const userEmail = sessionData.user.email || sessionData.user.user_metadata?.email;
      if (userEmail !== evaluationData.correo) {
        return { success: false, error: 'El correo no coincide con el usuario en sesión' };
      }

      // Insertar evaluación automáticamente
      const { error } = await supabase
        .from('calificaciones')
        .insert([{
          nombre: evaluationData.nombre,
          correo: evaluationData.correo,
          modalidad: evaluationData.modalidad,
          calificacion: evaluationData.calificacion,
          comentario: evaluationData.comentario || null,
          fecha: new Date().toISOString()
        }]);

      if (error) {
        console.error('Error insertando evaluación:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error en submitEvaluation:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }
}