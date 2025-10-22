import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { socketService } from '../lib/socketService';

interface SocketStatusProps {
  showDetails?: boolean;
}

export default function SocketStatus({ showDetails = false }: SocketStatusProps) {
  const { colors } = useTheme();
  const [isConnected, setIsConnected] = useState(socketService.estaConectado());

  useEffect(() => {
    // Actualizar estado cada 2 segundos
    const interval = setInterval(() => {
      setIsConnected(socketService.estaConectado());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleReconectar = () => {
    socketService.habilitar();
    setIsConnected(socketService.estaConectado());
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statusIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 8,
      backgroundColor: isConnected ? '#4CAF50' : '#F44336',
    },
    statusText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    detailsContainer: {
      marginTop: 8,
      padding: 12,
      backgroundColor: colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    detailLabel: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    detailValue: {
      fontSize: 12,
      color: colors.text,
      fontWeight: '500',
    },
    reconnectButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      marginTop: 8,
    },
    reconnectButtonText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '600',
    },
  });

  return (
    <View>
      <View style={styles.container}>
        <View style={styles.statusIndicator} />
        <Text style={styles.statusText}>
          {isConnected ? 'Conectado' : 'Desconectado'}
        </Text>
        {!isConnected && (
          <TouchableOpacity onPress={handleReconectar} style={{ marginLeft: 8 }}>
            <Ionicons name="refresh" size={16} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {showDetails && (
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Estado:</Text>
            <Text style={[styles.detailValue, { color: isConnected ? '#4CAF50' : '#F44336' }]}>
              {isConnected ? 'Conectado' : 'Desconectado'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Modo:</Text>
            <Text style={styles.detailValue}>Solo envío de eventos</Text>
          </View>

          {!isConnected && (
            <TouchableOpacity style={styles.reconnectButton} onPress={handleReconectar}>
              <Text style={styles.reconnectButtonText}>Reconectar</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}
