import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useAuth, useOAuth } from "@clerk/clerk-expo";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";

WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen() {
  const { isSignedIn, isLoaded, signOut } = useAuth();
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  const [loading, setLoading] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const { createdSessionId, setActive } = await startOAuthFlow();
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }
    } catch (err) {
      console.error("OAuth error", err);
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
          <ThemedText>
            You&apos;re successfully authenticated with BuddyReminder.
          </ThemedText>
          <Pressable
            style={[
              styles.button,
              {
                backgroundColor: colors.primary,
                borderColor: colors.border,
                shadowColor: colors.shadow,
              },
            ]}
            onPress={() => signOut()}
          >
            <Text
              style={[styles.buttonText, { color: colors.primaryForeground }]}
            >
              Sign Out
            </Text>
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
            style={[
              styles.button,
              {
                backgroundColor: colors.primary,
                borderColor: colors.border,
                shadowColor: colors.shadow,
              },
            ]}
            onPress={handleGoogleSignIn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text
                style={[styles.buttonText, { color: colors.primaryForeground }]}
              >
                Sign in with Google
              </Text>
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
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  authContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    maxWidth: 400,
    width: "100%",
  },
  authenticatedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  title: {
    textAlign: "center",
    marginBottom: 10,
    fontWeight: "900",
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 40,
    opacity: 1,
    fontWeight: "bold",
  },
  buttonContainer: {
    gap: 15,
    width: "100%",
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: "center",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});
