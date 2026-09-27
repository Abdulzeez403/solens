import { Alert, Pressable, Text } from 'react-native'
import React from 'react'
import { useRouter } from 'expo-router'
import { useMobileWallet } from '@wallet-ui/react-native-web3js'
import { appStyles } from '@/constants/app-styles'

export function AccountFeatureDisconnect() {
  const { account, disconnect } = useMobileWallet()
  const router = useRouter()

  async function handleDisconnect() {
    try {
      await disconnect()
      router.replace('/')
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Try again from Settings.'
      Alert.alert('Could not disconnect wallet', message)
    }
  }

  return (
    <Pressable disabled={!account} onPress={() => void handleDisconnect()} style={appStyles.secondaryButton}>
      <Text style={appStyles.secondaryButtonText}>Disconnect</Text>
    </Pressable>
  )
}
