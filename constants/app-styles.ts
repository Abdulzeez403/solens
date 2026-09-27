import { StyleSheet } from 'react-native'

export const appStyles = StyleSheet.create({
  card: {
    backgroundColor: '#12151d',
    borderColor: '#252a36',
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  screen: {
    flex: 1,
    backgroundColor: '#080a0f',
  },
  page: {
    flexGrow: 1,
    gap: 28,
    paddingBottom: 32,
    paddingHorizontal: 22,
    paddingTop: 16,
  },
  stack: {
    gap: 12,
  },
  title: {
    color: '#f3f4f8',
    fontSize: 18,
    fontWeight: '700',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#7964ef',
    borderRadius: 14,
    flexDirection: 'row',
    gap: 9,
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: 18,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#191d28',
    borderColor: '#2b3040',
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 14,
  },
  secondaryButtonText: {
    color: '#d7d9e1',
    fontSize: 14,
    fontWeight: '600',
  },
  mutedText: {
    color: '#8b91a4',
    fontSize: 13,
    lineHeight: 19,
  },
  bodyText: {
    color: '#d7d9e1',
    fontSize: 13,
    lineHeight: 19,
  },
})
