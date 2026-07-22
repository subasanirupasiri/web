export type WeatherEffectType = "sun" | "cloud" | "rain" | "thunder" | "fog";

export interface WeatherDataPoint {
  id: string;
  name: string;
  temp: number; // °C
  condition: WeatherEffectType;
  description: string;
  descriptionSi: string;
  humidity: number; // %
  windSpeed: number; // km/h
  precipitation: number; // mm
  weatherCode: number;
  isDay: boolean;
}

export interface MonthlyForecastOutlook {
  monthName: string;
  avgTemp: number;
  totalRainfall: number; // mm
  rainyDays: number; // number of rainy days in month
  dominantCondition: WeatherEffectType;
  conditionDescription: string;
  monsoonSeason: string;
}

export interface ThreeMonthOutlookData {
  locationName: string;
  monthlyOutlooks: MonthlyForecastOutlook[];
  weeklyTrends: {
    weekLabel: string;
    startDate: string;
    expectedTemp: number;
    expectedRainfall: number;
    condition: WeatherEffectType;
  }[];
}

export function parseWMOCode(code: number): {
  type: WeatherEffectType;
  description: string;
  descriptionSi: string;
} {
  switch (code) {
    case 0:
      return { type: "sun", description: "Clear Sky", descriptionSi: "පැහැදිලි අහස" };
    case 1:
      return { type: "sun", description: "Mainly Clear", descriptionSi: "බොහෝ දුරට පැහැදිලි" };
    case 2:
      return { type: "cloud", description: "Partly Cloudy", descriptionSi: "අර්ධ වශයෙන් වළාකුළු" };
    case 3:
      return { type: "cloud", description: "Overcast", descriptionSi: "වළාකුලින් බරයි" };
    case 45:
    case 48:
      return { type: "fog", description: "Misty Fog", descriptionSi: "මීදුම් සහිතයි" };
    case 51:
    case 53:
    case 55:
      return { type: "rain", description: "Light Drizzle", descriptionSi: "සිහින් පොද වැසි" };
    case 61:
    case 63:
      return { type: "rain", description: "Moderate Rain", descriptionSi: "මධ්‍යම වැසි" };
    case 65:
    case 66:
    case 67:
      return { type: "rain", description: "Heavy Rain", descriptionSi: "තද වැසි" };
    case 80:
    case 81:
    case 82:
      return { type: "rain", description: "Rain Showers", descriptionSi: "වැසි වාර කිහිපයක්" };
    case 95:
    case 96:
    case 99:
      return { type: "thunder", description: "Thunderstorm", descriptionSi: "ගගුරම් සහිත වැසි" };
    default:
      return { type: "cloud", description: "Cloudy", descriptionSi: "වළාකුළු සහිතයි" };
  }
}

// Fallback / Future Extrapolation Generator (up to +90 days into the future)
export function generateFallbackWeather(
  id: string,
  lat: number,
  lng: number,
  dateStr: string = new Date().toISOString().split("T")[0],
  hour: number = 12
): WeatherDataPoint {
  const targetDateObj = new Date(dateStr);
  const month = targetDateObj.getMonth(); // 0 = Jan, 6 = Jul, 7 = Aug, 8 = Sep, 9 = Oct

  // Deterministic seed based on location + date + hour
  const dayOffset = Math.floor(targetDateObj.getTime() / 86400000);
  const hash = Math.abs(
    id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) + dayOffset * 13 + hour * 7
  );

  // Hill country (Kotmale, Nuwara Eliya, Kandy)
  const isHighland = lat < 7.5 && lat > 6.7 && lng > 80.5 && lng < 81.2;
  const isNuwaraEliya = id.includes("LK23") || id.includes("nuwara") || id.includes("kotmale");

  let baseTemp = isNuwaraEliya ? 18 : isHighland ? 22 : 30;

  // Monthly temperature variations in Sri Lanka (Jul-Aug warmer, Dec-Jan cooler)
  if (month === 11 || month === 0 || month === 1) baseTemp -= 2.5; // Dec-Feb colder
  if (month >= 4 && month <= 7) baseTemp += 1.5; // May-Aug warmer

  const tempVar = (hash % 5) - 2;
  const temp = baseTemp + tempVar;

  // Monsoonal Weather determination for Sri Lanka:
  // May - Sep: SW Monsoon (High rain in Kotmale / Nuwara Eliya / West)
  // Oct - Nov: Inter-monsoon (Thunderstorms across island)
  // Dec - Feb: NE Monsoon (East & North rain, Central cool & mist)
  let code = 0;
  const rand = hash % 10;

  if (month >= 4 && month <= 8) {
    // South-West Monsoon (Heavy rains in Kotmale/Hill country)
    if (isHighland || isNuwaraEliya) {
      if (rand < 5) code = 61; // Moderate rain
      else if (rand < 7) code = 95; // Thunderstorm
      else if (rand < 9) code = 2; // Cloudy
      else code = 45; // Mist/fog
    } else {
      if (rand < 4) code = 0; // Sunny
      else if (rand < 7) code = 2; // Cloudy
      else code = 61; // Rain
    }
  } else if (month === 9 || month === 10) {
    // Oct-Nov Inter-monsoon thunderstorms
    if (rand < 5) code = 95; // Thunderstorm
    else if (rand < 8) code = 65; // Heavy rain
    else code = 2;
  } else {
    // Dec-Apr
    if (isNuwaraEliya) {
      if (rand < 3) code = 45; // Mountain fog
      else if (rand < 6) code = 0; // Sunny hill day
      else code = 2; // Cloudy
    } else {
      if (rand < 6) code = 0; // Clear sunny
      else code = 2; // Partly cloudy
    }
  }

  const { type, description, descriptionSi } = parseWMOCode(code);

  return {
    id,
    name: id,
    temp,
    condition: type,
    description,
    descriptionSi,
    humidity: 65 + (hash % 30),
    windSpeed: 10 + (hash % 16),
    precipitation: type === "rain" ? 3.5 + (hash % 12) : type === "thunder" ? 18 + (hash % 25) : 0,
    weatherCode: code,
    isDay: hour >= 6 && hour <= 18,
  };
}

export async function fetchBatchWeather(
  locations: { id: string; name: string; lat: number; lng: number }[],
  dateStr?: string,
  hour: number = 12
): Promise<Record<string, WeatherDataPoint>> {
  if (locations.length === 0) return {};

  const todayStr = new Date().toISOString().split("T")[0];
  const targetDate = dateStr || todayStr;
  const isPast = targetDate < todayStr;

  // Check how many days in future targetDate is
  const daysDiff = Math.round(
    (new Date(targetDate).getTime() - new Date(todayStr).getTime()) / 86400000
  );

  const lats = locations.map((l) => l.lat.toFixed(4)).join(",");
  const lngs = locations.map((l) => l.lng.toFixed(4)).join(",");

  try {
    let url = "";
    if (isPast) {
      url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lats}&longitude=${lngs}&start_date=${targetDate}&end_date=${targetDate}&hourly=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&timezone=Asia%2FColombo`;
    } else if (daysDiff <= 16) {
      url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lngs}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,is_day&hourly=temperature_2m,precipitation,weather_code,wind_speed_10m&forecast_days=16&timezone=Asia%2FColombo`;
    } else {
      // For future dates > 16 days up to 90 days, use seasonal climate extrapolation
      const mapped: Record<string, WeatherDataPoint> = {};
      locations.forEach((loc) => {
        mapped[loc.id] = generateFallbackWeather(loc.id, loc.lat, loc.lng, targetDate, hour);
      });
      return mapped;
    }

    const res = await fetch(url, { cache: "force-cache" });
    if (!res.ok) throw new Error("Open-Meteo API response not ok");

    const rawData = await res.json();
    const resultList = Array.isArray(rawData) ? rawData : [rawData];

    const mapped: Record<string, WeatherDataPoint> = {};

    locations.forEach((loc, index) => {
      const data = resultList[index] || resultList[0];
      if (!data) {
        mapped[loc.id] = generateFallbackWeather(loc.id, loc.lat, loc.lng, targetDate, hour);
        return;
      }

      let temp = 28;
      let humidity = 70;
      let precip = 0;
      let wCode = 0;
      let wind = 10;
      let isDay = hour >= 6 && hour <= 18;

      if (!isPast && daysDiff === 0 && data.current) {
        temp = Math.round(data.current.temperature_2m ?? 28);
        humidity = Math.round(data.current.relative_humidity_2m ?? 70);
        precip = data.current.precipitation ?? 0;
        wCode = data.current.weather_code ?? 0;
        wind = Math.round(data.current.wind_speed_10m ?? 10);
        isDay = Boolean(data.current.is_day ?? (hour >= 6 && hour <= 18));
      } else if (data.hourly && data.hourly.temperature_2m) {
        const hourlyIndex = Math.min(hour, data.hourly.temperature_2m.length - 1);
        temp = Math.round(data.hourly.temperature_2m[hourlyIndex] ?? 28);
        humidity = Math.round(data.hourly.relative_humidity_2m?.[hourlyIndex] ?? 70);
        precip = data.hourly.precipitation?.[hourlyIndex] ?? 0;
        wCode = data.hourly.weather_code?.[hourlyIndex] ?? 0;
        wind = Math.round(data.hourly.wind_speed_10m?.[hourlyIndex] ?? 10);
      }

      const { type, description, descriptionSi } = parseWMOCode(wCode);

      mapped[loc.id] = {
        id: loc.id,
        name: loc.name,
        temp,
        condition: type,
        description,
        descriptionSi,
        humidity,
        windSpeed: wind,
        precipitation: precip,
        weatherCode: wCode,
        isDay,
      };
    });

    return mapped;
  } catch (err) {
    console.warn("Open-Meteo API fetch fallback active:", err);
    const mapped: Record<string, WeatherDataPoint> = {};
    locations.forEach((loc) => {
      mapped[loc.id] = generateFallbackWeather(loc.id, loc.lat, loc.lng, targetDate, hour);
    });
    return mapped;
  }
}

// Function to generate 3-Month / 90-Day Seasonal Weather Outlook for any location
export function fetchThreeMonthOutlook(
  locationName: string,
  lat: number,
  lng: number
): ThreeMonthOutlookData {
  const now = new Date();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const monthlyOutlooks: MonthlyForecastOutlook[] = [];

  for (let i = 0; i < 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 15);
    const monthIdx = d.getMonth();
    const monthName = monthNames[monthIdx];

    // Determine monsoon season for Sri Lanka
    let monsoonSeason = "Inter-monsoon Period";
    if (monthIdx >= 4 && monthIdx <= 8) monsoonSeason = "South-West Monsoon (Yala)";
    else if (monthIdx >= 11 || monthIdx <= 1) monsoonSeason = "North-East Monsoon (Maha)";

    const isHighland = lat < 7.5 && lat > 6.7 && lng > 80.5 && lng < 81.2;
    const isKotmale = locationName.toLowerCase().includes("kotmale") || locationName.toLowerCase().includes("nuwara");

    let avgTemp = isKotmale ? 19 : isHighland ? 22 : 29;
    let rainyDays = 12;
    let totalRainfall = 180;
    let dominantCondition: WeatherEffectType = "rain";
    let conditionDescription = "Moderate Monsoonal Rain Showers";

    if (monthIdx >= 4 && monthIdx <= 8) {
      if (isKotmale || isHighland) {
        totalRainfall = 340 + (i * 45);
        rainyDays = 22 - i;
        dominantCondition = "rain";
        conditionDescription = "Heavy Southwest Monsoonal Rain & Mist";
      } else {
        totalRainfall = 110;
        rainyDays = 8;
        dominantCondition = "sun";
        conditionDescription = "Mostly Sunny & Warm Coast";
      }
    } else if (monthIdx === 9 || monthIdx === 10) {
      totalRainfall = 380;
      rainyDays = 24;
      dominantCondition = "thunder";
      conditionDescription = "Inter-Monsoon Thunderstorms & Heavy Showers";
    } else {
      if (isKotmale) {
        totalRainfall = 130;
        rainyDays = 10;
        dominantCondition = "fog";
        conditionDescription = "Cool Misty Mornings & Clear Afternoons";
      }
    }

    monthlyOutlooks.push({
      monthName: `${monthName} ${d.getFullYear()}`,
      avgTemp,
      totalRainfall,
      rainyDays,
      dominantCondition,
      conditionDescription,
      monsoonSeason,
    });
  }

  // Generate 12 Weekly forecast points over next 90 days
  const weeklyTrends = Array.from({ length: 12 }).map((_, w) => {
    const weekDate = new Date();
    weekDate.setDate(weekDate.getDate() + w * 7);
    const dateStr = weekDate.toISOString().split("T")[0];
    const sampleWeather = generateFallbackWeather("loc", lat, lng, dateStr, 12);

    return {
      weekLabel: `Week ${w + 1}`,
      startDate: `${weekDate.getDate()} ${monthNames[weekDate.getMonth()].slice(0, 3)}`,
      expectedTemp: sampleWeather.temp,
      expectedRainfall: Math.round(sampleWeather.precipitation * 7),
      condition: sampleWeather.condition,
    };
  });

  return {
    locationName,
    monthlyOutlooks,
    weeklyTrends,
  };
}

// In-memory weather cache for GN divisions — prevents repeated API calls for same location+date
const gnWeatherCache = new Map<string, WeatherDataPoint>();

/**
 * Fetch weather for GN Divisions in chunks of 8 (parallel batches).
 * Skips already-cached locations. Throttles to avoid hammering Open-Meteo.
 */
export async function fetchWeatherForGNDivisions(
  gnDivisions: { id: string; name: string; lat: number; lng: number }[],
  dateStr: string,
  hour: number,
  signal?: AbortSignal
): Promise<Record<string, WeatherDataPoint>> {
  const result: Record<string, WeatherDataPoint> = {};
  const uncached = gnDivisions.filter((gn) => {
    const cacheKey = `${gn.id}:${dateStr}:${hour}`;
    const cached = gnWeatherCache.get(cacheKey);
    if (cached) {
      result[gn.id] = cached;
      return false;
    }
    return true;
  });

  if (uncached.length === 0) return result;

  // Chunk into groups of 8 for parallel batching
  const CHUNK_SIZE = 8;
  const chunks: typeof uncached[] = [];
  for (let i = 0; i < uncached.length; i += CHUNK_SIZE) {
    chunks.push(uncached.slice(i, i + CHUNK_SIZE));
  }

  // Fetch each chunk with a short stagger to avoid rate limiting
  for (let ci = 0; ci < chunks.length; ci++) {
    if (signal?.aborted) break;
    const chunk = chunks[ci];
    try {
      const chunkResult = await fetchBatchWeather(chunk, dateStr, hour);
      for (const [id, data] of Object.entries(chunkResult)) {
        result[id] = data;
        const gn = chunk.find((g) => g.id === id);
        if (gn) {
          gnWeatherCache.set(`${id}:${dateStr}:${hour}`, data);
        }
      }
    } catch {
      // Fallback for this chunk
      chunk.forEach((gn) => {
        const fb = generateFallbackWeather(gn.id, gn.lat, gn.lng, dateStr, hour);
        result[gn.id] = fb;
        gnWeatherCache.set(`${gn.id}:${dateStr}:${hour}`, fb);
      });
    }
    // Small stagger between chunks
    if (ci < chunks.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 120));
    }
  }

  return result;
}
