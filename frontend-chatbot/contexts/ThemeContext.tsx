import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setThemeMode: (mode: 'light' | 'dark') => void;
  themeMode: 'light' | 'dark';
  colors: {
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    primary: string;
    error: string;
    overlay: string;
    tabBarBackground: string; // Color específico para la barra de navegación
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

const lightColors = {
  background: '#EBE6E6',
  surface: '#F8F9FA',
  text: '#2C3E50',
  textSecondary: '#7F8C8D',
  border: '#E5E5EA',
  primary: '#007BFF',
  error: '#FF3B30',
  overlay: 'rgba(0,0,0,0.4)',
  tabBarBackground: '#EBE6E6', // Gris claro neutro para la barra
};

const darkColors = {
  background: '#15151D', // Color específico de fondo
  surface: '#524e5c', // Color para superficies elevadas
  text: '#FFFFFF', // Texto principal en blanco
  textSecondary: '#B0B0B0', // Texto secundario en gris claro
  border: '#69605c', // Bordes en gris
  primary: '#A988F2', // Morado claro para botones
  error: '#FF3B30',
  overlay: 'rgba(16,13,17,0.8)', // Overlay usando #100d11
  tabBarBackground: '#302E40', // Color específico para la barra
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<'light' | 'dark'>('light');
  
  // Calcular si está en modo oscuro
  const isDarkMode = themeMode === 'dark';

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('themeMode');
      if (savedTheme !== null) {
        setThemeModeState(savedTheme as 'light' | 'dark');
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
  };

  const setThemeMode = async (mode: 'light' | 'dark') => {
    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem('themeMode', mode);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const toggleDarkMode = async () => {
    const newMode = isDarkMode ? 'light' : 'dark';
    await setThemeMode(newMode);
  };

  const colors = isDarkMode ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ 
      isDarkMode, 
      toggleDarkMode, 
      setThemeMode, 
      themeMode, 
      colors 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};
