export const SERVICE_CITIES = [
  "Kathmandu",
  "Lalitpur",
  "Bhaktapur",
  "Pokhara",
] as const;

export type ServiceCity = (typeof SERVICE_CITIES)[number];

export const CITY_COORDS: Record<ServiceCity, { lat: number; lng: number }> = {
  Kathmandu: { lat: 27.7172, lng: 85.324 },
  Lalitpur: { lat: 27.6588, lng: 85.3247 },
  Bhaktapur: { lat: 27.671, lng: 85.4298 },
  Pokhara: { lat: 28.2096, lng: 83.9856 },
};

export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const r = 6371;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dlat = ((lat2 - lat1) * Math.PI) / 180;
  const dlon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dlat / 2) ** 2 +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dlon / 2) ** 2;
  return r * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** @deprecated use SERVICE_CITIES */
export const VALLEY_CITIES = SERVICE_CITIES;
export type ValleyCity = ServiceCity;
