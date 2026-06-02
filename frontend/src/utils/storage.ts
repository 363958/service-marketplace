import AsyncStorage from "@react-native-async-storage/async-storage";

export const StorageKeys = {
  TOKEN: "token",
  REFRESH_TOKEN: "refresh_token",
  ROLE: "role",
  USERNAME: "username",
  EMAIL: "email",
  PROFILE_COMPLETED: "profile_completed",
  KYC_STATUS: "kyc_status",
  SERVICES: "services",
  VIEWED_SERVICES: "viewed_services",
  SEARCH_HISTORY: "search_history",
} as const;

export async function getItem(key: string): Promise<string | null> {
  return AsyncStorage.getItem(key);
}

export async function setItem(key: string, value: string): Promise<void> {
  await AsyncStorage.setItem(key, value);
}

export async function removeItems(keys: string[]): Promise<void> {
  await AsyncStorage.multiRemove(keys);
}
