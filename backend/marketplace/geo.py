import math

# Kathmandu Valley area centers (lat, lng)
CITY_COORDS = {
    "kathmandu": (27.7172, 85.3240),
    "lalitpur": (27.6588, 85.3247),
    "bhaktapur": (27.6710, 85.4298),
    "pokhara": (28.2096, 83.9856),
}


def coords_for_location(location: str) -> tuple[float, float]:
    loc = (location or "").lower()
    for city, coords in CITY_COORDS.items():
        if city in loc:
            return coords
    return CITY_COORDS["kathmandu"]


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(p1) * math.cos(p2) * math.sin(dlon / 2) ** 2
    )
    return r * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
