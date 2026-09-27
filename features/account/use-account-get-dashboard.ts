import { ParsedTransactionWithMeta, PublicKey } from '@solana/web3.js'
import { useQuery } from '@tanstack/react-query'
import { useMobileWallet } from '@wallet-ui/react-native-web3js'

const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
const TOKEN_2022_PROGRAM_ID = new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb')
const WRAPPED_SOL_MINT = 'So11111111111111111111111111111111111111112'
const LAMPORTS_PER_SOL = 1_000_000_000

export interface DashboardHolding {
  mint: string
  symbol: string | null
  amount: number
  decimals: number
  priceUsd: number | null
}

export interface DashboardTransaction {
  signature: string
  timestamp: number | null
  type: string
  amount: string
  valueUsd: number | null
  searchText: string
  status: 'Confirmed' | 'Failed'
  feeLamports: number
  programs: string[]
  accounts: string[]
}

export interface AccountDashboardData {
  solBalance: number
  solPriceUsd: number | null
  holdings: DashboardHolding[]
  transactions: DashboardTransaction[]
}

export function useAccountGetDashboard(address: PublicKey | undefined, transactionLimit = 4) {
  const { chain, connection } = useMobileWallet()

  return useQuery({
    queryKey: ['account-dashboard', chain, address?.toBase58(), transactionLimit],
    enabled: !!address,
    staleTime: 30_000,
    retry: 1,
    queryFn: async (): Promise<AccountDashboardData> => {
      if (!address) throw new Error('Connect a wallet to load dashboard data.')

      const [lamports, classicAccounts, token2022Accounts, signatures] = await Promise.all([
        connection.getBalance(address, 'confirmed'),
        connection.getParsedTokenAccountsByOwner(address, { programId: TOKEN_PROGRAM_ID }, 'confirmed'),
        connection.getParsedTokenAccountsByOwner(address, { programId: TOKEN_2022_PROGRAM_ID }, 'confirmed'),
        connection.getSignaturesForAddress(address, { limit: transactionLimit }, 'confirmed'),
      ])

      const accounts = [...classicAccounts.value, ...token2022Accounts.value]
      const amountByMint = new Map<string, { amount: number; decimals: number }>()
      for (const account of accounts) {
        const parsed = account.account.data.parsed.info
        const mint = parsed.mint as string
        const amount = Number(parsed.tokenAmount.uiAmountString ?? '0')
        if (!mint || !Number.isFinite(amount) || amount === 0) continue
        const current = amountByMint.get(mint)
        amountByMint.set(mint, {
          amount: (current?.amount ?? 0) + amount,
          decimals: Number(parsed.tokenAmount.decimals),
        })
      }

      const mintList = [...new Set([WRAPPED_SOL_MINT, ...amountByMint.keys()])]
      const prices = await fetchUsdPrices(mintList).catch(() => new Map<string, TokenPrice>())
      const holdings = [...amountByMint.entries()].map(([mint, token]) => ({
        mint,
        symbol: prices.get(mint)?.symbol ?? null,
        amount: token.amount,
        decimals: token.decimals,
        priceUsd: prices.get(mint)?.priceUsd ?? null,
      }))

      const parsedTransactions = signatures.length
        ? await connection.getParsedTransactions(
            signatures.map(({ signature }) => signature),
            { commitment: 'confirmed', maxSupportedTransactionVersion: 0 },
          )
        : []

      return {
        solBalance: lamports / LAMPORTS_PER_SOL,
        solPriceUsd: prices.get(WRAPPED_SOL_MINT)?.priceUsd ?? null,
        holdings,
        transactions: parsedTransactions.flatMap((transaction, index) => {
          if (!transaction?.meta) return []
          const signature = signatures[index]
          return [
            parseRecentTransaction(
              transaction,
              address.toBase58(),
              signature.signature,
              signature.blockTime ?? null,
              prices,
            ),
          ]
        }),
      }
    },
  })
}

interface TokenPrice {
  priceUsd: number
  symbol: string | null
  liquidityUsd: number
}

async function fetchUsdPrices(mints: string[]): Promise<Map<string, TokenPrice>> {
  const prices = new Map<string, TokenPrice>()
  for (let index = 0; index < mints.length; index += 30) {
    const batch = mints.slice(index, index + 30)
    const response = await fetch(`https://api.dexscreener.com/tokens/v1/solana/${batch.join(',')}`)
    if (!response.ok) throw new Error('Live token prices are temporarily unavailable.')
    const pairs = (await response.json()) as Array<{
      baseToken?: { address?: string; symbol?: string }
      quoteToken?: { address?: string; symbol?: string }
      priceUsd?: string
      priceNative?: string
      liquidity?: { usd?: number }
    }>
    for (const pair of pairs) {
      const baseMint = pair.baseToken?.address
      const basePrice = Number(pair.priceUsd)
      const liquidityUsd = pair.liquidity?.usd ?? 0
      if (baseMint && Number.isFinite(basePrice) && basePrice > 0) {
        const current = prices.get(baseMint)
        if (!current || liquidityUsd > current.liquidityUsd) {
          prices.set(baseMint, {
            priceUsd: basePrice,
            symbol: pair.baseToken?.symbol ?? null,
            liquidityUsd,
          })
        }
      }

      const quoteMint = pair.quoteToken?.address
      const nativePrice = Number(pair.priceNative)
      if (quoteMint && baseMint && basePrice > 0 && nativePrice > 0) {
        const quotePrice = basePrice / nativePrice
        const current = prices.get(quoteMint)
        if (!current || liquidityUsd > current.liquidityUsd) {
          prices.set(quoteMint, {
            priceUsd: quotePrice,
            symbol: pair.quoteToken?.symbol ?? null,
            liquidityUsd,
          })
        }
      }
    }
  }
  return prices
}

function parseRecentTransaction(
  transaction: ParsedTransactionWithMeta,
  owner: string,
  signature: string,
  timestamp: number | null,
  prices: Map<string, TokenPrice>,
): DashboardTransaction {
  const searchText = [
    signature,
    ...transaction.transaction.message.accountKeys.map((key) => key.pubkey.toBase58()),
    ...transaction.transaction.message.instructions.flatMap((instruction) => [
      instruction.programId.toBase58(),
      ...('program' in instruction ? [instruction.program] : []),
      ...('parsed' in instruction ? [JSON.stringify(instruction.parsed)] : []),
    ]),
  ].join(' ').toLowerCase()
  const isDeFi = /stake|deposit|withdraw|lend|borrow|liquid|yield/i.test(searchText)
  const meta = transaction.meta
  if (!meta) {
    return {
      signature,
      timestamp,
      type: 'Unknown',
      amount: 'Unavailable',
      valueUsd: null,
      searchText,
      status: 'Failed',
      feeLamports: 0,
      programs: [],
      accounts: [],
    }
  }
  const transactionDetails = {
    searchText,
    status: meta.err ? ('Failed' as const) : ('Confirmed' as const),
    feeLamports: meta.fee,
    programs: [...new Set(transaction.transaction.message.instructions.map((instruction) => {
      if ('program' in instruction) return instruction.program
      return instruction.programId.toBase58()
    }))],
    accounts: transaction.transaction.message.accountKeys.map((key) => key.pubkey.toBase58()),
  }
  const tokenDeltas = new Map<string, number>()
  for (const balance of meta.preTokenBalances ?? []) {
    if (balance.owner !== owner) continue
    tokenDeltas.set(balance.mint, (tokenDeltas.get(balance.mint) ?? 0) - Number(balance.uiTokenAmount.uiAmountString ?? 0))
  }
  for (const balance of meta.postTokenBalances ?? []) {
    if (balance.owner !== owner) continue
    tokenDeltas.set(balance.mint, (tokenDeltas.get(balance.mint) ?? 0) + Number(balance.uiTokenAmount.uiAmountString ?? 0))
  }

  const changedTokens = [...tokenDeltas.entries()].filter(([, amount]) => Math.abs(amount) > 0)
  const accountKeys = transaction.transaction.message.accountKeys
  const ownerIndex = accountKeys.findIndex((key) => key.pubkey.toBase58() === owner)
  const solDelta = ownerIndex < 0 ? 0 : (meta.postBalances[ownerIndex] - meta.preBalances[ownerIndex]) / LAMPORTS_PER_SOL
  const sortedTokens = changedTokens.sort((left, right) => Math.abs(right[1]) - Math.abs(left[1]))
  const tokenOutUsd = sortedTokens
    .filter(([, amount]) => amount < 0)
    .reduce((sum, [mint, amount]) => sum + Math.abs(amount) * (prices.get(mint)?.priceUsd ?? 0), 0)
  const tokenInUsd = sortedTokens
    .filter(([, amount]) => amount > 0)
    .reduce((sum, [mint, amount]) => sum + amount * (prices.get(mint)?.priceUsd ?? 0), 0)
  const tokenUsd = Math.max(tokenOutUsd, tokenInUsd)
  const solUsd = Math.abs(solDelta) * (prices.get(WRAPPED_SOL_MINT)?.priceUsd ?? 0)
  const valueUsd = Math.max(tokenUsd, solUsd) || null

  if (sortedTokens.length > 1 && sortedTokens.some(([, amount]) => amount < 0) && sortedTokens.some(([, amount]) => amount > 0)) {
    const outgoing = sortedTokens.find(([, amount]) => amount < 0)!
    const incoming = sortedTokens.find(([, amount]) => amount > 0)!
    return {
      signature,
      timestamp,
      type: isDeFi ? 'DeFi' : 'Swap',
      amount: `${formatTokenAmount(Math.abs(outgoing[1]))} ${prices.get(outgoing[0])?.symbol ?? outgoing[0].slice(0, 4)} → ${formatTokenAmount(incoming[1])} ${prices.get(incoming[0])?.symbol ?? incoming[0].slice(0, 4)}`,
      valueUsd,
      ...transactionDetails,
    }
  }

  if (sortedTokens.length) {
    const [mint, amount] = sortedTokens[0]
    return {
      signature,
      timestamp,
      type: isDeFi ? 'DeFi' : amount > 0 ? 'Received' : 'Sent',
      amount: `${formatTokenAmount(Math.abs(amount))} ${prices.get(mint)?.symbol ?? `${mint.slice(0, 4)}…`}`,
      valueUsd,
      ...transactionDetails,
    }
  }

  return {
    signature,
    timestamp,
    type: isDeFi ? 'DeFi' : solDelta > 0 ? 'Received SOL' : 'Sent SOL',
    amount: `${formatTokenAmount(Math.abs(solDelta))} SOL`,
    valueUsd: solUsd || null,
    ...transactionDetails,
  }
}

function formatTokenAmount(amount: number): string {
  return amount.toLocaleString('en-US', { maximumFractionDigits: 5 })
}