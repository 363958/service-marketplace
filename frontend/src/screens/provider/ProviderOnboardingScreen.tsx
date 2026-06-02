import React, { useState } from "react";
import { Text, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import ScreenShell from "../../components/ScreenShell";
import FeedbackModal, { type FeedbackType } from "../../components/FeedbackModal";
import { kycApi } from "../../services/api/kycApi";
import { StorageKeys, setItem } from "../../utils/storage";
import { sharedStyles } from "../../theme/sharedStyles";
import { getApiErrorMessage } from "../../services/api/client";

export default function ProviderOnboardingScreen() {
  const router = useRouter();
  const [service, setService] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState({
    visible: false,
    type: "info" as FeedbackType,
    title: "",
    message: "",
    onConfirm: undefined as (() => void) | undefined,
  });

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

  const submit = async () => {
    if (!service.trim() || !phone.trim() || !location.trim()) {
      showPopup("error", "Missing fields", "Fill in service type, phone, and location.");
      return;
    }
    setLoading(true);
    try {
      const profile = await kycApi.saveProfile({ service, phone, location });
      await setItem(
        StorageKeys.PROFILE_COMPLETED,
        profile.profile_completed ? "true" : "false"
      );
      await setItem(StorageKeys.KYC_STATUS, profile.kyc_status);
      showPopup("success", "Profile saved", "Complete KYC next to get verified.", () =>
        router.replace("/provider-kyc")
      );
    } catch (err) {
      showPopup("error", "Save failed", getApiErrorMessage(err, "Could not save profile."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenShell
      step="Step 5 · Provider setup"
      title="Tell us about your service"
      subtitle="This helps customers find you on the marketplace."
    >
      <TextInput
        placeholder="Service type (e.g. Plumbing)"
        value={service}
        onChangeText={setService}
        style={sharedStyles.input}
      />
      <TextInput
        placeholder="Phone number"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        style={sharedStyles.input}
      />
      <TextInput
        placeholder="Location / city"
        value={location}
        onChangeText={setLocation}
        style={sharedStyles.input}
      />
      <TouchableOpacity
        onPress={submit}
        disabled={loading}
        style={[sharedStyles.btnPrimary, loading && { opacity: 0.65 }]}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={sharedStyles.btnPrimaryText}>Continue to KYC</Text>
        )}
      </TouchableOpacity>

      <FeedbackModal
        visible={popup.visible}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        onClose={closePopup}
      />
    </ScreenShell>
  );
}
