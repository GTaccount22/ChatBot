import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { socketService } from '../lib/socketService';

const SocketDebug: React.FC = () => {
  const [estado, setEstado] = useState(socketService.obtenerEstado());
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setEstado(socketService.obtenerEstado());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleReconectar = () => {
    socketService.reconectar();
    setTimeout(() => {
      setEstado(socketService.obtenerEstado());
    }, 2000);
  };

  if (!visible) {
    return (
      <TouchableOpacity 
        style={styles.toggleButton}
        onPress={() => setVisible(true)}
      >
        <Text style={styles.toggleText}>🔌 Debug Socket</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔌 Estado Socket.IO</Text>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => setVisible(false)}
        >
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.statusContainer}>
        <Text style={[
          styles.statusText, 
          { color: estado.conectado ? '#4CAF50' : '#F44336' }
        ]}>
          {estado.conectado ? '✅ Conectado' : '❌ Desconectado'}
        </Text>
        
        <Text style={styles.infoText}>
          URL: {estado.url}
        </Text>
        
        <Text style={styles.infoText}>
          Socket ID: {estado.socketId || 'N/A'}
        </Text>
        
        <Text style={styles.infoText}>
          Transport: {estado.transport || 'N/A'}
        </Text>
        
        <Text style={styles.infoText}>
          Habilitado: {estado.habilitado ? '✅' : '❌'}
        </Text>
      </View>
      
      <TouchableOpacity 
        style={styles.reconnectButton}
        onPress={handleReconectar}
      >
        <Text style={styles.reconnectText}>🔄 Reconectar</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    padding: 15,
    borderRadius: 10,
    minWidth: 250,
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
  statusContainer: {
    marginBottom: 15,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  infoText: {
    color: '#CCCCCC',
    fontSize: 12,
    marginBottom: 2,
  },
  reconnectButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  reconnectText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  toggleButton: {
    position: 'absolute',
    top: 50,
    right: 10,
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

export default SocketDebug;
