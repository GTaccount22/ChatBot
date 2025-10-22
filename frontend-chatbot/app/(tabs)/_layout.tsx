import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, TouchableOpacity } from 'react-native';
import { useModal } from '../../contexts/ModalContext';
import { useTheme } from '../../contexts/ThemeContext';

export default function TabLayout() {
  const { openMenu } = useModal();
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { 
          backgroundColor: colors.tabBarBackground, 
          borderTopWidth: 0, 
          paddingTop: Platform.OS === 'ios' ? 15 : 12,
          paddingBottom: Platform.OS === 'ios' ? 15 : 12, 
          height: Platform.OS === 'ios' ? 105 : 90,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarLabelStyle: { display: 'none' }, // solo iconos
      }}
    >
      {/* Tab Home */}
      <Tabs.Screen
        name="home"
        options={{
        tabBarIcon: ({ color, focused }) => (
          <Ionicons name={focused ? "home" : "home-outline"} size={30} color={color} />
        ),
        }}
      />

      {/* Tab Menu (abre modal, no navega) */}
      <Tabs.Screen
        name="menu"
        options={{
        tabBarIcon: ({ color }) => (
          <Ionicons name="menu" size={34} color={color} />
        ),
          tabBarButton: (props) => (
            <TouchableOpacity onPress={openMenu} style={props.style}>
              {props.children}
            </TouchableOpacity>
          ),
        }}
      />
    </Tabs>
  );
}
