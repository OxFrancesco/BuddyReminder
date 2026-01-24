// Type declarations for voltra (iOS widget library)
// These are placeholder types until the package is properly installed

declare module 'voltra' {
  import { ReactNode } from 'react'
  import { ViewStyle, ImageSourcePropType } from 'react-native'

  interface GradientProps {
    colors: string[]
    start?: { x: number; y: number }
    end?: { x: number; y: number }
    style?: ViewStyle
    children?: ReactNode
  }

  interface VStackProps {
    style?: ViewStyle
    children?: ReactNode
  }

  interface ImageProps {
    source: ImageSourcePropType
    style?: ViewStyle
  }

  export const Voltra: {
    LinearGradient: React.FC<GradientProps>
    VStack: React.FC<VStackProps>
    Image: React.FC<ImageProps>
  }
}

declare module 'voltra/client' {
  import { ReactNode } from 'react'

  interface WidgetConfig {
    systemSmall?: ReactNode
    systemMedium?: ReactNode
    systemLarge?: ReactNode
  }

  interface WidgetOptions {
    deepLinkUrl?: string
  }

  export function updateWidget(
    name: string,
    config: WidgetConfig,
    options?: WidgetOptions
  ): Promise<void>
}
