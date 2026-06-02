import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { ReviewItem } from "../services/api/reviewsApi";
import { CARD, TEXT, TEXT_MUTED, BORDER, STAR } from "../theme/colors";

type Props = { reviews: ReviewItem[] };

function Stars({ rating }: { rating: number }) {
  return (
    <Text style={styles.stars}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Text key={i} style={{ color: i <= rating ? STAR : BORDER }}>
          ★
        </Text>
      ))}
    </Text>
  );
}

export default function ReviewList({ reviews }: Props) {
  if (reviews.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No reviews yet. Be the first to book!</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {reviews.map((r) => (
        <View key={r.id} style={styles.item}>
          <View style={styles.head}>
            <View style={styles.avatar}>
              <Text style={styles.avatarLetter}>{r.customer_name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{r.customer_name}</Text>
              <Stars rating={r.rating} />
            </View>
            <Text style={styles.date}>{r.created_at.slice(0, 10)}</Text>
          </View>
          {r.comment ? <Text style={styles.comment}>{r.comment}</Text> : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  empty: { padding: 20, backgroundColor: CARD, borderRadius: 8, borderWidth: 1, borderColor: BORDER },
  emptyText: { color: TEXT_MUTED, textAlign: "center" },
  item: {
    backgroundColor: CARD,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
  },
  head: { flexDirection: "row", alignItems: "flex-start", marginBottom: 8 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E8E8E8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  avatarLetter: { fontWeight: "700", color: TEXT },
  name: { fontWeight: "700", color: TEXT, fontSize: 14 },
  stars: { fontSize: 12, marginTop: 2 },
  date: { fontSize: 11, color: TEXT_MUTED },
  comment: { fontSize: 14, color: TEXT, lineHeight: 21 },
});
