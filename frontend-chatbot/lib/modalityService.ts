import { supabase } from './supabaseClient';

export interface Modality {
  id_modality: number;
  type: string;
}

export class ModalityService {
  /**
   * Obtener todas las modalidades disponibles
   */
  static async getModalities(): Promise<{ success: boolean; data?: Modality[]; error?: string }> {
    try {
      console.log('🔍 Obteniendo modalidades...');
      
      const { data, error } = await supabase
        .from('Modality')
        .select('id_modality, type')
        .order('id_modality', { ascending: true });

      if (error) {
        console.error('❌ Error obteniendo modalidades:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ Modalidades obtenidas: ${data.length} registros`);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Error en getModalities:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  /**
   * Obtener una modalidad específica por ID
   */
  static async getModalityById(id: number): Promise<{ success: boolean; data?: Modality; error?: string }> {
    try {
      console.log(`🔍 Obteniendo modalidad con ID: ${id}`);
      
      const { data, error } = await supabase
        .from('Modality')
        .select('id_modality, type')
        .eq('id_modality', id)
        .single();

      if (error) {
        console.error('❌ Error obteniendo modalidad:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Modalidad obtenida:', data);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Error en getModalityById:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  /**
   * Crear una nueva modalidad
   */
  static async createModality(type: string): Promise<{ success: boolean; data?: Modality; error?: string }> {
    try {
      console.log(`🔍 Creando modalidad: ${type}`);
      
      const { data, error } = await supabase
        .from('Modality')
        .insert([{ type }])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creando modalidad:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Modalidad creada:', data);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Error en createModality:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }
}
