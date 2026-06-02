import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { BACKGROUND, PRIMARY, TEXT, TEXT_MUTED } from "../theme/colors";

type Props = {
  step?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  scroll?: boolean;
  showBack?: boolean;
};

export default function ScreenShell({
  step,
  title,
  subtitle,
  children,
  scroll = true,
  showBack,
}: Props) {
  const router = useRouter();
  const body = (
    <Animated.View entering={FadeInDown.duration(450).springify()} style={styles.inner}>
      {step ? <Text style={styles.step}>{step}</Text> : null}
      {showBack ? (
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      ) : null}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {children}
    </Animated.View>
  );

  if (scroll) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {body}
      </ScrollView>
    );
  }

  return <View style={[styles.screen, styles.content]}>{body}</View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BACKGROUND },
  content: { padding: 20, paddingBottom: 40 },
  inner: { flex: 1 },
  back: { marginBottom: 8 },
  backText: { color: PRIMARY, fontWeight: "600", fontSize: 15 },
  step: { fontSize: 12, color: TEXT_MUTED, fontWeight: "600", letterSpacing: 0.3 },
  title: { fontSize: 24, fontWeight: "800", color: TEXT, marginTop: 8, marginBottom: 6 },
  subtitle: { fontSize: 15, color: TEXT_MUTED, lineHeight: 22, marginBottom: 20 },
});
