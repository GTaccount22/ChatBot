import { io, Socket } from 'socket.io-client';
import { SOCKET_ENABLED, SOCKET_OPTIONS, SOCKET_URL } from './socketConfigSimple';

// Tipos para los eventos (simplificados según el ejemplo)
interface NuevoUsuarioData {
  usuario_id: string;
}

interface NuevaCalificacionData {
  nombre: string;
  calificacion: number;
  comentario?: string;
  fecha: string;
  hora: string;
  modalidad: string;
  email: string;
}

interface TutorialCompletadoData {
  usuario_id: string;
  fecha_completado: string;
  es_primer_tutorial: boolean;
}

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private isEnabled = true;

  constructor() {
    if (SOCKET_ENABLED) {
      this.connect();
    } else {
      this.isEnabled = false;
    }
  }

  /**
   * Conectar al servidor Socket.IO
   */
  private connect() {
    if (!this.isEnabled) return;

    try {
      this.socket = io(SOCKET_URL, SOCKET_OPTIONS);
      
      // Solo escuchar eventos de conexión/desconexión
      this.socket.on('connect', () => {
        this.isConnected = true;
        console.log('✅ Socket conectado');
      });

      this.socket.on('disconnect', () => {
        this.isConnected = false;
        console.log('❌ Socket desconectado');
      });

      this.socket.on('connect_error', (error) => {
        this.isConnected = false;
        console.log('❌ Error de conexión:', error.message);
      });

    } catch (error) {
      this.isConnected = false;
      console.log('❌ Error al conectar:', error);
    }
  }

  /**
   * Enviar evento de nuevo usuario
   */
  public enviarNuevoUsuario(data: NuevoUsuarioData) {
    if (!this.socket || !this.isConnected) {
      console.log('⚠️ Socket no conectado, no se puede enviar evento');
      return false;
    }

    try {
      this.socket.emit('nuevo_usuario', data);
      console.log('👤 Usuario enviado:', data);
      return true;
    } catch (error) {
      console.log('❌ Error al enviar usuario:', error);
      return false;
    }
  }

  /**
   * Enviar evento de nueva calificación
   */
  public enviarNuevaCalificacion(data: NuevaCalificacionData) {
    if (!this.socket || !this.isConnected) {
      console.log('⚠️ Socket no conectado, no se puede enviar evento');
      return false;
    }

    try {
      this.socket.emit('nueva_calificacion', data);
      console.log('⭐ Calificación enviada:', data);
      return true;
    } catch (error) {
      console.log('❌ Error al enviar calificación:', error);
      return false;
    }
  }

  /**
   * Verificar si está conectado
   */
  public estaConectado(): boolean {
    return this.isConnected;
  }

  /**
   * Enviar evento de tutorial completado
   */
  public enviarTutorialCompletado(data: TutorialCompletadoData) {
    if (!this.socket || !this.isConnected) {
      console.log('⚠️ Socket no conectado, no se puede enviar evento');
      return false;
    }

    try {
      this.socket.emit('tutorial_completado', data);
      console.log('🎓 Tutorial completado enviado:', data);
      return true;
    } catch (error) {
      console.log('❌ Error al enviar tutorial completado:', error);
      return false;
    }
  }

  /**
   * Desconectar del servidor
   */
  public desconectar() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  /**
   * Habilitar Socket.IO
   */
  public habilitar() {
    this.isEnabled = true;
    this.connect();
  }

  /**
   * Deshabilitar Socket.IO
   */
  public deshabilitar() {
    this.isEnabled = false;
    this.desconectar();
  }
}

// Instancia singleton del servicio
export const socketService = new SocketService();

// Exportar tipos para uso en otros archivos
export type { NuevaCalificacionData, NuevoUsuarioData, TutorialCompletadoData };
