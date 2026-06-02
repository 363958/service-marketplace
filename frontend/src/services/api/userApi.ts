import { api } from "./client";

export type UserProfile = {
  id: number;
  username: string;
  email: string;
  role: string;
  phone: string;
  profile_photo: string;
  kyc_status?: string;
  is_verified?: boolean;
};

export const userApi = {
  me: () => api.get<UserProfile>("users/me/").then((r) => r.data),

  updateProfile: (data: FormData) =>
    api
      .patch<UserProfile>("users/update-profile/", data, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data),

  deletePhoto: () => api.delete<UserProfile>("users/me/photo/").then((r) => r.data),

  changePassword: (current_password: string, new_password: string) =>
    api
      .post<{ message: string }>("users/change-password/", {
        current_password,
        new_password,
      })
      .then((r) => r.data),
      
  requestEmailChange: (email: string) =>
    api.post<{ message: string }>("users/request-email-change/", { email }).then((r) => r.data),
    
  verifyEmailChange: (email: string, otp: string) =>
    api.post<{ message: string }>("users/verify-email-change/", { email, otp }).then((r) => r.data),

  forgotPassword: (email: string) =>
    api
      .post<{ message: string; email_sent?: boolean }>("users/forgot-password/", { email })
      .then((r) => r.data),

  resetPassword: (data: {
    email: string;
    uid: string;
    token: string;
    new_password: string;
  }) =>
    api.post<{ message: string }>("users/reset-password/", data).then((r) => r.data),

  checkUsername: (username: string) =>
    api
      .post<{ available: boolean; username: string }>("users/check-username/", { username })
      .then((r) => r.data),
};
