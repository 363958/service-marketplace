import React from "react";

import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

import { Image } from "expo-image";

import Animated, { FadeInDown } from "react-native-reanimated";

import type { ServiceItem } from "../services/api/servicesApi";

import { CARD, TEXT, TEXT_MUTED, BORDER, STAR, PRIMARY, TAG_BG } from "../theme/colors";



type Props = {

  service: ServiceItem;

  onPress: () => void;

  index?: number;

};



export default function GigCard({ service, onPress, index = 0 }: Props) {

  const img = service.images?.[0]?.image_url;

  const rating = service.avg_rating ?? 0;

  const count = service.review_count ?? 0;



  return (

    <Animated.View entering={FadeInDown.delay(index * 45).duration(350)}>

      <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.94}>

        {img ? (

          <Image source={{ uri: img }} style={styles.image} contentFit="cover" />

        ) : (

          <View style={styles.noPhoto}>

            <Text style={styles.noPhotoText}>No photo uploaded</Text>

          </View>

        )}

        <View style={styles.body}>

          <View style={styles.sellerRow}>

            <View style={styles.avatar}>

              <Text style={styles.avatarText}>

                {service.provider_name.charAt(0).toUpperCase()}

              </Text>

            </View>

            <Text style={styles.seller} numberOfLines={1}>

              {service.provider_name}

              {service.provider_verified ? " ✓" : ""}

            </Text>

          </View>

          <Text style={styles.title} numberOfLines={2}>

            {service.title}

          </Text>

          <View style={styles.ratingRow}>

            <Text style={styles.star}>★</Text>

            <Text style={styles.rating}>{rating > 0 ? rating.toFixed(1) : "New"}</Text>

            {count > 0 ? <Text style={styles.count}>({count})</Text> : null}

          </View>

          {service.distance_km != null ? (

            <Text style={styles.dist}>{service.distance_km} km · {service.location}</Text>

          ) : (

            <Text style={styles.dist}>{service.location}</Text>

          )}

          <View style={styles.footer}>

            <Text style={styles.from}>From</Text>

            <Text style={styles.price}> Rs {parseFloat(service.price).toFixed(0)}</Text>

          </View>

        </View>

      </TouchableOpacity>

    </Animated.View>

  );

}



const styles = StyleSheet.create({

  card: {

    backgroundColor: CARD,

    borderRadius: 12,

    marginBottom: 12,

    borderWidth: 1,

    borderColor: BORDER,

    overflow: "hidden",

  },

  image: { width: "100%", height: 168, backgroundColor: TAG_BG },

  noPhoto: {

    width: "100%",

    height: 168,

    backgroundColor: TAG_BG,

    alignItems: "center",

    justifyContent: "center",

  },

  noPhotoText: { color: TEXT_MUTED, fontSize: 13, fontWeight: "500" },

  body: { padding: 14 },

  sellerRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },

  avatar: {

    width: 28,

    height: 28,

    borderRadius: 14,

    backgroundColor: PRIMARY,

    alignItems: "center",

    justifyContent: "center",

    marginRight: 8,

  },

  avatarText: { color: "#fff", fontWeight: "700", fontSize: 12 },

  seller: { flex: 1, fontSize: 13, fontWeight: "600", color: TEXT },

  title: { fontSize: 15, fontWeight: "600", color: TEXT, lineHeight: 20, marginBottom: 8 },

  ratingRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },

  star: { color: STAR, fontSize: 14, marginRight: 4 },

  rating: { fontWeight: "700", color: TEXT, fontSize: 13 },

  count: { color: TEXT_MUTED, fontSize: 12, marginLeft: 4 },

  dist: { fontSize: 12, color: TEXT_MUTED, marginBottom: 10 },

  footer: { flexDirection: "row", alignItems: "baseline" },

  from: { fontSize: 12, color: TEXT_MUTED, marginRight: 4 },

  price: { fontSize: 18, fontWeight: "800", color: TEXT },

});

