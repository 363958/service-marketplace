import { api } from "./client";

export type ProviderProfilePayload = {
  service: string;
  phone: string;
  location: string;
};

export type ProviderProfile = {
  service_type: string;
  phone: string;
  location: string;
  id_number?: string;
  kyc_status: string;
  is_verified: boolean;
  profile_completed: boolean;
};

export const kycApi = {
  getProfile: () =>
    api.get<ProviderProfile>("providers/profile/").then((r) => r.data),
  saveProfile: (data: ProviderProfilePayload) =>
    api
      .post<ProviderProfile>("providers/profile/", data)
      .then((r) => r.data),
  submitKyc: (id_number: string) =>
    api
      .post<ProviderProfile>("kyc/submit/", { id_number })
      .then((r) => r.data),
};
