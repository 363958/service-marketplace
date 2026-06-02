import React, { useState } from "react";
import { Text, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import ScreenShell from "../../components/ScreenShell";
import FeedbackModal, { type FeedbackType } from "../../components/FeedbackModal";
import { kycApi } from "../../services/api/kycApi";
import { StorageKeys, setItem } from "../../utils/storage";
import { sharedStyles } from "../../theme/sharedStyles";
import { getApiErrorMessage } from "../../services/api/client";

export default function ProviderKycScreen() {
  const router = useRouter();
  const [idNumber, setIdNumber] = useState("");
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
    if (!idNumber.trim()) {
      showPopup("error", "ID required", "Enter your national ID or license number.");
      return;
    }
    setLoading(true);
    try {
      const profile = await kycApi.submitKyc(idNumber.trim());
      await setItem(StorageKeys.KYC_STATUS, profile.kyc_status);
      showPopup(
        "success",
        "KYC submitted",
        "Admin will review your documents. You can use the dashboard while pending.",
        () => router.replace("/provider-home")
      );
    } catch (err) {
      showPopup("error", "Submission failed", getApiErrorMessage(err, "KYC submission failed."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenShell
      step="Step 6–7 · Verification"
      title="KYC submission"
      subtitle="Submit your ID for admin approval and a verified badge on your profile."
    >
      <TextInput
        placeholder="National ID / license number"
        value={idNumber}
        onChangeText={setIdNumber}
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
          <Text style={sharedStyles.btnPrimaryText}>Submit KYC</Text>
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
