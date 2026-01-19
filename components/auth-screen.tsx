import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useAuth, useOAuth } from '@clerk/clerk-expo';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';

WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen() {
  const { isSignedIn, isLoaded, signOut } = useAuth();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const { createdSessionId, setActive } = await startOAuthFlow();
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }
    } catch (err) {
      console.error('OAuth error', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.loadingContainer}>
          <ThemedText>Loading...</ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  if (isSignedIn) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.authenticatedContainer}>
          <ThemedText type="title">Welcome back!</ThemedText>
          <ThemedText>You're successfully authenticated with BuddyReminder.</ThemedText>
          <Pressable style={styles.button} onPress={() => signOut()}>
            <Text style={styles.buttonText}>Sign Out</Text>
          </Pressable>
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.authContainer}>
        <ThemedText type="title" style={styles.title}>
          Welcome to BuddyReminder
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Your AI-powered task and reminder assistant
        </ThemedText>
        
        <View style={styles.buttonContainer}>
          <Pressable 
            style={styles.button} 
            onPress={handleGoogleSignIn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign in with Google</Text>
            )}
          </Pressable>
        </View>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
  },
  authenticatedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 40,
    opacity: 0.7,
  },
  buttonContainer: {
    gap: 15,
    width: '100%',
  },
  button: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#0a7ea4',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#0a7ea4',
  },
});
