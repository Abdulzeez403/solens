import { Ionicons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'
import React from 'react'

const tabIcons = {
  index: 'grid-outline',
  activity: 'pulse-outline',
  ai: 'sparkles-outline',
  portfolio: 'pie-chart-outline',
  settings: 'settings-outline',
} as const

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#a592ff',
        tabBarInactiveTintColor: '#777e91',
        tabBarStyle: {
          backgroundColor: '#0d1017',
          borderTopColor: '#252a36',
          height: 62,
          paddingBottom: 5,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 1 },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={tabIcons[route.name as keyof typeof tabIcons]} size={size} color={color} />
        ),
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="activity" options={{ title: 'Activity' }} />
      <Tabs.Screen name="ai" options={{ title: 'AI' }} />
      <Tabs.Screen name="portfolio" options={{ title: 'Portfolio' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  )
}