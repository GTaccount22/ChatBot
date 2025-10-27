import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { API_URL } from '../lib/socketConfigSimple';
import { socketService } from '../lib/socketService';

interface UsuariosPorDia {
  [fecha: string]: number;
}

const UsuariosPorDiaComponent: React.FC = () => {
  const [datos, setDatos] = useState<UsuariosPorDia>({});
  const [cargando, setCargando] = useState(false);
  const [conectado, setConectado] = useState(false);

  const cargarDatos = async () => {
    if (!socketService.estaConectado()) {
      console.log('⚠️ Socket no conectado, esperando...');
      return;
    }

    setCargando(true);
    try {
      console.log('🔄 Cargando usuarios por día desde:', API_URL);
      const response = await fetch(API_URL);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Usuarios por día obtenidos:', data);
        
        // Verificar si los datos están vacíos (backend reiniciado)
        if (Object.keys(data).length === 0) {
          console.log('⚠️ Backend reiniciado - datos vacíos');
          setDatos({});
        } else {
          setDatos(data);
        }
      } else {
        console.log('❌ Error en fetch:', response.status);
      }
    } catch (error) {
      console.log('❌ Error cargando datos:', error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    // Verificar conexión
    const checkConnection = () => {
      const connected = socketService.estaConectado();
      setConectado(connected);
      
      if (connected) {
        console.log('✅ Socket conectado, cargando datos...');
        cargarDatos();
      }
    };

    // Verificar inmediatamente
    checkConnection();

    // Verificar cada 2 segundos
    const interval = setInterval(checkConnection, 2000);

    return () => clearInterval(interval);
  }, []);

  const fechas = Object.keys(datos).sort().reverse(); // Más recientes primero
  const totalUsuarios = Object.values(datos).reduce((sum, count) => sum + count, 0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📊 Usuarios por Día</Text>
      
      <View style={styles.statusContainer}>
        <Text style={[styles.status, { color: conectado ? '#4CAF50' : '#F44336' }]}>
          Socket: {conectado ? '🟢 Conectado' : '🔴 Desconectado'}
        </Text>
        
        <Text style={[styles.status, { color: cargando ? '#2196F3' : '#4CAF50' }]}>
          Estado: {cargando ? '🔄 Cargando...' : '✅ Listo'}
        </Text>
        
        <Text style={styles.totalText}>
          Total usuarios: {totalUsuarios}
        </Text>
      </View>

      <TouchableOpacity 
        style={[styles.reloadButton, { opacity: conectado ? 1 : 0.5 }]}
        onPress={cargarDatos}
        disabled={!conectado || cargando}
      >
        <Text style={styles.reloadText}>
          {cargando ? '🔄 Cargando...' : '🔄 Recargar Datos'}
        </Text>
      </TouchableOpacity>

      <ScrollView style={styles.scrollContainer}>
        {fechas.length > 0 ? (
          fechas.map((fecha) => (
            <View key={fecha} style={styles.fechaContainer}>
              <Text style={styles.fechaText}>{fecha}</Text>
              <Text style={styles.countText}>{datos[fecha]} usuarios</Text>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {conectado ? '📭 No hay datos históricos' : '⏳ Esperando conexión...'}
            </Text>
            {conectado && (
              <Text style={styles.emptySubtext}>
                El backend puede haberse reiniciado o no tener datos aún
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    margin: 10,
    maxHeight: 400,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  statusContainer: {
    marginBottom: 15,
  },
  status: {
    fontSize: 14,
    marginBottom: 5,
    fontWeight: 'bold',
  },
  totalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
    textAlign: 'center',
    marginTop: 5,
  },
  reloadButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  reloadText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  scrollContainer: {
    maxHeight: 200,
  },
  fechaContainer: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  fechaText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  countText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  emptyContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default UsuariosPorDiaComponent;
