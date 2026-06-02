import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";

export default function AuthGuard({ children }: any) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return children;
}