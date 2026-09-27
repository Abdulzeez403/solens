import { ActivityIndicator, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import React, { useState } from 'react'
import { useMobileWallet } from '@wallet-ui/react-native-web3js'
import { appStyles } from '@/constants/app-styles'

export function AccountFeatureConnect() {
  const { account, connect } = useMobileWallet()
  const [sheetVisible, setSheetVisible] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConnect() {
    setError(null)
    setConnecting(true)
    try {
      await connect()
      setSheetVisible(false)
    } catch (cause) {
      setError(getConnectionError(cause))
    } finally {
      setConnecting(false)
    }
  }

  return (
    <View style={appStyles.stack}>
      <Pressable
        disabled={!!account}
        onPress={() => setSheetVisible(true)}
        style={({ pressed }) => [appStyles.primaryButton, pressed && { opacity: 0.88 }]}
      >
        <Text style={appStyles.primaryButtonText}>Connect Solana Wallet</Text>
      </Pressable>
      <Modal
        animationType="slide"
        onRequestClose={() => setSheetVisible(false)}
        transparent
        visible={sheetVisible}
        statusBarTranslucent
      >
        <View accessibilityViewIsModal style={sheetStyles.overlay}>
          <Pressable accessibilityLabel="Close wallet connection sheet" onPress={() => setSheetVisible(false)} style={StyleSheet.absoluteFill} />
          <View style={sheetStyles.sheet}>
            <View style={sheetStyles.handle} />
            <View style={sheetStyles.headerRow}>
              <View style={sheetStyles.headerIcon}><Text style={sheetStyles.solMark}>S</Text></View>
              <View style={sheetStyles.headerText}>
                <Text style={sheetStyles.eyebrow}>MOBILE WALLET ADAPTER</Text>
                <Text style={sheetStyles.title}>Connect a wallet</Text>
              </View>
              <Pressable accessibilityLabel="Close" onPress={() => setSheetVisible(false)} style={sheetStyles.closeButton}>
                <Text style={sheetStyles.closeText}>×</Text>
              </Pressable>
            </View>

            <View style={sheetStyles.readOnlyNote}>
              <Text style={sheetStyles.readOnlyTitle}>Read-only connection</Text>
              <Text style={sheetStyles.readOnlyCopy}>Solens can view your public address and on-chain data. It never receives permission to move funds.</Text>
            </View>

            <Text style={sheetStyles.listLabel}>Compatible Android wallets</Text>
            <View style={sheetStyles.walletList}>
              <WalletOption name="Phantom" description="Solana wallet" color="#ab9ff2" mark="P" />
              <WalletOption name="Solflare" description="Solana wallet" color="#fc822b" mark="S" />
              <WalletOption name="Backpack" description="Solana wallet" color="#e35b60" mark="B" />
            </View>

            {Platform.OS !== 'android' && (
              <Text style={sheetStyles.warning}>Mobile Wallet Adapter is supported on Android. Open this app in an Android development build; Expo Go is not supported.</Text>
            )}
            {error && <Text accessibilityRole="alert" style={sheetStyles.error}>{error}</Text>}

            <Pressable
              disabled={connecting || Platform.OS !== 'android'}
              onPress={handleConnect}
              style={({ pressed }) => [sheetStyles.connectButton, (pressed || connecting) && sheetStyles.connectButtonPressed, Platform.OS !== 'android' && sheetStyles.connectButtonDisabled]}
            >
              {connecting && <ActivityIndicator color="#ffffff" size="small" />}
              <Text style={sheetStyles.connectText}>{connecting ? 'Opening wallet...' : 'Continue to wallet'}</Text>
            </Pressable>
            <Text style={sheetStyles.footer}>Choose an installed wallet in the Android system prompt.</Text>
          </View>
        </View>
      </Modal>
    </View>
  )
}

function WalletOption({ name, description, color, mark }: { name: string; description: string; color: string; mark: string }) {
  return (
    <View style={sheetStyles.walletRow}>
      <View style={[sheetStyles.walletMark, { backgroundColor: color }]}><Text style={sheetStyles.walletMarkText}>{mark}</Text></View>
      <View style={sheetStyles.walletText}>
        <Text style={sheetStyles.walletName}>{name}</Text>
        <Text style={sheetStyles.walletDescription}>{description}</Text>
      </View>
      <View style={sheetStyles.compatibleBadge}><Text style={sheetStyles.compatibleText}>MWA</Text></View>
    </View>
  )
}

const sheetStyles = StyleSheet.create({
  overlay: { backgroundColor: 'rgba(3, 4, 8, 0.72)', flex: 1, justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#12151d', borderColor: '#2b3040', borderTopLeftRadius: 22, borderTopRightRadius: 22, borderWidth: 1, gap: 17, paddingHorizontal: 20, paddingTop: 9, paddingBottom: 30 },
  handle: { alignSelf: 'center', backgroundColor: '#414656', borderRadius: 3, height: 4, marginBottom: 3, width: 36 },
  headerRow: { alignItems: 'center', flexDirection: 'row', gap: 11 },
  headerIcon: { alignItems: 'center', backgroundColor: '#292442', borderRadius: 12, height: 42, justifyContent: 'center', width: 42 },
  solMark: { color: '#b9aaff', fontSize: 19, fontWeight: '800' },
  headerText: { flex: 1, gap: 3 },
  eyebrow: { color: '#8b91a4', fontSize: 9, fontWeight: '700', letterSpacing: 0.7 },
  title: { color: '#f3f4f8', fontSize: 18, fontWeight: '700' },
  closeButton: { alignItems: 'center', backgroundColor: '#20242f', borderRadius: 18, height: 34, justifyContent: 'center', width: 34 },
  closeText: { color: '#c0c4d0', fontSize: 22, lineHeight: 25 },
  readOnlyNote: { backgroundColor: '#111a18', borderColor: '#20302a', borderRadius: 12, borderWidth: 1, gap: 5, padding: 13 },
  readOnlyTitle: { color: '#51d99b', fontSize: 12, fontWeight: '700' },
  readOnlyCopy: { color: '#aeb7b0', fontSize: 11, lineHeight: 17 },
  listLabel: { color: '#8b91a4', fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginBottom: -9 },
  walletList: { gap: 1 },
  walletRow: { alignItems: 'center', flexDirection: 'row', gap: 11, minHeight: 56 },
  walletMark: { alignItems: 'center', borderRadius: 10, height: 34, justifyContent: 'center', width: 34 },
  walletMarkText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
  walletText: { flex: 1, gap: 2 },
  walletName: { color: '#e9eaf0', fontSize: 12, fontWeight: '600' },
  walletDescription: { color: '#777e91', fontSize: 10 },
  compatibleBadge: { backgroundColor: '#20242f', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 4 },
  compatibleText: { color: '#aeb3c1', fontSize: 8, fontWeight: '700' },
  warning: { color: '#e8bd74', fontSize: 11, lineHeight: 17 },
  error: { color: '#ff9aa4', fontSize: 11, lineHeight: 17 },
  connectButton: { alignItems: 'center', backgroundColor: '#7964ef', borderRadius: 12, flexDirection: 'row', gap: 8, justifyContent: 'center', minHeight: 50, marginTop: 1 },
  connectButtonPressed: { opacity: 0.87 },
  connectButtonDisabled: { backgroundColor: '#39354e' },
  connectText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  footer: { color: '#62697b', fontSize: 10, textAlign: 'center', marginTop: -8 },
})

function getConnectionError(cause: unknown): string {
  const message = cause instanceof Error ? cause.message : String(cause)
  if (/expo go|native module|native bridge/i.test(message)) {
    return 'MWA requires an Android development build; Expo Go does not include its native wallet bridge.'
  }
  if (/https|secure context|identity|association/i.test(message)) {
    return 'Wallet verification needs a valid HTTPS app identity and wallet association. Check the app identity URI configuration.'
  }
  if (/reject|cancel|declin/i.test(message)) {
    return 'The wallet connection was declined.'
  }
  return message ? `Could not connect to a wallet: ${message}` : 'Could not connect to a wallet. Open an MWA-compatible wallet and try again.'
}
