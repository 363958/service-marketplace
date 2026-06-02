import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import type { ServiceCity } from "../utils/geo";
import { PRIMARY, PRIMARY_LIGHT, CARD, TEXT, TEXT_MUTED, BORDER } from "../theme/colors";

type Props = {
  city: ServiceCity;
  cities: readonly ServiceCity[];
  usingGps: boolean;
  onSelectCity: (city: ServiceCity) => void;
  onUseGps: () => void;
};

export default function LocationBar({
  city,
  cities,
  usingGps,
  onSelectCity,
  onUseGps,
}: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={styles.label}>📍 Nearest to you</Text>
        <TouchableOpacity onPress={onUseGps} style={styles.gpsBtn}>
          <Text style={styles.gpsText}>{usingGps ? "GPS on" : "Use GPS"}</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {cities.map((c) => (
          <TouchableOpacity
            key={c}
            onPress={() => onSelectCity(c)}
            style={[styles.chip, city === c && !usingGps && styles.chipActive]}
          >
            <Text style={[styles.chipText, city === c && !usingGps && styles.chipTextActive]}>
              {c}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    backgroundColor: PRIMARY_LIGHT,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  label: { fontSize: 14, fontWeight: "700", color: TEXT },
  gpsBtn: {
    backgroundColor: CARD,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: PRIMARY,
  },
  gpsText: { fontSize: 12, fontWeight: "700", color: PRIMARY },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: CARD,
    marginRight: 8,
    borderWidth: 1,
    borderColor: BORDER,
  },
  chipActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  chipText: { fontSize: 13, fontWeight: "600", color: TEXT_MUTED },
  chipTextActive: { color: "#fff" },
});
