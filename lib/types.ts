export type Place = {
  id: string;
  name: string;
  adm1: string;
  adm2: string;
  country: string;
  lat: string;
  lon: string;
  tz: string;
};

export type WeatherNow = {
  obsTime: string;
  temp: string;
  feelsLike: string;
  icon: string;
  text: string;
  windDir: string;
  windScale: string;
  windSpeed: string;
  humidity: string;
  precip: string;
  pressure: string;
  vis: string;
  cloud?: string;
};

export type HourlyForecast = {
  fxTime: string;
  temp: string;
  icon: string;
  text: string;
  windSpeed: string;
  humidity: string;
  pop?: string;
  precip?: string;
};

export type DailyForecast = {
  fxDate: string;
  sunrise?: string;
  sunset?: string;
  tempMax: string;
  tempMin: string;
  iconDay: string;
  textDay: string;
  iconNight: string;
  textNight: string;
  windDirDay?: string;
  windScaleDay?: string;
  humidity?: string;
  precip?: string;
  pop?: string;
  uvIndex?: string;
};

export type MinuteForecast = {
  summary: string;
  minutely: Array<{ fxTime: string; precip: string; type: string }>;
};

export type AirQuality = {
  aqi: number;
  category: string;
  primaryPollutant?: string;
  advice?: string;
  color?: { red: number; green: number; blue: number; alpha: number };
};

export type WeatherAlert = {
  id: string;
  headline: string;
  description: string;
  severity: string;
  color?: { code?: string; red: number; green: number; blue: number; alpha: number };
  senderName?: string;
  expireTime?: string;
};

export type WeatherPayload = {
  location: Place;
  updateTime: string;
  now: WeatherNow;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  minutely: MinuteForecast | null;
  air: AirQuality | null;
  alerts: WeatherAlert[];
};
