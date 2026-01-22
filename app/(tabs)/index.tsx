import { StyleSheet } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { useState } from 'react';

import { ThemedView } from '@/components/themed-view';
import AuthScreen from '@/components/auth-screen';
import ItemsList from '@/components/items-list';
import QuickCaptureFAB from '@/components/quick-capture-fab';
import QuickCaptureModal from '@/components/quick-capture-modal';
import { useUserSync } from '@/hooks/use-user-sync';
import { SwipeableTab } from '@/components/swipeable-tab';

export default function HomeScreen() {
  const { isSignedIn } = useAuth();
  const [showQuickCapture, setShowQuickCapture] = useState(false);
  useUserSync(); // Automatically sync user data

  return (
    <SwipeableTab onTwoFingerTap={() => setShowQuickCapture(true)}>
      <ThemedView style={styles.container}>
        {!isSignedIn ? (
          <AuthScreen />
        ) : (
          <>
            <ItemsList />
            <QuickCaptureFAB />
            <QuickCaptureModal
              visible={showQuickCapture}
              onClose={() => setShowQuickCapture(false)}
            />
          </>
        )}
      </ThemedView>
    </SwipeableTab>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
