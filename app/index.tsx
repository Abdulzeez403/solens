import { Ionicons } from '@expo/vector-icons'
import { useMobileWallet } from '@wallet-ui/react-native-web3js'
import { AccountFeatureConnect } from '@/features/account/account-feature-connect'
import { Redirect } from 'expo-router'
import React from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function IndexRoute() {
  const { account } = useMobileWallet()

  if (account) return <Redirect href="/(tabs)" />

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.page}>
          <View style={styles.header}>
            <View style={styles.brandMark}>
              <View style={[styles.markLine, styles.markTop]} />
              <View style={[styles.markLine, styles.markMiddle]} />
              <View style={[styles.markLine, styles.markBottom]} />
            </View>
            <Text style={styles.brandName}>Solens</Text>
            <View style={styles.networkTag}><View style={styles.networkDot} /><Text style={styles.networkText}>SOLANA</Text></View>
          </View>

          <View style={styles.hero}>
            <Text style={styles.eyebrow}>YOUR WALLET, IN CONTEXT</Text>
            <Text style={styles.headline}>
              Ask your <Text style={styles.headlineAccent}>Solana wallet</Text> anything.
            </Text>
            <Text style={styles.subtitle}>
              Understand your balances, token holdings and transactions with clear, data-grounded insights.
            </Text>
            <View accessibilityLabel="Wallet activity illustration" style={styles.chart}>
              <View style={styles.chartGuide} />
              <View style={[styles.chartSegment, styles.chartSegmentOne]} />
              <View style={[styles.chartSegment, styles.chartSegmentTwo]} />
              <View style={[styles.chartSegment, styles.chartSegmentThree]} />
              <View style={[styles.chartSegment, styles.chartSegmentFour]} />
              <View style={[styles.chartPoint, styles.chartPointOne]} />
              <View style={[styles.chartPoint, styles.chartPointTwo]} />
              <View style={[styles.chartPoint, styles.chartPointThree]} />
              <View style={[styles.chartPoint, styles.chartPointFour]} />
            </View>
          </View>

          <View style={styles.actions}>
            <AccountFeatureConnect />
            <View style={styles.securityNote}>
              <Ionicons name="shield-checkmark-outline" size={17} color="#51d99b" />
              <Text style={styles.securityText}>Read-only access. Your public address is all Solens needs; private keys stay in your wallet.</Text>
            </View>
            <View style={styles.platformNote}>
              <Ionicons name="phone-portrait-outline" size={14} color="#777e91" />
              <Text style={styles.platformText}>Android development build · MWA-compatible wallet required</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#080a0f', flex: 1 },
  scrollContent: { flexGrow: 1 },
  page: { alignSelf: 'center', flex: 1, gap: 18, justifyContent: 'space-between', maxWidth: 480, paddingHorizontal: 24, paddingTop: 14, paddingBottom: 18, width: '100%' },
  header: { alignItems: 'center', flexDirection: 'row', gap: 11 },
  brandMark: { alignItems: 'center', backgroundColor: '#7964ef', borderRadius: 13, height: 43, justifyContent: 'center', padding: 9, width: 43 },
  markLine: { backgroundColor: '#ffffff', borderRadius: 2, height: 3, marginVertical: 2, transform: [{ skewX: '-32deg' }] },
  markTop: { width: 18 },
  markMiddle: { opacity: 0.76, width: 23 },
  markBottom: { width: 18 },
  brandName: { color: '#f3f4f8', flex: 1, fontSize: 16, fontWeight: '700' },
  networkTag: { alignItems: 'center', backgroundColor: '#141922', borderColor: '#252a36', borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 6, paddingHorizontal: 10, paddingVertical: 7 },
  networkDot: { backgroundColor: '#51d99b', borderRadius: 4, height: 7, width: 7 },
  networkText: { color: '#aeb3c1', fontSize: 9, fontWeight: '700' },
  hero: { alignItems: 'center', paddingTop: 12 },
  eyebrow: { color: '#51d99b', fontSize: 9, fontWeight: '700', letterSpacing: 1, marginBottom: 14 },
  headline: { color: '#f3f4f8', fontSize: 32, fontWeight: '700', lineHeight: 39, textAlign: 'center' },
  headlineAccent: { color: '#ad9cff' },
  subtitle: { color: '#969bad', fontSize: 14, lineHeight: 21, marginTop: 12, maxWidth: 330, textAlign: 'center' },
  chart: { height: 128, marginTop: 14, overflow: 'hidden', position: 'relative', width: '100%' },
  chartGuide: { backgroundColor: '#1a1e29', height: StyleSheet.hairlineWidth, left: '4%', position: 'absolute', right: '4%', top: 92 },
  chartSegment: { backgroundColor: '#8d78f0', borderRadius: 2, height: 2, position: 'absolute' },
  chartSegmentOne: { left: '2%', top: 75, transform: [{ rotate: '-32deg' }], width: '29%' },
  chartSegmentTwo: { left: '24%', top: 60, transform: [{ rotate: '22deg' }], width: '28%' },
  chartSegmentThree: { left: '45%', top: 52, transform: [{ rotate: '-37deg' }], width: '31%' },
  chartSegmentFour: { left: '68%', top: 39, transform: [{ rotate: '22deg' }], width: '30%' },
  chartPoint: { backgroundColor: '#51d99b', borderColor: '#080a0f', borderRadius: 5, borderWidth: 2, height: 10, position: 'absolute', width: 10 },
  chartPointOne: { left: '24%', top: 48 },
  chartPointTwo: { left: '45%', top: 48 },
  chartPointThree: { left: '68%', top: 27 },
  chartPointFour: { left: '94%', top: 32 },
  actions: { gap: 13, paddingBottom: 3 },
  securityNote: { alignItems: 'flex-start', flexDirection: 'row', gap: 9, paddingHorizontal: 2 },
  securityText: { color: '#858b9e', flex: 1, fontSize: 11, lineHeight: 17 },
  platformNote: { alignItems: 'center', flexDirection: 'row', gap: 7, justifyContent: 'center' },
  platformText: { color: '#656c7d', fontSize: 9 },
})