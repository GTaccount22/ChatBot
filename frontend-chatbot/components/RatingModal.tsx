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
import { GA4Service } from '../lib/ga4Service';
import { SamsungInputUtils, useProtectedInput } from '../lib/inputUtils';
import { Modality, ModalityService } from '../lib/modalityService';
import { socketService } from '../lib/socketService';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');
const isSmallScreen = screenHeight < 700;
const isTablet = screenWidth > 768;

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
  const [modalities, setModalities] = useState<Modality[]>([]);
  const [loadingModalities, setLoadingModalities] = useState(false);
  const [email, setEmail] = useState('');
  const [comments, setComments] = useState('');
  const [satisfaction, setSatisfaction] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Hook para manejo protegido de inputs
  const { handleChange: handleProtectedChange } = useProtectedInput();

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
        const userData = {
          ...(sessionData.user.user_metadata || sessionData.user),
          id: sessionData.user.id // Asegurar que tenemos el ID real
        };
        setCurrentUser(userData);
        console.log('👤 Usuario cargado:', userData);
        // Obtener el correo del usuario autenticado
        const userEmail = sessionData.user.email || userData.institutional_email || '';
        setEmail(userEmail);
      }
      
      // Cargar modalidades de la BD
      await loadModalities();
    } catch (error) {
      // Error silencioso para mejor UX
      console.error('Error cargando datos de usuario:', error);
    }
  };

  const loadModalities = async () => {
    try {
      setLoadingModalities(true);
      const result = await ModalityService.getModalities();
      
      if (result.success && result.data) {
        setModalities(result.data);
        console.log('✅ Modalidades cargadas:', result.data);
      } else {
        console.error('❌ Error cargando modalidades:', result.error);
        // Fallback a modalidades hardcodeadas si falla la BD
        setModalities([
          { id_modality: 1, type: 'Sede' },
          { id_modality: 2, type: '100% Online' }
        ]);
      }
    } catch (error) {
      console.error('❌ Error inesperado cargando modalidades:', error);
      // Fallback a modalidades hardcodeadas
      setModalities([
        { id_modality: 1, type: 'Sede' },
        { id_modality: 2, type: '100% Online' }
      ]);
    } finally {
      setLoadingModalities(false);
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
    // Validar campos obligatorios (ya no necesitamos studyModality)
    if (!email || !satisfaction) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return;
    }
    
    // Validar que el usuario tenga una modalidad asignada
    if (!currentUser?.modality_id) {
      Alert.alert('Error', 'No tienes una modalidad de estudio asignada');
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
      // Obtener la modalidad del usuario desde la BD
      const userModality = modalities.find(m => m.id_modality === currentUser.modality_id);
      
      const evaluationData: EvaluationData = {
        nombre: currentUser ? `${currentUser.first_name || currentUser.nombre} ${currentUser.last_name || currentUser.apellido}` : 'Usuario',
        correo: email,
        modalidad: (userModality?.type || 'Sede') as 'Sede' | '100% Online',
        calificacion: satisfaction,
        comentario: comments.trim() || undefined
      };

      console.log('👤 Modalidad del usuario:', currentUser.modality_id);
      console.log('📊 Modalidad encontrada:', userModality);
      console.log('📊 Datos de evaluación:', evaluationData);

      const result = await EvaluationService.submitEvaluation(evaluationData);
      console.log('📊 Resultado del envío:', result);

      if (result.success) {
        // Enviar evento de nueva calificación al servidor
        const fechaActual = new Date();
        const fecha = fechaActual.toLocaleDateString('es-CL');
        const hora = fechaActual.toLocaleTimeString('es-CL', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        
        console.log('👤 currentUser.id:', currentUser?.id);
        
        const calificacionEnviada = socketService.enviarNuevaCalificacion({
          rut: currentUser?.rut || '',
          score: satisfaction,
          comment: comments.trim() || undefined,
          date: new Date().toISOString()
        });

        if (calificacionEnviada) {
          // Calificación enviada exitosamente
        }
        
        // Registrar en GA4
        GA4Service.logRating(satisfaction, currentUser?.rut);

        Alert.alert(
          '¡Gracias!', 
          'Tu evaluación ha sido enviada exitosamente. Tu opinión es muy importante para nosotros.',
          [{ text: 'OK', onPress: () => {
            // Limpiar formulario
            setEmail('');
            setComments('');
            setSatisfaction(null);
            closeModal();
          }}]
        );
      } else {
        console.error('❌ Error en envío:', result.error);
        Alert.alert('Error', result.error || 'No se pudo enviar la evaluación. Inténtalo de nuevo.');
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error inesperado. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
      // Limpiar formulario
      setEmail('');
      setComments('');
      setSatisfaction(null);
    }
  };

  const scrollToField = (y: number) => {
    scrollViewRef.current?.scrollTo({ y, animated: true });
  };

  // Funciones protegidas contra duplicación en Samsung
  const handleEmailChange = (text: string) => {
    handleProtectedChange(text, setEmail, SamsungInputUtils.formatEmail);
  };

  const handleCommentsChange = (text: string) => {
    handleProtectedChange(text, setComments, SamsungInputUtils.formatComments);
  };

  if (!visible) return null;

  const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
    modalContainer: { 
      backgroundColor: colors.background, 
      borderTopLeftRadius: 20, 
      borderTopRightRadius: 20, 
      height: isSmallScreen ? screenHeight * 0.98 : screenHeight * 0.95,
      maxHeight: screenHeight * 0.98,
    },
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
    radioContainer: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      marginBottom: 12,
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    radioButton: { 
      width: 24, 
      height: 24, 
      borderRadius: 12, 
      borderWidth: 2, 
      marginRight: 12, 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: 'transparent',
    },
    radioSelected: { 
      width: 12, 
      height: 12, 
      borderRadius: 6, 
      backgroundColor: colors.primary 
    },
    radioText: { 
      fontSize: 16, 
      color: colors.text,
      fontWeight: '500',
      marginLeft: 8,
    },
    hintText: { fontSize: 14, color: colors.textSecondary, marginBottom: 10 },
    inputField: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 15, paddingVertical: 12, fontSize: 16, color: colors.text, marginBottom: 10 },
    textArea: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 15, paddingVertical: 12, fontSize: 16, color: colors.text, height: 100, textAlignVertical: 'top' },
    ratingContainer: { 
      flexDirection: 'row', 
      justifyContent: 'space-around', 
      alignItems: 'center',
      marginBottom: 15, 
      paddingHorizontal: 10,
      minHeight: 60,
    },
    starButton: { 
      padding: 12,
      borderRadius: 8,
      backgroundColor: 'transparent',
    },
    ratingLabels: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      marginBottom: 20, 
      paddingHorizontal: 10,
      alignItems: 'center',
    },
    ratingLabel: { 
      fontSize: 12, 
      color: colors.textSecondary, 
      textAlign: 'center', 
      flex: 1,
      lineHeight: 16,
      fontWeight: '500',
    },
    submitButton: { backgroundColor: colors.primary, paddingVertical: 15, borderRadius: 8, alignItems: 'center', marginTop: 20 },
    submitButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
    asterisk: { color: '#FF3B30' },
    modalityDisplay: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      padding: 15,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.primary,
      marginTop: 10,
    },
    modalityText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginLeft: 10,
    },
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

                {/* Información de Modalidad */}
                {currentUser?.modality_id && (
                  <View style={styles.questionContainer}>
                    <View style={styles.questionHeader}>
                      <Text style={styles.questionNumber}>📚</Text>
                      <Text style={styles.questionText}>Tu modalidad de estudio</Text>
                    </View>
                    
                    <View style={styles.modalityDisplay}>
                      <Ionicons name="school-outline" size={20} color={colors.primary} />
                      <Text style={styles.modalityText}>
                        {modalities.find(m => m.id_modality === currentUser.modality_id)?.type || 'Sin modalidad'}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Pregunta 1: Email */}
                <View style={styles.questionContainer}>
                  <View style={styles.questionHeader}>
                    <Text style={styles.questionNumber}>1.</Text>
                    <Text style={styles.questionText}>¿Cuál es tu correo Duoc UC?</Text>
                    <Text style={styles.asterisk}>*</Text>
                  </View>
                  
                  <Text style={styles.hintText}>
                    {email && currentUser 
                      ? 'Tu correo institucional se ha cargado automáticamente 😊' 
                      : 'Esto nos permite validar tu opinión 😊'
                    }
                  </Text>
                  
                  <TextInput
                    style={[styles.inputField, email && currentUser && { backgroundColor: colors.surface, opacity: 0.8 }]}
                    placeholder="Escriba una dirección de correo electrónico"
                    placeholderTextColor={colors.textSecondary}
                    value={email}
                    onChangeText={handleEmailChange}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    onFocus={() => scrollToField(200)}
                    editable={!currentUser || !email}
                  />
                </View>

                {/* Pregunta 2: Comentarios */}
                <View style={styles.questionContainer}>
                  <View style={styles.questionHeader}>
                    <Text style={styles.questionNumber}>2.</Text>
                    <Text style={styles.questionText}>¿Quieres dejarnos comentarios o sugerencias?</Text>
                  </View>
                  
                  <TextInput
                    style={styles.textArea}
                    placeholder="Escriba su respuesta"
                    placeholderTextColor={colors.textSecondary}
                    value={comments}
                    onChangeText={handleCommentsChange}
                    multiline
                    numberOfLines={4}
                    autoCorrect={false}
                    onFocus={() => scrollToField(450)}
                  />
                </View>

                {/* Pregunta 3: Satisfacción */}
                <View style={styles.questionContainer}>
                  <View style={styles.questionHeader}>
                    <Text style={styles.questionNumber}>3.</Text>
                    <Text style={styles.questionText}>¿Qué tan satisfecho estás con Nuestra App Duco?</Text>
                  </View>
                  
                  <View style={styles.ratingContainer}>
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <TouchableOpacity
                        key={rating}
                        style={styles.starButton}
                        onPress={() => setSatisfaction(rating)}
                        activeOpacity={0.7}
                      >
                        <Ionicons 
                          name={(satisfaction || 0) >= rating ? "star" : "star-outline"} 
                          size={40} 
                          color={(satisfaction || 0) >= rating ? "#FFD700" : colors.textSecondary} 
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
