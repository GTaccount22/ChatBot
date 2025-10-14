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
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        headerShown: false,
        tabBarStyle: { 
          backgroundColor: colors.tabBarBackground, 
          borderTopWidth: 1, 
          borderTopColor: colors.border, 
          paddingTop: Platform.OS === 'ios' ? 15 : 10,
          paddingBottom: Platform.OS === 'ios' ? 15 : 10, 
          height: Platform.OS === 'ios' ? 105 : 85 
        },
        tabBarLabelStyle: { display: 'none' },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "menu" : "menu"} size={32} color={color} />
          ),
          tabBarButton: (props) => (
            <TouchableOpacity
              onPress={openMenu}
              style={props.style}
            >
              {props.children}
            </TouchableOpacity>
          ),
        }}
      />
    </Tabs>
  );
}
