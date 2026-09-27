import { Ionicons } from '@expo/vector-icons'
import { useMobileWallet } from '@wallet-ui/react-native-web3js'
import { AccountFeatureConnect } from '@/features/account/account-feature-connect'
import { useAccountGetDashboard } from '@/features/account/use-account-get-dashboard'
import { formatAmount, formatUsd } from '@/features/dashboard/dashboard-screen'
import { useNetwork } from '@/features/network/use-network'
import React from 'react'
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const stableSymbols = new Set(['USDC', 'USDT', 'PYUSD', 'USDG', 'FDUSD'])

export default function PortfolioTab() {
  const { account } = useMobileWallet()
  const { selectedNetwork } = useNetwork()
  const query = useAccountGetDashboard(account?.address)
  const splTokens = query.data?.holdings ?? []
  const assets = [
    {
      symbol: 'SOL',
      mint: 'Native Solana',
      amount: query.data?.solBalance ?? 0,
      priceUsd: query.data?.solPriceUsd ?? null,
    },
    ...splTokens.map((token) => ({
      symbol: token.symbol ?? `${token.mint.slice(0, 4)}…`,
      mint: token.mint,
      amount: token.amount,
      priceUsd: token.priceUsd,
    })),
  ].sort((left, right) => (right.priceUsd ?? -1) * right.amount - (left.priceUsd ?? -1) * left.amount)
  const total = assets.reduce((sum, asset) => sum + asset.amount * (asset.priceUsd ?? 0), 0)
  const unpricedCount = assets.filter((asset) => asset.priceUsd === null).length
  const buckets = [
    {
      label: 'SOL',
      detail: 'Native SOL',
      color: '#a592ff',
      value: query.data ? query.data.solBalance * (query.data.solPriceUsd ?? 0) : 0,
    },
    {
      label: 'Stablecoins',
      detail: 'USD-pegged assets',
      color: '#51d99b',
      value: splTokens
        .filter((token) => token.symbol && stableSymbols.has(token.symbol.toUpperCase()))
        .reduce((sum, token) => sum + token.amount * (token.priceUsd ?? 0), 0),
    },
    {
      label: 'Other tokens',
      detail: 'SPL and Token-2022',
      color: '#57a7e8',
      value: splTokens
        .filter((token) => !token.symbol || !stableSymbols.has(token.symbol.toUpperCase()))
        .reduce((sum, token) => sum + token.amount * (token.priceUsd ?? 0), 0),
    },
  ]
  const allocatedBuckets = buckets.filter((bucket) => bucket.value > 0)

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          account ? (
            <RefreshControl
              refreshing={query.isFetching && !query.isLoading}
              onRefresh={() => void query.refetch()}
              tintColor="#a592ff"
              colors={['#a592ff']}
            />
          ) : undefined
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>ANALYTICS · {selectedNetwork.label.toUpperCase()}</Text>
            <Text style={styles.title}>Portfolio</Text>
          </View>
          {account && (
            <Pressable accessibilityLabel="Refresh portfolio" onPress={() => void query.refetch()} style={styles.refreshButton}>
              <Ionicons name="refresh-outline" size={18} color="#c2b7ff" />
            </Pressable>
          )}
        </View>

        {!account ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}><Ionicons name="pie-chart-outline" size={24} color="#a592ff" /></View>
            <Text style={styles.emptyTitle}>Your allocation starts here.</Text>
            <Text style={styles.muted}>Connect a wallet to see live token balances and portfolio value.</Text>
            <AccountFeatureConnect />
          </View>
        ) : query.isLoading && !query.data ? (
          <View style={styles.statePanel}><ActivityIndicator color="#a592ff" /><Text style={styles.muted}>Loading portfolio...</Text></View>
        ) : query.isError && !query.data ? (
          <Pressable onPress={() => void query.refetch()} style={styles.statePanel}>
            <Ionicons name="cloud-offline-outline" size={22} color="#ff8793" />
            <Text style={styles.stateTitle}>Portfolio unavailable</Text>
            <Text style={styles.muted}>Tap to retry loading balances and prices.</Text>
            <Text style={styles.retryLabel}>Retry</Text>
          </Pressable>
        ) : query.data ? (
          <>
            <View style={styles.summary}>
              <View style={styles.summaryHeading}>
                <Text style={styles.summaryLabel}>TOTAL PORTFOLIO VALUE</Text>
                <View style={styles.liveBadge}><View style={styles.liveDot} /><Text style={styles.liveText}>LIVE</Text></View>
              </View>
              <Text style={styles.totalValue}>{`${unpricedCount ? '~' : ''}${formatUsd(total)}`}</Text>
              <Text style={styles.estimateNote}>
                {unpricedCount ? `${unpricedCount} asset(s) missing a market price` : 'Estimated from current market prices'}
              </Text>
              <View style={styles.summaryRule} />
              <View style={styles.summaryFooter}>
                <View><Text style={styles.metaLabel}>ASSETS</Text><Text style={styles.metaValue}>{assets.length}</Text></View>
                <View style={styles.metaDivider} />
                <View><Text style={styles.metaLabel}>SOL BALANCE</Text><Text style={styles.metaValue}>{formatAmount(query.data.solBalance, 4)} SOL</Text></View>
                <View style={styles.metaDivider} />
                <View><Text style={styles.metaLabel}>NETWORK</Text><Text style={styles.metaValue}>{selectedNetwork.label}</Text></View>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeading}>
                <Text style={styles.sectionTitle}>Current allocation</Text>
                <Text style={styles.sectionCount}>{assets.length} assets</Text>
              </View>
              {allocatedBuckets.length ? (
                <>
                  <View accessibilityLabel="Portfolio allocation proportions" style={styles.allocationBar}>
                    {allocatedBuckets.map((bucket) => (
                      <View key={bucket.label} style={[styles.allocationSegment, { backgroundColor: bucket.color, flex: bucket.value }]} />
                    ))}
                  </View>
                  <View style={styles.breakdownList}>
                    {buckets.map((bucket) => (
                      <AllocationRow key={bucket.label} bucket={bucket} total={total} />
                    ))}
                  </View>
                </>
              ) : (
                <View style={styles.emptyAllocation}><Text style={styles.muted}>No priced assets to chart yet.</Text></View>
              )}
              <Text style={styles.historyNote}>
                {unpricedCount ? 'Allocation shows assets with live prices only. ' : ''}
                Historical performance will appear after portfolio snapshots are available.
              </Text>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeading}>
                <Text style={styles.sectionTitle}>Holdings</Text>
                <Text style={styles.sectionCount}>Sorted by value</Text>
              </View>
              <View style={styles.holdingsList}>
                {assets.map((asset) => (
                  <AssetRow
                    key={asset.mint}
                    symbol={asset.symbol}
                    mint={asset.mint}
                    amount={asset.amount}
                    priceUsd={asset.priceUsd}
                    total={total}
                  />
                ))}
                {!splTokens.length && <Text style={styles.emptyHolding}>No non-zero SPL token balances.</Text>}
              </View>
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  )
}

function AllocationRow({
  bucket,
  total,
}: {
  bucket: { label: string; detail: string; color: string; value: number }
  total: number
}) {
  return (
    <View style={styles.allocationRow}>
      <View style={[styles.legendDot, { backgroundColor: bucket.color }]} />
      <View style={styles.allocationInfo}><Text style={styles.allocationLabel}>{bucket.label}</Text><Text style={styles.allocationDetail}>{bucket.detail}</Text></View>
      <View style={styles.allocationValues}>
        <Text style={styles.allocationUsd}>{formatUsd(bucket.value)}</Text>
        <Text style={styles.allocationPercent}>{total ? `${((bucket.value / total) * 100).toFixed(1)}%` : '—'}</Text>
      </View>
    </View>
  )
}

function AssetRow({
  symbol,
  mint,
  amount,
  priceUsd,
  total,
}: {
  symbol: string
  mint: string
  amount: number
  priceUsd: number | null
  total: number
}) {
  const marketValue = priceUsd === null ? null : amount * priceUsd
  return (
    <View style={styles.assetRow}>
      <View style={styles.tokenMark}><Text style={styles.tokenLetter}>{symbol.slice(0, 1).toUpperCase()}</Text></View>
      <View style={styles.assetInfo}>
        <Text numberOfLines={1} style={styles.assetSymbol}>{symbol}</Text>
        <Text numberOfLines={1} style={styles.assetAmount}>
          {formatAmount(amount, 6)} {symbol} · {mint === 'Native Solana' ? 'Native' : `${mint.slice(0, 4)}…${mint.slice(-4)}`}
        </Text>
      </View>
      <View style={styles.assetValues}>
        <Text style={styles.assetUsd}>{marketValue === null ? 'Unpriced' : formatUsd(marketValue)}</Text>
        <Text style={styles.assetShare}>
          {marketValue === null ? 'Price unavailable' : `${formatUsd(priceUsd ?? 0)} each · ${total ? ((marketValue / total) * 100).toFixed(1) : '0.0'}%`}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#080a0f', flex: 1 },
  content: { gap: 22, padding: 20, paddingBottom: 34 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  eyebrow: { color: '#8b91a4', fontSize: 10, fontWeight: '700', letterSpacing: 0.7 },
  title: { color: '#f3f4f8', fontSize: 25, fontWeight: '700', marginTop: 3 },
  refreshButton: { alignItems: 'center', backgroundColor: '#191d28', borderColor: '#2b3040', borderRadius: 11, borderWidth: 1, height: 40, justifyContent: 'center', width: 40 },
  summary: { backgroundColor: '#12151d', borderColor: '#252a36', borderRadius: 17, borderWidth: 1, padding: 18 },
  summaryHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { color: '#8b91a4', fontSize: 10, fontWeight: '700', letterSpacing: 0.6 },
  liveBadge: { alignItems: 'center', backgroundColor: '#142a23', borderRadius: 12, flexDirection: 'row', gap: 5, paddingHorizontal: 8, paddingVertical: 5 },
  liveDot: { backgroundColor: '#51d99b', borderRadius: 3, height: 6, width: 6 },
  liveText: { color: '#51d99b', fontSize: 9, fontWeight: '700' },
  totalValue: { color: '#f3f4f8', fontSize: 32, fontWeight: '700', marginTop: 9 },
  estimateNote: { color: '#8b91a4', fontSize: 11, marginTop: 4 },
  summaryRule: { backgroundColor: '#252a36', height: 1, marginVertical: 17 },
  summaryFooter: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  metaLabel: { color: '#777e91', fontSize: 9, fontWeight: '700', letterSpacing: 0.4 },
  metaValue: { color: '#e9eaf0', fontSize: 12, fontWeight: '600', marginTop: 5 },
  metaDivider: { backgroundColor: '#252a36', height: 28, width: 1 },
  section: { gap: 11 },
  sectionHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  sectionTitle: { color: '#f3f4f8', fontSize: 15, fontWeight: '700' },
  sectionCount: { color: '#8b91a4', fontSize: 10 },
  allocationBar: { backgroundColor: '#20242f', borderRadius: 5, flexDirection: 'row', gap: 2, height: 10, overflow: 'hidden' },
  allocationSegment: { borderRadius: 5, minWidth: 2 },
  breakdownList: { backgroundColor: '#12151d', borderColor: '#252a36', borderRadius: 14, borderWidth: 1, paddingHorizontal: 14 },
  allocationRow: { alignItems: 'center', borderBottomColor: '#202431', borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 10, minHeight: 59, paddingVertical: 9 },
  legendDot: { borderRadius: 4, height: 8, width: 8 },
  allocationInfo: { flex: 1, gap: 3 },
  allocationLabel: { color: '#e9eaf0', fontSize: 12, fontWeight: '600' },
  allocationDetail: { color: '#777e91', fontSize: 10 },
  allocationValues: { alignItems: 'flex-end', gap: 3 },
  allocationUsd: { color: '#e0e2e9', fontSize: 11, fontWeight: '600' },
  allocationPercent: { color: '#8b91a4', fontSize: 10 },
  historyNote: { color: '#62697b', fontSize: 10, lineHeight: 15 },
  emptyAllocation: { alignItems: 'center', backgroundColor: '#12151d', borderColor: '#252a36', borderRadius: 13, borderWidth: 1, padding: 20 },
  holdingsList: { backgroundColor: '#12151d', borderColor: '#252a36', borderRadius: 14, borderWidth: 1, paddingHorizontal: 13 },
  assetRow: { alignItems: 'center', borderBottomColor: '#202431', borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 10, minHeight: 69, paddingVertical: 10 },
  tokenMark: { alignItems: 'center', backgroundColor: '#292442', borderRadius: 18, height: 36, justifyContent: 'center', width: 36 },
  tokenLetter: { color: '#c1b5ff', fontSize: 13, fontWeight: '700' },
  assetInfo: { flex: 1, gap: 4, minWidth: 0 },
  assetSymbol: { color: '#e9eaf0', fontSize: 12, fontWeight: '600' },
  assetAmount: { color: '#777e91', fontSize: 9 },
  assetValues: { alignItems: 'flex-end', gap: 4, maxWidth: '43%' },
  assetUsd: { color: '#dfe1e8', fontSize: 11, fontWeight: '600' },
  assetShare: { color: '#777e91', fontSize: 9, textAlign: 'right' },
  emptyHolding: { color: '#8b91a4', fontSize: 11, paddingVertical: 18, textAlign: 'center' },
  emptyState: { alignItems: 'center', gap: 12, paddingTop: 36 },
  emptyIcon: { alignItems: 'center', backgroundColor: '#211d35', borderRadius: 23, height: 54, justifyContent: 'center', width: 54 },
  emptyTitle: { color: '#f3f4f8', fontSize: 17, fontWeight: '700' },
  muted: { color: '#8b91a4', fontSize: 11, lineHeight: 18, textAlign: 'center' },
  statePanel: { alignItems: 'center', backgroundColor: '#12151d', borderColor: '#252a36', borderRadius: 14, borderWidth: 1, gap: 11, padding: 22 },
  stateTitle: { color: '#f3f4f8', fontSize: 15, fontWeight: '700' },
  retryLabel: { color: '#a592ff', fontSize: 12, fontWeight: '700', padding: 6 },
})