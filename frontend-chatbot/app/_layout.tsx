import { useColorScheme } from '@/hooks/use-color-scheme';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import 'react-native-reanimated';

import MenuModal from '../components/MenuModal';
import { ModalProvider, useModal } from '../contexts/ModalContext';
import { ThemeProvider as CustomThemeProvider, useTheme } from '../contexts/ThemeContext';
import { TutorialProvider } from '../contexts/TutorialContext';
import { AuthService } from '../lib/authService';

// Componente principal que maneja el modal y stack
function AppWithModal() {
  const { isMenuVisible, closeMenu } = useModal();
  const { isDarkMode } = useTheme();

  // Logout seguro
  const handleLogout = async () => {
    try {
      await AuthService.logout();
      closeMenu();
      router.replace('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <MenuModal visible={isMenuVisible} onClose={closeMenu} onLogout={handleLogout} />
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
    </>
  );
}

// Wrapper para agrupar todos los providers
function AppProviders({ children }: { children: React.ReactNode }) {
  const colorScheme = useColorScheme();

  return (
    <CustomThemeProvider>
      <TutorialProvider>
        <ModalProvider>
          <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            {children}
          </NavigationThemeProvider>
        </ModalProvider>
      </TutorialProvider>
    </CustomThemeProvider>
  );
}

// RootLayout exportado
export default function RootLayout() {
  return (
    <AppProviders>
      <AppWithModal />
    </AppProviders>
  );
}
