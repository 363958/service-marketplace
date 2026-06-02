import { api } from "./client";

export type AvailabilitySlot = {
  id: number;
  provider: number;
  service: number | null;
  date: string;
  start_time: string;
  end_time: string;
  status: "available" | "booked" | "blocked";
  booking: number | null;
};

export type BookingItem = {
  id: number;
  service: number;
  service_title?: string;
  status: string;
  booking_time: string | null;
  can_cancel?: boolean;
};

export const bookingsApi = {
  listAvailability: (params: {
    provider?: number;
    service?: number;
    month: string;
  }) =>
    api
      .get<AvailabilitySlot[]>("bookings/availability/", { params })
      .then((r) => (Array.isArray(r.data) ? r.data : [])),

  createAvailability: (data: {
    service: number;
    date: string;
    start_time?: string;
    end_time?: string;
    status?: string;
  }) => api.post<AvailabilitySlot>("bookings/availability/", data),

  toggleBlock: (slotId: number) =>
    api.post<AvailabilitySlot>(`bookings/availability/${slotId}/toggle_block/`),

  createBooking: (data: { service: number; slot_id: number; notes?: string }) =>
    api.post<BookingItem>("bookings/", data),

  acceptBooking: (bookingId: number) =>
    api.post<{ message: string; booking_id: number; status: string }>(
      `bookings/${bookingId}/accept/`
    ),

  rejectBooking: (bookingId: number) =>
    api.post<{ message: string; booking_id: number; status: string }>(
      `bookings/${bookingId}/reject/`
    ),

  cancelBooking: (bookingId: number) =>
    api.post(`bookings/${bookingId}/cancel/`),

  listBookings: () =>
    api.get<BookingItem[]>("bookings/").then((r) => (Array.isArray(r.data) ? r.data : [])),
};
