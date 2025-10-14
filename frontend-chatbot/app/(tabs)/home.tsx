import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { AuthService } from "../../lib/authService";

type Usuario = {
  nombre: string;
  apellido: string;
  genero: boolean; // true = hombre, false = mujer
};


export default function HomeScreen() {
  const { colors } = useTheme();
  // Estados para el usuario actual
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Cargar datos del usuario desde AsyncStorage
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const sessionData = await AuthService.loadSession();
        console.log("Session data:", sessionData);
        if (sessionData && sessionData.user) {
          // Acceder a los datos del usuario desde user_metadata
          const userData = sessionData.user.user_metadata || sessionData.user;
          setCurrentUser(userData);
        }
      } catch (error) {
        console.error("Error cargando datos del usuario:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadUserData();
  }, []);

  // Obtener información del usuario actual
  const saludo = currentUser?.genero === true ? "¡Bienvenido!" : "¡Bienvenida!";
  const nombreUsuario = currentUser ? currentUser.nombre : "Usuario";
  const logo = currentUser?.genero === true
    ? "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" // Hombre
    : "https://cdn-icons-png.flaticon.com/512/3135/3135789.png"; // Mujer

  // Configuración del bot (debería venir de una API o configuración)
  const botConfig = {
    phone: "56937888616", // Tu número del bot
    message: "Hola, necesito ayuda"
  };

  const openWhatsApp = () => {
    const url = `https://wa.me/${botConfig.phone}?text=${encodeURIComponent(botConfig.message)}`;
    Linking.openURL(url).catch(() => 
      Alert.alert("Error", "No se pudo abrir WhatsApp. Verifica tu conexión a internet.")
    );
  };


  // Estilos dinámicos basados en el tema
  const dynamicStyles = StyleSheet.create({
    scrollView: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
      minHeight: "100%",
    },
    headerContainer: {
      alignItems: "center",
      marginBottom: 20,
      paddingHorizontal: 5,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.text,
      textAlign: "center",
      fontFamily: "Jost",
    },
    logo: {
      width: 120,
      height: 120,
      marginBottom: 20,
      borderRadius: 60,
    },
    subtitle: {
      fontSize: 16,
      marginBottom: 30,
      textAlign: "center",
      color: colors.textSecondary,
      lineHeight: 22,
      fontFamily: "Jost",
    },
    button: {
      backgroundColor: colors.primary, // Usar el color primario del tema
      paddingVertical: 15,
      paddingHorizontal: 30,
      borderRadius: 25,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
      marginBottom: 20,
    },
    buttonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
      textAlign: "center",
      fontFamily: "Jost",
    },
    infoContainer: {
      alignItems: "center",
      marginTop: 20,
    },
    infoText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: 5,
      fontFamily: "Jost",
    },
  });

  return (
    <ScrollView style={dynamicStyles.scrollView} contentContainerStyle={dynamicStyles.container}>
      <View style={dynamicStyles.headerContainer}>
        <Text style={dynamicStyles.title}>
          Hola {nombreUsuario}! Bienvenido a la plataforma
        </Text>
      </View>

      <Image 
        source={{ uri: logo }} 
        style={dynamicStyles.logo}
        resizeMode="contain"
      />

      <Text style={dynamicStyles.subtitle}>
        Ingresa a una de las opciones para continuar
      </Text>

      <TouchableOpacity 
        style={dynamicStyles.button} 
        onPress={openWhatsApp}
      >
        <Text style={dynamicStyles.buttonText}>Contactar a DucoBot</Text>
      </TouchableOpacity>

      {/* Informacion adicional */}
      <View style={dynamicStyles.infoContainer}>
        <Text style={dynamicStyles.infoText}>
          Chatea directamente con nuestro bot inteligente
        </Text>
        <Text style={dynamicStyles.infoText}>
          Disponible 24/7 para ayudarte
        </Text>
      </View>

    </ScrollView>
  );
}
