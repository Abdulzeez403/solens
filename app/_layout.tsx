import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as Updates from 'expo-updates'
import { useEffect } from 'react'
import 'react-native-reanimated'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AppProviders } from '@/components/app-providers'

export default function RootLayout() {
  useEffect(() => {
    if (__DEV__ === false) {
      Updates.checkForUpdateAsync().then((update) => {
        if (update.isAvailable) {
          Updates.fetchUpdateAsync().then(() => Updates.reloadAsync())
        }
      })
    }
  }, [])

  return (
    <SafeAreaProvider>
      <AppProviders>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="transaction/[signature]" options={{ headerShown: false, animation: 'slide_from_right' }} />
        </Stack>
        <StatusBar style="light" />
      </AppProviders>
    </SafeAreaProvider>
  )
}
