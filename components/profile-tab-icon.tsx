import { Image } from 'expo-image';
import { useUser } from '@clerk/clerk-expo';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface ProfileTabIconProps {
  color: string;
  size?: number;
}

export function ProfileTabIcon({ color, size = 32 }: ProfileTabIconProps) {
  const { user } = useUser();
  
  if (user?.imageUrl) {
    return (
      <Image 
        source={{ uri: user.imageUrl }} 
        style={{ 
          width: size, 
          height: size, 
          borderRadius: size / 2,
        }}
      />
    );
  }
  
  return <IconSymbol size={size} name="person.circle.fill" color={color} />;
}
