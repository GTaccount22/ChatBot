
// Servicio simple de analytics que usa Supabase para guardar eventos
export class AnalyticsService {
  /**
   * Registrar evento de apertura de app
   */
  static async logAppOpen() {
    try {
      console.log('📊 Analytics Event: app_open');
      // TODO: Guardar en Supabase si lo necesitas
      // Descomentar cuando tengas la tabla 'app_events' creada
      /*
      const { data, error } = await supabase
        .from('app_events')
        .insert({
          event_name: 'app_open',
          timestamp: new Date().toISOString(),
          platform: 'mobile'
        });
      
      if (error) {
        console.error('❌ Error guardando evento:', error);
      }
      */
      
      return true;
    } catch (error) {
      console.error('❌ Error en logAppOpen:', error);
      return false;
    }
  }

  /**
   * Registrar evento de login
   */
  static async logLogin(method: string, userRut?: string) {
    try {
      console.log('📊 Analytics Event: login', { method, userRut });
      
      // TODO: Guardar en Supabase si lo necesitas
      // Descomentar cuando tengas la tabla 'app_events' creada
      /*
      if (userRut) {
        const { data, error } = await supabase
          .from('app_events')
          .insert({
            event_name: 'login',
            user_rut: userRut,
            event_params: { method },
            timestamp: new Date().toISOString(),
            platform: 'mobile'
          });
        
        if (error) {
          console.error('❌ Error guardando evento:', error);
        }
      }
      */
      
      return true;
    } catch (error) {
      console.error('❌ Error en logLogin:', error);
      return false;
    }
  }

  /**
   * Registrar evento de calificación
   */
  static async logRating(score: number, userRut?: string) {
    try {
      console.log('📊 Analytics Event: rating_submitted', { score, userRut });
      
      // TODO: Guardar en Supabase si lo necesitas
      // Descomentar cuando tengas la tabla 'app_events' creada
      /*
      if (userRut) {
        const { data, error } = await supabase
          .from('app_events')
          .insert({
            event_name: 'rating_submitted',
            user_rut: userRut,
            event_params: { score },
            timestamp: new Date().toISOString(),
            platform: 'mobile'
          });
        
        if (error) {
          console.error('❌ Error guardando evento:', error);
        }
      }
      */
      
      return true;
    } catch (error) {
      console.error('❌ Error en logRating:', error);
      return false;
    }
  }

  /**
   * Registrar evento personalizado
   */
  static async logEvent(eventName: string, params?: any, userRut?: string) {
    try {
      console.log('📊 Analytics Event:', eventName, params);
      
      // TODO: Guardar en Supabase si lo necesitas
      // Descomentar cuando tengas la tabla 'app_events' creada
      /*
      if (userRut) {
        const { data, error } = await supabase
          .from('app_events')
          .insert({
            event_name: eventName,
            user_rut: userRut,
            event_params: params,
            timestamp: new Date().toISOString(),
            platform: 'mobile'
          });
        
        if (error) {
          console.error('❌ Error guardando evento:', error);
        }
      }
      */
      
      return true;
    } catch (error) {
      console.error('❌ Error en logEvent:', error);
      return false;
    }
  }
}

