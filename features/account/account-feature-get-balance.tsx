import { Text } from 'react-native'
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import { useAccountGetBalance } from '@/features/account/use-account-get-balance'
import { appStyles } from '@/constants/app-styles'

export function AccountFeatureGetBalance({ address }: { address: PublicKey }) {
  const { data, isLoading } = useAccountGetBalance({ address })

  return <Text style={appStyles.bodyText}>Balance: {isLoading ? '...' : `${(data ?? 0) / LAMPORTS_PER_SOL} SOL`}</Text>
}
