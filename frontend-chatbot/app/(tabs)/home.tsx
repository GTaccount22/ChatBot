import { router } from 'expo-router';
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
import { AuthService } from "../../lib/authService";

export default function HomeScreen() {
  // Estados para el usuario actual
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Cargar datos del usuario desde AsyncStorage
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const sessionData = await AuthService.loadSession();
        console.log("📋 Session data:", sessionData);
        if (sessionData && sessionData.user) {
          // Acceder a los datos del usuario desde user_metadata
          const userData = sessionData.user.user_metadata || sessionData.user;
          setCurrentUser(userData);
        }
      } catch (error) {
        console.error("❌ Error cargando datos del usuario:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadUserData();
  }, []);

  // Obtener información del usuario actual
  const saludo = currentUser?.genero ? "Bienvenido" : "Bienvenida";
  const nombreUsuario = currentUser ? `${currentUser.nombre} ${currentUser.apellido}` : "Usuario";
  const logo = currentUser?.genero 
    ? "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" // Hombre
    : "https://cdn-icons-png.flaticon.com/512/3135/3135789.png"; // Mujer

  // 🔧 Configuración del bot (debería venir de una API o configuración)
  const botConfig = {
    phone: "56937888616", // Tu número del bot
    message: "Hola, necesito hablar con DucoBot"
  };

  const openWhatsApp = () => {
    const url = `https://wa.me/${botConfig.phone}?text=${encodeURIComponent(botConfig.message)}`;
    Linking.openURL(url).catch(() => 
      Alert.alert("Error", "No se pudo abrir WhatsApp. Verifica tu conexión a internet.")
    );
  };

  const logout = async () => {
    try {
      await AuthService.logout();
      router.replace('/');
    } catch (error) {
      console.error("❌ Error cerrando sesión:", error);
    }
  };

  // 🎨 Estilos mejorados
  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>
          {saludo} {nombreUsuario} a la plataforma
        </Text>
      </View>

      <Image 
        source={{ uri: logo }} 
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.subtitle}>
        Ingresa a una de las opciones para continuar
      </Text>

      <TouchableOpacity 
        style={styles.button} 
        onPress={openWhatsApp}
      >
        <Text style={styles.buttonText}>Contactar a DucoBot</Text>
      </TouchableOpacity>

      {/* Botón de cerrar sesión */}
      <TouchableOpacity style={styles.logoutButtonBelow} onPress={logout}>
        <Text style={styles.logoutButtonTextBelow}>Cerrar Sesión</Text>
      </TouchableOpacity>

      {/* 📱 Información adicional */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          💬 Chatea directamente con nuestro bot inteligente
        </Text>
        <Text style={styles.infoText}>
          🕒 Disponible 24/7 para ayudarte
        </Text>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: "#E8E2E2",
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
    color: "#2c3e50",
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
    color: "#7f8c8d",
    lineHeight: 22,
    fontFamily: "Jost",
  },
  button: {
    backgroundColor: "#25D366", // Color oficial de WhatsApp
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
    color: "#7f8c8d",
    textAlign: "center",
    marginBottom: 5,
    fontFamily: "Jost",
  },
  logoutButtonBelow: {
    backgroundColor: "#ff0000",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 15,
    marginTop: 15,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: "#cc0000",
    shadowColor: "#ff0000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  logoutButtonTextBelow: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    fontFamily: "Jost",
  },
});
