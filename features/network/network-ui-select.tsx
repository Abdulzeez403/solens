import { Pressable, Text, View } from 'react-native'
import React from 'react'
import { SolanaCluster } from '@wallet-ui/react-native-web3js'
import { appStyles } from '@/constants/app-styles'

export function NetworkUiSelect({
  networks,
  selectedNetwork,
  setSelectedNetwork,
}: {
  networks: SolanaCluster[]
  selectedNetwork: SolanaCluster
  setSelectedNetwork: (network: SolanaCluster) => void
}) {
  return (
    <View style={appStyles.stack}>
      {networks
        .filter((i) => i.id !== selectedNetwork.id)
        .map((network) => (
          <View key={network.id}>
            <Pressable
              disabled={selectedNetwork.id === network.id}
              onPress={() => setSelectedNetwork(network)}
              style={appStyles.secondaryButton}
            >
              <Text style={appStyles.secondaryButtonText}>Switch to {network.label}</Text>
            </Pressable>
          </View>
        ))}
    </View>
  )
}
