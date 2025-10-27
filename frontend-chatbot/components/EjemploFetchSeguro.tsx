import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useEstadisticasSeguras } from '../lib/useSocketSync';

const EjemploFetchSeguro: React.FC = () => {
  const { estadisticas, cargando, backendReiniciado, recargar, canFetch } = useEstadisticasSeguras();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📊 Datos Históricos</Text>
      
      {backendReiniciado && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>
            🔄 Backend reiniciado - datos por defecto
          </Text>
        </View>
      )}

      <View style={styles.statusContainer}>
        <Text style={[styles.status, { color: canFetch ? '#4CAF50' : '#F44336' }]}>
          Estado: {canFetch ? '🟢 Listo' : '🔴 Esperando'}
        </Text>
        
        <Text style={[styles.status, { color: cargando ? '#2196F3' : '#4CAF50' }]}>
          Carga: {cargando ? '🔄 Cargando...' : '✅ Completado'}
        </Text>
      </View>

      <View style={styles.datosContainer}>
        <Text style={styles.datoItem}>👤 Usuarios: {estadisticas.usuarios_conectados}</Text>
        <Text style={styles.datoItem}>⭐ Calificaciones: {estadisticas.calificaciones_totales}</Text>
        <Text style={styles.datoItem}>🎓 Tutoriales: {estadisticas.tutoriales_completados}</Text>
        
        <Text style={styles.timestamp}>
          📅 {new Date(estadisticas.ultima_actualizacion).toLocaleString()}
        </Text>
      </View>

      <TouchableOpacity 
        style={styles.reloadButton}
        onPress={recargar}
        disabled={!canFetch || cargando}
      >
        <Text style={styles.reloadText}>
          {cargando ? '🔄 Cargando...' : '🔄 Recargar Datos'}
        </Text>
      </TouchableOpacity>

      {!canFetch && (
        <Text style={styles.esperando}>
          ⏳ Esperando conexión estable...
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    margin: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  warningContainer: {
    backgroundColor: '#FFF3CD',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#FFEAA7',
  },
  warningText: {
    color: '#856404',
    fontSize: 14,
    fontWeight: 'bold',
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
  datosContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 15,
  },
  datoItem: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 10,
  },
  reloadButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  reloadText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  esperando: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default EjemploFetchSeguro;
