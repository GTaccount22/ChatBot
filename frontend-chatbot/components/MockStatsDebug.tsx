import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { mockDataService } from '../lib/mockDataService';

const MockStatsDebug: React.FC = () => {
  const [estadisticas, setEstadisticas] = useState({
    usuarios_conectados: 0,
    calificaciones_totales: 0,
    tutoriales_completados: 0,
    ultima_actualizacion: new Date().toISOString()
  });
  const [visible, setVisible] = useState(false);

  const cargarEstadisticas = async () => {
    try {
      // Detectar si estamos en web
      const isWeb = typeof window !== 'undefined' && window.localStorage;
      
      let stats;
      if (isWeb) {
        // Usar método síncrono en web
        stats = mockDataService.obtenerEstadisticasSync();
      } else {
        // Usar método async en React Native
        stats = await mockDataService.obtenerEstadisticas();
      }
      
      setEstadisticas(stats);
    } catch (error) {
      console.log('Error al cargar estadísticas:', error);
    }
  };

  useEffect(() => {
    cargarEstadisticas();
    const interval = setInterval(cargarEstadisticas, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLimpiar = () => {
    Alert.alert(
      'Limpiar Datos',
      '¿Estás seguro de que quieres limpiar todos los datos?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Limpiar', 
          style: 'destructive',
          onPress: async () => {
            await mockDataService.limpiarDatos();
            await cargarEstadisticas();
          }
        }
      ]
    );
  };

  if (!visible) {
    return (
      <TouchableOpacity 
        style={styles.toggleButton}
        onPress={() => setVisible(true)}
      >
        <Text style={styles.toggleText}>📊 Mock Stats</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📊 Estadísticas Mock</Text>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => setVisible(false)}
        >
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>👤 Usuarios:</Text>
          <Text style={styles.statValue}>{estadisticas.usuarios_conectados}</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>⭐ Calificaciones:</Text>
          <Text style={styles.statValue}>{estadisticas.calificaciones_totales}</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>🎓 Tutoriales:</Text>
          <Text style={styles.statValue}>{estadisticas.tutoriales_completados}</Text>
        </View>
        
        <Text style={styles.lastUpdate}>
          Última actualización: {new Date(estadisticas.ultima_actualizacion).toLocaleTimeString()}
        </Text>
      </View>
      
      <TouchableOpacity 
        style={styles.clearButton}
        onPress={handleLimpiar}
      >
        <Text style={styles.clearText}>🗑️ Limpiar Datos</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    padding: 15,
    borderRadius: 10,
    minWidth: 200,
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  closeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statsContainer: {
    marginBottom: 15,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statLabel: {
    color: '#CCCCCC',
    fontSize: 14,
  },
  statValue: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 'bold',
  },
  lastUpdate: {
    color: '#888888',
    fontSize: 10,
    marginTop: 10,
    textAlign: 'center',
  },
  clearButton: {
    backgroundColor: '#F44336',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  clearText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  toggleButton: {
    position: 'absolute',
    top: 50,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    borderRadius: 5,
    zIndex: 1000,
  },
  toggleText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default MockStatsDebug;
