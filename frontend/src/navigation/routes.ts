/** Expo Router paths — public home is `/` (first screen). */
export const Routes = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  CHOOSE_SERVICES: "/choose-services",
  SEARCH: "/search",
  BOOK: "/book",
  CHAT: "/chat",
  PROVIDER_ONBOARDING: "/provider-onboarding",
  PROVIDER_KYC: "/provider-kyc",
  PROVIDER_HOME: "/provider-home",
  PROVIDER_SERVICES: "/provider-services",
} as const;

export type AppRoute = (typeof Routes)[keyof typeof Routes];

/** @deprecated use Routes.HOME */
export const RoutesLegacy = { CUSTOMER_HOME: "/" as const, SPLASH: "/" as const };
