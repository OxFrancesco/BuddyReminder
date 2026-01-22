import { Voltra } from 'voltra'

export const AddCardWidget = () => {
  return (
    <Voltra.LinearGradient
      colors={['#007AFF', '#0051D5']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <Voltra.VStack style={{ flex: 1, padding: 16 }}>
        <Voltra.Image
          source={require('@/assets/images/Plius Widget.jpg')}
          style={{ width: 80, height: 80 }}
        />
      </Voltra.VStack>
    </Voltra.LinearGradient>
  )
}
