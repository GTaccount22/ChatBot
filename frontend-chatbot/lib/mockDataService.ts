// Servicio alternativo que simula el envío de datos sin necesidad de red
import AsyncStorage from '@react-native-async-storage/async-storage';

// Detectar si estamos en web o React Native
const isWeb = typeof window !== 'undefined' && window.localStorage;

// Variables globales para almacenar datos (funciona en cualquier plataforma)
let globalEventos = {
  nuevosUsuarios: [],
  calificaciones: [],
  tutorialesCompletados: []
};

export interface NuevoUsuarioData {
  rut: string;  // Cambiar user_id a rut (string)
}

export interface NuevaCalificacionData {
  rut: string;  // Cambiar user_id a rut (string)
  score: number;
  comment?: string;
  date: string;
}

export interface TutorialCompletadoData {
  user_id: number;  // Cambiar a rut si necesario
  rut?: string;     // Agregar opcionalmente
  date: string;
  is_first_tutorial: boolean;
}

class MockDataService {
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = true;
  }

  /**
   * Simular envío de nuevo usuario
   */
  public async enviarNuevoUsuario(data: NuevoUsuarioData): Promise<boolean> {
    if (!this.isEnabled) {
      console.log('⚠️ Mock Service deshabilitado');
      return false;
    }

    try {
      console.log('🔄 Simulando envío de nuevo usuario...');
      console.log('📊 Datos:', data);
      
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Guardar en variables globales (funciona en cualquier plataforma)
      globalEventos.nuevosUsuarios.push({
        ...data,
        timestamp: new Date().toISOString()
      });
      
      // También guardar en localStorage/AsyncStorage para persistencia
      await this.guardarEventos(globalEventos);
      
      // Enviar al servidor para que la web pueda obtener los datos
      await this.enviarAlServidor('nuevo_usuario', data);
      
      console.log('✅ Usuario simulado exitosamente');
      console.log('📈 Total usuarios:', globalEventos.nuevosUsuarios.length);
      return true;
    } catch (error) {
      console.log('❌ Error al simular usuario:', error);
      return false;
    }
  }

  /**
   * Simular envío de nueva calificación
   */
  public async enviarNuevaCalificacion(data: NuevaCalificacionData): Promise<boolean> {
    if (!this.isEnabled) {
      console.log('⚠️ Mock Service deshabilitado');
      return false;
    }

    try {
      console.log('🔄 Simulando envío de nueva calificación...');
      console.log('📊 Datos:', data);
      
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Guardar en variables globales (funciona en cualquier plataforma)
      globalEventos.calificaciones.push({
        ...data,
        timestamp: new Date().toISOString()
      });
      
      // También guardar en localStorage/AsyncStorage para persistencia
      await this.guardarEventos(globalEventos);
      
      // Enviar al servidor para que la web pueda obtener los datos
      await this.enviarAlServidor('nueva_calificacion', data);
      
      console.log('✅ Calificación simulada exitosamente');
      console.log('📈 Total calificaciones:', globalEventos.calificaciones.length);
      return true;
    } catch (error) {
      console.log('❌ Error al simular calificación:', error);
      return false;
    }
  }

  /**
   * Simular envío de tutorial completado
   */
  public async enviarTutorialCompletado(data: TutorialCompletadoData): Promise<boolean> {
    if (!this.isEnabled) {
      console.log('⚠️ Mock Service deshabilitado');
      return false;
    }

    try {
      console.log('🔄 Simulando envío de tutorial completado...');
      console.log('📊 Datos:', data);
      
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Guardar en variables globales (funciona en cualquier plataforma)
      globalEventos.tutorialesCompletados.push({
        ...data,
        timestamp: new Date().toISOString()
      });
      
      // También guardar en localStorage/AsyncStorage para persistencia
      await this.guardarEventos(globalEventos);
      
      // Enviar al servidor para que la web pueda obtener los datos
      await this.enviarAlServidor('tutorial_completado', data);
      
      console.log('✅ Tutorial completado simulado exitosamente');
      console.log('📈 Total tutoriales:', globalEventos.tutorialesCompletados.length);
      return true;
    } catch (error) {
      console.log('❌ Error al simular tutorial completado:', error);
      return false;
    }
  }

  /**
   * Obtener eventos guardados (híbrido web/React Native)
   */
  private async getEventosGuardados() {
    try {
      let eventos;
      
      if (isWeb) {
        // Usar localStorage en web
        eventos = localStorage.getItem('mock_eventos');
      } else {
        // Usar AsyncStorage en React Native
        eventos = await AsyncStorage.getItem('mock_eventos');
      }
      
      if (eventos) {
        return JSON.parse(eventos);
      }
    } catch (error) {
      console.log('Error al leer eventos:', error);
    }
    
    return {
      nuevosUsuarios: [],
      calificaciones: [],
      tutorialesCompletados: []
    };
  }

  /**
   * Guardar eventos (híbrido web/React Native)
   */
  private async guardarEventos(eventos: any) {
    try {
      const eventosString = JSON.stringify(eventos);
      
      if (isWeb) {
        // Usar localStorage en web
        localStorage.setItem('mock_eventos', eventosString);
      } else {
        // Usar AsyncStorage en React Native
        await AsyncStorage.setItem('mock_eventos', eventosString);
      }
    } catch (error) {
      console.log('Error al guardar eventos:', error);
    }
  }

  /**
   * Obtener estadísticas (versión síncrona - usa variables globales)
   */
  public obtenerEstadisticasSync() {
    return {
      usuarios_conectados: globalEventos.nuevosUsuarios.length,
      calificaciones_totales: globalEventos.calificaciones.length,
      tutoriales_completados: globalEventos.tutorialesCompletados.length,
      ultima_actualizacion: new Date().toISOString()
    };
  }

  /**
   * Obtener estadísticas (versión async para React Native)
   */
  public async obtenerEstadisticas() {
    const eventos = await this.getEventosGuardados();
    return {
      usuarios_conectados: eventos.nuevosUsuarios.length,
      calificaciones_totales: eventos.calificaciones.length,
      tutoriales_completados: eventos.tutorialesCompletados.length,
      ultima_actualizacion: new Date().toISOString()
    };
  }

  /**
   * Limpiar datos (limpia variables globales)
   */
  public async limpiarDatos() {
    try {
      // Limpiar variables globales
      globalEventos = {
        nuevosUsuarios: [],
        calificaciones: [],
        tutorialesCompletados: []
      };
      
      // También limpiar localStorage/AsyncStorage
      if (isWeb) {
        localStorage.removeItem('mock_eventos');
      } else {
        await AsyncStorage.removeItem('mock_eventos');
      }
      
      console.log('🗑️ Datos limpiados');
    } catch (error) {
      console.log('Error al limpiar datos:', error);
    }
  }

  /**
   * Enviar datos al servidor para que la web pueda obtenerlos
   */
  private async enviarAlServidor(tipo: string, datos: any) {
    try {
      const response = await fetch('http://192.168.1.20:3001/api/estadisticas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tipo: tipo,
          datos: datos
        })
      });

      if (response.ok) {
        console.log(`✅ ${tipo} enviado al servidor exitosamente`);
      } else {
        console.log(`❌ Error al enviar ${tipo} al servidor:`, response.status);
      }
    } catch (error) {
      console.log(`❌ Error de conexión al servidor para ${tipo}:`, error);
    }
  }

  /**
   * Verificar si está habilitado
   */
  public estaHabilitado(): boolean {
    return this.isEnabled;
  }

  /**
   * Habilitar/deshabilitar el servicio
   */
  public setHabilitado(habilitado: boolean) {
    this.isEnabled = habilitado;
    console.log(`🔧 Mock Service ${habilitado ? 'habilitado' : 'deshabilitado'}`);
  }
}

// Instancia singleton del servicio
export const mockDataService = new MockDataService();

// Función global para obtener estadísticas (puede ser llamada desde cualquier lugar)
export const obtenerEstadisticasGlobales = () => {
  return {
    usuarios_conectados: globalEventos.nuevosUsuarios.length,
    calificaciones_totales: globalEventos.calificaciones.length,
    tutoriales_completados: globalEventos.tutorialesCompletados.length,
    ultima_actualizacion: new Date().toISOString()
  };
};

// Función global para limpiar datos
export const limpiarDatosGlobales = () => {
  globalEventos = {
    nuevosUsuarios: [],
    calificaciones: [],
    tutorialesCompletados: []
  };
  console.log('🗑️ Datos globales limpiados');
};

// Exportar tipos para uso en otros archivos
export type { NuevaCalificacionData, NuevoUsuarioData, TutorialCompletadoData };

