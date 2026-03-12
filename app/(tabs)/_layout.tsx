import { Tabs } from 'expo-router';
import React from 'react';

import { BlurView } from 'expo-blur';
import { StyleSheet, Platform } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: () => (
          Platform.OS === 'ios' ? (
            <BlurView
              tint={colorScheme === 'dark' ? 'dark' : 'light'}
              intensity={80}
              style={StyleSheet.absoluteFill}
            />
          ) : undefined
        ),
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
            borderTopWidth: 0,
            elevation: 0,
            backgroundColor: 'transparent',
          },
          default: {
            borderTopWidth: 0,
            elevation: 10,
            backgroundColor: Colors[colorScheme ?? 'light'].background,
          },
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Gardes',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="map.fill" color={color} />,
        }}
      />
      
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="message.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: 'Demandes',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="bell.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="dogs"
        options={{
          title: 'Mes Chiens',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="pawprint.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
