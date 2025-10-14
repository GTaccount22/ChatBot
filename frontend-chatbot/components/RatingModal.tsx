import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { AuthService } from '../lib/authService';
import { EvaluationData, EvaluationService } from '../lib/evaluationService';

const { height: screenHeight } = Dimensions.get('window');

interface RatingModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function RatingModal({ visible, onClose }: RatingModalProps) {
  const { colors } = useTheme();
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Estados del formulario
  const [studyModality, setStudyModality] = useState<'sede' | 'online' | null>(null);
  const [email, setEmail] = useState('');
  const [comments, setComments] = useState('');
  const [satisfaction, setSatisfaction] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

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

      // Cargar datos del usuario
      loadUserData();
    }
  }, [visible]);

  const loadUserData = async () => {
    try {
      const sessionData = await AuthService.loadSession();
      if (sessionData?.user) {
        const userData = sessionData.user.user_metadata || sessionData.user;
        setCurrentUser(userData);
        setEmail(userData.email || '');
      }
    } catch (error) {
      // Error silencioso para mejor UX
    }
  };

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

  const handleSubmit = async () => {
    // Validar campos obligatorios
    if (!studyModality || !email || !satisfaction) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Por favor ingresa un correo electrónico válido');
      return;
    }

    setIsSubmitting(true);

    try {
      const evaluationData: EvaluationData = {
        nombre: currentUser ? `${currentUser.nombre} ${currentUser.apellido}` : 'Usuario',
        correo: email,
        modalidad: studyModality === 'sede' ? 'Sede' : '100% Online',
        calificacion: satisfaction,
        comentario: comments.trim() || undefined
      };

      const result = await EvaluationService.submitEvaluation(evaluationData);

      if (result.success) {
        Alert.alert(
          '¡Gracias!', 
          'Tu evaluación ha sido enviada exitosamente. Tu opinión es muy importante para nosotros.',
          [{ text: 'OK', onPress: () => {
            // Limpiar formulario
            setStudyModality(null);
            setEmail('');
            setComments('');
            setSatisfaction(null);
            closeModal();
          }}]
        );
      } else {
        Alert.alert('Error', result.error || 'No se pudo enviar la evaluación. Inténtalo de nuevo.');
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error inesperado. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToField = (y: number) => {
    scrollViewRef.current?.scrollTo({ y, animated: true });
  };

  if (!visible) return null;

  const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
    modalContainer: { backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, height: screenHeight * 0.95 },
    handle: { width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginVertical: 8 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: colors.border },
    title: { fontSize: 24, fontWeight: 'bold', color: colors.text },
    closeButton: { padding: 8, borderRadius: 20, backgroundColor: colors.surface },
    content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 },
    introText: { fontSize: 14, color: colors.textSecondary, marginBottom: 10, lineHeight: 20 },
    requiredText: { fontSize: 14, color: colors.textSecondary, marginBottom: 20 },
    questionContainer: { marginBottom: 25 },
    questionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    questionNumber: { fontSize: 16, fontWeight: '600', color: colors.text, marginRight: 8 },
    questionText: { fontSize: 16, fontWeight: '600', color: colors.text, flex: 1 },
    editIcon: { marginLeft: 8 },
    radioContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    radioButton: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, marginRight: 10, alignItems: 'center', justifyContent: 'center' },
    radioSelected: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
    radioText: { fontSize: 16, color: colors.text },
    hintText: { fontSize: 14, color: colors.textSecondary, marginBottom: 10 },
    inputField: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 15, paddingVertical: 12, fontSize: 16, color: colors.text, marginBottom: 10 },
    textArea: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 15, paddingVertical: 12, fontSize: 16, color: colors.text, height: 100, textAlignVertical: 'top' },
    ratingContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, paddingHorizontal: 5 },
    starButton: { padding: 8 },
    ratingLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, paddingHorizontal: 5 },
    ratingLabel: { fontSize: 11, color: colors.textSecondary, textAlign: 'center', width: 65, lineHeight: 14 },
    submitButton: { backgroundColor: colors.primary, paddingVertical: 15, borderRadius: 8, alignItems: 'center', marginTop: 20 },
    submitButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
    asterisk: { color: '#FF3B30' },
  });

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={closeModal}>
      <TouchableWithoutFeedback onPress={closeModal}>
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <TouchableWithoutFeedback>
            <Animated.View style={[styles.modalContainer, { transform: [{ translateY: slideAnim }] }]}>
              <View style={styles.handle} />
              <View style={styles.header}>
                <Text style={styles.title}>Nuestra App Duco</Text>
                <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                  <Ionicons name="close" size={24} color={colors.primary} />
                </TouchableOpacity>
              </View>

              <ScrollView 
                ref={scrollViewRef}
                style={styles.content}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 100 }}
              >
                <Text style={styles.introText}>
                  Cuando envíe este formulario, no recopilará automáticamente sus detalles, como el nombre y la dirección de correo electrónico, a menos que lo proporcione usted mismo.
                </Text>
                <Text style={styles.requiredText}>* Obligatorio</Text>

                {/* Pregunta 1: Modalidad de estudio */}
                <View style={styles.questionContainer}>
                  <View style={styles.questionHeader}>
                    <Text style={styles.questionNumber}>1.</Text>
                    <Text style={styles.questionText}>¿Cuál es tu modalidad de estudio?</Text>
                    <Ionicons name="create-outline" size={20} color={colors.primary} style={styles.editIcon} />
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.radioContainer} 
                    onPress={() => setStudyModality('sede')}
                  >
                    <View style={[styles.radioButton, { borderColor: colors.border }]}>
                      {studyModality === 'sede' && <View style={[styles.radioSelected, { backgroundColor: colors.primary }]} />}
                    </View>
                    <Text style={styles.radioText}>Sede</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.radioContainer} 
                    onPress={() => setStudyModality('online')}
                  >
                    <View style={[styles.radioButton, { borderColor: colors.border }]}>
                      {studyModality === 'online' && <View style={[styles.radioSelected, { backgroundColor: colors.primary }]} />}
                    </View>
                    <Text style={styles.radioText}>100% online</Text>
                  </TouchableOpacity>
                </View>

                {/* Pregunta 2: Email */}
                <View style={styles.questionContainer}>
                  <View style={styles.questionHeader}>
                    <Text style={styles.questionNumber}>2.</Text>
                    <Text style={styles.questionText}>¿Cuál es tu correo Duoc UC?</Text>
                    <Text style={styles.asterisk}>*</Text>
                  </View>
                  
                  <Text style={styles.hintText}>Esto nos permite validar tu opinión 😊</Text>
                  
                  <TextInput
                    style={styles.inputField}
                    placeholder="Escriba una dirección de correo electrónico"
                    placeholderTextColor={colors.textSecondary}
                    value={email}
                    onChangeText={(text) => setEmail(text.toLowerCase())}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onFocus={() => scrollToField(200)}
                  />
                </View>

                {/* Pregunta 3: Comentarios */}
                <View style={styles.questionContainer}>
                  <View style={styles.questionHeader}>
                    <Text style={styles.questionNumber}>3.</Text>
                    <Text style={styles.questionText}>¿Quieres dejarnos comentarios o sugerencias?</Text>
                  </View>
                  
                  <TextInput
                    style={styles.textArea}
                    placeholder="Escriba su respuesta"
                    placeholderTextColor={colors.textSecondary}
                    value={comments}
                    onChangeText={(text) => {
                      const formatted = text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
                      setComments(formatted);
                    }}
                    multiline
                    numberOfLines={4}
                    onFocus={() => scrollToField(450)}
                  />
                </View>

                {/* Pregunta 4: Satisfacción */}
                <View style={styles.questionContainer}>
                  <View style={styles.questionHeader}>
                    <Text style={styles.questionNumber}>4.</Text>
                    <Text style={styles.questionText}>¿Qué tan satisfecho estás con Nuestra App Duco?</Text>
                  </View>
                  
                  <View style={styles.ratingContainer}>
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <TouchableOpacity
                        key={rating}
                        style={styles.starButton}
                        onPress={() => setSatisfaction(rating)}
                      >
                        <Ionicons 
                          name={(satisfaction || 0) >= rating ? "star" : "star-outline"} 
                          size={32} 
                          color={(satisfaction || 0) >= rating ? "#FFD700" : colors.border} 
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                  
                  <View style={styles.ratingLabels}>
                    <Text style={styles.ratingLabel}>Muy insatisfecho</Text>
                    <Text style={styles.ratingLabel}></Text>
                    <Text style={styles.ratingLabel}></Text>
                    <Text style={styles.ratingLabel}></Text>
                    <Text style={styles.ratingLabel}>Muy satisfecho</Text>
                  </View>
                </View>

                <TouchableOpacity 
                  style={[styles.submitButton, isSubmitting && { opacity: 0.6 }]} 
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                >
                  <Text style={styles.submitButtonText}>
                    {isSubmitting ? 'Enviando...' : 'Enviar'}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
