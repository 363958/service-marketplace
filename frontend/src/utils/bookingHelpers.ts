export function canCancelBooking(
  bookingTime: string | null | undefined,
  canCancelFromApi?: boolean
): boolean {
  if (canCancelFromApi === false) return false;
  if (!bookingTime) return true;
  const appointment = new Date(bookingTime).getTime();
  const cutoff = Date.now() + 24 * 60 * 60 * 1000;
  return appointment > cutoff;
}

export function formatSlotTime(start: string, end: string): string {
  return `${start.slice(0, 5)} – ${end.slice(0, 5)}`;
}

export const TIME_PRESETS = [
  { label: "9–11 AM", start: "09:00", end: "11:00" },
  { label: "11 AM–1 PM", start: "11:00", end: "13:00" },
  { label: "2–4 PM", start: "14:00", end: "16:00" },
  { label: "4–6 PM", start: "16:00", end: "18:00" },
];
