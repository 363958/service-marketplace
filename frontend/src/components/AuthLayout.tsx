import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import {
  PRIMARY,
  BACKGROUND,
  PRIMARY_LIGHT,
  TEXT,
  TEXT_MUTED,
  CARD,
  BORDER,
  HERO_BG,
} from "../theme/colors";
import { getApiBaseUrl } from "../config/api";

type Props = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  showBack?: boolean;
};

export default function AuthLayout({ title, subtitle, children, showBack }: Props) {
  const router = useRouter();

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        {showBack ? (
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        ) : null}
        <View style={styles.brandRow}>
          <View style={styles.logo}>
            <Text style={styles.logoLetter}>S</Text>
          </View>
          <Text style={styles.brand}>Service Marketplace</Text>
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <View style={styles.body}>{children}</View>
      <Text style={styles.apiHint} numberOfLines={1}>
        API: {getApiBaseUrl()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BACKGROUND },
  header: {
    backgroundColor: PRIMARY_LIGHT,
    paddingTop: 16,
    paddingHorizontal: 24,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    borderBottomWidth: 1,
    borderColor: BORDER,
  },
  backBtn: { marginBottom: 12 },
  backText: { color: PRIMARY, fontWeight: "600", fontSize: 15 },
  brandRow: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  logo: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  logoLetter: { color: "#fff", fontWeight: "800", fontSize: 20 },
  brand: { fontSize: 17, fontWeight: "800", color: TEXT },
  title: { fontSize: 28, fontWeight: "800", color: TEXT },
  subtitle: { fontSize: 15, color: TEXT_MUTED, marginTop: 8, lineHeight: 22 },
  body: { flex: 1, paddingHorizontal: 20, paddingTop: 24 },
  apiHint: {
    textAlign: "center",
    fontSize: 10,
    color: TEXT_MUTED,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
});

export const authFormStyles = StyleSheet.create({
  card: {
    backgroundColor: CARD,
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: PRIMARY,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  label: { fontSize: 13, fontWeight: "600", color: TEXT, marginBottom: 6 },
  input: {
    backgroundColor: HERO_BG,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 15,
    color: TEXT,
    marginBottom: 14,
  },
  inputFocused: { borderColor: PRIMARY },
  button: {
    backgroundColor: PRIMARY,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.65 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  linkRow: { marginTop: 20, alignItems: "center" },
  link: { color: TEXT_MUTED, fontSize: 15 },
  linkBold: { color: PRIMARY, fontWeight: "700" },
  roleRow: {
    flexDirection: "row",
    marginBottom: 18,
    gap: 10,
  },
  roleChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    backgroundColor: HERO_BG,
  },
  roleChipActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  roleText: { fontWeight: "700", color: TEXT_MUTED },
  roleTextActive: { color: "#fff" },
  stepRow: { flexDirection: "row", marginBottom: 20, gap: 8 },
  step: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: BORDER,
  },
  stepActive: { backgroundColor: PRIMARY },
});
