// Servicio para enviar eventos a Google Analytics 4 usando Measurement Protocol
export class GA4Service {
  // Leer desde variables de entorno (.env)
  private static readonly MEASUREMENT_ID = process.env.EXPO_PUBLIC_GA4_MEASUREMENT_ID || '';
  private static readonly API_SECRET = process.env.EXPO_PUBLIC_GA4_API_SECRET || '';
  private static readonly ENDPOINT = 'https://www.google-analytics.com/mp/collect';

  /**
   * Enviar evento a GA4
   */
  private static async sendEvent(eventName: string, params?: any, userRut?: string) {
    try {
      // Validar que las credenciales estén configuradas
      if (!this.MEASUREMENT_ID || !this.API_SECRET) {
        console.warn('⚠️ GA4: Variables de entorno no configuradas. Agrega EXPO_PUBLIC_GA4_MEASUREMENT_ID y EXPO_PUBLIC_GA4_API_SECRET al .env');
        return false;
      }

      // Para GA4, client_id debe ser un número o UUID, no el RUT directamente
      const clientId = this.getClientId();
      
      const payload = {
        client_id: clientId,
        events: [{
          name: eventName,
          params: {
            ...params,
            rut_usuario: userRut, // Agregar RUT como parámetro si existe
            // Parámetros para que GA4 calcule usuarios activos y nuevos
            session_id: Date.now().toString(),
            nuevo_usuario: eventName === 'apertura_app' // Marcar si es nuevo usuario
          }
        }]
      };

      const url = `${this.ENDPOINT}?measurement_id=${this.MEASUREMENT_ID}&api_secret=${this.API_SECRET}`;
      
      console.log('🌐 Enviando a GA4...');
      console.log('📦 Payload:', JSON.stringify(payload));
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const responseStatus = response.status;
      console.log('📡 Response status:', responseStatus);
      
      // Verificar si el status es OK
      if (response.ok) {
        console.log(`✅ GA4 Event sent: ${eventName} (Status: ${responseStatus})`);
        return true;
      } else {
        const errorText = await response.text();
        console.error(`❌ ERROR enviando evento a GA4: ${response.status}`);
        console.error(`❌ Response body:`, errorText);
        
        // Log adicional para debug
        console.error(`❌ MEASUREMENT_ID:`, this.MEASUREMENT_ID);
        console.error(`❌ API_SECRET length:`, this.API_SECRET.length);
        
        return false;
      }
    } catch (error) {
      console.error(`❌ Error en sendEvent:`, error);
      return false;
    }
  }

  /**
   * Generar o recuperar Client ID único
   */
  private static getClientId(): string {
    // En React Native, puedes usar AsyncStorage o un UUID
    // Por simplicidad, generamos un ID basado en el dispositivo
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    return `${timestamp}-${random}`;
  }

  /**
   * Registrar evento de apertura de app
   */
  static async logAppOpen() {
    console.log('📊 GA4 Event: apertura_app');
    console.log('🔑 MEASUREMENT_ID:', this.MEASUREMENT_ID);
    console.log('🔑 API_SECRET:', this.API_SECRET ? '✅ Configurado' : '❌ No configurado');
    
    // Enviar apertura normal
    await this.sendEvent('apertura_app', {
      platform: 'mobile',
      engagement_time_msec: 1000
    });
    
    // También enviar first_open para detectar usuarios nuevos
    // Nota: Esto solo funcionará la primera vez, GA4 lo detecta automáticamente
    await this.sendEvent('first_open', {
      platform: 'mobile',
      engagement_time_msec: 1000
    });
    
    return true;
  }

  /**
   * Registrar evento de login
   */
  static async logLogin(method: string, userRut?: string) {
    console.log('📊 GA4 Event: inicio_sesion', { method, userRut });
    return await this.sendEvent('inicio_sesion', {
      metodo: method
    }, userRut);
  }

  /**
   * Registrar evento de calificación
   */
  static async logRating(score: number, userRut?: string) {
    console.log('📊 GA4 Event: califica_app', { score, userRut });
    return await this.sendEvent('califica_app', {
      puntuacion: score
    }, userRut);
  }

  /**
   * Registrar evento personalizado
   */
  static async logEvent(eventName: string, params?: any, userRut?: string) {
    console.log('📊 GA4 Event:', eventName, params);
    return await this.sendEvent(eventName, params, userRut);
  }
}

