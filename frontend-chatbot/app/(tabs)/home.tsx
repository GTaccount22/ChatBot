import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  InteractionManager,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { useTutorial } from "../../contexts/TutorialContext";
import { AuthService } from "../../lib/authService";
import { TutorialService } from "../../lib/tutorialService";

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type Usuario = {
  nombre: string;
  apellido: string;
  genero: boolean;
};

interface TutorialStep {
  id: string;
  text: string;
  target: 'welcome' | 'mainButton' | 'menu';
}

function HomeScreen() {
  const { colors } = useTheme();
  const { 
    isTutorialVisible, 
    currentStep, 
    nextStep, 
    finishTutorial, 
    isManualTutorial, 
    setIsManualTutorial,
    startTutorial
  } = useTutorial();
  
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  const tutorialSteps: TutorialStep[] = [
    { id: 'welcome', text: '¡Bienvenido! Aquí puedes ver tu mensaje de bienvenida personalizado', target: 'welcome' },
    { id: 'mainButton', text: 'Este es el botón principal para contactar con DucoBot, nuestro asistente virtual disponible las 24 horas', target: 'mainButton' },
    { id: 'menu', text: 'Desde aquí puedes acceder a la configuración, calificar la aplicación, ver este tutorial y cerrar sesión', target: 'menu' }
  ];

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const sessionData = await AuthService.loadSession();
        if (sessionData && sessionData.user) {
          const userData = sessionData.user.user_metadata || sessionData.user;
          setCurrentUser(userData);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadUserData();
  }, []);

  useEffect(() => {
    const checkTutorialStatus = async () => {
      try {
        const seen = await TutorialService.hasSeenTutorial();
        if (!seen) {
          setIsManualTutorial(false); // Marcar como automático
          InteractionManager.runAfterInteractions(() => {
            startTutorial();
          });
        }
      } catch (error) {
        console.error('Error checking tutorial:', error);
      }
    };
    // Solo verificar tutorial automático si NO es manual Y no está visible
    if (!loading && !isManualTutorial && !isTutorialVisible) {
      checkTutorialStatus();
    }
  }, [loading, startTutorial, setIsManualTutorial, isManualTutorial, isTutorialVisible]);

  // Función para iniciar tutorial manualmente (ignora validación de BD)
  const startManualTutorial = () => {
    setIsManualTutorial(true); // Marcar como manual en contexto
    startTutorial(); // Iniciar directamente
  };

  // Exponer función globalmente para el menú
  React.useEffect(() => {
    (window as any).startManualTutorial = startManualTutorial;
    return () => {
      delete (window as any).startManualTutorial;
    };
  }, []);

  // Función personalizada para manejar el siguiente paso
  const handleNextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      nextStep();
    } else {
      handleFinishTutorial();
    }
  };

  // Función personalizada para manejar el final del tutorial
  const handleFinishTutorial = async () => {
    try {
      if (!isManualTutorial) {
        // Solo marcar como visto si es el tutorial automático (primera vez)
        const result = await TutorialService.markTutorialAsSeen();
        if (!result.success) {
          console.error('Error finishing tutorial:', result.error);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      // Usar la función del contexto
      finishTutorial();
    }
  };

  const getTooltipPosition = (step: number) => {
    switch (step) {
      case 0: // welcome - cerca del título
        return { top: 120, left: 20 };
      case 1: // mainButton - cerca del botón principal
        return { top: 400, left: 20 };
      case 2: // menu - mucho más arriba de la barra
        return { top: screenHeight - 300, left: 20 };
      default:
        return { top: 200, left: 20 };
    }
  };

  const nombreUsuario = currentUser?.nombre || "Usuario";
  const apellidoUsuario = currentUser?.apellido || "";
  
  // Generar iniciales del usuario
  const getInitials = (nombre: string, apellido: string) => {
    const firstInitial = nombre.charAt(0).toUpperCase();
    const lastInitial = apellido.charAt(0).toUpperCase();
    return `${firstInitial}${lastInitial}`;
  };
  
  const userInitials = getInitials(nombreUsuario, apellidoUsuario);

  const openWhatsApp = () => {
    const url = `https://wa.me/56937888616?text=${encodeURIComponent("Hola, necesito ayuda")}`;
    Linking.openURL(url).catch(() =>
      Alert.alert("Error", "No se pudo abrir WhatsApp")
    );
  };

  const styles = StyleSheet.create({
    scrollView: { flex: 1, backgroundColor: colors.background },
    container: { alignItems: "center", justifyContent: "center", padding: 20, minHeight: "100%" },
    headerContainer: { alignItems: "center", marginBottom: 20 },
    title: { fontSize: 24, fontWeight: "bold", color: colors.text, textAlign: "center" },
    avatarContainer: { 
      width: 120, 
      height: 120, 
      marginBottom: 20, 
      borderRadius: 60, 
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    avatarText: { 
      fontSize: 36, 
      fontWeight: 'bold', 
      color: '#FFFFFF',
      textAlign: 'center',
    },
    subtitle: { fontSize: 16, marginBottom: 30, textAlign: "center", color: colors.textSecondary },
    button: { backgroundColor: colors.primary, padding: 15, borderRadius: 25, marginBottom: 20 },
    buttonText: { color: "#fff", textAlign: "center" },
    infoContainer: { alignItems: "center", marginTop: 20 },
    infoText: { fontSize: 14, color: colors.textSecondary, textAlign: "center", marginBottom: 5 },
    // Tutorial styles
    tutorialOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.7)',
    },
    tutorialTooltip: {
      position: 'absolute',
      backgroundColor: colors.primary,
      padding: 20,
      borderRadius: 12,
      maxWidth: 300,
      minWidth: 250,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    tutorialProgress: {
      color: '#fff',
      fontSize: 12,
      textAlign: 'center',
      marginBottom: 8,
      opacity: 0.8,
    },
    tutorialText: {
      color: '#fff',
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 15,
    },
    tutorialButton: {
      backgroundColor: '#fff',
      padding: 10,
      borderRadius: 8,
      alignItems: 'center',
    },
    tutorialButtonText: {
      color: colors.primary,
      fontWeight: 'bold',
    },
  });

  // Tutorial funcionando correctamente

  return (
    <View style={{ flex: 1 }}>
      {/* TUTORIAL OVERLAY - TIPO OVERLAY CON RESALTADO */}
      {isTutorialVisible && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          zIndex: 9999
        }}>
          {/* Tooltip posicionado según el paso */}
          <View style={[
            styles.tutorialTooltip,
            getTooltipPosition(currentStep)
          ]}>
            <Text style={styles.tutorialProgress}>
              {currentStep + 1} de {tutorialSteps.length}
            </Text>
            <Text style={styles.tutorialText}>
              {tutorialSteps[currentStep]?.text}
            </Text>
            <TouchableOpacity style={styles.tutorialButton} onPress={handleNextStep}>
              <Text style={styles.tutorialButtonText}>
                {currentStep === tutorialSteps.length - 1 ? 'Finalizar' : 'Siguiente'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Hola {nombreUsuario}! Bienvenido a la plataforma</Text>
        </View>

        <View>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{userInitials}</Text>
          </View>
        </View>

        <View>
          <Text style={styles.subtitle}>
            Ingresa a una de las opciones para continuar
          </Text>
        </View>

        <View>
          <TouchableOpacity style={styles.button} onPress={openWhatsApp}>
            <Text style={styles.buttonText}>Contactar a DucoBot</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            Chatea directamente con nuestro bot inteligente
          </Text>
          <Text style={styles.infoText}>
            Disponible 24/7 para ayudarte
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

export default HomeScreen;