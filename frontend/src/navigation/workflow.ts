import { kycApi } from "../services/api/kycApi";
import { StorageKeys, getItem, setItem } from "../utils/storage";
import { Routes, type AppRoute } from "./routes";

export async function syncProviderProfile(): Promise<void> {
  try {
    const profile = await kycApi.getProfile();
    await setItem(
      StorageKeys.PROFILE_COMPLETED,
      profile.profile_completed ? "true" : "false"
    );
    await setItem(StorageKeys.KYC_STATUS, profile.kyc_status);
  } catch {
    // ignore
  }
}

/** After login / register — providers go to setup; customers land on public home. */
export async function getPostLoginRoute(role: string): Promise<AppRoute> {
  if (role?.toLowerCase() === "provider") {
    await syncProviderProfile();
    const profileDone =
      (await getItem(StorageKeys.PROFILE_COMPLETED)) === "true";
    const kycStatus = (await getItem(StorageKeys.KYC_STATUS)) || "pending";

    if (!profileDone) return Routes.PROVIDER_ONBOARDING;
    // Approved status is stored in DB and synced on login — never re-prompt KYC
    if (kycStatus === "approved") return Routes.PROVIDER_HOME;
    if (kycStatus === "pending") return Routes.PROVIDER_KYC;
    return Routes.PROVIDER_HOME;
  }

  return Routes.HOME;
}

/** App start: always show marketplace home first (guest or logged in). */
export async function resolveInitialRoute(): Promise<AppRoute> {
  return Routes.HOME;
}
