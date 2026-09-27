import { Ionicons } from '@expo/vector-icons'
import { useMobileWallet } from '@wallet-ui/react-native-web3js'
import { AccountFeatureConnect } from '@/features/account/account-feature-connect'
import { useAccountGetDashboard, AccountDashboardData } from '@/features/account/use-account-get-dashboard'
import { useNetwork } from '@/features/network/use-network'
import React, { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
}

const aiProxyUrl = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, '') ?? ''

const suggestions = [
  { icon: 'wallet-outline' as const, title: 'SOL balance', prompt: 'What is my SOL balance?' },
  { icon: 'layers-outline' as const, title: 'Token holdings', prompt: 'Which tokens do I hold?' },
  { icon: 'trending-up-outline' as const, title: 'Portfolio value', prompt: 'What is my portfolio worth?' },
  { icon: 'pulse-outline' as const, title: 'Recent activity', prompt: 'Summarize my recent activity.' },
]

export default function AssistantTab() {
  const { account } = useMobileWallet()
  const { selectedNetwork } = useNetwork()
  const query = useAccountGetDashboard(account?.address, 50)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [serviceError, setServiceError] = useState<string | null>(null)
  const scrollRef = useRef<ScrollView>(null)

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true })
  }, [messages])

  async function sendMessage(text = draft) {
    const prompt = text.trim()
    if (!prompt || !query.data || sending) return
    if (!aiProxyUrl) {
      setServiceError('AI proxy is not configured. Set EXPO_PUBLIC_API_URL and restart Expo.')
      return
    }

    const conversation = messages.slice(-8).map((message) => ({ role: message.role, content: message.text }))
    setMessages((current) => [...current, { id: `${Date.now()}-user`, role: 'user', text: prompt }])
    setDraft('')
    setServiceError(null)
    setSending(true)
    try {
      const response = await fetch(`${aiProxyUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: prompt,
          conversation,
          walletContext: buildWalletContext(query.data, selectedNetwork.label),
        }),
      })
      const result = (await response.json()) as { answer?: unknown; error?: string }
      if (!response.ok) throw new Error(result.error ?? `AI request failed (${response.status}).`)
      if (typeof result.answer !== 'string' || !result.answer.trim()) throw new Error('The AI service returned an empty answer.')
      setMessages((current) => [...current, { id: `${Date.now()}-assistant`, role: 'assistant', text: result.answer as string }])
    } catch (cause) {
      setServiceError(cause instanceof Error ? cause.message : 'Could not reach the AI service.')
      setDraft(prompt)
    } finally {
      setSending(false)
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>SOLENS · WALLET DATA</Text>
            <Text style={styles.title}>Wallet assistant</Text>
          </View>
          {messages.length > 0 && (
            <Pressable accessibilityLabel="Clear conversation" onPress={() => setMessages([])} style={styles.headerButton}>
              <Ionicons name="trash-outline" size={18} color="#aeb3c1" />
            </Pressable>
          )}
        </View>

        <View style={styles.dataNotice}>
          <Ionicons name="shield-checkmark-outline" size={15} color="#51d99b" />
          <Text style={styles.dataNoticeText}>Your question and a limited wallet summary are sent to OpenAI through your server. Private keys and addresses are not included.</Text>
        </View>
        {account && !aiProxyUrl && (
          <View style={styles.configNotice}>
            <Ionicons name="settings-outline" size={15} color="#e8bd74" />
            <Text style={styles.configNoticeText}>Set EXPO_PUBLIC_API_URL and restart Expo to enable ChatGPT.</Text>
          </View>
        )}

        {!account ? (
          <View style={styles.centerState}>
            <View style={styles.heroIcon}><Ionicons name="chatbubbles-outline" size={25} color="#a592ff" /></View>
            <Text style={styles.stateTitle}>Connect your wallet</Text>
            <Text style={styles.muted}>Wallet insights will use your public on-chain data.</Text>
            <AccountFeatureConnect />
          </View>
        ) : query.isLoading && !query.data ? (
          <View style={styles.centerState}><ActivityIndicator color="#a592ff" /><Text style={styles.muted}>Retrieving wallet data...</Text></View>
        ) : query.isError && !query.data ? (
          <Pressable onPress={() => void query.refetch()} style={styles.centerState}>
            <Ionicons name="cloud-offline-outline" size={24} color="#ff8793" />
            <Text style={styles.stateTitle}>Wallet data unavailable</Text>
            <Text style={styles.muted}>Tap to retry before starting a conversation.</Text>
          </Pressable>
        ) : (
          <>
            <ScrollView
              ref={scrollRef}
              contentContainerStyle={styles.chatContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {!messages.length ? (
                <View style={styles.welcome}>
                  <View style={styles.heroIcon}><Ionicons name="sparkles-outline" size={24} color="#a592ff" /></View>
                  <Text style={styles.welcomeTitle}>What would you like to know?</Text>
                  <Text style={styles.muted}>Choose a question or ask about your current wallet data.</Text>
                  <View style={styles.suggestionGrid}>
                    {suggestions.map((item) => (
                      <Pressable key={item.title} onPress={() => sendMessage(item.prompt)} style={styles.suggestion}>
                        <Ionicons name={item.icon} size={17} color="#b9aaff" />
                        <Text style={styles.suggestionText}>{item.title}</Text>
                        <Ionicons name="arrow-forward" size={14} color="#777e91" />
                      </Pressable>
                    ))}
                  </View>
                </View>
              ) : (
                <View style={styles.messageList}>
                  {messages.map((message) => (
                    <View key={message.id} style={[styles.messageBubble, message.role === 'user' ? styles.userBubble : styles.assistantBubble]}>
                      {message.role === 'assistant' && (
                        <View style={styles.replyLabel}><Ionicons name="sparkles-outline" size={13} color="#51d99b" /><Text style={styles.replyLabelText}>OPENAI · WALLET CONTEXT</Text></View>
                      )}
                      <Text style={[styles.messageText, message.role === 'user' && styles.userMessageText]}>{message.text}</Text>
                    </View>
                  ))}
                  {sending && (
                    <View style={[styles.messageBubble, styles.assistantBubble, styles.thinkingBubble]}>
                      <ActivityIndicator color="#a592ff" size="small" />
                      <Text style={styles.muted}>Analyzing wallet data...</Text>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>

            {serviceError && (
              <View accessibilityRole="alert" style={styles.errorNotice}>
                <Ionicons name="alert-circle-outline" size={16} color="#ff9aa4" />
                <Text style={styles.errorText}>{serviceError}</Text>
              </View>
            )}

            <View style={styles.composerWrap}>
              <View style={styles.composer}>
                <TextInput
                  accessibilityLabel="Ask about your wallet"
                  editable={!!query.data && !sending}
                  maxLength={300}
                  onChangeText={setDraft}
                  onSubmitEditing={() => sendMessage()}
                  placeholder="Ask about your wallet..."
                  placeholderTextColor="#777e91"
                  returnKeyType="send"
                  style={styles.input}
                  value={draft}
                />
                <Pressable
                  accessibilityLabel="Send question"
                  disabled={!draft.trim() || !query.data || sending}
                  onPress={() => void sendMessage()}
                  style={[styles.sendButton, (!draft.trim() || !query.data || sending) && styles.sendDisabled]}
                >
                  <Ionicons name="arrow-up" size={18} color="#ffffff" />
                </Pressable>
              </View>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

function buildWalletContext(data: AccountDashboardData, network: string) {
  return {
    network,
    solBalance: data.solBalance,
    solPriceUsd: data.solPriceUsd,
    holdings: data.holdings.map((holding) => ({
      symbol: holding.symbol ?? 'Unknown token',
      amount: holding.amount,
      priceUsd: holding.priceUsd,
    })),
    recentTransactions: data.transactions.slice(0, 10).map((transaction) => ({
      type: transaction.type,
      amount: transaction.amount,
      estimatedValueUsd: transaction.valueUsd,
      timestamp: transaction.timestamp,
    })),
  }
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#080a0f', flex: 1 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 10 },
  headerText: { gap: 3 },
  eyebrow: { color: '#8b91a4', fontSize: 9, fontWeight: '700', letterSpacing: 0.6 },
  title: { color: '#f3f4f8', fontSize: 22, fontWeight: '700' },
  headerButton: { alignItems: 'center', backgroundColor: '#191d28', borderColor: '#2b3040', borderRadius: 10, borderWidth: 1, height: 36, justifyContent: 'center', width: 36 },
  dataNotice: { alignItems: 'center', backgroundColor: '#111a18', borderBottomColor: '#20302a', borderTopColor: '#20302a', borderBottomWidth: StyleSheet.hairlineWidth, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingVertical: 9 },
  dataNoticeText: { color: '#9da99f', flex: 1, fontSize: 10, lineHeight: 15 },
  configNotice: { alignItems: 'center', backgroundColor: '#261f16', flexDirection: 'row', gap: 7, paddingHorizontal: 20, paddingVertical: 8 },
  configNoticeText: { color: '#e8bd74', flex: 1, fontSize: 10, lineHeight: 15 },
  centerState: { alignItems: 'center', flex: 1, gap: 12, justifyContent: 'center', paddingHorizontal: 28 },
  heroIcon: { alignItems: 'center', backgroundColor: '#211d35', borderRadius: 24, height: 56, justifyContent: 'center', width: 56 },
  stateTitle: { color: '#f3f4f8', fontSize: 16, fontWeight: '700' },
  muted: { color: '#8b91a4', fontSize: 11, lineHeight: 18, textAlign: 'center' },
  chatContent: { flexGrow: 1, justifyContent: 'flex-end', paddingHorizontal: 16, paddingTop: 22, paddingBottom: 14 },
  welcome: { alignItems: 'center', gap: 12, paddingBottom: 14, paddingTop: 22 },
  welcomeTitle: { color: '#f3f4f8', fontSize: 17, fontWeight: '700', textAlign: 'center' },
  suggestionGrid: { alignSelf: 'stretch', flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 8 },
  suggestion: { alignItems: 'center', backgroundColor: '#12151d', borderColor: '#252a36', borderRadius: 12, borderWidth: 1, flexDirection: 'row', gap: 8, minHeight: 48, paddingHorizontal: 11, width: '48%' },
  suggestionText: { color: '#c7c9d3', flex: 1, fontSize: 11, fontWeight: '600' },
  messageList: { gap: 13, paddingVertical: 6 },
  messageBubble: { borderRadius: 15, maxWidth: '88%', paddingHorizontal: 13, paddingVertical: 11 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#6552ca', borderBottomRightRadius: 4 },
  assistantBubble: { alignSelf: 'flex-start', backgroundColor: '#171b24', borderColor: '#282d39', borderWidth: 1, borderBottomLeftRadius: 4 },
  thinkingBubble: { alignItems: 'center', flexDirection: 'row', gap: 9 },
  replyLabel: { alignItems: 'center', flexDirection: 'row', gap: 5, marginBottom: 7 },
  replyLabelText: { color: '#51d99b', fontSize: 9, fontWeight: '700', letterSpacing: 0.4 },
  messageText: { color: '#e1e3ea', fontSize: 12, lineHeight: 19 },
  userMessageText: { color: '#ffffff' },
  errorNotice: { alignItems: 'flex-start', backgroundColor: '#28191d', flexDirection: 'row', gap: 8, marginHorizontal: 13, paddingHorizontal: 11, paddingVertical: 9 },
  errorText: { color: '#ffadb5', flex: 1, fontSize: 10, lineHeight: 15 },
  composerWrap: { paddingHorizontal: 13, paddingTop: 9, paddingBottom: 10 },
  composer: { alignItems: 'center', backgroundColor: '#191d28', borderColor: '#303646', borderRadius: 15, borderWidth: 1, flexDirection: 'row', gap: 8, minHeight: 50, paddingLeft: 14, paddingRight: 6 },
  input: { color: '#f3f4f8', flex: 1, fontSize: 13, minWidth: 0, paddingVertical: 10 },
  sendButton: { alignItems: 'center', backgroundColor: '#7964ef', borderRadius: 11, height: 38, justifyContent: 'center', width: 38 },
  sendDisabled: { backgroundColor: '#373445' },
})