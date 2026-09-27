import { Ionicons } from '@expo/vector-icons'
import Clipboard from '@react-native-clipboard/clipboard'
import { useMobileWallet } from '@wallet-ui/react-native-web3js'
import { useAccountGetDashboard } from '@/features/account/use-account-get-dashboard'
import { useNetwork } from '@/features/network/use-network'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useState } from 'react'
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function TransactionDetailScreen() {
  const router = useRouter()
  const { signature: signatureParam } = useLocalSearchParams<{ signature: string }>()
  const signature = Array.isArray(signatureParam) ? signatureParam[0] : signatureParam
  const { account } = useMobileWallet()
  const { selectedNetwork, getExplorerUrl } = useNetwork()
  const query = useAccountGetDashboard(account?.address, 50)
  const [copied, setCopied] = useState(false)
  const transaction = query.data?.transactions.find((item) => item.signature === signature)

  function goBack() {
    if (router.canGoBack()) router.back()
    else router.replace('/(tabs)/activity')
  }

  function copySignature() {
    if (!signature) return
    Clipboard.setString(signature)
    setCopied(true)
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.topbar}>
        <Pressable accessibilityLabel="Go back" onPress={goBack} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={19} color="#e9eaf0" />
        </Pressable>
        <Text style={styles.topbarTitle}>Transaction details</Text>
        <Pressable accessibilityLabel={copied ? 'Signature copied' : 'Copy signature'} onPress={copySignature} style={styles.iconButton}>
          <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={17} color={copied ? '#51d99b' : '#c0c4d0'} />
        </Pressable>
      </View>

      {!account ? (
        <View style={styles.statePanel}><Text style={styles.stateTitle}>Wallet disconnected</Text><Text style={styles.muted}>Reconnect to view this transaction.</Text></View>
      ) : query.isLoading && !query.data ? (
        <View style={styles.statePanel}><ActivityIndicator color="#a592ff" /><Text style={styles.muted}>Loading transaction...</Text></View>
      ) : query.isError ? (
        <Pressable onPress={() => void query.refetch()} style={styles.statePanel}>
          <Ionicons name="cloud-offline-outline" size={22} color="#ff8793" />
          <Text style={styles.stateTitle}>Transaction unavailable</Text>
          <Text style={styles.muted}>Tap to retry loading on-chain details.</Text>
        </Pressable>
      ) : !transaction ? (
        <View style={styles.statePanel}>
          <Ionicons name="search-outline" size={22} color="#a592ff" />
          <Text style={styles.stateTitle}>Transaction not in recent history</Text>
          <Text style={styles.muted}>This view currently searches the latest 50 wallet transactions.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <View style={[styles.typeIcon, transaction.status === 'Failed' && styles.failedIcon]}>
              <Ionicons name={iconForType(transaction.type)} size={21} color={transaction.status === 'Failed' ? '#ff8793' : '#b9aaff'} />
            </View>
            <Text style={styles.typeLabel}>{transaction.type.toUpperCase()}</Text>
            <Text style={styles.amount}>{transaction.amount}</Text>
            <Text style={styles.usdValue}>{transaction.valueUsd === null ? 'USD value unavailable' : formatUsd(transaction.valueUsd)}</Text>
            <View style={[styles.statusPill, transaction.status === 'Failed' && styles.failedStatus]}>
              <View style={[styles.statusDot, transaction.status === 'Failed' && styles.failedDot]} />
              <Text style={[styles.statusText, transaction.status === 'Failed' && styles.failedText]}>{transaction.status}</Text>
            </View>
          </View>

          <View style={styles.detailsList}>
            <DetailRow label="Network" value={selectedNetwork.label} />
            <DetailRow label="Timestamp" value={formatTimestamp(transaction.timestamp)} />
            <DetailRow label="Network fee" value={`${formatSol(transaction.feeLamports)} SOL`} />
            <DetailRow label="Fee payer" value={transaction.accounts[0] ?? 'Unavailable'} selectable />
            <DetailRow label="Signature" value={signature ?? ''} selectable />
            {transaction.programs.map((program) => <DetailRow key={program} label="Program" value={program} selectable />)}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Involved accounts</Text>
            <View style={styles.accountsList}>
              {transaction.accounts.slice(0, 8).map((address, index) => (
                <View key={`${address}-${index}`} style={styles.accountRow}>
                  <Text style={styles.accountIndex}>{String(index + 1).padStart(2, '0')}</Text>
                  <Text selectable numberOfLines={1} style={styles.accountAddress}>{address}</Text>
                </View>
              ))}
              {transaction.accounts.length > 8 && <Text style={styles.moreAccounts}>+{transaction.accounts.length - 8} more accounts</Text>}
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => void Linking.openURL(getExplorerUrl(`tx/${encodeURIComponent(transaction.signature)}`))}
            style={styles.explorerButton}
          >
            <Ionicons name="open-outline" size={17} color="#e9e5ff" />
            <Text style={styles.explorerText}>View on Solana Explorer</Text>
          </Pressable>

          <View style={styles.aiNote}>
            <Ionicons name="sparkles-outline" size={16} color="#a592ff" />
            <Text style={styles.aiText}>AI transaction explanations will be available when the assistant service is connected.</Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

function DetailRow({ label, value, selectable = false }: { label: string; value: string; selectable?: boolean }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text selectable={selectable} style={styles.detailValue}>{value}</Text>
    </View>
  )
}

function iconForType(type: string): keyof typeof Ionicons.glyphMap {
  const normalized = type.toLowerCase()
  if (normalized.includes('swap')) return 'swap-horizontal'
  if (normalized.includes('receive')) return 'arrow-down-outline'
  if (normalized.includes('defi')) return 'layers-outline'
  return 'arrow-up-outline'
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(value)
}

function formatSol(lamports: number): string {
  return (lamports / 1_000_000_000).toLocaleString('en-US', { maximumFractionDigits: 9 })
}

function formatTimestamp(timestamp: number | null): string {
  if (timestamp === null) return 'Time unavailable'
  return new Date(timestamp * 1000).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#080a0f', flex: 1 },
  topbar: { alignItems: 'center', flexDirection: 'row', gap: 12, justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 9 },
  iconButton: { alignItems: 'center', backgroundColor: '#191d28', borderColor: '#2b3040', borderRadius: 11, borderWidth: 1, height: 38, justifyContent: 'center', width: 38 },
  topbarTitle: { color: '#e9eaf0', flex: 1, fontSize: 14, fontWeight: '600', textAlign: 'center' },
  content: { gap: 18, padding: 20, paddingBottom: 32 },
  statePanel: { alignItems: 'center', flex: 1, gap: 11, justifyContent: 'center', padding: 24 },
  stateTitle: { color: '#f3f4f8', fontSize: 15, fontWeight: '700', textAlign: 'center' },
  muted: { color: '#8b91a4', fontSize: 12, lineHeight: 18, textAlign: 'center' },
  hero: { alignItems: 'center', gap: 8, paddingBottom: 5, paddingTop: 12 },
  typeIcon: { alignItems: 'center', backgroundColor: '#211d35', borderRadius: 24, height: 54, justifyContent: 'center', marginBottom: 5, width: 54 },
  failedIcon: { backgroundColor: '#351d25' },
  typeLabel: { color: '#a592ff', fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  amount: { color: '#f3f4f8', fontSize: 23, fontWeight: '700', textAlign: 'center' },
  usdValue: { color: '#aeb3c1', fontSize: 14 },
  statusPill: { alignItems: 'center', backgroundColor: '#142a23', borderRadius: 18, flexDirection: 'row', gap: 7, marginTop: 5, paddingHorizontal: 12, paddingVertical: 7 },
  failedStatus: { backgroundColor: '#351d25' },
  statusDot: { backgroundColor: '#51d99b', borderRadius: 3, height: 6, width: 6 },
  failedDot: { backgroundColor: '#ff8793' },
  statusText: { color: '#51d99b', fontSize: 11, fontWeight: '700' },
  failedText: { color: '#ff9aa4' },
  detailsList: { backgroundColor: '#12151d', borderColor: '#252a36', borderRadius: 14, borderWidth: 1, paddingHorizontal: 15 },
  detailRow: { alignItems: 'flex-start', borderBottomColor: '#202431', borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 16, justifyContent: 'space-between', paddingVertical: 13 },
  detailLabel: { color: '#777e91', flexShrink: 0, fontSize: 11 },
  detailValue: { color: '#e0e2e9', flex: 1, fontSize: 11, lineHeight: 17, textAlign: 'right' },
  section: { gap: 9 },
  sectionTitle: { color: '#f3f4f8', fontSize: 14, fontWeight: '700' },
  accountsList: { backgroundColor: '#12151d', borderColor: '#252a36', borderRadius: 13, borderWidth: 1, paddingHorizontal: 13 },
  accountRow: { alignItems: 'center', borderBottomColor: '#202431', borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 10, minHeight: 42 },
  accountIndex: { color: '#62697b', fontSize: 10, width: 20 },
  accountAddress: { color: '#bfc3ce', flex: 1, fontSize: 10 },
  moreAccounts: { color: '#777e91', fontSize: 10, paddingVertical: 11, textAlign: 'center' },
  explorerButton: { alignItems: 'center', backgroundColor: '#211d35', borderColor: '#393052', borderRadius: 12, borderWidth: 1, flexDirection: 'row', gap: 9, justifyContent: 'center', minHeight: 48 },
  explorerText: { color: '#e9e5ff', fontSize: 12, fontWeight: '600' },
  aiNote: { alignItems: 'flex-start', flexDirection: 'row', gap: 8, paddingHorizontal: 3 },
  aiText: { color: '#777e91', flex: 1, fontSize: 10, lineHeight: 16 },
})