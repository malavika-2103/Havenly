// Distance and a simple, explainable commute model. Used by the seed and by validate.ts,
// so commute minutes are always consistent with the stored coordinates.

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

/** Road distance is roughly 1.35x straight-line distance in a dense lane network (calibrated on the launch area). */
export const ROAD_FACTOR = 1.35

export function commuteFor(straightKm: number) {
  const road = straightKm * ROAD_FACTOR
  return {
    distance_km: Math.round(road * 10) / 10,
    minutes_walk: Math.max(1, Math.round((road / 4.8) * 60)), // 4.8 km/h walking
    minutes_auto: Math.max(3, Math.round((road / 18) * 60 + 3)), // 18 km/h in traffic + 3 min to find an auto
    minutes_bus: Math.max(8, Math.round((road / 14) * 60 + 10)), // 14 km/h + ~10 min walk and wait
  }
}
