const latitude = Number(process.env.OFFICE_LATITUDE ?? 13.0827);
const longitude = Number(process.env.OFFICE_LONGITUDE ?? 80.2707);
const radiusMeters = Number(process.env.OFFICE_RADIUS_METERS ?? 200);

if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !Number.isFinite(radiusMeters) || radiusMeters <= 0) {
  throw new Error("Invalid office geofence configuration. Check OFFICE_LATITUDE, OFFICE_LONGITUDE and OFFICE_RADIUS_METERS.");
}

export const OFFICE_LOCATION = Object.freeze({ latitude, longitude, radiusMeters });

export function getDistanceInMeters(lat1, lon1, lat2, lon2) {
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const earthRadius = 6371000;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function isInsideOffice(latitudeValue, longitudeValue) {
  const distance = getDistanceInMeters(latitude, longitude, latitudeValue, longitudeValue);
  return { allowed: distance <= radiusMeters, distance: Math.round(distance), radiusMeters };
}
