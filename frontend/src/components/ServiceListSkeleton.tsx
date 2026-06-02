import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  FadeIn,
} from "react-native-reanimated";
import { BORDER, CARD } from "../theme/colors";

function SkeletonBlock({ width, height }: { width: number | `${number}%`; height: number }) {
  const opacity = useSharedValue(0.45);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 900 }), -1, true);
  }, [opacity]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        { width, height, backgroundColor: BORDER, borderRadius: 10 },
        style,
      ]}
    />
  );
}

export default function ServiceListSkeleton() {
  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.container}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={styles.card}>
          <SkeletonBlock width="70%" height={20} />
          <View style={{ height: 10 }} />
          <SkeletonBlock width="40%" height={14} />
          <View style={{ height: 14 }} />
          <SkeletonBlock width="100%" height={14} />
          <View style={{ height: 8 }} />
          <SkeletonBlock width="90%" height={14} />
        </View>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 8 },
  card: {
    backgroundColor: CARD,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: BORDER,
  },
});
