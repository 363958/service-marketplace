import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import axios from "axios";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import BookingCalendar from "../../components/BookingCalendar";
import FeedbackModal, { type FeedbackType } from "../../components/FeedbackModal";
import { bookingsApi, type AvailabilitySlot } from "../../services/api/bookingsApi";
import { getApiErrorMessage } from "../../services/api/client";
import { getAuth } from "../../auth/auth";
import {
  BACKGROUND,
  CARD,
  TEXT,
  TEXT_MUTED,
  BORDER,
  PRIMARY,
  SUCCESS,
  TAG_BG,
  PRIMARY_LIGHT,
} from "../../theme/colors";

type Step = 1 | 2;

export default function BookScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    serviceId?: string;
    title?: string;
    price?: string;
    provider?: string;
    providerId?: string;
  }>();

  const [step, setStep] = useState<Step>(1);
  const [month, setMonth] = useState(new Date());
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [popup, setPopup] = useState({
    visible: false,
    type: "info" as FeedbackType,
    title: "",
    message: "",
    onConfirm: undefined as (() => void) | undefined,
  });

  const monthKey = useMemo(
    () => `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`,
    [month]
  );

  const missingParams = !params.serviceId || !params.providerId;
  const priceNum = params.price ? parseFloat(params.price) : 0;

  useEffect(() => {
    (async () => {
      const auth = await getAuth();
      if (
        auth.role?.toLowerCase() === "provider" &&
        auth.username &&
        params.provider &&
        params.provider === auth.username
      ) {
        router.replace("/provider-services");
      }
    })();
  }, [router, params.provider]);

  const loadSlots = useCallback(async () => {
    if (!params.serviceId || !params.providerId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await bookingsApi.listAvailability({
        provider: Number(params.providerId),
        service: Number(params.serviceId),
        month: monthKey,
      });
      setSlots(data);
    } catch (err) {
      // If backend requires auth (or token is stale), show a friendly message.
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        showPopup("info", "Sign in required", "Please sign in to view availability.", () =>
          router.push("/login")
        );
        setSlots([]);
        return;
      }
      showPopup("error", "Could not load slots", getApiErrorMessage(err, "Try again."));
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [monthKey, params.serviceId, params.providerId]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  useFocusEffect(
    useCallback(() => {
      loadSlots();
    }, [loadSlots])
  );

  const showPopup = (
    type: FeedbackType,
    title: string,
    message: string,
    onConfirm?: () => void
  ) => setPopup({ visible: true, type, title, message, onConfirm });

  const closePopup = () => {
    const cb = popup.onConfirm;
    setPopup((p) => ({ ...p, visible: false, onConfirm: undefined }));
    cb?.();
  };

  const onSelectSlot = (slot: AvailabilitySlot) => {
    if (slot.status !== "available") return;
    setSelectedSlot(slot);
  };

  const goToConfirm = () => {
    if (!selectedSlot) {
      showPopup("error", "Select a slot", "Pick an available date and time first.");
      return;
    }
    setStep(2);
  };

  const confirmBooking = async () => {
    const auth = await getAuth();
    if (!auth.token) {
      showPopup("info", "Sign in required", "Please sign in to book a service.", () =>
        router.push("/login")
      );
      return;
    }
    if (!selectedSlot || !params.serviceId) return;

    setBooking(true);
    try {
      await bookingsApi.createBooking({
        service: Number(params.serviceId),
        slot_id: selectedSlot.id,
      });
      showPopup(
        "success",
        "Booking confirmed",
        "Your booking request is now pending. Track status in My Account → dashboard.",
        () => router.replace("/dashboard")
      );
      setSelectedSlot(null);
      loadSlots();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        showPopup("info", "Session expired", "Please sign in again to confirm your booking.", () =>
          router.push("/login")
        );
        return;
      }
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        showPopup("error", "Booking not allowed", getApiErrorMessage(err, "You cannot book this listing."));
        return;
      }
      showPopup("error", "Booking failed", getApiErrorMessage(err, "Try another slot."));
      await loadSlots();
    } finally {
      setBooking(false);
    }
  };

  if (missingParams) {
    return (
      <View style={styles.center}>
        <Text style={styles.errTitle}>Booking unavailable</Text>
        <Text style={styles.errText}>Open a service and tap Continue to book.</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.replace("/")}>
          <Text style={styles.btnText}>Browse services</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Animated.View entering={FadeInDown.duration(400)}>
          <View style={styles.steps}>
            <StepPill n={1} label="Pick slot" active={step >= 1} done={step > 1} />
            <View style={styles.stepLine} />
            <StepPill n={2} label="Confirm" active={step >= 2} done={false} />
          </View>

          <View style={styles.summary}>
            <Text style={styles.title}>{params.title}</Text>
            <Text style={styles.meta}>Provider: {params.provider}</Text>
            {params.price ? (
              <Text style={styles.price}>Rs {priceNum.toFixed(0)}</Text>
            ) : null}
          </View>

          {step === 1 ? (
            <>
              <Text style={styles.h2}>Choose date & time</Text>
              <Text style={styles.hint}>Green slots are available for booking.</Text>
              {loading ? (
                <ActivityIndicator color={PRIMARY} style={{ marginVertical: 24 }} />
              ) : (
                <BookingCalendar
                  month={month}
                  slots={slots}
                  selectedDate={selectedDate}
                  onSelectDate={(d) => {
                    setSelectedDate(d);
                    setSelectedSlot(null);
                  }}
                  onChangeMonth={(d) =>
                    setMonth(new Date(month.getFullYear(), month.getMonth() + d, 1))
                  }
                onToggleSlot={onSelectSlot}
                selectedSlotId={selectedSlot?.id}
                bookingMode
                />
              )}
              {selectedSlot ? (
                <View style={styles.selected}>
                  <Text style={styles.selectedText}>
                    {selectedSlot.date} · {selectedSlot.start_time.slice(0, 5)} –{" "}
                    {selectedSlot.end_time.slice(0, 5)}
                  </Text>
                </View>
              ) : null}
            </>
          ) : (
            <>
              <Text style={styles.h2}>Review & confirm</Text>
              <View style={styles.reviewCard}>
                <Row label="Service" value={params.title || ""} />
                <Row label="Provider" value={params.provider || ""} />
                <Row
                  label="Date & time"
                  value={
                    selectedSlot
                      ? `${selectedSlot.date} ${selectedSlot.start_time.slice(0, 5)}`
                      : "—"
                  }
                />
                <Row label="Total" value={`Rs ${priceNum.toFixed(0)}`} bold />
              </View>
              <TouchableOpacity style={styles.backLink} onPress={() => setStep(1)}>
                <Text style={styles.backLinkText}>← Change slot</Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      </ScrollView>

      <View style={styles.footer}>
        {step === 1 ? (
          <TouchableOpacity
            style={[styles.btn, !selectedSlot && styles.btnDisabled]}
            disabled={!selectedSlot}
            onPress={goToConfirm}
          >
            <Text style={styles.btnText}>Continue to review</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.btn, booking && styles.btnDisabled]}
            disabled={booking}
            onPress={confirmBooking}
          >
            {booking ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Confirm booking</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      <FeedbackModal
        visible={popup.visible}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        onClose={closePopup}
        confirmLabel={popup.type === "success" ? "View dashboard" : "OK"}
      />
    </View>
  );
}

function StepPill({
  n,
  label,
  active,
  done,
}: {
  n: number;
  label: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <View style={styles.pillWrap}>
      <View style={[styles.pill, active && styles.pillActive, done && styles.pillDone]}>
        <Text style={[styles.pillNum, active && styles.pillNumActive]}>{done ? "✓" : n}</Text>
      </View>
      <Text style={styles.pillLabel}>{label}</Text>
    </View>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, bold && styles.rowBold]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BACKGROUND },
  content: { padding: 16, paddingBottom: 24 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: BACKGROUND,
  },
  errTitle: { fontSize: 20, fontWeight: "700", color: TEXT, marginBottom: 8 },
  errText: { color: TEXT_MUTED, textAlign: "center", marginBottom: 20 },
  steps: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  stepLine: { flex: 1, height: 2, backgroundColor: BORDER, marginHorizontal: 8 },
  pillWrap: { alignItems: "center", width: 72 },
  pill: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: TAG_BG,
    borderWidth: 2,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  pillActive: { borderColor: PRIMARY, backgroundColor: PRIMARY_LIGHT },
  pillDone: { backgroundColor: SUCCESS, borderColor: SUCCESS },
  pillNum: { fontWeight: "800", color: TEXT_MUTED, fontSize: 14 },
  pillNumActive: { color: PRIMARY },
  pillLabel: { fontSize: 11, color: TEXT_MUTED, marginTop: 6, fontWeight: "600" },
  summary: {
    backgroundColor: CARD,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 20,
  },
  title: { fontSize: 18, fontWeight: "700", color: TEXT },
  meta: { color: TEXT_MUTED, marginTop: 6, fontSize: 14 },
  price: { fontSize: 22, fontWeight: "800", color: TEXT, marginTop: 10 },
  h2: { fontSize: 17, fontWeight: "700", color: TEXT, marginBottom: 6 },
  hint: { color: TEXT_MUTED, marginBottom: 12, fontSize: 13 },
  selected: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#ECFDF5",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: SUCCESS,
  },
  selectedText: { color: TEXT, fontWeight: "600" },
  reviewCard: {
    backgroundColor: CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    marginTop: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  rowLabel: { color: TEXT_MUTED, fontSize: 14 },
  rowValue: { color: TEXT, fontSize: 14, fontWeight: "600", maxWidth: "60%", textAlign: "right" },
  rowBold: { fontSize: 16, fontWeight: "800" },
  backLink: { marginTop: 16 },
  backLinkText: { color: PRIMARY, fontWeight: "700" },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderColor: BORDER,
    backgroundColor: CARD,
  },
  btn: {
    backgroundColor: PRIMARY,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
