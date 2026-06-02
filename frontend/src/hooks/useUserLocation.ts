import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CITY_COORDS, type ServiceCity, SERVICE_CITIES } from "../utils/geo";

const STORAGE_CITY = "user_city";
const STORAGE_LAT = "user_lat";
const STORAGE_LNG = "user_lng";

export type UserLocationState = {
  city: ServiceCity;
  lat: number;
  lng: number;
  usingGps: boolean;
  loading: boolean;
};

export function useUserLocation() {
  const [city, setCity] = useState<ServiceCity>("Kathmandu");
  const [coords, setCoords] = useState(CITY_COORDS.Kathmandu);
  const [usingGps, setUsingGps] = useState(false);
  const [loading, setLoading] = useState(true);

  const applyCity = useCallback(async (next: ServiceCity) => {
    const c = CITY_COORDS[next];
    setCity(next);
    setCoords(c);
    setUsingGps(false);
    await AsyncStorage.multiSet([
      [STORAGE_CITY, next],
      [STORAGE_LAT, String(c.lat)],
      [STORAGE_LNG, String(c.lng)],
    ]);
  }, []);

  const detectGps = useCallback(async () => {
    try {
      const Location = await import("expo-location");
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        return false;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = pos.coords;
      setCoords({ lat: latitude, lng: longitude });
      setUsingGps(true);
      await AsyncStorage.multiSet([
        [STORAGE_LAT, String(latitude)],
        [STORAGE_LNG, String(longitude)],
      ]);
      return true;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [[, savedCity], [, savedLat], [, savedLng]] =
          await AsyncStorage.multiGet([STORAGE_CITY, STORAGE_LAT, STORAGE_LNG]);

        if (savedLat && savedLng) {
          setCoords({ lat: parseFloat(savedLat), lng: parseFloat(savedLng) });
          setUsingGps(true);
        }
        if (savedCity && SERVICE_CITIES.includes(savedCity as ServiceCity)) {
          setCity(savedCity as ServiceCity);
          if (!savedLat) {
            setCoords(CITY_COORDS[savedCity as ServiceCity]);
          }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return {
    city,
    lat: coords.lat,
    lng: coords.lng,
    usingGps,
    loading,
    setCity: applyCity,
    detectGps,
    cities: SERVICE_CITIES,
  };
}
