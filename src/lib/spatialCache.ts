/**
 * Spatial LRU Cache for GN Division and DS Division data.
 * Prevents re-downloading data for already-visited viewport tiles.
 * Max 200 entries — oldest entries evicted when limit exceeded.
 */

export interface GNDivision {
  id: string;
  name: string;
  nameSi?: string;
  lat: number;
  lng: number;
  adminLevel: 8 | 9 | 10; // 8=DS, 9=intermediate, 10=GN
  districtId?: string;
  dsName?: string;
}

export interface DSDivision {
  id: string;
  name: string;
  lat: number;
  lng: number;
  districtId: string;
  gnCount?: number;
}

export interface ViewportBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

// Tile size in degrees: 0.05° ≈ 5.5 km
const TILE_SIZE_DEG = 0.05;
const MAX_CACHE_ENTRIES = 200;

type CacheEntry<T> = {
  data: T;
  timestamp: number;
  hits: number;
};

class SpatialLRUCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxEntries: number;

  constructor(maxEntries = MAX_CACHE_ENTRIES) {
    this.maxEntries = maxEntries;
  }

  /** Build a tile key from lat/lng tile indices */
  private tileKey(tileLat: number, tileLng: number): string {
    return `${tileLat.toFixed(4)}:${tileLng.toFixed(4)}`;
  }

  /** Get which tile a lat/lng falls into */
  latLngToTile(lat: number, lng: number): { tileLat: number; tileLng: number } {
    return {
      tileLat: Math.floor(lat / TILE_SIZE_DEG) * TILE_SIZE_DEG,
      tileLng: Math.floor(lng / TILE_SIZE_DEG) * TILE_SIZE_DEG,
    };
  }

  /** Get all tile keys that a bounding box overlaps */
  getBoundsKeys(bounds: ViewportBounds): string[] {
    const keys: string[] = [];
    let lat = Math.floor(bounds.minLat / TILE_SIZE_DEG) * TILE_SIZE_DEG;
    while (lat <= bounds.maxLat + TILE_SIZE_DEG) {
      let lng = Math.floor(bounds.minLng / TILE_SIZE_DEG) * TILE_SIZE_DEG;
      while (lng <= bounds.maxLng + TILE_SIZE_DEG) {
        keys.push(this.tileKey(lat, lng));
        lng += TILE_SIZE_DEG;
      }
      lat += TILE_SIZE_DEG;
    }
    return keys;
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    entry.hits++;
    entry.timestamp = Date.now();
    return entry.data;
  }

  set(key: string, data: T): void {
    if (this.cache.size >= this.maxEntries) {
      // Evict least recently used entry
      let oldest: string | undefined;
      let oldestTime = Infinity;
      for (const [k, v] of this.cache) {
        if (v.timestamp < oldestTime) {
          oldestTime = v.timestamp;
          oldest = k;
        }
      }
      if (oldest) this.cache.delete(oldest);
    }
    this.cache.set(key, { data, timestamp: Date.now(), hits: 1 });
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

// Singleton caches (module-level, persists across renders)
export const gnDivisionCache = new SpatialLRUCache<GNDivision[]>();
export const dsWeatherCache = new SpatialLRUCache<Record<string, number>>();

/** Get tiles not yet cached for a given bounds */
export function getUncachedTiles(bounds: ViewportBounds): string[] {
  const allKeys = gnDivisionCache.getBoundsKeys(bounds);
  return allKeys.filter((key) => !gnDivisionCache.has(key));
}

/** Get all cached GN divisions visible in bounds */
export function getCachedGNDivisionsInBounds(bounds: ViewportBounds): GNDivision[] {
  const allKeys = gnDivisionCache.getBoundsKeys(bounds);
  const result: GNDivision[] = [];
  for (const key of allKeys) {
    const data = gnDivisionCache.get(key);
    if (data) result.push(...data);
  }
  // Deduplicate by id
  const seen = new Set<string>();
  return result.filter((gn) => {
    if (seen.has(gn.id)) return false;
    seen.add(gn.id);
    return true;
  });
}

/** Convert SVG pixel coordinates to approximate lat/lng (Sri Lanka bounding box mapping) */
export function svgToLatLng(
  svgX: number,
  svgY: number,
  svgWidth = 752,
  svgHeight = 1050
): { lat: number; lng: number } {
  // Sri Lanka bounding box: lat 5.9°N–9.9°N, lng 79.5°E–82.0°E
  const SL_MIN_LAT = 5.9;
  const SL_MAX_LAT = 9.9;
  const SL_MIN_LNG = 79.5;
  const SL_MAX_LNG = 82.0;

  const lng = SL_MIN_LNG + (svgX / svgWidth) * (SL_MAX_LNG - SL_MIN_LNG);
  const lat = SL_MAX_LAT - (svgY / svgHeight) * (SL_MAX_LAT - SL_MIN_LAT);
  return { lat, lng };
}

/** Convert lat/lng back to SVG coordinates */
export function latLngToSvg(
  lat: number,
  lng: number,
  svgWidth = 752,
  svgHeight = 1050
): { x: number; y: number } {
  const SL_MIN_LAT = 5.9;
  const SL_MAX_LAT = 9.9;
  const SL_MIN_LNG = 79.5;
  const SL_MAX_LNG = 82.0;

  const x = ((lng - SL_MIN_LNG) / (SL_MAX_LNG - SL_MIN_LNG)) * svgWidth;
  const y = ((SL_MAX_LAT - lat) / (SL_MAX_LAT - SL_MIN_LAT)) * svgHeight;
  return { x, y };
}

/** Distance between two lat/lng points in kilometers (Haversine) */
export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
