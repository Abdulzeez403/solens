import { DashboardScreen } from '@/features/dashboard/dashboard-screen'
import { SafeAreaView } from 'react-native-safe-area-context'
import React from 'react'
import { StyleSheet } from 'react-native'

export default function HomeTab() {
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <DashboardScreen />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({ screen: { backgroundColor: '#080a0f', flex: 1 } })