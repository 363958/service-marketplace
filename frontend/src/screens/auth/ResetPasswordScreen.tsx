import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { authApi } from "../../services/api/authApi";
import { getApiErrorMessage } from "../../services/api/client";
import AuthLayout, { authFormStyles as s } from "../../components/AuthLayout";
import FeedbackModal, { type FeedbackType } from "../../components/FeedbackModal";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string; uid?: string; token?: string }>();
  const [email, setEmail] = useState(params.email?.toString() || "");
  const [uid, setUid] = useState(params.uid?.toString() || "");
  const [token, setToken] = useState(params.token?.toString() || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState({
    visible: false,
    type: "info" as FeedbackType,
    title: "",
    message: "",
    onConfirm: undefined as (() => void) | undefined,
  });

  const show = (
    type: FeedbackType,
    title: string,
    message: string,
    onConfirm?: () => void
  ) => setPopup({ visible: true, type, title, message, onConfirm });

  const close = () => {
    const cb = popup.onConfirm;
    setPopup((p) => ({ ...p, visible: false, onConfirm: undefined }));
    cb?.();
  };

  const submit = async () => {
    if (!email.trim() || !uid.trim() || !token.trim() || !newPassword) {
      show("error", "Missing fields", "Fill in email, user ID, token, and new password.");
      return;
    }
    if (newPassword.length < 6) {
      show("error", "Too short", "Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      show("error", "Mismatch", "Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.resetPassword({
        email: email.trim().toLowerCase(),
        uid: uid.trim(),
        token: token.trim(),
        new_password: newPassword,
      });
      show("success", "Password reset", res.message || "You can sign in now.", () =>
        router.replace("/login")
      );
    } catch (err) {
      show("error", "Reset failed", getApiErrorMessage(err, "Invalid or expired token."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset password"
      subtitle="Paste the User ID and token from your reset email."
      showBack
    >
      <ScrollView keyboardShouldPersistTaps="handled">
        <View style={s.card}>
          <Text style={s.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={s.input}
          />
          <Text style={s.label}>User ID (from email)</Text>
          <TextInput value={uid} onChangeText={setUid} autoCapitalize="none" style={s.input} />
          <Text style={s.label}>Reset token (from email)</Text>
          <TextInput value={token} onChangeText={setToken} autoCapitalize="none" style={s.input} />
          <Text style={s.label}>New password</Text>
          <TextInput
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            style={s.input}
          />
          <Text style={s.label}>Confirm password</Text>
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            style={s.input}
          />
          <TouchableOpacity
            onPress={submit}
            disabled={loading}
            style={[s.button, loading && s.buttonDisabled]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.buttonText}>Reset password</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <FeedbackModal
        visible={popup.visible}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        onClose={close}
        confirmLabel={popup.type === "success" ? "Sign in" : "OK"}
      />
    </AuthLayout>
  );
}
