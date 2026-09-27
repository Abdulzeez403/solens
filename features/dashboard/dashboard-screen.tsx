import { Ionicons } from '@expo/vector-icons'
import { useMobileWallet } from '@wallet-ui/react-native-web3js'
import { useAccountGetDashboard } from '@/features/account/use-account-get-dashboard'
import { AccountFeatureConnect } from '@/features/account/account-feature-connect'
import React from 'react'
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'

export function DashboardScreen() {
  const { account } = useMobileWallet()
  const dashboard = useAccountGetDashboard(account?.address)
  const holdings = [...(dashboard.data?.holdings ?? [])].sort(
    (left, right) => (right.priceUsd ?? -1) * right.amount - (left.priceUsd ?? -1) * left.amount,
  )
  const solPrice = dashboard.data?.solPriceUsd ?? null
  const unknownPrices = holdings.filter((holding) => holding.priceUsd === null).length + (solPrice === null ? 1 : 0)
  const portfolioValue = dashboard.data
    ? dashboard.data.solBalance * (solPrice ?? 0) +
      holdings.reduce((sum, holding) => sum + holding.amount * (holding.priceUsd ?? 0), 0)
    : null

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={
        account ? (
          <RefreshControl
            refreshing={dashboard.isFetching && !dashboard.isLoading}
            onRefresh={() => void dashboard.refetch()}
            tintColor="#a592ff"
            colors={['#a592ff']}
          />
        ) : undefined
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.overline}>{account ? 'WELCOME BACK' : 'SOLANA WALLET ANALYTICS'}</Text>
          <Text style={styles.title}>Dashboard</Text>
        </View>
        {account && <Text style={styles.address}>{shortAddress(account.address.toBase58())}</Text>}
      </View>

      {!account ? (
        <View style={styles.connectBlock}>
          <Ionicons name="wallet-outline" size={28} color="#a592ff" />
          <Text style={styles.emptyTitle}>Your wallet, in focus.</Text>
          <Text style={styles.muted}>Connect a wallet to see live balances, token holdings, and recent activity.</Text>
          <AccountFeatureConnect />
        </View>
      ) : dashboard.isLoading && !dashboard.data ? (
        <View style={styles.stateBlock}><ActivityIndicator color="#a592ff" /><Text style={styles.muted}>Loading wallet data...</Text></View>
      ) : dashboard.isError && !dashboard.data ? (
        <View style={styles.stateBlock}>
          <Ionicons name="cloud-offline-outline" size={24} color="#ff8793" />
          <Text style={styles.emptyTitle}>Dashboard unavailable</Text>
          <Text style={styles.muted}>{dashboard.error.message}</Text>
          <Pressable style={styles.retry} onPress={() => void dashboard.refetch()}>
            <Ionicons name="refresh" size={16} color="#fff" /><Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : dashboard.data ? (
        <>
          {dashboard.isError && (
            <Pressable style={styles.refreshError} onPress={() => void dashboard.refetch()}>
              <Text style={styles.refreshErrorText}>Refresh failed. Tap to retry.</Text>
              <Ionicons name="refresh" size={15} color="#ff8793" />
            </Pressable>
          )}
          <View style={styles.summary}>
            <Text style={styles.overline}>TOTAL PORTFOLIO VALUE</Text>
            <Text style={styles.total}>{portfolioValue === null ? '—' : `${unknownPrices ? '~' : ''}${formatUsd(portfolioValue)}`}</Text>
            <Text style={styles.priceHint}>
              {unknownPrices ? `Partial estimate · ${unknownPrices} asset(s) unpriced` : 'Live market estimate'}
            </Text>
            <View style={styles.rule} />
            <View style={styles.summaryStats}>
              <View><Text style={styles.statLabel}>SOL BALANCE</Text><Text style={styles.statValue}>{formatAmount(dashboard.data.solBalance, 4)} SOL</Text></View>
              <View><Text style={styles.statLabel}>TOKEN ASSETS</Text><Text style={styles.statValue}>{holdings.length}</Text></View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>Token holdings</Text><Text style={styles.count}>{holdings.length} assets</Text></View>
            <View style={styles.list}>
              <HoldingRow symbol="SOL" mint="Native Solana" amount={dashboard.data.solBalance} priceUsd={solPrice} />
              {holdings.map((holding) => (
                <HoldingRow
                  key={holding.mint}
                  symbol={holding.symbol ?? `${holding.mint.slice(0, 4)}…`}
                  mint={holding.mint}
                  amount={holding.amount}
                  priceUsd={holding.priceUsd}
                />
              ))}
              {!holdings.length && <Text style={styles.muted}>No non-zero SPL token balances.</Text>}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>Recent activity</Text><Text style={styles.count}>Last 4</Text></View>
            <View style={styles.list}>
              {dashboard.data.transactions.map((transaction) => (
                <View key={transaction.signature} style={styles.transaction}>
                  <View style={styles.transactionIcon}>
                    <Ionicons name={transaction.type.toLowerCase().includes('receive') ? 'arrow-down' : 'arrow-up'} size={15} color="#a592ff" />
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.rowTitle}>{transaction.type}</Text>
                    <Text numberOfLines={1} style={styles.subtle}>{transaction.amount} · {formatTimestamp(transaction.timestamp)}</Text>
                  </View>
                  <Text style={styles.rowValue}>{transaction.valueUsd === null ? '—' : formatUsd(transaction.valueUsd)}</Text>
                </View>
              ))}
              {!dashboard.data.transactions.length && <Text style={styles.muted}>No recent transactions found.</Text>}
            </View>
          </View>
        </>
      ) : null}
    </ScrollView>
  )
}

function HoldingRow({ symbol, mint, amount, priceUsd }: { symbol: string; mint: string; amount: number; priceUsd: number | null }) {
  return (
    <View style={styles.holding}>
      <View style={styles.tokenIcon}><Text style={styles.tokenLetter}>{symbol.slice(0, 1).toUpperCase()}</Text></View>
      <View style={styles.holdingInfo}>
        <Text numberOfLines={1} style={styles.rowTitle}>{symbol}</Text>
        <Text numberOfLines={1} style={styles.subtle}>{formatAmount(amount, 6)} {symbol === 'SOL' ? '' : `· ${mint.slice(0, 4)}…${mint.slice(-4)}`}</Text>
      </View>
      <View style={styles.holdingValue}>
        <Text style={styles.rowValue}>{priceUsd === null ? 'Unpriced' : formatUsd(amount * priceUsd)}</Text>
        <Text style={styles.subtle}>{priceUsd === null ? 'Price unavailable' : `${formatUsd(priceUsd)} each`}</Text>
      </View>
    </View>
  )
}

export function formatUsd(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(value)
}

export function formatAmount(value: number, digits: number): string {
  return value.toLocaleString('en-US', { maximumFractionDigits: digits })
}

export function formatTimestamp(timestamp: number | null): string {
  if (timestamp === null) return 'Time unavailable'
  return new Date(timestamp * 1000).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function shortAddress(address: string): string {
  return address.length > 14 ? `${address.slice(0, 5)}…${address.slice(-5)}` : address
}

const styles = StyleSheet.create({
  content: { gap: 22, padding: 20, paddingBottom: 32 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  overline: { color: '#8b91a4', fontSize: 10, fontWeight: '700', letterSpacing: 0.7 },
  title: { color: '#f3f4f8', fontSize: 25, fontWeight: '700', marginTop: 3 },
  address: { backgroundColor: '#141922', borderColor: '#252a36', borderRadius: 20, borderWidth: 1, color: '#c0c4d0', fontSize: 11, overflow: 'hidden', paddingHorizontal: 11, paddingVertical: 8 },
  connectBlock: { alignItems: 'center', gap: 14, paddingTop: 42 },
  emptyTitle: { color: '#f3f4f8', fontSize: 17, fontWeight: '700' },
  muted: { color: '#8b91a4', fontSize: 12, lineHeight: 18, textAlign: 'center' },
  stateBlock: { alignItems: 'center', backgroundColor: '#12151d', borderColor: '#252a36', borderRadius: 14, borderWidth: 1, gap: 12, padding: 22 },
  retry: { alignItems: 'center', backgroundColor: '#7964ef', borderRadius: 10, flexDirection: 'row', gap: 7, paddingHorizontal: 15, paddingVertical: 10 },
  retryText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  refreshError: { alignItems: 'center', backgroundColor: '#24171c', borderRadius: 9, flexDirection: 'row', justifyContent: 'space-between', padding: 10 },
  refreshErrorText: { color: '#ff9aa4', fontSize: 11 },
  summary: { backgroundColor: '#12151d', borderColor: '#252a36', borderRadius: 17, borderWidth: 1, padding: 18 },
  total: { color: '#f3f4f8', fontSize: 34, fontWeight: '700', marginTop: 8 },
  priceHint: { color: '#8b91a4', fontSize: 11, marginTop: 5 },
  rule: { backgroundColor: '#252a36', height: 1, marginVertical: 17 },
  summaryStats: { flexDirection: 'row', justifyContent: 'space-between' },
  statLabel: { color: '#777e91', fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  statValue: { color: '#f3f4f8', fontSize: 14, fontWeight: '600', marginTop: 6 },
  section: { gap: 10 },
  sectionHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  sectionTitle: { color: '#f3f4f8', fontSize: 15, fontWeight: '700' },
  count: { color: '#8b91a4', fontSize: 11 },
  list: { backgroundColor: '#12151d', borderColor: '#252a36', borderRadius: 14, borderWidth: 1, paddingHorizontal: 13 },
  holding: { alignItems: 'center', borderBottomColor: '#202431', borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 10, minHeight: 65, paddingVertical: 9 },
  tokenIcon: { alignItems: 'center', backgroundColor: '#292442', borderRadius: 18, height: 36, justifyContent: 'center', width: 36 },
  tokenLetter: { color: '#c1b5ff', fontSize: 13, fontWeight: '700' },
  holdingInfo: { flex: 1, gap: 3, minWidth: 0 },
  holdingValue: { alignItems: 'flex-end', gap: 3, maxWidth: '42%' },
  rowTitle: { color: '#e9eaf0', fontSize: 12, fontWeight: '600' },
  rowValue: { color: '#dfe1e8', fontSize: 11, fontWeight: '600' },
  subtle: { color: '#777e91', fontSize: 10 },
  transaction: { alignItems: 'center', borderBottomColor: '#202431', borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 9, minHeight: 61, paddingVertical: 9 },
  transactionIcon: { alignItems: 'center', backgroundColor: '#20202f', borderRadius: 10, height: 34, justifyContent: 'center', width: 34 },
  transactionInfo: { flex: 1, gap: 4, minWidth: 0 },
})