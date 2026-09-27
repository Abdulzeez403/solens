import { Ionicons } from '@expo/vector-icons'
import { useMobileWallet } from '@wallet-ui/react-native-web3js'
import { AccountFeatureConnect } from '@/features/account/account-feature-connect'
import { useAccountGetDashboard } from '@/features/account/use-account-get-dashboard'
import { formatTimestamp, formatUsd } from '@/features/dashboard/dashboard-screen'
import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const filters = ['All', 'Sent', 'Received', 'Swaps', 'DeFi', 'Other'] as const
type ActivityFilter = (typeof filters)[number]

export default function ActivityTab() {
  const router = useRouter()
  const { account } = useMobileWallet()
  const query = useAccountGetDashboard(account?.address, 50)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<ActivityFilter>('All')
  const searchTerm = search.trim().toLowerCase()
  const transactions = (query.data?.transactions ?? []).filter((transaction) => {
    const type = transaction.type.toLowerCase()
    const filterMatches =
      activeFilter === 'All' ||
      (activeFilter === 'Sent' && type.startsWith('sent')) ||
      (activeFilter === 'Received' && type.startsWith('received')) ||
      (activeFilter === 'Swaps' && type === 'swap') ||
      (activeFilter === 'DeFi' && type === 'defi') ||
      (activeFilter === 'Other' && !['swap', 'defi'].includes(type) && !type.startsWith('sent') && !type.startsWith('received'))
    return filterMatches && (!searchTerm || `${type} ${transaction.amount} ${transaction.searchText}`.includes(searchTerm))
  })

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.content}>
        <View style={styles.heading}>
          <Text style={styles.eyebrow}>TRANSACTION HISTORY</Text>
          <Text style={styles.title}>Activity</Text>
        </View>

        {account && (
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={18} color="#777e91" />
            <TextInput
              accessibilityLabel="Search token, program, address, or signature"
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setSearch}
              placeholder="Search token, program or address"
              placeholderTextColor="#777e91"
              returnKeyType="search"
              style={styles.searchInput}
              value={search}
            />
            {!!search && (
              <Pressable accessibilityLabel="Clear search" hitSlop={8} onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={18} color="#777e91" />
              </Pressable>
            )}
          </View>
        )}

        {account && (
          <ScrollView horizontal contentContainerStyle={styles.filters} showsHorizontalScrollIndicator={false}>
            {filters.map((filter) => (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: filter === activeFilter }}
                key={filter}
                onPress={() => setActiveFilter(filter)}
                style={[styles.filter, filter === activeFilter && styles.filterActive]}
              >
                <Text style={[styles.filterText, filter === activeFilter && styles.filterTextActive]}>{filter}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {!account ? (
          <View style={styles.emptyPanel}>
            <View style={styles.emptyIcon}><Ionicons name="wallet-outline" size={23} color="#a592ff" /></View>
            <Text style={styles.emptyTitle}>Connect a wallet</Text>
            <Text style={styles.muted}>Your on-chain transactions will appear here.</Text>
            <AccountFeatureConnect />
          </View>
        ) : query.isLoading ? (
          <View style={styles.statePanel}><ActivityIndicator color="#a592ff" /><Text style={styles.muted}>Loading transaction history...</Text></View>
        ) : query.isError ? (
          <Pressable style={styles.statePanel} onPress={() => void query.refetch()}>
            <Ionicons name="cloud-offline-outline" size={22} color="#ff8793" />
            <Text style={styles.emptyTitle}>Activity unavailable</Text>
            <Text style={styles.muted}>Tap to retry loading transactions.</Text>
            <View style={styles.retry}><Ionicons name="refresh" size={15} color="#fff" /><Text style={styles.retryText}>Retry</Text></View>
          </Pressable>
        ) : (
          <ScrollView
            contentContainerStyle={styles.resultsContent}
            refreshControl={
              <RefreshControl
                refreshing={query.isFetching && !query.isLoading}
                onRefresh={() => void query.refetch()}
                tintColor="#a592ff"
                colors={['#a592ff']}
              />
            }
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.resultsHeading}>
              <Text style={styles.resultsTitle}>{search || activeFilter !== 'All' ? 'Matching activity' : 'Latest activity'}</Text>
              <Text style={styles.resultCount}>{transactions.length}</Text>
            </View>
            {transactions.length ? (
              <View style={styles.list}>
                {transactions.map((transaction) => {
                  const type = transaction.type.toLowerCase()
                  const incoming = type.startsWith('received')
                  const isSwap = type === 'swap'
                  return (
                    <Pressable
                      accessibilityLabel={`${transaction.type}, ${transaction.amount}, ${formatTimestamp(transaction.timestamp)}`}
                      accessibilityRole="button"
                      key={transaction.signature}
                      onPress={() => router.push({ pathname: '/transaction/[signature]', params: { signature: transaction.signature } })}
                      style={styles.row}
                    >
                      <View style={[styles.icon, incoming && styles.incomingIcon, isSwap && styles.swapIcon]}>
                        <Ionicons
                          name={isSwap ? 'swap-horizontal' : incoming ? 'arrow-down-outline' : 'arrow-up-outline'}
                          size={17}
                          color={incoming ? '#51d99b' : '#a592ff'}
                        />
                      </View>
                      <View style={styles.info}>
                        <Text style={styles.rowTitle}>{transaction.type}</Text>
                        <Text numberOfLines={1} style={styles.rowMeta}>{transaction.amount}</Text>
                        <Text numberOfLines={1} style={styles.muted}>{formatTimestamp(transaction.timestamp)}</Text>
                      </View>
                      <View style={styles.valueGroup}>
                        <Text style={styles.value}>{transaction.valueUsd === null ? '—' : formatUsd(transaction.valueUsd)}</Text>
                        <Text style={styles.signature}>{transaction.signature.slice(0, 5)}…{transaction.signature.slice(-4)}</Text>
                      </View>
                    </Pressable>
                  )
                })}
              </View>
            ) : (
              <View style={styles.emptyPanel}>
                <View style={styles.emptyIcon}><Ionicons name="file-tray-outline" size={22} color="#8b91a4" /></View>
                <Text style={styles.emptyTitle}>No matching activity</Text>
                <Text style={styles.muted}>Try another search or transaction type.</Text>
                {(!!search || activeFilter !== 'All') && (
                  <Pressable onPress={() => { setSearch(''); setActiveFilter('All') }}>
                    <Text style={styles.clearFilters}>Clear filters</Text>
                  </Pressable>
                )}
              </View>
            )}
            <Text style={styles.footerNote}>Showing up to 50 recent on-chain transactions</Text>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#080a0f', flex: 1 },
  content: { flex: 1, gap: 13, paddingHorizontal: 20, paddingTop: 12 },
  heading: { gap: 3 },
  eyebrow: { color: '#8b91a4', fontSize: 10, fontWeight: '700', letterSpacing: 0.7 },
  title: { color: '#f3f4f8', fontSize: 25, fontWeight: '700' },
  searchBox: { alignItems: 'center', backgroundColor: '#191d28', borderColor: '#2b3040', borderRadius: 12, borderWidth: 1, flexDirection: 'row', gap: 10, minHeight: 46, paddingHorizontal: 13 },
  searchInput: { color: '#f3f4f8', flex: 1, fontSize: 13, minWidth: 0, paddingVertical: 9 },
  filters: { gap: 8, paddingBottom: 2 },
  filter: { backgroundColor: '#191d28', borderColor: '#2b3040', borderRadius: 18, borderWidth: 1, minHeight: 34, justifyContent: 'center', paddingHorizontal: 14 },
  filterActive: { backgroundColor: '#7964ef', borderColor: '#7964ef' },
  filterText: { color: '#aeb3c1', fontSize: 12, fontWeight: '600' },
  filterTextActive: { color: '#ffffff' },
  resultsContent: { gap: 11, paddingBottom: 20 },
  resultsHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingTop: 2 },
  resultsTitle: { color: '#e9eaf0', fontSize: 13, fontWeight: '700' },
  resultCount: { color: '#8b91a4', fontSize: 11 },
  list: { backgroundColor: '#12151d', borderColor: '#252a36', borderRadius: 14, borderWidth: 1, paddingHorizontal: 12 },
  row: { alignItems: 'center', borderBottomColor: '#202431', borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 10, minHeight: 76, paddingVertical: 11 },
  icon: { alignItems: 'center', backgroundColor: '#292442', borderRadius: 11, height: 38, justifyContent: 'center', width: 38 },
  incomingIcon: { backgroundColor: '#142a23' },
  swapIcon: { backgroundColor: '#202b36' },
  info: { flex: 1, gap: 3, minWidth: 0 },
  rowTitle: { color: '#e9eaf0', fontSize: 13, fontWeight: '600' },
  rowMeta: { color: '#aeb3c1', fontSize: 11 },
  muted: { color: '#777e91', fontSize: 10 },
  valueGroup: { alignItems: 'flex-end', gap: 5, maxWidth: '31%' },
  value: { color: '#dfe1e8', fontSize: 11, fontWeight: '600' },
  signature: { color: '#62697b', fontSize: 9 },
  statePanel: { alignItems: 'center', backgroundColor: '#12151d', borderColor: '#252a36', borderRadius: 14, borderWidth: 1, gap: 11, padding: 22 },
  retry: { alignItems: 'center', backgroundColor: '#7964ef', borderRadius: 9, flexDirection: 'row', gap: 7, paddingHorizontal: 13, paddingVertical: 9 },
  retryText: { color: '#ffffff', fontSize: 11, fontWeight: '700' },
  emptyPanel: { alignItems: 'center', gap: 11, paddingHorizontal: 22, paddingVertical: 26 },
  emptyIcon: { alignItems: 'center', backgroundColor: '#211d35', borderRadius: 22, height: 48, justifyContent: 'center', width: 48 },
  emptyTitle: { color: '#f3f4f8', fontSize: 15, fontWeight: '700' },
  clearFilters: { color: '#a592ff', fontSize: 12, fontWeight: '600', padding: 5 },
  footerNote: { color: '#62697b', fontSize: 10, paddingTop: 2, textAlign: 'center' },
})