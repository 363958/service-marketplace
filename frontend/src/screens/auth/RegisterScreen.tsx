import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { authApi } from "../../services/api/authApi";
import { getApiErrorMessage } from "../../services/api/client";
import { setAuth, getPostLoginRoute } from "../../auth/auth";
import AuthLayout, { authFormStyles as s } from "../../components/AuthLayout";
import FeedbackModal, { type FeedbackType } from "../../components/FeedbackModal";
import { PRIMARY, HERO_BG } from "../../theme/colors";

const RESEND_COOLDOWN = 30;

export default function RegisterScreen() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"customer" | "provider">("customer");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [usernameTaken, setUsernameTaken] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

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

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => (c <= 1 ? 0 : c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: otpSent ? 1 : 0,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [otpSent, fadeAnim]);

  const normalizeEmail = (v: string) => v.trim().toLowerCase();

  const sendOtp = async () => {
    if (!email.trim()) {
      showPopup("error", "Email required", "Enter your email to receive the OTP code.");
      return;
    }
    if (cooldown > 0) return;

    setSendingOtp(true);
    try {
      const res = await authApi.sendOtp(normalizeEmail(email));
      setOtpSent(true);
      setCooldown(RESEND_COOLDOWN);

      const devOtp = res.data.dev_otp;
      if (__DEV__ && devOtp) setOtp(devOtp);

      const msg =
        res.data.message ||
        (res.data.email_sent
          ? "Check your inbox and spam folder for the 6-digit code."
          : "If email did not arrive, check your spam folder or try again.");

      showPopup(
        "success",
        res.data.email_sent ? "OTP sent" : "Check your email",
        msg
      );
    } catch (err) {
      showPopup("error", "OTP failed", getApiErrorMessage(err, "Could not send OTP."));
    } finally {
      setSendingOtp(false);
    }
  };

  const validateForm = (): string | null => {
    if (!username.trim()) return "Please enter a username.";
    if (usernameTaken) return "Username already taken.";
    if (!email.trim()) return "Please enter your email.";
    if (!phone.trim()) return "Please enter your phone number.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    if (!otp.trim()) return "Please enter the OTP code.";
    return null;
  };

  const verifyOtpRegister = async () => {
    if (!otpSent) {
      showPopup("info", "Send OTP first", "Tap Send OTP to verify your email before registering.");
      return;
    }
    const err = validateForm();
    if (err) {
      showPopup("error", "Check your details", err);
      return;
    }

    setVerifying(true);
    try {
      const res = await authApi.verifyOtpRegister({
        username: username.trim(),
        email: normalizeEmail(email),
        phone: phone.trim(),
        password,
        otp: otp.trim(),
        role,
      });

      if (!res.data.access) {
        showPopup("error", "Registration failed", "No access token returned from server.");
        return;
      }

      await setAuth({
        access: res.data.access,
        refresh: res.data.refresh,
        role: res.data.role ?? role,
        username: res.data.username ?? username,
        email: res.data.email ?? normalizeEmail(email),
      });

      const route = await getPostLoginRoute(res.data.role ?? role);
      showPopup(
        "success",
        "Account created",
        res.data.message || "Your account is ready. Welcome to Service Marketplace!",
        () => router.replace(route)
      );
    } catch (err) {
      showPopup("error", "Registration failed", getApiErrorMessage(err, "Could not create account."));
    } finally {
      setVerifying(false);
    }
  };

  const checkUsernameAvailable = async () => {
    const name = username.trim();
    if (name.length < 3) return;
    try {
      const res = await authApi.checkUsername(name);
      setUsernameTaken(!res.available);
    } catch {
      setUsernameTaken(false);
    }
  };

  const step = otpSent ? 2 : 1;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <AuthLayout
        title="Create account"
        subtitle="Register → verify email OTP → login. Choose customer or provider."
        showBack
      >
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={s.stepRow}>
            <View style={[s.step, step >= 1 && s.stepActive]} />
            <View style={[s.step, step >= 2 && s.stepActive]} />
          </View>

          <View style={s.roleRow}>
            {(["customer", "provider"] as const).map((r) => (
              <TouchableOpacity
                key={r}
                style={[s.roleChip, role === r && s.roleChipActive]}
                onPress={() => setRole(r)}
              >
                <Text style={[s.roleText, role === r && s.roleTextActive]}>
                  {r === "customer" ? "Customer" : "Provider"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={s.card}>
            <Text style={s.label}>Username</Text>
            <TextInput
              placeholder="Choose a username"
              value={username}
              onChangeText={(t) => {
                setUsername(t);
                setUsernameTaken(false);
              }}
              onBlur={checkUsernameAvailable}
              autoCapitalize="none"
              style={s.input}
            />
            {usernameTaken ? (
              <Text style={{ color: "#DC2626", marginBottom: 10, fontSize: 13 }}>
                Username already taken — choose another.
              </Text>
            ) : null}
            <Text style={s.label}>Email</Text>
            <TextInput
              placeholder="you@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={s.input}
            />
            <Text style={s.label}>Phone</Text>
            <TextInput
              placeholder="98XXXXXXXX"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              style={s.input}
            />
            <Text style={s.label}>Password</Text>
            <TextInput
              placeholder="Min. 6 characters"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={s.input}
            />

            {otpSent && (
              <Animated.View style={{ opacity: fadeAnim }}>
                <Text style={s.label}>OTP code</Text>
                <TextInput
                  placeholder="6-digit code"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                  style={[s.input, { borderColor: PRIMARY, backgroundColor: HERO_BG }]}
                />
              </Animated.View>
            )}

            {!otpSent ? (
              <TouchableOpacity
                onPress={sendOtp}
                disabled={sendingOtp}
                style={[s.button, sendingOtp && s.buttonDisabled]}
              >
                {sendingOtp ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={s.buttonText}>Send OTP to email</Text>
                )}
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  onPress={verifyOtpRegister}
                  disabled={verifying}
                  style={[s.button, verifying && s.buttonDisabled]}
                >
                  {verifying ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={s.buttonText}>Verify & Register</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={sendOtp}
                  disabled={sendingOtp || cooldown > 0}
                  style={{ alignItems: "center", marginTop: 14 }}
                >
                  <Text style={{ color: cooldown > 0 ? "#aaa" : "#C66992", fontWeight: "600" }}>
                    {cooldown > 0 ? `Resend OTP in ${cooldown}s` : "Resend OTP"}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity style={s.linkRow} onPress={() => router.replace("/login")}>
              <Text style={s.link}>
                Already have an account? <Text style={s.linkBold}>Sign in</Text>
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
