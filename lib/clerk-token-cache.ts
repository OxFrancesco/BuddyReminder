import { TokenCache } from "@clerk/clerk-expo";
import * as SecureStore from "expo-secure-store";
import { logger } from "@/lib/logger";

const createTokenCache = (): TokenCache => {
    return {
        getToken: async (key: string) => {
            try {
                const item = await SecureStore.getItemAsync(key);
                return item;
            } catch (error) {
                logger.error("SecureStore getToken error:", error);
                await SecureStore.deleteItemAsync(key);
                return null;
            }
        },
        saveToken: async (key: string, token: string) => {
            try {
                await SecureStore.setItemAsync(key, token);
            } catch (error) {
                logger.error("SecureStore saveToken error:", error);
            }
        },
        clearToken: async (key: string) => {
            try {
                await SecureStore.deleteItemAsync(key);
            } catch (error) {
                logger.error("SecureStore clearToken error:", error);
            }
        },
    };
};

export const tokenCache = createTokenCache();
