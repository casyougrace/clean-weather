import type { AirQuality, DailyForecast, HourlyForecast, MinuteForecast, Place, WeatherNow, WeatherPayload } from "./types";

type OpenMeteoCurrent = {
  time: string;
  temperature_2m: number;
  relative_humidity_2m: number;
  apparent_temperature: number;
  is_day: number;
  precipitation: number;
  weather_code: number;
  cloud_cover: number;
  pressure_msl: number;
  wind_speed_10m: number;
  wind_direction_10m: number;
  wind_gusts_10m: number;
  visibility: number;
};

type OpenMeteoHourly = {
  time: string[];
  temperature_2m: number[];
  relative_humidity_2m: number[];
  precipitation_probability: number[];
  precipitation: number[];
  weather_code: number[];
  wind_speed_10m: number[];
  wind_direction_10m: number[];
  is_day: number[];
};

type OpenMeteoDaily = {
  time: string[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  sunrise: string[];
  sunset: string[];
  precipitation_sum: number[];
  precipitation_probability_max: number[];
  uv_index_max: number[];
};

type OpenMeteoMinutely = {
  time: string[];
  precipitation: number[];
};

type OpenMeteoForecastResponse = {
  latitude: number;
  longitude: number;
  timezone: string;
  current: OpenMeteoCurrent;
  hourly: OpenMeteoHourly;
  daily: OpenMeteoDaily;
  minutely_15?: OpenMeteoMinutely;
};

type OpenMeteoAirResponse = {
  current?: {
    time: string;
    us_aqi?: number;
    pm2_5?: number;
    pm10?: number;
  };
};

export type OpenMeteoGeocodingResponse = {
  results?: Array<{
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    country?: string;
    country_code?: string;
    admin1?: string;
    admin2?: string;
    timezone?: string;
  }>;
};

export async function openMeteoFetch<T>(url: string, revalidate = 600): Promise<T> {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate }
  });

  const body = (await response.json().catch(() => null)) as (T & { reason?: string; error?: boolean }) | null;
  if (!response.ok || body?.error) {
    throw new Error(body?.reason || `Open-Meteo 请求失败：HTTP ${response.status}`);
  }
  return body as T;
}

export function weatherText(code: number): string {
  const labels: Record<number, string> = {
    0: "晴",
    1: "大部晴朗",
    2: "多云",
    3: "阴",
    45: "有雾",
    48: "雾凇",
    51: "小毛毛雨",
    53: "毛毛雨",
    55: "强毛毛雨",
    56: "轻微冻毛毛雨",
    57: "冻毛毛雨",
    61: "小雨",
    63: "中雨",
    65: "大雨",
    66: "轻微冻雨",
    67: "冻雨",
    71: "小雪",
    73: "中雪",
    75: "大雪",
    77: "米雪",
    80: "小阵雨",
    81: "阵雨",
    82: "强阵雨",
    85: "小阵雪",
    86: "强阵雪",
    95: "雷暴",
    96: "雷暴伴小冰雹",
    99: "雷暴伴强冰雹"
  };
  return labels[code] ?? "天气变化";
}

export function weatherIconCode(code: number, isDay = true): string {
  if (code === 0) return isDay ? "100" : "150";
  if (code === 1) return isDay ? "101" : "151";
  if (code === 2) return isDay ? "102" : "152";
  if (code === 3) return isDay ? "104" : "154";
  if ([45, 48].includes(code)) return "501";
  if ([51, 53, 55, 56, 57].includes(code)) return "305";
  if ([61, 66, 80].includes(code)) return "305";
  if ([63, 67, 81].includes(code)) return "306";
  if ([65, 82].includes(code)) return "307";
  if ([71, 85].includes(code)) return "400";
  if ([73, 86].includes(code)) return "401";
  if (code === 75) return "402";
  if (code === 77) return "499";
  if (code === 95) return "302";
  if (code === 96) return "303";
  if (code === 99) return "304";
  return isDay ? "101" : "151";
}

function windDirection(degrees: number): string {
  const directions = ["北风", "东北风", "东风", "东南风", "南风", "西南风", "西风", "西北风"];
  return directions[Math.round((((degrees % 360) + 360) % 360) / 45) % 8];
}

function beaufortScale(kmh: number): string {
  const limits = [1, 6, 12, 20, 29, 39, 50, 62, 75, 89, 103, 118];
  const index = limits.findIndex((limit) => kmh < limit);
  return String(index === -1 ? 12 : index);
}

function aqiCategory(aqi: number): string {
  if (aqi <= 50) return "优";
  if (aqi <= 100) return "良";
  if (aqi <= 150) return "轻度污染";
  if (aqi <= 200) return "中度污染";
  if (aqi <= 300) return "重度污染";
  return "严重污染";
}

function precipitationSummary(items: Array<{ precip: string }>): string {
  const values = items.map((item) => Number(item.precip));
  const firstWet = values.findIndex((value) => value >= 0.05);
  const total = values.reduce((sum, value) => sum + value, 0);
  if (firstWet === -1) return "未来两小时预计无明显降水";
  if (firstWet === 0) return `降水正在持续，未来两小时累计约 ${total.toFixed(1)} mm`;
  return `约 ${firstWet * 15} 分钟后可能开始降水，累计约 ${total.toFixed(1)} mm`;
}

export async function getOpenMeteoWeather(place: Place): Promise<WeatherPayload> {
  const latitude = Number(place.lat);
  const longitude = Number(place.lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) throw new Error("地点坐标无效");

  const forecastParams = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "is_day",
      "precipitation",
      "weather_code",
      "cloud_cover",
      "pressure_msl",
      "wind_speed_10m",
      "wind_direction_10m",
      "wind_gusts_10m",
      "visibility"
    ].join(","),
    hourly: [
      "temperature_2m",
      "relative_humidity_2m",
      "precipitation_probability",
      "precipitation",
      "weather_code",
      "wind_speed_10m",
      "wind_direction_10m",
      "is_day"
    ].join(","),
    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "sunrise",
      "sunset",
      "precipitation_sum",
      "precipitation_probability_max",
      "uv_index_max"
    ].join(","),
    minutely_15: "precipitation",
    forecast_hours: "24",
    forecast_days: "7",
    forecast_minutely_15: "9",
    timezone: "auto",
    wind_speed_unit: "kmh",
    precipitation_unit: "mm"
  });

  const airParams = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: "us_aqi,pm2_5,pm10",
    timezone: "auto"
  });

  const [forecast, air] = await Promise.all([
    openMeteoFetch<OpenMeteoForecastResponse>(`https://api.open-meteo.com/v1/forecast?${forecastParams}`, 600),
    openMeteoFetch<OpenMeteoAirResponse>(`https://air-quality-api.open-meteo.com/v1/air-quality?${airParams}`, 1800).catch(() => null)
  ]);

  const current = forecast.current;
  const now: WeatherNow = {
    obsTime: current.time,
    temp: String(Math.round(current.temperature_2m)),
    feelsLike: String(Math.round(current.apparent_temperature)),
    icon: weatherIconCode(current.weather_code, current.is_day === 1),
    text: weatherText(current.weather_code),
    windDir: windDirection(current.wind_direction_10m),
    windScale: beaufortScale(current.wind_speed_10m),
    windSpeed: String(Math.round(current.wind_speed_10m)),
    humidity: String(Math.round(current.relative_humidity_2m)),
    precip: current.precipitation.toFixed(1),
    pressure: String(Math.round(current.pressure_msl)),
    vis: (current.visibility / 1000).toFixed(current.visibility < 10000 ? 1 : 0),
    cloud: String(Math.round(current.cloud_cover))
  };

  const hourly: HourlyForecast[] = forecast.hourly.time.map((time, index) => ({
    fxTime: time,
    temp: String(Math.round(forecast.hourly.temperature_2m[index])),
    icon: weatherIconCode(forecast.hourly.weather_code[index], forecast.hourly.is_day[index] === 1),
    text: weatherText(forecast.hourly.weather_code[index]),
    windSpeed: String(Math.round(forecast.hourly.wind_speed_10m[index])),
    humidity: String(Math.round(forecast.hourly.relative_humidity_2m[index])),
    pop: String(Math.round(forecast.hourly.precipitation_probability[index] ?? 0)),
    precip: Number(forecast.hourly.precipitation[index] ?? 0).toFixed(1)
  }));

  const daily: DailyForecast[] = forecast.daily.time.map((date, index) => ({
    fxDate: date,
    sunrise: forecast.daily.sunrise[index]?.slice(11, 16),
    sunset: forecast.daily.sunset[index]?.slice(11, 16),
    tempMax: String(Math.round(forecast.daily.temperature_2m_max[index])),
    tempMin: String(Math.round(forecast.daily.temperature_2m_min[index])),
    iconDay: weatherIconCode(forecast.daily.weather_code[index], true),
    textDay: weatherText(forecast.daily.weather_code[index]),
    iconNight: weatherIconCode(forecast.daily.weather_code[index], false),
    textNight: weatherText(forecast.daily.weather_code[index]),
    precip: Number(forecast.daily.precipitation_sum[index] ?? 0).toFixed(1),
    pop: String(Math.round(forecast.daily.precipitation_probability_max[index] ?? 0)),
    uvIndex: Number(forecast.daily.uv_index_max[index] ?? 0).toFixed(1)
  }));

  let minutely: MinuteForecast | null = null;
  if (forecast.minutely_15?.time?.length) {
    const items = forecast.minutely_15.time.map((time, index) => ({
      fxTime: time,
      precip: Number(forecast.minutely_15?.precipitation[index] ?? 0).toFixed(2),
      type: "rain"
    }));
    minutely = { summary: precipitationSummary(items), minutely: items };
  }

  let airQuality: AirQuality | null = null;
  if (air?.current?.us_aqi != null) {
    const aqi = Math.round(air.current.us_aqi);
    airQuality = {
      aqi,
      category: aqiCategory(aqi),
      advice: `PM2.5 ${Math.round(air.current.pm2_5 ?? 0)} μg/m³ · PM10 ${Math.round(air.current.pm10 ?? 0)} μg/m³`
    };
  }

  return {
    location: { ...place, tz: forecast.timezone || place.tz },
    updateTime: new Date().toISOString(),
    now,
    hourly,
    daily,
    minutely,
    air: airQuality,
    alerts: []
  };
}
