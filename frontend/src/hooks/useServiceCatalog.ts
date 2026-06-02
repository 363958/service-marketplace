import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { servicesApi, type ServiceItem } from "../services/api/servicesApi";

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  All: [],
  "Home Repairs": ["plumb", "pipe", "leak", "repair", "electric", "wiring", "fan"],
  Automobile: ["car", "bike", "vehicle", "auto"],
  "Tech & Digital": ["laptop", "computer", "pc", "virus", "tech", "digital"],
  "Personal Service": ["maid", "clean", "laundry", "hair"],
  "Pet Care": ["pet", "dog", "cat"],
  Professional: ["professional", "consult"],
  "Home Improvement": ["bathroom", "kitchen", "renovation", "install"],
  "Health & Wellness": ["health", "wellness", "spa"],
  Trainings: ["train", "course", "class"],
};

type Params = {
  lat: number;
  lng: number;
  city: string;
  search: string;
  category: string;
  locationReady?: boolean;
};

export function useServiceCatalog({
  lat,
  lng,
  city,
  search,
  category,
  locationReady = true,
}: Params) {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hadData = useRef(false);

  const load = useCallback(
    async (isRefresh = false) => {
      if (!locationReady) return;
      try {
        if (isRefresh) setRefreshing(true);
        else if (!hadData.current) setLoading(true);
        setError(null);
        const data = await servicesApi.list({
          lat,
          lng,
          city: city.toLowerCase(),
          search: search.trim() || undefined,
        });
        setServices(data);
        hadData.current = data.length > 0;
      } catch {
        setError("Could not load services. Check your connection and pull to refresh.");
        if (!hadData.current) setServices([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [lat, lng, city, search, locationReady]
  );

  useEffect(() => {
    if (!locationReady) return;
    const timer = setTimeout(() => load(), search ? 350 : 0);
    return () => clearTimeout(timer);
  }, [load, search, locationReady]);

  const filtered = useMemo(() => {
    if (category === "All") return services;
    const keys = CATEGORY_KEYWORDS[category] || [];
    if (keys.length === 0) return services;
    return services.filter((s) => {
      const blob = `${s.title} ${s.description}`.toLowerCase();
      return keys.some((k) => blob.includes(k));
    });
  }, [services, category]);

  return {
    services: filtered,
    totalCount: filtered.length,
    loading: loading && !hadData.current,
    refreshing,
    error,
    refresh: () => load(true),
  };
}
