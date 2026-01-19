import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '@clerk/clerk-expo';
import { Image } from 'expo-image';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function TabTwoScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  
  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + 20 }]}>
      {user?.imageUrl && (
        <Image 
          source={{ uri: user.imageUrl }} 
          style={styles.avatar}
        />
      )}
      <ThemedText type="title">Profile</ThemedText>
      {user?.fullName && (
        <ThemedText style={styles.name}>{user.fullName}</ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
  },
  name: {
    marginTop: 8,
    fontSize: 16,
    opacity: 0.7,
  },
});
