import { router } from 'expo-router';
import { useEffect } from 'react';

export default function MenuScreen() {
  useEffect(() => {
    // Redirigir inmediatamente a home
    router.replace('/(tabs)/home');
  }, []);

  return null;
}
