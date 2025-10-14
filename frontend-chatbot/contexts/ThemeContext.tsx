import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
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
  background: '#FFFFFF',
  surface: '#F8F9FA',
  text: '#2C3E50',
  textSecondary: '#7F8C8D',
  border: '#E5E5EA',
  primary: '#007BFF',
  error: '#FF3B30',
  overlay: 'rgba(0,0,0,0.4)',
  tabBarBackground: '#FFFFFF', // Blanco para la barra en modo claro
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
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('darkMode');
      if (savedTheme !== null) {
        setIsDarkMode(JSON.parse(savedTheme));
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
  };

  const toggleDarkMode = async () => {
    try {
      const newTheme = !isDarkMode;
      setIsDarkMode(newTheme);
      await AsyncStorage.setItem('darkMode', JSON.stringify(newTheme));
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const colors = isDarkMode ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};
