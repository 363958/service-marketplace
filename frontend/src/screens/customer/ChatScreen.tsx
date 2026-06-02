import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { chatsApi, type ChatMessage, type ChatRoom } from "../../services/api/chatsApi";
import { getApiErrorMessage } from "../../services/api/client";
import { getAuth } from "../../auth/auth";
import { resolveMediaUrl } from "../../config/api";
import FeedbackModal, { type FeedbackType } from "../../components/FeedbackModal";
import {
  BACKGROUND,
  CARD,
  TEXT,
  TEXT_MUTED,
  BORDER,
  PRIMARY,
  PRIMARY_LIGHT,
} from "../../theme/colors";

export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { roomId, bookingId } = useLocalSearchParams<{
    roomId?: string;
    bookingId?: string;
  }>();

  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [inputText, setInputText] = useState("");
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [popup, setPopup] = useState({
    visible: false,
    type: "info" as FeedbackType,
    title: "",
    message: "",
  });

  const flatListRef = useRef<FlatList>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load current user ID
  useEffect(() => {
    (async () => {
      const auth = await getAuth();
      if (!auth.token) {
        router.replace("/login");
        return;
      }
      // Fetch user ID from the me endpoint
      try {
        const { userApi } = await import("../../services/api/userApi");
        const me = await userApi.me();
        setCurrentUserId(me.id);
      } catch {
        router.replace("/login");
      }
    })();
  }, [router]);

  // Load room info
  const loadRoom = useCallback(async () => {
    try {
      if (roomId) {
        const rooms = await chatsApi.listRooms();
        const found = rooms.find((r) => r.id === Number(roomId));
        if (found) setRoom(found);
      } else if (bookingId) {
        const r = await chatsApi.roomForBooking(Number(bookingId));
        setRoom(r);
      }
    } catch (err) {
      setPopup({
        visible: true,
        type: "error",
        title: "Error",
        message: getApiErrorMessage(err, "Could not load chat room."),
      });
    } finally {
      setLoading(false);
    }
  }, [roomId, bookingId]);

  // Load messages
  const loadMessages = useCallback(async () => {
    if (!room) return;
    try {
      const msgs = await chatsApi.getMessages(room.id);
      setMessages(msgs);
    } catch {
      // Silently fail on poll - user will see last known messages
    }
  }, [room]);

  // Initial load
  useEffect(() => {
    loadRoom();
  }, [loadRoom]);

  // Load messages once room is set, then poll every 3 seconds
  useEffect(() => {
    if (!room) return;
    loadMessages();
    pollRef.current = setInterval(loadMessages, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [room, loadMessages]);

  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text || !room || sending) return;
    setSending(true);
    setInputText("");
    try {
      await chatsApi.sendMessage(room.id, { text });
      await loadMessages();
    } catch (err) {
      setInputText(text);
      setPopup({
        visible: true,
        type: "error",
        title: "Send failed",
        message: getApiErrorMessage(err, "Could not send message."),
      });
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMe = item.sender === currentUserId;
    return (
      <View style={[styles.msgRow, isMe && styles.msgRowMine]}>
        {!isMe && room?.other_user_photo ? (
          <Image
            source={{ uri: resolveMediaUrl(room.other_user_photo) }}
            style={styles.msgAvatar}
          />
        ) : !isMe ? (
          <View style={[styles.msgAvatar, styles.msgAvatarPlaceholder]}>
            <Text style={styles.msgAvatarLetter}>
              {item.sender_name.charAt(0).toUpperCase()}
            </Text>
          </View>
        ) : null}
        <View style={[styles.bubble, isMe ? styles.bubbleMine : styles.bubbleOther]}>
          {item.text ? <Text style={styles.bubbleText}>{item.text}</Text> : null}
          {item.image_url ? (
            <Image
              source={{ uri: resolveMediaUrl(item.image_url) }}
              style={styles.bubbleImage}
              contentFit="cover"
            />
          ) : null}
          <Text style={styles.bubbleTime}>
            {new Date(item.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={PRIMARY} size="large" />
      </View>
    );
  }

  if (!room) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No chat room found.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
          <Text style={styles.headerBackText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          {room.other_user_photo ? (
            <Image
              source={{ uri: resolveMediaUrl(room.other_user_photo) }}
              style={styles.headerAvatar}
            />
          ) : (
            <View style={[styles.headerAvatar, styles.headerAvatarPlaceholder]}>
              <Text style={styles.headerAvatarLetter}>
                {room.other_user_name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.headerName}>{room.other_user_name}</Text>
            <Text style={styles.headerService}>{room.service_title}</Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderMessage}
        contentContainerStyle={styles.msgList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>No messages yet. Say hello!</Text>
          </View>
        }
      />

      {/* Input */}
      <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor={TEXT_MUTED}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={2000}
          onSubmitEditing={sendMessage}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!inputText.trim() || sending) && styles.sendBtnDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.sendBtnText}>Send</Text>
          )}
        </TouchableOpacity>
      </View>

      <FeedbackModal
        visible={popup.visible}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        onClose={() => setPopup((p) => ({ ...p, visible: false }))}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BACKGROUND },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  emptyWrap: { padding: 40, alignItems: "center" },
  emptyText: { color: TEXT_MUTED, fontSize: 15, textAlign: "center" },
  backBtn: { marginTop: 16, paddingHorizontal: 16, paddingVertical: 10 },
  backBtnText: { color: PRIMARY, fontWeight: "700" },

  // Header
  header: {
    backgroundColor: CARD,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerBack: { marginBottom: 8 },
  headerBackText: { color: PRIMARY, fontWeight: "600", fontSize: 15 },
  headerInfo: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerAvatar: { width: 40, height: 40, borderRadius: 20 },
  headerAvatarPlaceholder: {
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },
  headerAvatarLetter: { color: "#fff", fontWeight: "800", fontSize: 16 },
  headerName: { fontSize: 16, fontWeight: "700", color: TEXT },
  headerService: { fontSize: 13, color: TEXT_MUTED, marginTop: 2 },

  // Messages
  msgList: { padding: 16, paddingBottom: 8 },
  msgRow: { flexDirection: "row", marginBottom: 12, alignItems: "flex-end" },
  msgRowMine: { flexDirection: "row-reverse" },
  msgAvatar: { width: 28, height: 28, borderRadius: 14, marginRight: 8 },
  msgAvatarPlaceholder: {
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },
  msgAvatarLetter: { color: "#fff", fontWeight: "700", fontSize: 11 },
  bubble: { maxWidth: "72%", padding: 12, borderRadius: 16 },
  bubbleOther: { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER },
  bubbleMine: { backgroundColor: PRIMARY_LIGHT },
  bubbleText: { color: TEXT, fontSize: 15, lineHeight: 20 },
  bubbleImage: { width: 200, height: 150, borderRadius: 8, marginTop: 6 },
  bubbleTime: { fontSize: 11, color: TEXT_MUTED, marginTop: 4, alignSelf: "flex-end" },

  // Input bar
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    backgroundColor: CARD,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    color: TEXT,
    backgroundColor: BACKGROUND,
  },
  sendBtn: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 20,
    minWidth: 72,
    alignItems: "center",
  },
  sendBtnDisabled: { opacity: 0.5 },
  sendBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
