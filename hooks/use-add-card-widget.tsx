import { useEffect } from 'react'
import { Platform } from 'react-native'
import Constants from 'expo-constants'
import { AddCardWidget } from '@/widgets/add-card-widget'
import { logger } from '@/lib/logger'

export function useAddCardWidget() {
  useEffect(() => {
    // Skip if not iOS or running in Expo Go (no native modules)
    if (Platform.OS !== 'ios') return
    const isExpoGo = Constants.appOwnership === 'expo'
    if (isExpoGo) return

    // Dynamic import to avoid crash when native module isn't available
    import('voltra/client').then(({ updateWidget }) => {
      updateWidget('add_card', {
        systemSmall: <AddCardWidget />,
      }, {
        deepLinkUrl: 'buddyreminder://modal',
      }).catch((error) => logger.warn('Failed to update add card widget:', error))
    }).catch(() => {
      // Voltra native module not available
    })
  }, [])
}
