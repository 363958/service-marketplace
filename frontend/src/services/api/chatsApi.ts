import { api } from "./client";

export type ChatMessage = {
  id: number;
  sender: number;
  sender_name: string;
  text: string;
  image_url: string;
  is_read: boolean;
  created_at: string;
};

export type ChatRoom = {
  id: number;
  booking: number;
  customer: number;
  provider: number;
  other_user_name: string;
  other_user_photo: string;
  service_title: string;
  last_message: ChatMessage | null;
  unread_count: number;
  is_active: boolean;
  created_at: string;
};

export const chatsApi = {
  listRooms: () =>
    api.get<ChatRoom[]>("chat/rooms/").then((r) => (Array.isArray(r.data) ? r.data : [])),

  getMessages: (roomId: number) =>
    api
      .get<ChatMessage[]>(`chat/rooms/${roomId}/messages/`)
      .then((r) => (Array.isArray(r.data) ? r.data : [])),

  sendMessage: (roomId: number, data: { text?: string; image_url?: string }) =>
    api.post<ChatMessage>(`chat/rooms/${roomId}/send/`, data).then((r) => r.data),

  markRead: (roomId: number) =>
    api.post(`chat/rooms/${roomId}/mark-read/`),

  roomForBooking: (bookingId: number) =>
    api.get<ChatRoom>(`chat/booking/${bookingId}/`).then((r) => r.data),
};
