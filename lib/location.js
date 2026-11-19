/**
 * lib/location.js
 *
 * Helper that returns the current "start location" for the demo.
 *
 * When Demo location is ON  → returns the sample hotel coordinates (never real location).
 * When Demo location is OFF → requests real browser geolocation (web only), only after
 *                             the user grants permission. Never saved or logged.
 *
 * Usage:
 *   const loc = await getStartLocation(db);
 *   // loc.xy   → [x, y] on the 800×900 schematic map (or null if unavailable)
 *   // loc.geo  → { lat, lng } real coordinates (or null)
 *   // loc.label → human-readable label
 */

import mapData from '../assets/cue-map-data.json';
import { Platform } from 'react-native';

// Demo hotel map position and label come from cue-map-data.json
const DEMO_HOTEL_XY = mapData.geo.demo_hotel_xy;       // [332, 1000]
const DEMO_HOTEL_LABEL = mapData.geo.demo_hotel_label; // "Demo hotel (sample)"

/**
 * Read the demo_location setting from the database.
 * Returns 'on' or 'off'.
 */
export function getDemoLocationSetting(db) {
  const row = db.getFirstSync(
    "SELECT value FROM settings WHERE key = 'demo_location'"
  );
  return row ? row.value : 'on';
}

/**
 * Write the demo_location setting to the database.
 */
export function setDemoLocationSetting(db, value) {
  db.runSync(
    "INSERT OR REPLACE INTO settings (key, value) VALUES ('demo_location', ?)",
    [value]
  );
}

/**
 * Get the current start location for the demo.
 * Returns { xy, geo, label } — never saves or logs the location.
 *
 * @param {object} db  - expo-sqlite db instance
 * @returns {Promise<{xy: number[]|null, geo: {lat:number,lng:number}|null, label: string}>}
 */
export async function getStartLocation(db) {
  const setting = getDemoLocationSetting(db);

  if (setting === 'on') {
    // Demo hotel — simulated, no real location needed
    return {
      xy: DEMO_HOTEL_XY,
      geo: null, // real geo coords not available for demo hotel without center_latlng
      label: DEMO_HOTEL_LABEL,
    };
  }

  // Real location — web only via browser geolocation API
  if (Platform.OS === 'web' && navigator?.geolocation) {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            xy: null, // can't map real coords to schematic without center_latlng
            geo: { lat: pos.coords.latitude, lng: pos.coords.longitude },
            label: 'My location',
          });
        },
        () => {
          // User denied or error — fall back to demo hotel silently
          resolve({
            xy: DEMO_HOTEL_XY,
            geo: null,
            label: DEMO_HOTEL_LABEL + ' (location unavailable)',
          });
        },
        { timeout: 8000 }
      );
    });
  }

  // Native (iOS/Android) — expo-location would go here; for now fall back
  return {
    xy: DEMO_HOTEL_XY,
    geo: null,
    label: DEMO_HOTEL_LABEL,
  };
}
