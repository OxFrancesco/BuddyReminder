import { StyleSheet } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';

import { ThemedView } from '@/components/themed-view';
import AuthScreen from '@/components/auth-screen';
import ItemsList from '@/components/items-list';
import QuickCaptureFAB from '@/components/quick-capture-fab';
import { useUserSync } from '@/hooks/use-user-sync';

export default function HomeScreen() {
  const { isSignedIn } = useAuth();
  useUserSync(); // Automatically sync user data

  return (
    <ThemedView style={styles.container}>
      {!isSignedIn ? (
        <AuthScreen />
      ) : (
        <>
          <ItemsList />
          <QuickCaptureFAB />
        </>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
