import React from "react";

import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

import GigCard from "./GigCard";

import ServiceListSkeleton from "./ServiceListSkeleton";

import type { ServiceItem } from "../services/api/servicesApi";

import { PRIMARY, TEXT, TEXT_MUTED, CARD, BORDER } from "../theme/colors";



type Props = {

  services: ServiceItem[];

  loading: boolean;

  error: string | null;

  searchQuery: string;

  onBook: (service: ServiceItem) => void;

  onRetry: () => void;

  title?: string;

};



export default function ServiceListing({

  services,

  loading,

  error,

  searchQuery,

  onBook,

  onRetry,

  title = "Services you may like",

}: Props) {

  if (loading) {

    return (

      <View style={styles.outer}>

        <ServiceListSkeleton />

      </View>

    );

  }



  if (error && services.length === 0) {

    return (

      <View style={styles.outer}>

        <View style={styles.container}>

          <Text style={styles.emptyText}>{error}</Text>

          <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>

            <Text style={styles.retryText}>Try again</Text>

          </TouchableOpacity>

        </View>

      </View>

    );

  }



  if (services.length === 0) {

    return (

      <View style={styles.outer}>

        <View style={styles.container}>

          <Text style={styles.emptyTitle}>No services found</Text>

          <Text style={styles.emptyText}>

            {searchQuery.trim()

              ? `No results for "${searchQuery}". Try another keyword or city.`

              : "No listings in this area yet. Pull to refresh."}

          </Text>

        </View>

      </View>

    );

  }



  return (

    <View style={styles.outer}>

      <View style={styles.header}>

        <Text style={styles.sectionTitle}>

          {title} ({services.length})

        </Text>

        <Text style={styles.sortHint}>Sorted by nearest location</Text>

      </View>

      <View style={styles.container}>

        {services.map((item, index) => (

          <GigCard

            key={item.id}

            service={item}

            onPress={() => onBook(item)}

            index={index}

          />

        ))}

      </View>

    </View>

  );

}



const styles = StyleSheet.create({

  outer: { paddingHorizontal: 16, marginTop: 20, paddingBottom: 8 },

  header: { marginBottom: 12 },

  sectionTitle: { fontSize: 18, fontWeight: "800", color: TEXT, marginBottom: 4 },

  sortHint: { fontSize: 13, color: TEXT_MUTED },

  container: {

    backgroundColor: CARD,

    borderRadius: 12,

    borderWidth: 1,

    borderColor: BORDER,

    padding: 12,

  },

  emptyTitle: { fontSize: 17, fontWeight: "700", color: TEXT, marginBottom: 8, textAlign: "center" },

  emptyText: { color: TEXT_MUTED, textAlign: "center", lineHeight: 22, padding: 8 },

  retryBtn: {

    marginTop: 12,

    backgroundColor: PRIMARY,

    paddingHorizontal: 20,

    paddingVertical: 12,

    borderRadius: 8,

    alignSelf: "center",

  },

  retryText: { color: "#fff", fontWeight: "700" },

});

