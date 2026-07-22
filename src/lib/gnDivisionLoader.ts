/**
 * GN Division Loader — Uses Overpass API (OSM) to fetch Grama Niladhari Divisions
 * for a given viewport bounding box. Falls back to a curated static dataset
 * for key areas (Kotmale, Nuwara Eliya, Kandy) when OSM data is incomplete.
 *
 * Admin levels in Sri Lanka (OSM):
 *   admin_level=5  → Province
 *   admin_level=6  → District
 *   admin_level=8  → Divisional Secretariat (DS)
 *   admin_level=10 → Grama Niladhari Division (GN)
 */

import { GNDivision, DSDivision, ViewportBounds, gnDivisionCache } from "./spatialCache";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

// ─────────────────────────────────────────────────────
// CURATED STATIC FALLBACK: Key GN-level locations
// Used when OSM data is sparse or Overpass times out
// ─────────────────────────────────────────────────────
const CURATED_GN_DIVISIONS: GNDivision[] = [
  // Kotmale / Nuwara Eliya area (user's home region)
  { id: "gn_kotmale_maswela", name: "Maswela", nameSi: "මස්වෙල", lat: 7.0428, lng: 80.595, adminLevel: 10, districtId: "LK23", dsName: "Kotmale" },
  { id: "gn_kotmale_ramboda", name: "Ramboda", nameSi: "රඹොඩ", lat: 7.0094, lng: 80.6314, adminLevel: 10, districtId: "LK23", dsName: "Kotmale" },
  { id: "gn_kotmale_narangala", name: "Narangala", nameSi: "නාරංගල", lat: 7.0582, lng: 80.6108, adminLevel: 10, districtId: "LK23", dsName: "Kotmale" },
  { id: "gn_kotmale_pussellawa", name: "Pussellawa", nameSi: "පුස්සෙල්ලාව", lat: 7.0166, lng: 80.6528, adminLevel: 10, districtId: "LK23", dsName: "Kotmale" },
  { id: "gn_kotmale_helboda", name: "Helboda", nameSi: "හෙල්බොඩ", lat: 7.0352, lng: 80.6012, adminLevel: 10, districtId: "LK23", dsName: "Kotmale" },
  { id: "gn_kotmale_talawakanda", name: "Talawakanda", nameSi: "තලාවකන්ද", lat: 7.0489, lng: 80.6142, adminLevel: 10, districtId: "LK23", dsName: "Kotmale" },
  { id: "gn_kotmale_reservoir", name: "Kotmale Reservoir", nameSi: "කොත්මලේ ජලාශය", lat: 7.0325, lng: 80.5751, adminLevel: 10, districtId: "LK23", dsName: "Kotmale" },
  { id: "gn_nuwaraeliya_town", name: "Nuwara Eliya Town", nameSi: "නුවරඑළිය නගරය", lat: 6.9497, lng: 80.7891, adminLevel: 10, districtId: "LK23", dsName: "Nuwara Eliya" },
  { id: "gn_nuwaraeliya_racecourse", name: "Racecourse Area", nameSi: "රේස්කෝස්", lat: 6.9543, lng: 80.7842, adminLevel: 10, districtId: "LK23", dsName: "Nuwara Eliya" },
  { id: "gn_nuwaraeliya_greenlands", name: "Greenlands", nameSi: "ග්‍රීන්ලෑන්ඩ්ස්", lat: 6.9612, lng: 80.7901, adminLevel: 10, districtId: "LK23", dsName: "Nuwara Eliya" },
  { id: "gn_nuwaraeliya_lake", name: "Lake Gregory Area", nameSi: "ලේක් ග්‍රෙගරි", lat: 6.9471, lng: 80.7960, adminLevel: 10, districtId: "LK23", dsName: "Nuwara Eliya" },
  { id: "gn_hatton_town", name: "Hatton Town", nameSi: "හැටන් නගරය", lat: 6.8928, lng: 80.5971, adminLevel: 10, districtId: "LK23", dsName: "Hatton-Dickoya" },
  { id: "gn_hatton_dickoya", name: "Dickoya", nameSi: "ඩිකෝය", lat: 6.8806, lng: 80.6128, adminLevel: 10, districtId: "LK23", dsName: "Hatton-Dickoya" },
  { id: "gn_talawakele_town", name: "Talawakele", nameSi: "තලවකැලේ", lat: 6.9372, lng: 80.6558, adminLevel: 10, districtId: "LK23", dsName: "Kotmale" },
  { id: "gn_maskeliya_town", name: "Maskeliya", nameSi: "මස්කෙළිය", lat: 6.8344, lng: 80.5847, adminLevel: 10, districtId: "LK23", dsName: "Maskeliya" },
  { id: "gn_norwood", name: "Norwood", nameSi: "නෝර්වුඩ්", lat: 6.8756, lng: 80.6326, adminLevel: 10, districtId: "LK23", dsName: "Hatton-Dickoya" },
  { id: "gn_ambewela", name: "Ambewela", nameSi: "අඹේවෙල", lat: 6.8975, lng: 80.8042, adminLevel: 10, districtId: "LK23", dsName: "Nuwara Eliya" },
  { id: "gn_pidurutalagala", name: "Pidurutalagala (Peak)", nameSi: "පිදුරුතලාගල", lat: 6.9999, lng: 80.7732, adminLevel: 10, districtId: "LK23", dsName: "Nuwara Eliya" },
  // Kandy area
  { id: "gn_kandy_city", name: "Kandy City", nameSi: "මහනුවර", lat: 7.2906, lng: 80.6337, adminLevel: 10, districtId: "LK21", dsName: "Kandy Four Gravets" },
  { id: "gn_kandy_mahaiyawa", name: "Mahaiyawa", nameSi: "මහෙයාව", lat: 7.2875, lng: 80.6289, adminLevel: 10, districtId: "LK21", dsName: "Kandy Four Gravets" },
  { id: "gn_kandy_katugastota", name: "Katugastota", nameSi: "කටුගස්තොට", lat: 7.3216, lng: 80.6223, adminLevel: 10, districtId: "LK21", dsName: "Kandy" },
  { id: "gn_kandy_ankumbura", name: "Ankumbura", nameSi: "අංකුඹුර", lat: 7.3528, lng: 80.5978, adminLevel: 10, districtId: "LK21", dsName: "Ududumbara" },
  { id: "gn_gampola_town", name: "Gampola Town", nameSi: "ගම්පොල නගරය", lat: 7.1646, lng: 80.5694, adminLevel: 10, districtId: "LK21", dsName: "Gampola" },
  { id: "gn_gampola_dolosbage", name: "Dolosbage", nameSi: "දොළොස්බාගේ", lat: 7.0754, lng: 80.4908, adminLevel: 10, districtId: "LK21", dsName: "Gampola" },
  { id: "gn_digana_town", name: "Digana", nameSi: "දිගන", lat: 7.3061, lng: 80.7511, adminLevel: 10, districtId: "LK21", dsName: "Minipe" },
  { id: "gn_peradeniya_uniarea", name: "Peradeniya University", nameSi: "පේරාදෙණිය විශ්ව.", lat: 7.2662, lng: 80.5977, adminLevel: 10, districtId: "LK21", dsName: "Harispattuwa" },
  { id: "gn_nawalapitiya_town", name: "Nawalapitiya Town", nameSi: "නාවලපිටිය නගරය", lat: 7.0506, lng: 80.5367, adminLevel: 10, districtId: "LK21", dsName: "Nawalapitiya" },
  // Colombo area
  { id: "gn_colombo_fort", name: "Colombo Fort", nameSi: "කොළඹ කොටුව", lat: 6.9344, lng: 79.8428, adminLevel: 10, districtId: "LK11", dsName: "Colombo" },
  { id: "gn_colombo_pettah", name: "Pettah", nameSi: "පිටකොටුව", lat: 6.9388, lng: 79.8531, adminLevel: 10, districtId: "LK11", dsName: "Colombo" },
  { id: "gn_colombo_kollupitiya", name: "Kollupitiya", nameSi: "කොල්ලුපිටිය", lat: 6.9168, lng: 79.8493, adminLevel: 10, districtId: "LK11", dsName: "Colombo" },
  { id: "gn_colombo_bambalapitiya", name: "Bambalapitiya", nameSi: "බම්බලපිටිය", lat: 6.8926, lng: 79.8568, adminLevel: 10, districtId: "LK11", dsName: "Colombo" },
  { id: "gn_colombo_wellawatta", name: "Wellawatta", nameSi: "වෙල්ලවත්ත", lat: 6.8739, lng: 79.8645, adminLevel: 10, districtId: "LK11", dsName: "Dehiwala" },
  { id: "gn_dehiwala_main", name: "Dehiwala", nameSi: "දෙහිවල", lat: 6.8511, lng: 79.8659, adminLevel: 10, districtId: "LK11", dsName: "Dehiwala" },
  { id: "gn_maharagama_town", name: "Maharagama Town", nameSi: "මහරගම", lat: 6.8480, lng: 79.9265, adminLevel: 10, districtId: "LK11", dsName: "Maharagama" },
  { id: "gn_homagama_main", name: "Homagama", nameSi: "හෝමාගම", lat: 6.8436, lng: 80.0031, adminLevel: 10, districtId: "LK11", dsName: "Homagama" },
  // Galle area
  { id: "gn_galle_fort", name: "Galle Fort", nameSi: "ගාල්ල කොටුව", lat: 6.0256, lng: 80.2170, adminLevel: 10, districtId: "LK31", dsName: "Galle" },
  { id: "gn_galle_town", name: "Galle Town", nameSi: "ගාල්ල නගරය", lat: 6.0535, lng: 80.2210, adminLevel: 10, districtId: "LK31", dsName: "Galle" },
  { id: "gn_hikkaduwa", name: "Hikkaduwa", nameSi: "හික්කඩුව", lat: 6.1394, lng: 80.1004, adminLevel: 10, districtId: "LK31", dsName: "Baddegama" },
  { id: "gn_unawatuna", name: "Unawatuna", nameSi: "උනාවටුන", lat: 6.0069, lng: 80.2500, adminLevel: 10, districtId: "LK31", dsName: "Galle" },
  // Jaffna area
  { id: "gn_jaffna_town", name: "Jaffna Town", nameSi: "යාපනය", lat: 9.6615, lng: 80.0255, adminLevel: 10, districtId: "LK41", dsName: "Jaffna" },
  { id: "gn_jaffna_nallur", name: "Nallur", nameSi: "නල්ලූර්", lat: 9.6692, lng: 80.0303, adminLevel: 10, districtId: "LK41", dsName: "Jaffna" },
  { id: "gn_jaffna_kopay", name: "Kopay", nameSi: "කෝපාය්", lat: 9.6845, lng: 80.0487, adminLevel: 10, districtId: "LK41", dsName: "Kopay" },
  { id: "gn_point_pedro", name: "Point Pedro", nameSi: "පේදුරුතුඩුව", lat: 9.8167, lng: 80.2333, adminLevel: 10, districtId: "LK41", dsName: "Vadamaradchi North" },
  // Matara
  { id: "gn_matara_town", name: "Matara Town", nameSi: "මාතර නගරය", lat: 5.9484, lng: 80.5353, adminLevel: 10, districtId: "LK32", dsName: "Matara" },
  { id: "gn_weligama", name: "Weligama", nameSi: "වෙළිගම", lat: 5.9743, lng: 80.4302, adminLevel: 10, districtId: "LK32", dsName: "Weligama" },
  // Anuradhapura
  { id: "gn_anuradhapura_town", name: "Anuradhapura Town", nameSi: "අනුරාධපුර", lat: 8.3114, lng: 80.4037, adminLevel: 10, districtId: "LK62", dsName: "Anuradhapura" },
  { id: "gn_mihintale", name: "Mihintale", nameSi: "මිහින්තලේ", lat: 8.3500, lng: 80.5097, adminLevel: 10, districtId: "LK62", dsName: "Mihintale" },
  // Polonnaruwa
  { id: "gn_polonnaruwa_town", name: "Polonnaruwa Town", nameSi: "පොළොන්නරුව", lat: 7.9397, lng: 81.0006, adminLevel: 10, districtId: "LK61", dsName: "Polonnaruwa" },
  // Trincomalee
  { id: "gn_trincomalee_town", name: "Trincomalee Town", nameSi: "තිරිකොණමලය", lat: 8.5922, lng: 81.2152, adminLevel: 10, districtId: "LK45", dsName: "Trincomalee" },
  { id: "gn_trincomalee_nilaveli", name: "Nilaveli Beach", nameSi: "නිලාවෙලි", lat: 8.7060, lng: 81.2112, adminLevel: 10, districtId: "LK45", dsName: "Trincomalee" },
  // Batticaloa
  { id: "gn_batticaloa_town", name: "Batticaloa Town", nameSi: "මඩකලපුව", lat: 7.7102, lng: 81.6924, adminLevel: 10, districtId: "LK42", dsName: "Batticaloa" },
  // Ratnapura
  { id: "gn_ratnapura_town", name: "Ratnapura Town", nameSi: "රත්නපුර", lat: 6.6828, lng: 80.3992, adminLevel: 10, districtId: "LK91", dsName: "Ratnapura" },
  { id: "gn_kuruwita", name: "Kuruwita", nameSi: "කුරුවිට", lat: 6.7139, lng: 80.3656, adminLevel: 10, districtId: "LK91", dsName: "Kuruwita" },
  // Badulla
  { id: "gn_badulla_town", name: "Badulla Town", nameSi: "බදුල්ල", lat: 6.9895, lng: 81.0558, adminLevel: 10, districtId: "LK82", dsName: "Badulla" },
  { id: "gn_ella", name: "Ella", nameSi: "එල්ල", lat: 6.8721, lng: 81.0461, adminLevel: 10, districtId: "LK82", dsName: "Hali-Ela" },
  { id: "gn_bandarawela", name: "Bandarawela", nameSi: "බණ්ඩාරවෙල", lat: 6.8294, lng: 80.9894, adminLevel: 10, districtId: "LK82", dsName: "Bandarawela" },
  { id: "gn_haputale", name: "Haputale", nameSi: "හාපුතලේ", lat: 6.7660, lng: 80.9606, adminLevel: 10, districtId: "LK82", dsName: "Haputale" },
  // Matale
  { id: "gn_matale_town", name: "Matale Town", nameSi: "මාතලේ", lat: 7.4714, lng: 80.6234, adminLevel: 10, districtId: "LK22", dsName: "Matale" },
  { id: "gn_dambulla", name: "Dambulla", nameSi: "දඹුල්ල", lat: 7.8742, lng: 80.6518, adminLevel: 10, districtId: "LK22", dsName: "Dambulla" },
];

/**
 * Fetch GN Divisions in viewport from Overpass API.
 * Falls back to curated static data if Overpass is slow or returns empty.
 */
export async function fetchGNDivisionsInViewport(
  bounds: ViewportBounds,
  signal?: AbortSignal
): Promise<GNDivision[]> {
  // Always include curated static data that falls in bounds
  const curatedInBounds = CURATED_GN_DIVISIONS.filter(
    (gn) =>
      gn.lat >= bounds.minLat &&
      gn.lat <= bounds.maxLat &&
      gn.lng >= bounds.minLng &&
      gn.lng <= bounds.maxLng
  );

  // Try Overpass API with a 6-second timeout
  try {
    const overpassQuery = `
[out:json][timeout:6];
(
  node["boundary"="administrative"]["admin_level"="10"]
    (${bounds.minLat},${bounds.minLng},${bounds.maxLat},${bounds.maxLng});
  node["place"~"village|hamlet|suburb|neighbourhood|town|city"]
    (${bounds.minLat},${bounds.minLng},${bounds.maxLat},${bounds.maxLng});
);
out body 80;`;

    const response = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(overpassQuery)}`,
      signal,
    });

    if (!response.ok) throw new Error("Overpass API error");

    const json = await response.json();
    const elements: Array<{ id: number; lat?: number; lon?: number; tags?: Record<string, string> }> =
      json.elements || [];

    const overpassGN: GNDivision[] = elements
      .filter((el) => el.lat && el.lon && el.tags?.name)
      .map((el) => ({
        id: `osm_${el.id}`,
        name: el.tags!["name:en"] || el.tags!.name || "Unknown",
        nameSi: el.tags!["name:si"] || undefined,
        lat: el.lat!,
        lng: el.lon!,
        adminLevel: 10 as const,
        districtId: undefined,
        dsName: el.tags!["is_in:district"] || el.tags!["addr:district"] || undefined,
      }));

    // Merge: curated data takes priority (deduplicate by proximity)
    const merged = [...curatedInBounds];
    const curatedPositions = curatedInBounds.map((g) => ({ lat: g.lat, lng: g.lng }));

    for (const ogn of overpassGN) {
      const tooClose = curatedPositions.some(
        (p) => Math.abs(p.lat - ogn.lat) < 0.005 && Math.abs(p.lng - ogn.lng) < 0.005
      );
      if (!tooClose) merged.push(ogn);
    }

    return merged;
  } catch {
    // Overpass failed — return curated fallback only
    return curatedInBounds;
  }
}

/**
 * Get all curated GN divisions for a specific district.
 * Used to pre-populate without any API call.
 */
export function getCuratedGNForDistrict(districtId: string): GNDivision[] {
  return CURATED_GN_DIVISIONS.filter((gn) => gn.districtId === districtId);
}

/**
 * Get all curated GN divisions (for search / listing).
 */
export function getAllCuratedGNDivisions(): GNDivision[] {
  return CURATED_GN_DIVISIONS;
}
