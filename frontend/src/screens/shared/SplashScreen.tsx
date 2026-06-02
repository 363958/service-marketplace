import { useRouter } from "expo-router";
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { resolveInitialRoute } from "../../navigation/workflow";

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const boot = async () => {
      const route = await resolveInitialRoute();
      setTimeout(() => router.replace(route), 200);
    };
    boot();
  }, [router]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color="rgb(198, 105, 146)" />
    </View>
  );
}
