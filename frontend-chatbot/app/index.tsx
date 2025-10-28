import { Redirect } from 'expo-router';
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from "../contexts/ThemeContext";
import { AuthService } from "../lib/authService";
import { GA4Service } from "../lib/ga4Service";
import { SamsungInputUtils } from "../lib/inputUtils";

interface User {
  rut: string;  // Primary Key
  first_name: string;
  last_name: string;
  institutional_email: string;
  gender: boolean;
  phone: string;
  created_at: string;
  modality_id: number;
}

export default function App() {
  const { colors, isDarkMode } = useTheme();
  const [rut, setRut] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<User | null>(null);
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);
  const [step, setStep] = useState<'rut' | 'success'>('rut');

  // Responsividad
  const { width, height } = Dimensions.get('window');
  const insets = useSafeAreaInsets();
  const isTablet = width > 768;
  const isSmallScreen = height < 600;
  const isLargeScreen = height > 800;

  const responsiveStyles = useMemo(() => {
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
        paddingBottom: Platform.OS === 'android' ? 100 : 30,
        backgroundColor: colors.background,
        minHeight: height,
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
        color: colors.text,
        fontFamily: "Jost",
      },
      welcomeSubtitle: {
        fontSize: subtitleFontSize,
        textAlign: "center",
        marginBottom: 20,
        color: colors.textSecondary,
        lineHeight: isTablet ? 28 : 24,
        paddingHorizontal: 20,
        fontFamily: "Jost",
      },
      inputContainer: { 
        marginBottom: Platform.OS === 'android' ? 50 : 25, 
        marginTop: Platform.OS === 'android' ? 60 : 40,
        paddingHorizontal: 10,
        width: '100%',
        paddingBottom: Platform.OS === 'android' ? 20 : 0,
      },
      inputLabel: {
        fontSize: isTablet ? 22 : isSmallScreen ? 18 : 20,
        fontWeight: "700",
        marginBottom: 15,
        color: colors.text,
        fontFamily: Platform.OS === 'android' ? 'Roboto' : 'Jost',
        textAlign: "center",
        letterSpacing: 0.5,
      },
      input: {
        backgroundColor: colors.surface,
        paddingHorizontal: isTablet ? 22 : 20,
        paddingVertical: isTablet ? 18 : 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: colors.primary,
        fontSize: inputFontSize,
        color: colors.text,
        minHeight: isTablet ? 65 : isSmallScreen ? 55 : 60,
        fontFamily: Platform.OS === 'android' ? 'Roboto' : 'Jost',
        textAlign: "center",
        fontWeight: "500",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      },
      button: {
        backgroundColor: colors.primary,
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
      buttonDisabled: { opacity: 0.6 },
      loadingContainer: { justifyContent: "center", alignItems: "center", flex: 1 },
      loadingText: {
        marginTop: 20,
        fontSize: isTablet ? 18 : isSmallScreen ? 14 : 16,
        color: colors.textSecondary,
        fontFamily: "Jost",
      },
    });
  }, [colors, width, height]);

  useEffect(() => {
    checkExistingSession();
    // Registrar evento de apertura de app en GA4
    GA4Service.logAppOpen();
  }, []);

  const checkExistingSession = async () => {
    setLoadingSession(true);
    try {
      const { isValid, session } = await AuthService.checkValidSession();
      if (isValid && session?.user) {
        setIsLoggedIn(true);
        const user: User = {
          rut: session.user.user_metadata?.rut || session.user.id || '',
          first_name: session.user.user_metadata?.first_name || '',
          last_name: session.user.user_metadata?.last_name || '',
          institutional_email: session.user.email || '',
          gender: session.user.user_metadata?.gender || false,
          phone: session.user.user_metadata?.phone || '',
          created_at: session.user.created_at || '',
          modality_id: session.user.user_metadata?.modality_id || 0
        };
        setUserData(user);
        setStep('success');
      }
    } catch (error) {
      console.error("❌ Error verificando sesión:", error);
    } finally {
      setLoadingSession(false);
    }
  };

  const handleRutChange = (text: string) => {
    // Limpiar el texto antes de formatear para evitar duplicación
    const cleanText = text.replace(/[^0-9kK]/g, '');
    
    // Solo actualizar si el texto realmente cambió
    const formattedRut = SamsungInputUtils.formatRut(cleanText);
    
    // Solo actualizar si el nuevo RUT es diferente al anterior
    if (formattedRut !== rut) {
      setRut(formattedRut);
    }
  };

  const handleLogin = async () => {
    if (!rut.trim()) {
      Alert.alert("Error", "Por favor ingresa tu RUT");
      return;
    }
    setLoadingLogin(true);
    try {
      const cleanRut = rut.replace(/[^0-9kK-]/g, '').replace(/k/g, 'K');
      const result = await AuthService.authenticateByRut(cleanRut);

      if (result.success && result.user) {
        const user = result.user as User;
        setUserData(user);
        setIsLoggedIn(true);
        setStep('success');
        
        // Registrar login en GA4 (analytics reemplaza el contador de usuarios)
        GA4Service.logLogin('rut', user.rut);
        
        Alert.alert("¡Bienvenido!", "Has iniciado sesión correctamente");
      } else {
        Alert.alert("Error", result.error || "No se pudo iniciar sesión");
      }
    } catch (error) {
      console.error("❌ Error iniciando sesión:", error);
      Alert.alert("Error", "Ocurrió un problema al iniciar sesión");
    } finally {
      setLoadingLogin(false);
    }
  };

  const logout = async () => {
    setLoadingLogin(true);
    try {
      await AuthService.logout();
      setIsLoggedIn(false);
      setStep('rut');
      setRut('');
      setUserData(null);
    } catch (error) {
      console.error("❌ Error cerrando sesión:", error);
    } finally {
      setLoadingLogin(false);
    }
  };

  if (loadingSession) {
    return (
      <View style={responsiveStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={responsiveStyles.loadingText}>Verificando sesión...</Text>
      </View>
    );
  }

  if (isLoggedIn) {
    return <Redirect href="/(tabs)/home" />;
  }

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView 
        contentContainerStyle={responsiveStyles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={responsiveStyles.logoContainer}>
          <Image
            source={
              isDarkMode 
                ? require('../assets/images/logo_duoc.png')
                : require('../assets/images/logoDuoc.png')
            }
            style={responsiveStyles.logoImage}
            resizeMode="contain"
          />
        </View>

        <Text style={responsiveStyles.welcomeTitle}>¡Te damos la Bienvenida!</Text>
        <Text style={responsiveStyles.welcomeSubtitle}>
          Aprovecha al máximo tu experiencia académica con Duoc
        </Text>

        <View style={responsiveStyles.inputContainer}>
          <Text style={responsiveStyles.inputLabel}>Ingresa tu RUT</Text>
          <TextInput
            style={responsiveStyles.input}
            placeholder="11.111.111-1"
            placeholderTextColor="#999"
            value={rut}
            onChangeText={handleRutChange}
            keyboardType={Platform.OS === 'ios' ? 'default' : 'visible-password'}
            maxLength={12}
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            selectTextOnFocus={false}
            underlineColorAndroid="transparent"
            returnKeyType="done"
            textContentType="none"
            dataDetectorTypes="none"
            editable={true}
            caretHidden={false}
            contextMenuHidden={true}
          />
        </View>

        <TouchableOpacity
          style={[responsiveStyles.button, loadingLogin && responsiveStyles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loadingLogin}
        >
          {loadingLogin ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={responsiveStyles.buttonText}>Iniciar Sesión</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
