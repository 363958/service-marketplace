import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from "react-native";
import { PRIMARY, CARD, TEXT, TEXT_MUTED, SUCCESS, BORDER } from "../theme/colors";

export type FeedbackType = "success" | "error" | "info";

type Props = {
  visible: boolean;
  type: FeedbackType;
  title: string;
  message: string;
  onClose: () => void;
  confirmLabel?: string;
};

const ICONS: Record<FeedbackType, string> = {
  success: "✓",
  error: "✕",
  info: "ℹ",
};

const ACCENTS: Record<FeedbackType, string> = {
  success: SUCCESS,
  error: "#E53935",
  info: PRIMARY,
};

export default function FeedbackModal({
  visible,
  type,
  title,
  message,
  onClose,
  confirmLabel = "OK",
}: Props) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={[styles.iconCircle, { backgroundColor: `${ACCENTS[type]}22` }]}>
            <Text style={[styles.icon, { color: ACCENTS[type] }]}>{ICONS[type]}</Text>
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: ACCENTS[type] }]}
            onPress={onClose}
          >
            <Text style={styles.btnText}>{confirmLabel}</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: CARD,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: BORDER,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  icon: { fontSize: 28, fontWeight: "800" },
  title: { fontSize: 20, fontWeight: "800", color: TEXT, textAlign: "center" },
  message: {
    fontSize: 15,
    color: TEXT_MUTED,
    textAlign: "center",
    marginTop: 10,
    lineHeight: 22,
  },
  btn: {
    marginTop: 22,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
