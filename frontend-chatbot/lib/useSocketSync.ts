import { useEffect, useState } from 'react';
import { socketService } from '../lib/socketService';
import { API_URL } from './socketConfigSimple';

/**
 * Verificar si un objeto está vacío
 */
const isEmpty = (obj: any): boolean => {
  if (obj === null || obj === undefined) return true;
  if (typeof obj !== 'object') return false;
  return Object.keys(obj).length === 0;
};

/**
 * Obtener datos por defecto cuando el backend está reiniciado
 */
const getDefaultData = () => {
  return {
    usuarios_conectados: 0,
    calificaciones_totales: 0,
    tutoriales_completados: 0,
    ultima_actualizacion: new Date().toISOString(),
    backend_reiniciado: true // Flag para identificar que el backend se reinició
  };
};

/**
 * Hook para sincronizar fetch de datos con Socket.IO
 * Evita hacer fetch antes de que el servidor esté listo
 */
export const useSocketSync = () => {
  const [isServerReady, setIsServerReady] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const checkServerReady = async () => {
      if (socketService.estaConectado()) {
        setIsConnecting(true);
        console.log('🔄 Verificando si servidor está listo...');
        
        try {
          const ready = await socketService.esperarServidorListo();
          setIsServerReady(ready);
          console.log('📊 Servidor listo:', ready);
        } catch (error) {
          console.log('❌ Error verificando servidor:', error);
          setIsServerReady(false);
        } finally {
          setIsConnecting(false);
        }
      } else {
        setIsServerReady(false);
      }
    };

    // Verificar inmediatamente
    checkServerReady();

    // Verificar cada vez que se conecte
    const interval = setInterval(() => {
      if (socketService.estaConectado() && !isServerReady) {
        checkServerReady();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isServerReady]);

  return {
    isServerReady,
    isConnecting,
    isConnected: socketService.estaConectado()
  };
};

/**
 * Hook para hacer fetch seguro después de que Socket.IO esté listo
 */
export const useSafeFetch = () => {
  const { isServerReady, isConnected } = useSocketSync();

  const safeFetch = async (url: string, options?: RequestInit) => {
    if (!isConnected) {
      console.log('⚠️ Socket no conectado, esperando...');
      return null;
    }

    if (!isServerReady) {
      console.log('⚠️ Servidor no listo, esperando...');
      return null;
    }

    try {
      console.log('🔄 Haciendo fetch seguro a:', url);
      const response = await fetch(url, options);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Fetch exitoso:', data);
        
        // Verificar si los datos están vacíos (backend reiniciado)
        if (isEmpty(data)) {
          console.log('⚠️ Backend reiniciado - datos vacíos, usando valores por defecto');
          return getDefaultData();
        }
        
        return data;
      } else {
        console.log('❌ Error en fetch:', response.status);
        return null;
      }
    } catch (error) {
      console.log('❌ Error en fetch:', error);
      return null;
    }
  };

  return {
    safeFetch,
    isServerReady,
    isConnected,
    canFetch: isConnected && isServerReady
  };
};

/**
 * Hook especializado para manejar estadísticas con backend reiniciado
 */
export const useEstadisticasSeguras = () => {
  const { safeFetch, canFetch } = useSafeFetch();
  const [estadisticas, setEstadisticas] = useState(getDefaultData());
  const [cargando, setCargando] = useState(false);
  const [backendReiniciado, setBackendReiniciado] = useState(false);

  const cargarEstadisticas = async () => {
    if (!canFetch) {
      console.log('⏸️ No se puede cargar estadísticas aún');
      return;
    }

    setCargando(true);
    try {
      console.log('🔄 Cargando estadísticas...');
      const datos = await safeFetch(API_URL);
      
      if (datos) {
        setEstadisticas(datos);
        setBackendReiniciado(datos.backend_reiniciado || false);
        
        if (datos.backend_reiniciado) {
          console.log('🔄 Backend reiniciado detectado - usando datos por defecto');
        } else {
          console.log('📊 Estadísticas cargadas:', datos);
        }
      }
    } catch (error) {
      console.log('❌ Error cargando estadísticas:', error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (canFetch) {
      cargarEstadisticas();
    }
  }, [canFetch]);

  return {
    estadisticas,
    cargando,
    backendReiniciado,
    recargar: cargarEstadisticas,
    canFetch
  };
};
