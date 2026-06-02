import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import type { AvailabilitySlot } from "../services/api/bookingsApi";
import { PRIMARY, CARD, TEXT, TEXT_MUTED, BORDER, SUCCESS } from "../theme/colors";

type Props = {
  month: Date;
  slots: AvailabilitySlot[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  onChangeMonth: (delta: number) => void;
  readOnly?: boolean;
  bookingMode?: boolean;
  selectedSlotId?: number | null;
  onToggleSlot?: (slot: AvailabilitySlot) => void;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function BookingCalendar({
  month,
  slots,
  selectedDate,
  selectedSlotId,
  onSelectDate,
  onChangeMonth,
  readOnly,
  bookingMode,
  onToggleSlot,
}: Props) {
  const year = month.getFullYear();
  const mon = month.getMonth();
  const label = month.toLocaleString("default", { month: "long", year: "numeric" });

  const slotsByDate = useMemo(() => {
    const map: Record<string, AvailabilitySlot[]> = {};
    slots.forEach((s) => {
      (map[s.date] ||= []).push(s);
    });
    return map;
  }, [slots]);

  const days = useMemo(() => {
    const first = new Date(year, mon, 1);
    const startPad = first.getDay();
    const count = new Date(year, mon + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < startPad; i++) cells.push(null);
    for (let d = 1; d <= count; d++) cells.push(d);
    return cells;
  }, [year, mon]);

  const dateStr = (day: number) =>
    `${year}-${String(mon + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const dayStatus = (day: number) => {
    const ds = dateStr(day);
    const daySlots = slotsByDate[ds] || [];
    if (daySlots.some((s) => s.status === "available")) return "available";
    if (daySlots.some((s) => s.status === "booked")) return "booked";
    if (daySlots.some((s) => s.status === "blocked")) return "blocked";
    return "none";
  };

  const selectedSlots = selectedDate ? slotsByDate[selectedDate] || [] : [];

  return (
    <View style={styles.wrap}>
      <View style={styles.monthRow}>
        <TouchableOpacity onPress={() => onChangeMonth(-1)}>
          <Text style={styles.nav}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{label}</Text>
        <TouchableOpacity onPress={() => onChangeMonth(1)}>
          <Text style={styles.nav}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAYS.map((w) => (
          <Text key={w} style={styles.weekday}>
            {w}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {days.map((day, i) => {
          if (day === null) return <View key={`e-${i}`} style={styles.cell} />;
          const ds = dateStr(day);
          const st = dayStatus(day);
          const selected = selectedDate === ds;
          return (
            <TouchableOpacity
              key={ds}
              style={[
                styles.cell,
                st === "available" && styles.cellAvailable,
                st === "booked" && styles.cellBooked,
                st === "blocked" && styles.cellBlocked,
                selected && styles.cellSelected,
              ]}
              onPress={() => onSelectDate(ds)}
            >
              <Text style={[styles.dayNum, selected && styles.daySelected]}>{day}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.legend}>
        <LegendDot color={SUCCESS} label="Available" />
        <LegendDot color="#CBD5E1" label="Booked" />
        <LegendDot color="#FCA5A5" label="Blocked" />
      </View>

      {selectedDate ? (
        <View style={styles.slots}>
          <Text style={styles.slotsTitle}>Times on {selectedDate}</Text>
          {selectedSlots.length === 0 ? (
            <Text style={styles.noSlots}>No slots — provider can add availability</Text>
          ) : (
            selectedSlots.map((slot) => {
              const selectable =
                !bookingMode || (!readOnly && slot.status === "available");
              return (
              <TouchableOpacity
                key={slot.id}
                disabled={!selectable && bookingMode}
                onPress={() => {
                  if (bookingMode && slot.status !== "available") return;
                  onToggleSlot?.(slot);
                }}
                style={[
                  styles.slotRow,
                  slot.status === "available" && styles.slotAvail,
                  slot.status === "booked" && styles.slotBooked,
                  slot.status === "blocked" && styles.slotBlocked,
                  selectedSlotId === slot.id && styles.slotSelected,
                ]}
              >
                <Text style={styles.slotTime}>
                  {slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}
                </Text>
                <Text style={styles.slotStatus}>{slot.status}</Text>
              </TouchableOpacity>
              );
            })
          )}
        </View>
      ) : null}
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: CARD, borderRadius: 8, padding: 16, borderWidth: 1, borderColor: BORDER },
  monthRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  nav: { fontSize: 28, color: PRIMARY, paddingHorizontal: 12 },
  monthLabel: { fontSize: 17, fontWeight: "700", color: TEXT },
  weekRow: { flexDirection: "row", marginBottom: 4 },
  weekday: { flex: 1, textAlign: "center", fontSize: 11, color: TEXT_MUTED, fontWeight: "600" },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: {
    width: "14.28%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    marginVertical: 2,
  },
  cellAvailable: { backgroundColor: "#ECFDF5" },
  cellBooked: { backgroundColor: "#F1F5F9" },
  cellBlocked: { backgroundColor: "#FEF2F2" },
  cellSelected: { borderWidth: 2, borderColor: PRIMARY },
  dayNum: { fontSize: 13, color: TEXT, fontWeight: "600" },
  daySelected: { color: PRIMARY },
  legend: { flexDirection: "row", justifyContent: "center", gap: 16, marginTop: 12 },
  legendItem: { flexDirection: "row", alignItems: "center" },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 4 },
  legendText: { fontSize: 11, color: TEXT_MUTED },
  slots: { marginTop: 16 },
  slotsTitle: { fontWeight: "700", color: TEXT, marginBottom: 8 },
  noSlots: { color: TEXT_MUTED, fontSize: 13 },
  slotRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: BORDER,
  },
  slotAvail: { backgroundColor: "#F0FDF4" },
  slotBooked: { backgroundColor: "#F8FAFC", opacity: 0.8 },
  slotBlocked: { backgroundColor: "#FEF2F2" },
  slotSelected: { borderColor: PRIMARY, borderWidth: 2 },
  slotTime: { fontWeight: "600", color: TEXT },
  slotStatus: { textTransform: "capitalize", color: TEXT_MUTED, fontSize: 13 },
});
