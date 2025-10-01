import React, { useState, useEffect } from "react";
import { Redirect } from 'expo-router';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Dimensions,
  Platform
} from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthService } from "../lib/authService";

interface User {
  id: string;
  nombre: string;
  apellido: string;
  email_institucional: string;
  rut: string;
  genero: boolean;
}

export default function App() {
  const [rut, setRut] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'rut' | 'otp' | 'success'>('rut');
  const [userEmail, setUserEmail] = useState("");

  // Variables responsivas
  const { width, height } = Dimensions.get('window');
  const insets = useSafeAreaInsets();
  const isTablet = width > 768;
  const isSmallScreen = height < 600;
  const isLargeScreen = height > 800;

  // Función para generar estilos responsivos
  const getResponsiveStyles = () => {
    const basePaddingTop = isSmallScreen ? 100 : isLargeScreen ? 150 : 150;
    const basePaddingHorizontal = isTablet ? 60 : 30;
    const logoSize = isTablet ? { width: 300, height: 120 } : { width: 200, height: 80 };
    const titleFontSize = isTablet ? 32 : isSmallScreen ? 22 : 26;
    const subtitleFontSize = isTablet ? 20 : isSmallScreen ? 15 : 17;
    const inputFontSize = isTablet ? 20 : isSmallScreen ? 15 : 17;
    const buttonFontSize = isTablet ? 20 : isSmallScreen ? 16 : 18;

    return StyleSheet.create({
      container: {
        flexGrow: 1,
        justifyContent: "flex-start",
        paddingTop: basePaddingTop,
        paddingHorizontal: basePaddingHorizontal,
        paddingBottom: 30,
        backgroundColor: "#E8E2E2",
      },
      logoContainer: {
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
      },
      logoImage: logoSize,
      welcomeTitle: {
        fontSize: titleFontSize,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 5,
        color: "#2c3e50",
        fontFamily: "Jost",
      },
      welcomeSubtitle: {
        fontSize: subtitleFontSize,
        textAlign: "center",
        marginBottom: 20,
        color: "#2c3e50",
        lineHeight: isTablet ? 28 : 24,
        paddingHorizontal: 20,
        fontFamily: "Jost",
      },
      inputContainer: { 
        marginBottom: 20, 
        marginTop: 35 
      },
      inputLabel: {
        fontSize: isTablet ? 22 : isSmallScreen ? 16 : 18,
        fontWeight: "600",
        marginBottom: 15,
        color: "#2c3e50",
        fontFamily: "Jost",
        textAlign: "center",
      },
      input: {
        backgroundColor: "#fff",
        padding: isTablet ? 22 : 18,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#ddd",
        fontSize: inputFontSize,
        color: "#2c3e50",
        height: isTablet ? 65 : isSmallScreen ? 50 : 55,
        fontFamily: "Jost",
      },
      button: {
        backgroundColor: "#007BFF",
        paddingVertical: isTablet ? 22 : isSmallScreen ? 15 : 18,
        paddingHorizontal: isTablet ? 50 : 40,
        borderRadius: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
      },
      buttonText: {
        color: "#fff",
        fontSize: buttonFontSize,
        fontWeight: "bold",
        marginRight: 10,
        fontFamily: "Jost",
      },
      buttonDisabled: {
        opacity: 0.6,
      },
      loadingContainer: {
        justifyContent: "center",
        alignItems: "center",
      },
      loadingText: {
        marginTop: 20,
        fontSize: isTablet ? 18 : isSmallScreen ? 14 : 16,
        color: "#666",
        fontFamily: "Jost",
      },
    });
  };

  const responsiveStyles = getResponsiveStyles();

  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    setLoading(true);
    try {
      const { isValid, session } = await AuthService.checkValidSession();
      if (isValid && session?.user) {
        setIsLoggedIn(true);
        // Convertir el usuario de Supabase al formato esperado
        const user: User = {
          id: session.user.id || '',
          nombre: session.user.user_metadata?.nombre || '',
          apellido: session.user.user_metadata?.apellido || '',
          email_institucional: session.user.email || '',
          rut: session.user.user_metadata?.rut || '',
          genero: session.user.user_metadata?.genero || false
        };
        setUserData(user);
        setStep('success');
      }
    } catch (error) {
      console.error("❌ Error verificando sesión:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRutChange = (text: string) => {
    // Formatear RUT automáticamente: 12.345.678-9
    let clean = text.replace(/[^0-9kK]/g, "").toUpperCase();
    let body = clean.slice(0, -1);
    let dv = clean.slice(-1);
    body = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    setRut(body ? `${body}-${dv}` : dv);
  };

  const handleLogin = async () => {
    if (!rut.trim()) {
      Alert.alert("Error", "Por favor ingresa tu RUT");
      return;
    }
    setLoading(true);
    try {
      console.log(`📝 RUT ingresado: ${rut}`);
      const cleanRut = rut.replace(/[^0-9kK-]/g, '').replace(/k/g, 'K');
      console.log(`🧹 RUT limpio: ${cleanRut}`);

      const result = await AuthService.authenticateByRut(cleanRut);
      console.log(`📋 Resultado de authenticateByRut:`, result);

      if (result.success) {
        setUserEmail(result.email || '');
        setUserData(result.user as User);
        setIsLoggedIn(true);
        setStep('success');
        Alert.alert("¡Bienvenido!", "Has iniciado sesión correctamente");
      } else {
        console.log(`❌ Error en authenticateByRut: ${result.error}`);
        Alert.alert("Error", result.error);
      }
    } catch (error) {
      console.error("❌ Error iniciando sesión:", error);
      Alert.alert("Error", "Ocurrió un problema al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    setStep('rut');
    setOtpCode('');
    setUserEmail('');
    setUserData(null);
  };

  const logout = async () => {
    setLoading(true);
    try {
      await AuthService.logout();
      setIsLoggedIn(false);
      setStep('rut');
      setRut('');
      setOtpCode('');
      setUserEmail('');
      setUserData(null);
    } catch (error) {
      console.error("❌ Error cerrando sesión:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && step === 'rut') {
    return (
      <View style={[responsiveStyles.container, responsiveStyles.loadingContainer]}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text style={responsiveStyles.loadingText}>Verificando sesión...</Text>
      </View>
    );
  }

  if (isLoggedIn) {
    return <Redirect href="/(tabs)/home" />;
  }

  return (
    <ScrollView contentContainerStyle={responsiveStyles.container}>
      <View style={responsiveStyles.logoContainer}>
        <Image
          source={require('../assets/images/logoDuoc.png')}
          style={responsiveStyles.logoImage}
          resizeMode="contain"
        />
      </View>

      {step === 'rut' && (
        <>
          <Text style={responsiveStyles.welcomeTitle}>¡Te damos la Bienvenida!</Text>
          <Text style={responsiveStyles.welcomeSubtitle}>
            Aprovecha al máximo tu experiencia académica con Duoc
          </Text>

          <View style={responsiveStyles.inputContainer}>
            <Text style={responsiveStyles.inputLabel}>Ingresa tu RUT</Text>
            <TextInput
              style={responsiveStyles.input}
              placeholder="11.111.111-1"
              value={rut}
              onChangeText={handleRutChange}
              keyboardType="default"
              maxLength={12}
            />
          </View>

          <TouchableOpacity
            style={[responsiveStyles.button, loading && responsiveStyles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={responsiveStyles.buttonText}>Iniciar Sesión</Text>
            )}
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}