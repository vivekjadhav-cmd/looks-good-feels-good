import { WeatherData } from "@/types";

const SINGAPORE_LAT = 1.3521;
const SINGAPORE_LNG = 103.8198;
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes

let weatherCache: WeatherData | null = null;

function mapWeatherCode(code: number): string {
  if (code === 0) return "Clear";
  if (code <= 3) return "Cloudy";
  if (code <= 48) return "Foggy";
  if (code <= 57) return "Drizzle";
  if (code <= 65) return "Rain";
  if (code <= 67) return "Freezing rain";
  if (code <= 77) return "Snow";
  if (code <= 82) return "Rain showers";
  if (code <= 86) return "Snow showers";
  if (code <= 99) return "Thunderstorm";
  return "Unknown";
}

export async function getWeather(): Promise<WeatherData> {
  // Return cached if fresh
  if (weatherCache && Date.now() - weatherCache.fetched_at < CACHE_DURATION_MS) {
    return weatherCache;
  }

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(SINGAPORE_LAT));
  url.searchParams.set("longitude", String(SINGAPORE_LNG));
  url.searchParams.set("current", "temperature_2m,relative_humidity_2m,weather_code");
  url.searchParams.set("timezone", "Asia/Singapore");

  const res = await fetch(url.toString(), { next: { revalidate: 1800 } });

  if (!res.ok) {
    throw new Error(`Weather API error: ${res.status}`);
  }

  const data = await res.json();
  const current = data.current;

  const weather: WeatherData = {
    temperature: Math.round(current.temperature_2m),
    humidity: Math.round(current.relative_humidity_2m),
    condition: mapWeatherCode(current.weather_code),
    fetched_at: Date.now(),
  };

  weatherCache = weather;
  return weather;
}
