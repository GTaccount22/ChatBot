import { io, Socket } from 'socket.io-client';
import { NuevaCalificacionData, NuevoUsuarioData, TutorialCompletadoData } from './mockDataService';
import { getAPIURL, getSocketURL, SOCKET_ENABLED, SOCKET_OPTIONS } from './socketConfigSimple';

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private isEnabled = true;
  private isConnecting = false;

  constructor() {
    console.log('🔧 SocketService inicializando...');
    console.log('📊 SOCKET_ENABLED:', SOCKET_ENABLED);
    
    if (SOCKET_ENABLED) {
      console.log('✅ Socket.IO habilitado - iniciando conexión');
      this.connect();
    } else {
      console.log('❌ Socket.IO deshabilitado');
      this.isEnabled = false;
    }
  }

  /**
   * Conectar al servidor Socket.IO
   */
  private async connect() {
    if (!this.isEnabled || this.isConnecting || this.isConnected) {
      console.log('⏸️ Conexión omitida:', {
        enabled: this.isEnabled,
        connecting: this.isConnecting,
        connected: this.isConnected
      });
      return;
    }

    this.isConnecting = true;

    try {
      // Detectar URL activa dinámicamente
      const socketURL = await getSocketURL();
      const apiURL = await getAPIURL();
      
      console.log('🔄 Intentando conectar a:', socketURL);
      console.log('🔧 Opciones:', SOCKET_OPTIONS);
      console.log('🌐 URL completa:', socketURL);
      console.log('🔗 Transport configurado:', SOCKET_OPTIONS.transports);
      
      this.socket = io(socketURL, SOCKET_OPTIONS);
      
      // Solo escuchar eventos de conexión/desconexión
      this.socket.on('connect', async () => {
        this.isConnected = true;
        this.isConnecting = false;
        console.log('✅ Socket conectado exitosamente');
        console.log('🆔 Socket ID:', this.socket?.id);
        console.log('🔗 Transport:', this.socket?.io?.engine?.transport?.name);
        
        // Hacer fetch después de conectarse (patrón recomendado)
        try {
          console.log('🔄 Obteniendo datos históricos después de conectar...');
          const res = await fetch(apiURL);
          const data = await res.json();
          console.log('📊 Datos históricos obtenidos:', data);
          
          // Emitir evento personalizado para notificar que está listo para fetch
          this.socket!.emit('cliente_listo', {
            timestamp: new Date().toISOString(),
            socketId: this.socket!.id,
            datosHistoricos: data
          });
        } catch (error) {
          console.log('❌ Error obteniendo datos históricos:', error);
          
          // Emitir evento de todos modos
          this.socket!.emit('cliente_listo', {
            timestamp: new Date().toISOString(),
            socketId: this.socket!.id,
            error: error
          });
        }
      });

      this.socket.on('disconnect', (reason) => {
        this.isConnected = false;
        this.isConnecting = false;
        console.log('❌ Socket desconectado:', reason);
      });

      this.socket.on('connect_error', (error) => {
        this.isConnected = false;
        this.isConnecting = false;
            console.log('❌ Error de conexión:', error.message);
            console.log('🔍 Error completo:', error);
      });

      this.socket.on('reconnect', (attemptNumber) => {
        this.isConnected = true;
        this.isConnecting = false;
        console.log('🔄 Reconectado después de', attemptNumber, 'intentos');
      });

      this.socket.on('reconnect_error', (error) => {
        this.isConnecting = false;
        console.log('❌ Error de reconexión:', error.message);
      });

      this.socket.on('reconnect_failed', () => {
        this.isConnecting = false;
        console.log('❌ Falló la reconexión después de todos los intentos');
      });

    } catch (error) {
      this.isConnected = false;
      this.isConnecting = false;
      console.log('❌ Error al conectar:', error);
    }
  }

  /**
   * Enviar evento de nuevo usuario
   */
  public enviarNuevoUsuario(data: NuevoUsuarioData) {
    console.log('🔄 Intentando enviar nuevo usuario...');
    console.log('📊 Estado actual:', this.obtenerEstado());
    
    if (!this.socket || !this.isConnected) {
      console.log('⚠️ Socket no conectado, no se puede enviar evento');
      console.log('🔍 Socket existe:', !!this.socket);
      console.log('🔍 Está conectado:', this.isConnected);
      return false;
    }

    try {
      this.socket.emit('nuevo_usuario', data);
      console.log('👤 Usuario enviado exitosamente:', data);
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
    console.log('🔄 Intentando enviar nueva calificación...');
    console.log('📊 Estado actual:', this.obtenerEstado());
    
    if (!this.socket || !this.isConnected) {
      console.log('⚠️ Socket no conectado, no se puede enviar evento');
      console.log('🔍 Socket existe:', !!this.socket);
      console.log('🔍 Está conectado:', this.isConnected);
      return false;
    }

    try {
      this.socket.emit('nueva_calificacion', data);
      console.log('⭐ Calificación enviada exitosamente:', data);
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
   * Obtener estado detallado de la conexión
   */
  public obtenerEstado() {
    return {
      conectado: this.isConnected,
      habilitado: this.isEnabled,
      socketId: this.socket?.id || null,
      transport: this.socket?.io?.engine?.transport?.name || null
    };
  }

  /**
   * Esperar a que el servidor esté listo para recibir datos
   */
  public async esperarServidorListo(): Promise<boolean> {
    if (!this.socket || !this.isConnected) {
      console.log('⚠️ Socket no conectado, no se puede esperar servidor');
      return false;
    }

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.log('⏰ Timeout esperando servidor listo');
        resolve(false);
      }, 5000); // 5 segundos de timeout

      // Escuchar confirmación del servidor
      this.socket!.on('servidor_listo', (data) => {
        clearTimeout(timeout);
        console.log('✅ Servidor confirmó que está listo:', data);
        resolve(true);
      });

      // Si ya está conectado, enviar señal de que estamos listos
      this.socket!.emit('cliente_listo', {
        timestamp: new Date().toISOString(),
        socketId: this.socket!.id
      });
    });
  }

  /**
   * Forzar reconexión
   */
  public reconectar() {
    if (this.socket) {
      console.log('🔄 Forzando reconexión...');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.isConnecting = false;
    }
    
    setTimeout(() => {
      this.connect();
    }, 1000);
  }

  /**
   * Enviar evento de tutorial completado
   */
  public enviarTutorialCompletado(data: TutorialCompletadoData) {
    console.log('🔄 Intentando enviar tutorial completado...');
    console.log('📊 Estado actual:', this.obtenerEstado());
    
    if (!this.socket || !this.isConnected) {
      console.log('⚠️ Socket no conectado, no se puede enviar evento');
      console.log('🔍 Socket existe:', !!this.socket);
      console.log('🔍 Está conectado:', this.isConnected);
      return false;
    }

    try {
      this.socket.emit('tutorial_completado', data);
      console.log('🎓 Tutorial completado enviado exitosamente:', data);
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

