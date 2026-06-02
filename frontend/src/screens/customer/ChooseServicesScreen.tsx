import React, { useState } from "react";
import { Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInRight } from "react-native-reanimated";
import ScreenShell from "../../components/ScreenShell";
import FeedbackModal, { type FeedbackType } from "../../components/FeedbackModal";
import { StorageKeys, setItem } from "../../utils/storage";
import { PRIMARY, CARD, TEXT, BORDER } from "../../theme/colors";
import { sharedStyles } from "../../theme/sharedStyles";

const services = ["Plumbing", "Cleaning", "Electrician", "Carpentry"];

export default function ChooseServicesScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [popup, setPopup] = useState({
    visible: false,
    type: "info" as FeedbackType,
    title: "",
    message: "",
    onConfirm: undefined as (() => void) | undefined,
  });

  const toggleService = (service: string) => {
    setSelected((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    );
  };

  const continueNext = async () => {
    if (selected.length === 0) {
      setPopup({
        visible: true,
        type: "error",
        title: "Select services",
        message: "Pick at least one category to personalize your feed.",
        onConfirm: undefined,
      });
      return;
    }
    await setItem(StorageKeys.SERVICES, JSON.stringify(selected));
    router.replace("/");
  };

  return (
    <ScreenShell
      step="Step 4 · Preferences"
      title="What services do you need?"
      subtitle="We will highlight relevant gigs on your home feed."
    >
      {services.map((s, i) => {
        const active = selected.includes(s);
        return (
          <Animated.View key={s} entering={FadeInRight.delay(i * 50).duration(300)}>
            <TouchableOpacity
              onPress={() => toggleService(s)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{s}</Text>
            </TouchableOpacity>
          </Animated.View>
        );
      })}

      <TouchableOpacity onPress={continueNext} style={sharedStyles.btnPrimary}>
        <Text style={sharedStyles.btnPrimaryText}>Continue to marketplace</Text>
      </TouchableOpacity>

      <FeedbackModal
        visible={popup.visible}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        onClose={() => setPopup((p) => ({ ...p, visible: false }))}
      />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  chip: {
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 4,
    backgroundColor: CARD,
  },
  chipActive: { borderColor: PRIMARY, backgroundColor: PRIMARY },
  chipText: { fontSize: 16, fontWeight: "600", color: TEXT },
  chipTextActive: { color: "#fff" },
});
