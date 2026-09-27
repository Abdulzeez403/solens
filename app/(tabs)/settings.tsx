import { Ionicons } from '@expo/vector-icons'
import Clipboard from '@react-native-clipboard/clipboard'
import { useMobileWallet } from '@wallet-ui/react-native-web3js'
import { AccountFeatureConnect } from '@/features/account/account-feature-connect'
import { AccountFeatureDisconnect } from '@/features/account/account-feature-disconnect'
import { useNetwork } from '@/features/network/use-network'
import React, { useState } from 'react'
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function SettingsTab() {
  const { account } = useMobileWallet()
  const { networks, selectedNetwork, setSelectedNetwork, getExplorerUrl } = useNetwork()
  const [copied, setCopied] = useState(false)
  const address = account?.address.toBase58()

  function copyAddress() {
    if (!address) return
    Clipboard.setString(address)
    setCopied(true)
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>ACCOUNT & PREFERENCES</Text>
          <Text style={styles.title}>Settings</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>Wallet</Text>
            <View style={[styles.statusBadge, account ? styles.connectedBadge : styles.disconnectedBadge]}>
              <View style={[styles.statusDot, account ? styles.connectedDot : styles.disconnectedDot]} />
              <Text style={[styles.statusLabel, account ? styles.connectedText : styles.disconnectedText]}>
                {account ? 'CONNECTED' : 'NOT CONNECTED'}
              </Text>
            </View>
          </View>
          {account ? (
            <View style={styles.walletPanel}>
              <View style={styles.walletIdentity}>
                <View style={styles.walletIcon}><Ionicons name="wallet-outline" size={19} color="#c0b5ff" /></View>
                <View style={styles.walletCopy}>
                  <Text style={styles.walletName}>Solana wallet</Text>
                  <Text style={styles.walletNetwork}>{selectedNetwork.label} · Read-only</Text>
                </View>
              </View>
              <View style={styles.addressBlock}>
                <Text style={styles.caption}>PUBLIC ADDRESS</Text>
                <Text selectable style={styles.address}>{address}</Text>
              </View>
              <View style={styles.actionRow}>
                <Pressable accessibilityRole="button" onPress={copyAddress} style={styles.actionButton}>
                  <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={16} color={copied ? '#51d99b' : '#d7d9e1'} />
                  <Text style={[styles.actionText, copied && styles.copiedText]}>{copied ? 'Copied' : 'Copy address'}</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => void Linking.openURL(getExplorerUrl(`address/${encodeURIComponent(account.address.toBase58())}`))}
                  style={styles.actionButton}
                >
                  <Ionicons name="open-outline" size={16} color="#d7d9e1" />
                  <Text style={styles.actionText}>Explorer</Text>
                </Pressable>
              </View>
              <View style={styles.disconnectWrap}><AccountFeatureDisconnect /></View>
            </View>
          ) : (
            <View style={styles.connectPanel}>
              <View style={styles.connectIcon}><Ionicons name="wallet-outline" size={21} color="#a592ff" /></View>
              <View style={styles.connectCopy}>
                <Text style={styles.walletName}>No wallet connected</Text>
                <Text style={styles.walletNetwork}>Connect through Mobile Wallet Adapter.</Text>
              </View>
              <AccountFeatureConnect />
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>Network</Text>
            <Text style={styles.currentNetwork}>{selectedNetwork.label}</Text>
          </View>
          <View accessibilityRole="radiogroup" style={styles.networkControl}>
            {networks.map((network) => {
              const selected = network.id === selectedNetwork.id
              return (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  key={network.id}
                  onPress={() => setSelectedNetwork(network)}
                  style={[styles.networkOption, selected && styles.networkOptionSelected]}
                >
                  <View style={[styles.networkOptionDot, selected && styles.networkOptionDotSelected]} />
                  <Text style={[styles.networkOptionText, selected && styles.networkOptionTextSelected]}>{network.label}</Text>
                </Pressable>
              )
            })}
          </View>
          <Text style={styles.sectionHint}>Changing networks refreshes wallet data from that cluster.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & security</Text>
          <View style={styles.securityPanel}>
            <View style={styles.securityRow}>
              <View style={styles.securityIcon}><Ionicons name="eye-outline" size={17} color="#51d99b" /></View>
              <View style={styles.securityCopy}>
                <Text style={styles.securityTitle}>Read-only access</Text>
                <Text style={styles.sectionHint}>Only your public address and public on-chain data are used.</Text>
              </View>
              <Ionicons name="checkmark-circle" size={17} color="#51d99b" />
            </View>
            <View style={styles.panelDivider} />
            <View style={styles.securityRow}>
              <View style={styles.securityIcon}><Ionicons name="key-outline" size={17} color="#a592ff" /></View>
              <View style={styles.securityCopy}>
                <Text style={styles.securityTitle}>Private keys stay yours</Text>
                <Text style={styles.sectionHint}>Solens never asks for your recovery phrase or secret key.</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.aboutRow}>
          <View style={styles.aboutMark}><Text style={styles.aboutLetter}>S</Text></View>
          <View style={styles.aboutCopy}><Text style={styles.aboutTitle}>Solens</Text><Text style={styles.sectionHint}>Mobile wallet analytics</Text></View>
          <Text style={styles.version}>v0.1</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#080a0f', flex: 1 },
  content: { gap: 24, padding: 20, paddingBottom: 34 },
  header: { gap: 4, paddingTop: 4 },
  eyebrow: { color: '#8b91a4', fontSize: 9, fontWeight: '700', letterSpacing: 0.7 },
  title: { color: '#f3f4f8', fontSize: 25, fontWeight: '700' },
  section: { gap: 11 },
  sectionHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  sectionTitle: { color: '#f3f4f8', fontSize: 14, fontWeight: '700' },
  currentNetwork: { color: '#b9aaff', fontSize: 11, fontWeight: '600' },
  statusBadge: { alignItems: 'center', borderRadius: 12, flexDirection: 'row', gap: 6, paddingHorizontal: 9, paddingVertical: 6 },
  connectedBadge: { backgroundColor: '#142a23' },
  disconnectedBadge: { backgroundColor: '#20242f' },
  statusDot: { borderRadius: 3, height: 6, width: 6 },
  connectedDot: { backgroundColor: '#51d99b' },
  disconnectedDot: { backgroundColor: '#8b91a4' },
  statusLabel: { fontSize: 8, fontWeight: '700' },
  connectedText: { color: '#51d99b' },
  disconnectedText: { color: '#aeb3c1' },
  walletPanel: { backgroundColor: '#12151d', borderColor: '#252a36', borderRadius: 14, borderWidth: 1, padding: 14 },
  walletIdentity: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  walletIcon: { alignItems: 'center', backgroundColor: '#292442', borderRadius: 11, height: 38, justifyContent: 'center', width: 38 },
  walletCopy: { flex: 1, gap: 3 },
  walletName: { color: '#e9eaf0', fontSize: 12, fontWeight: '600' },
  walletNetwork: { color: '#8b91a4', fontSize: 10 },
  addressBlock: { backgroundColor: '#0d1017', borderRadius: 9, gap: 6, marginTop: 14, padding: 11 },
  caption: { color: '#777e91', fontSize: 8, fontWeight: '700', letterSpacing: 0.6 },
  address: { color: '#dfe1e8', fontSize: 11, lineHeight: 17 },
  actionRow: { flexDirection: 'row', gap: 9, marginTop: 10 },
  actionButton: { alignItems: 'center', backgroundColor: '#1b1f2a', borderColor: '#2b3040', borderRadius: 9, borderWidth: 1, flex: 1, flexDirection: 'row', gap: 7, justifyContent: 'center', minHeight: 38 },
  actionText: { color: '#d7d9e1', fontSize: 10, fontWeight: '600' },
  copiedText: { color: '#51d99b' },
  disconnectWrap: { borderTopColor: '#252a36', borderTopWidth: StyleSheet.hairlineWidth, marginTop: 12, paddingTop: 12 },
  connectPanel: { alignItems: 'center', backgroundColor: '#12151d', borderColor: '#252a36', borderRadius: 14, borderWidth: 1, gap: 12, padding: 15 },
  connectIcon: { alignItems: 'center', backgroundColor: '#211d35', borderRadius: 20, height: 46, justifyContent: 'center', width: 46 },
  connectCopy: { alignItems: 'center', gap: 4 },
  networkControl: { backgroundColor: '#12151d', borderColor: '#252a36', borderRadius: 12, borderWidth: 1, flexDirection: 'row', gap: 6, padding: 5 },
  networkOption: { alignItems: 'center', borderRadius: 8, flex: 1, flexDirection: 'row', gap: 7, justifyContent: 'center', minHeight: 39 },
  networkOptionSelected: { backgroundColor: '#25213a' },
  networkOptionDot: { backgroundColor: '#62697b', borderRadius: 3, height: 6, width: 6 },
  networkOptionDotSelected: { backgroundColor: '#a592ff' },
  networkOptionText: { color: '#8b91a4', fontSize: 11, fontWeight: '600' },
  networkOptionTextSelected: { color: '#d2c9ff' },
  sectionHint: { color: '#777e91', fontSize: 10, lineHeight: 15 },
  securityPanel: { backgroundColor: '#12151d', borderColor: '#252a36', borderRadius: 14, borderWidth: 1, paddingHorizontal: 13 },
  securityRow: { alignItems: 'center', flexDirection: 'row', gap: 10, minHeight: 67, paddingVertical: 10 },
  securityIcon: { alignItems: 'center', backgroundColor: '#20242f', borderRadius: 9, height: 34, justifyContent: 'center', width: 34 },
  securityCopy: { flex: 1, gap: 4 },
  securityTitle: { color: '#e0e2e9', fontSize: 11, fontWeight: '600' },
  panelDivider: { backgroundColor: '#252a36', height: StyleSheet.hairlineWidth },
  aboutRow: { alignItems: 'center', flexDirection: 'row', gap: 10, paddingVertical: 2 },
  aboutMark: { alignItems: 'center', backgroundColor: '#292442', borderRadius: 10, height: 34, justifyContent: 'center', width: 34 },
  aboutLetter: { color: '#c1b5ff', fontSize: 14, fontWeight: '800' },
  aboutCopy: { flex: 1, gap: 3 },
  aboutTitle: { color: '#dfe1e8', fontSize: 11, fontWeight: '600' },
  version: { color: '#62697b', fontSize: 10 },
})