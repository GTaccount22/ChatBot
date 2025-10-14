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
          paddingTop: Platform.OS === 'ios' ? 15 : 10,
          paddingBottom: Platform.OS === 'ios' ? 15 : 10, 
          height: Platform.OS === 'ios' ? 105 : 85,
        },
        tabBarLabelStyle: { display: 'none' }, // solo iconos
      }}
    >
      {/* Tab Home */}
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={28} color={color} />
          ),
        }}
      />

      {/* Tab Menu (abre modal, no navega) */}
      <Tabs.Screen
        name="menu"
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="menu" size={32} color={color} />
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
