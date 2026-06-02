import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { authApi } from "../../services/api/authApi";
import { getApiErrorMessage } from "../../services/api/client";
import { setAuth, getPostLoginRoute } from "../../auth/auth";
import AuthLayout, { authFormStyles as s } from "../../components/AuthLayout";
import FeedbackModal, { type FeedbackType } from "../../components/FeedbackModal";

export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState<{
    visible: boolean;
    type: FeedbackType;
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({ visible: false, type: "info", title: "", message: "" });

  const showPopup = (
    type: FeedbackType,
    title: string,
    message: string,
    onConfirm?: () => void
  ) => setPopup({ visible: true, type, title, message, onConfirm });

  const closePopup = () => {
    const cb = popup.onConfirm;
    setPopup((p) => ({ ...p, visible: false, onConfirm: undefined }));
    cb?.();
  };

  const loginUser = async () => {
    if (!username.trim() || !password.trim()) {
      showPopup("error", "Missing fields", "Please enter your username and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.login({
        username: username.trim(),
        password,
      });
      const { access, refresh, role, username: uname, email } = res.data;
      if (!access) {
        showPopup("error", "Login failed", "Invalid response from server.");
        return;
      }
      await setAuth({ access, refresh, role, username: uname, email });
      const route = await getPostLoginRoute(role);
      showPopup(
        "success",
        "Login successful",
        res.data.message || `Welcome back, ${uname}!`,
        () => router.replace(route)
      );
    } catch (err) {
      showPopup("error", "Login failed", getApiErrorMessage(err, "Could not sign in."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <AuthLayout
        title="Welcome back"
        subtitle="Sign in to book services, manage bookings, or access your provider dashboard."
        showBack
      >
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={s.card}>
            <Text style={s.label}>Username or email</Text>
            <TextInput
              placeholder="Enter username or email"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              style={s.input}
            />
            <Text style={s.label}>Password</Text>
            <TextInput
              placeholder="Enter password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={s.input}
            />
            <TouchableOpacity
              onPress={loginUser}
              disabled={loading}
              style={[s.button, loading && s.buttonDisabled]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.buttonText}>Sign In</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={s.linkRow}
              onPress={() => router.push("/forgot-password")}
            >
              <Text style={s.linkBold}>Forgot password?</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.linkRow}
              onPress={() => router.replace("/register")}
            >
              <Text style={s.link}>
                New here? <Text style={s.linkBold}>Create account</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </AuthLayout>

      <FeedbackModal
        visible={popup.visible}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        onClose={closePopup}
        confirmLabel={popup.type === "success" ? "Continue" : "OK"}
      />
    </KeyboardAvoidingView>
  );
}
