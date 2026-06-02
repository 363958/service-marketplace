import axios from "axios";
import { getApiBaseUrl } from "../../config/api";

export type LoginPayload = { username: string; password: string };
export type RegisterPayload = {
  username: string;
  email: string;
  phone: string;
  password: string;
  otp: string;
  role: "customer" | "provider";
};

export type SendOtpResponse = {
  message?: string;
  email_sent?: boolean;
  dev_otp?: string;
};

export type AuthResponse = {
  message?: string;
  access: string;
  refresh?: string;
  role: string;
  username: string;
  email?: string;
};

const authClient = axios.create({
  headers: { "Content-Type": "application/json" },
  timeout: 20000,
});

authClient.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();
  // Never send auth headers on login/register/reset endpoints
  delete config.headers.Authorization;
  return config;
});

export const authApi = {
  sendOtp: (email: string) =>
    authClient.post<SendOtpResponse>("users/send-otp/", { email }),
  verifyOtpRegister: (data: RegisterPayload) =>
    authClient.post<AuthResponse>("users/verify-otp-register/", data),
  login: (data: LoginPayload) =>
    authClient.post<AuthResponse>("users/login/", data),
  forgotPassword: (email: string) =>
    authClient
      .post<{ message: string; email_sent?: boolean }>("users/forgot-password/", { email })
      .then((r) => r.data),
  resetPassword: (data: {
    email: string;
    uid: string;
    token: string;
    new_password: string;
  }) =>
    authClient.post<{ message: string }>("users/reset-password/", data).then((r) => r.data),
  checkUsername: (username: string) =>
    authClient
      .post<{ available: boolean }>("users/check-username/", { username })
      .then((r) => r.data),
};
