import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import RatingModal from './RatingModal';

const { height: screenHeight } = Dimensions.get('window');

interface MenuModalProps {
  visible: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export default function MenuModal({ visible, onClose, onLogout }: MenuModalProps) {
  const { isDarkMode, toggleDarkMode, colors } = useTheme();
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isRatingModalVisible, setIsRatingModalVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(screenHeight);
      fadeAnim.setValue(0);

      setTimeout(() => {
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      }, 50);
    }
  }, [visible]);

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: screenHeight,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  const openRatingModal = () => {
    setIsRatingModalVisible(true);
  };

  const closeRatingModal = () => {
    setIsRatingModalVisible(false);
  };

  if (!visible) return null;

  const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
    modalContainer: { backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, height: screenHeight * 0.75 },
    handle: { width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginVertical: 8 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: colors.border },
    title: { fontSize: 24, fontWeight: 'bold', color: colors.text },
    closeButton: { padding: 8, borderRadius: 20, backgroundColor: colors.surface },
    content: { paddingHorizontal: 20, paddingTop: 20 },
    settingsSection: { marginBottom: 30 },
    sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 15, marginLeft: 5 },
    settingItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: 15, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
    settingText: { flex: 1, fontSize: 16, color: colors.text, marginLeft: 15, fontWeight: '500' },
  });

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={closeModal}>
      <TouchableWithoutFeedback onPress={closeModal}>
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <TouchableWithoutFeedback>
            <Animated.View style={[styles.modalContainer, { transform: [{ translateY: slideAnim }] }]}>
              <View style={styles.handle} />
              <View style={styles.header}>
                <Text style={styles.title}>Menú</Text>
                <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                  <Ionicons name="close" size={24} color={colors.primary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.content}>
                {/* Sección Configuración */}
                <View style={styles.settingsSection}>
                  <Text style={styles.sectionTitle}>Configuración</Text>
                  
                  <View style={styles.settingItem}>
                    <Ionicons name="moon-outline" size={24} color={colors.primary} />
                    <Text style={styles.settingText}>Activar modo oscuro</Text>
                    <Switch
                      value={isDarkMode}
                      onValueChange={toggleDarkMode}
                      trackColor={{ false: colors.border, true: colors.primary }}
                      thumbColor={isDarkMode ? '#FFFFFF' : '#F4F3F4'}
                    />
                  </View>

                  <TouchableOpacity style={styles.settingItem} onPress={openRatingModal}>
                    <Ionicons name="star-outline" size={24} color={colors.primary} />
                    <Text style={styles.settingText}>Califica nuestra App</Text>
                  </TouchableOpacity>
                </View>

                {/* Botón Cerrar Sesión */}
                <TouchableOpacity style={styles.settingItem} onPress={onLogout}>
                  <Ionicons name="log-out-outline" size={24} color={colors.primary} />
                  <Text style={styles.settingText}>Cerrar Sesión</Text>
                </TouchableOpacity>
              </ScrollView>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
      
      <RatingModal 
        visible={isRatingModalVisible} 
        onClose={closeRatingModal} 
      />
    </Modal>
  );
}