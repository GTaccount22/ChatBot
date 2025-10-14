import { useColorScheme } from '@/hooks/use-color-scheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import MenuModal from '../components/MenuModal';
import { ModalProvider, useModal } from '../contexts/ModalContext';
import { ThemeProvider as CustomThemeProvider } from '../contexts/ThemeContext';
import { AuthService } from '../lib/authService';

function AppWithModal() {
  const { isMenuVisible, closeMenu } = useModal();

  const handleLogout = async () => {
    await AuthService.logout();
    closeMenu();
    router.replace('/');
  };

  return (
    <>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <MenuModal visible={isMenuVisible} onClose={closeMenu} onLogout={handleLogout} />
    </>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <CustomThemeProvider>
      <ModalProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <AppWithModal />
          <StatusBar style="auto" />
        </ThemeProvider>
      </ModalProvider>
    </CustomThemeProvider>
  );
}
