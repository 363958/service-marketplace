import React from "react";
import { TouchableOpacity, Text } from "react-native";
import { useRouter } from "expo-router";
import ScreenShell from "./ScreenShell";
import { sharedStyles } from "../theme/sharedStyles";

type Props = {
  title: string;
  step: string;
  description: string;
  nextRoute?: string;
  nextLabel?: string;
};

export default function WorkflowPlaceholder({
  title,
  step,
  description,
  nextRoute,
  nextLabel = "Continue",
}: Props) {
  const router = useRouter();

  return (
    <ScreenShell step={step} title={title} subtitle={description}>
      {nextRoute ? (
        <TouchableOpacity
          onPress={() => router.push(nextRoute as never)}
          style={sharedStyles.btnPrimary}
        >
          <Text style={sharedStyles.btnPrimaryText}>{nextLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </ScreenShell>
  );
}
