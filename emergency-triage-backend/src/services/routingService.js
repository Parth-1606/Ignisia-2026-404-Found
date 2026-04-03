/**
 * ROUTING SERVICE
 * 
 * Estimates ambulance transit time between two coordinates.
 * 
 * Primary:  OpenRouteService API (free, no billing required)
 * Fallback: Haversine formula with average ambulance speed estimate
 */

const AVERAGE_AMBULANCE_SPEED_KMH = 60; // Urban speed with lights/sirens

/**
 * Haversine formula — straight-line distance between two lat/lng points
 * @returns distance in kilometers
 */
const haversineDistance = (loc1, loc2) => {
  const R = 6371; // Earth radius in km
  const dLat = toRad(loc2.latitude - loc1.latitude);
  const dLon = toRad(loc2.longitude - loc1.longitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(loc1.latitude)) *
    Math.cos(toRad(loc2.latitude)) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (deg) => (deg * Math.PI) / 180;

/**
 * Estimate transit time using OpenRouteService API
 * Falls back to Haversine if API is unavailable
 */
const estimateTransitTime = async (origin, destination) => {
  // Try ORS API if key is configured
  if (process.env.ORS_API_KEY && process.env.ORS_API_KEY !== 'your_openrouteservice_api_key') {
    try {
      const response = await fetch(
        'https://api.openrouteservice.org/v2/directions/driving-car',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': process.env.ORS_API_KEY,
          },
          body: JSON.stringify({
            coordinates: [
              [origin.longitude, origin.latitude],
              [destination.longitude, destination.latitude],
            ],
          }),
          signal: AbortSignal.timeout(3000), // 3 second timeout
        }
      );

      if (response.ok) {
        const data = await response.json();
        const segment = data.routes?.[0]?.segments?.[0];
        if (segment) {
          const durationSeconds = segment.duration;
          // Ambulances typically travel ~35% faster than regular traffic
          const ambulanceDuration = durationSeconds * 0.65;
          return {
            minutes: Math.round(ambulanceDuration / 60),
            distanceKm: Math.round(segment.distance / 1000 * 10) / 10,
            source: 'openrouteservice',
            route: data.routes[0],
          };
        }
      }
    } catch (err) {
      console.warn('[RoutingService] ORS API failed, using Haversine fallback:', err.message);
    }
  }

  // Fallback: Haversine + average speed estimate
  const distanceKm = haversineDistance(origin, destination);
  // Road distance is typically 1.3x straight-line distance in urban areas
  const roadDistanceKm = distanceKm * 1.3;
  const hours = roadDistanceKm / AVERAGE_AMBULANCE_SPEED_KMH;
  const minutes = Math.round(hours * 60);

  return {
    minutes: Math.max(1, minutes), // Minimum 1 minute
    distanceKm: Math.round(roadDistanceKm * 10) / 10,
    source: 'haversine_estimate',
    route: null,
  };
};

module.exports = { estimateTransitTime, haversineDistance };
