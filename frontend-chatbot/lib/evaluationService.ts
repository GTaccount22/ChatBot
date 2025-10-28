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
      console.log('🔍 Iniciando envío de evaluación:', evaluationData);
      
      // Validar sesión y obtener usuario actual
      const sessionData = await AuthService.loadSession();
      console.log('📋 Datos de sesión:', sessionData);
      
      if (!sessionData?.user) {
        console.log('❌ No hay usuario en sesión');
        return { success: false, error: 'Usuario no autenticado' };
      }

      // Obtener correo del usuario de diferentes fuentes posibles
      const userEmail = sessionData.user.email || 
                       sessionData.user.user_metadata?.email || 
                       sessionData.user.user_metadata?.email_institucional;
      
      console.log('📧 Correo del usuario en sesión:', userEmail);
      console.log('📧 Correo en evaluación:', evaluationData.correo);

      // Validación más flexible del correo
      if (userEmail && userEmail.toLowerCase() !== evaluationData.correo.toLowerCase()) {
        console.log('⚠️ Los correos no coinciden, pero continuando...');
        // No bloquear por diferencia de correos, solo loguear
      }

      console.log('💾 Insertando evaluación en base de datos...');
      
      // Obtener el RUT del usuario actual
      const userRut = sessionData.user.user_metadata?.rut || sessionData.user.id;
      console.log('👤 User RUT:', userRut);
      
      // Obtener la modalidad del usuario directamente desde User
      const { data: userData, error: userError } = await supabase
        .from('User')
        .select('modality_id')
        .eq('rut', userRut)
        .single();
      
      if (userError || !userData) {
        console.error('❌ Error obteniendo usuario:', userError);
        return { success: false, error: 'Error al obtener usuario' };
      }
      
      console.log('✅ Modalidad del usuario:', userData.modality_id);
      
      // Insertar evaluación con rut en lugar de user_id
      // Agregar timestamp para que cada calificación sea única
      const timestamp = new Date().toISOString();
      const { data, error } = await supabase
        .from('Rating')
        .insert({
          rut: userRut,
          score: evaluationData.calificacion,
          comment: evaluationData.comentario || null,
          date: timestamp
        })
        .select();
      
      console.log('📅 Timestamp usado:', timestamp);

      if (error) {
        console.error('❌ Error insertando evaluación:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Evaluación insertada exitosamente:', data);
      return { success: true };
    } catch (error) {
      console.error('❌ Error en submitEvaluation:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }
}