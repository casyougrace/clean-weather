"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  Clock3,
  Cloud,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudSun,
  Droplets,
  Eye,
  Gauge,
  LocateFixed,
  MapPin,
  Moon,
  RefreshCw,
  Search,
  Sun,
  Wind,
  X
} from "lucide-react";

type Place = {
  id: string;
  name: string;
  admin1?: string;
  country?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
};

type WeatherData = {
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    precipitation: number;
    weather_code: number;
    surface_pressure: number;
    visibility: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    is_day: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: number[];
    precipitation: number[];
    weather_code: number[];
    relative_humidity_2m: number[];
    wind_speed_10m: number[];
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    sunrise: string[];
    sunset: string[];
    precipitation_probability_max: number[];
  };
  minutely_15?: {
    time: string[];
    precipitation: number[];
  };
};

type AirData = {
  current?: {
    us_aqi?: number;
    pm2_5?: number;
    pm10?: number;
  };
};

type SearchResponse = {
  results?: Array<{
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    country?: string;
    admin1?: string;
    timezone?: string;
  }>;
};

const defaultPlace: Place = {
  id: "117.2272,31.8206",
  name: "合肥",
  admin1: "安徽省",
  country: "中国",
  latitude: 31.8206,
  longitude: 117.2272,
  timezone: "Asia/Shanghai"
};

const popularPlaces: Place[] = [
  { id: "116.4074,39.9042", name: "北京", admin1: "北京市", country: "中国", longitude: 116.4074, latitude: 39.9042 },
  { id: "121.4737,31.2304", name: "上海", admin1: "上海市", country: "中国", longitude: 121.4737, latitude: 31.2304 },
  { id: "113.2644,23.1291", name: "广州", admin1: "广东省", country: "中国", longitude: 113.2644, latitude: 23.1291 },
  { id: "114.0579,22.5431", name: "深圳", admin1: "广东省", country: "中国", longitude: 114.0579, latitude: 22.5431 },
  { id: "117.2272,31.8206", name: "合肥", admin1: "安徽省", country: "中国", longitude: 117.2272, latitude: 31.8206 },
  { id: "118.6757,24.8741", name: "泉州", admin1: "福建省", country: "中国", longitude: 118.6757, latitude: 24.8741 },
  { id: "120.1551,30.2741", name: "杭州", admin1: "浙江省", country: "中国", longitude: 120.1551, latitude: 30.2741 },
  { id: "104.0665,30.5728", name: "成都", admin1: "四川省", country: "中国", longitude: 104.0665, latitude: 30.5728 },
  { id: "114.3054,30.5931", name: "武汉", admin1: "湖北省", country: "中国", longitude: 114.3054, latitude: 30.5931 },
  { id: "108.9398,34.3416", name: "西安", admin1: "陕西省", country: "中国", longitude: 108.9398, latitude: 34.3416 }
];

const storageKey = "clean-weather:place";
const recentKey = "clean-weather:recent";

function weatherText(code: number): string {
  if (code === 0) return "晴";
  if (code === 1) return "大部晴朗";
  if (code === 2) return "多云";
  if (code === 3) return "阴";
  if ([45, 48].includes(code)) return "有雾";
  if ([51, 53, 55, 56, 57].includes(code)) return "毛毛雨";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "有雨";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "有雪";
  if ([95, 96, 99].includes(code)) return "雷雨";
  return "天气未知";
}

function WeatherGlyph({ code, isDay = true, size = 32 }: { code: number; isDay?: boolean; size?: number }) {
  const props = { size, strokeWidth: 1.7, "aria-hidden": true } as const;
  if (code === 0) return isDay ? <Sun className="glyph glyph-sun" {...props} /> : <Moon className="glyph glyph-moon" {...props} />;
  if (code <= 2) return isDay ? <CloudSun className="glyph glyph-partly" {...props} /> : <CloudMoon className="glyph glyph-cloud" {...props} />;
  if (code === 3) return <Cloud className="glyph glyph-cloud" {...props} />;
  if ([45, 48].includes(code)) return <CloudFog className="glyph glyph-cloud" {...props} />;
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return <CloudRain className="glyph glyph-rain" {...props} />;
  if ([71, 73, 75, 77, 85, 86].includes(code)) return <CloudSnow className="glyph glyph-snow" {...props} />;
  if ([95, 96, 99].includes(code)) return <CloudLightning className="glyph glyph-storm" {...props} />;
  return <CloudSun className="glyph glyph-partly" {...props} />;
}

function themeClass(code?: number, isDay = 1): string {
  if (!isDay) return "theme-night";
  if (code == null || code <= 1) return "theme-clear";
  if ([45, 48].includes(code)) return "theme-fog";
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code)) return "theme-rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "theme-snow";
  return "theme-cloud";
}

function windDirection(value: number): string {
  const labels = ["北", "东北", "东", "东南", "南", "西南", "西", "西北"];
  return labels[Math.round(value / 45) % 8];
}

function aqiLabel(value?: number): string {
  if (value == null) return "暂无";
  if (value <= 50) return "优";
  if (value <= 100) return "良";
  if (value <= 150) return "轻度污染";
  if (value <= 200) return "中度污染";
  if (value <= 300) return "重度污染";
  return "严重污染";
}

function hourLabel(value: string, index: number): string {
  if (index === 0) return "现在";
  return `${new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", hour12: false }).format(new Date(value))}时`;
}

function dayLabel(value: string, index: number): string {
  if (index === 0) return "今天";
  return new Intl.DateTimeFormat("zh-CN", { weekday: "short" }).format(new Date(`${value}T12:00:00`));
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`数据请求失败（${response.status}）`);
  return response.json() as Promise<T>;
}

export default function HomePage() {
  const [place, setPlace] = useState<Place>(defaultPlace);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [air, setAir] = useState<AirData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const [searching, setSearching] = useState(false);
  const [recent, setRecent] = useState<Place[]>([defaultPlace]);
  const [scrolled, setScrolled] = useState(false);

  const loadWeather = useCallback(async (target: Place, silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const common = new URLSearchParams({
        latitude: String(target.latitude),
        longitude: String(target.longitude),
        timezone: "auto"
      });
      const forecastParams = new URLSearchParams(common);
      forecastParams.set("current", "temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,surface_pressure,visibility,wind_speed_10m,wind_direction_10m,is_day");
      forecastParams.set("hourly", "temperature_2m,precipitation_probability,precipitation,weather_code,relative_humidity_2m,wind_speed_10m");
      forecastParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max");
      forecastParams.set("minutely_15", "precipitation");
      forecastParams.set("forecast_days", "10");

      const airParams = new URLSearchParams(common);
      airParams.set("current", "us_aqi,pm2_5,pm10");

      const [forecast, airQuality] = await Promise.all([
        fetchJson<WeatherData>(`https://api.open-meteo.com/v1/forecast?${forecastParams}`),
        fetchJson<AirData>(`https://air-quality-api.open-meteo.com/v1/air-quality?${airParams}`).catch(() => null)
      ]);
      setWeather(forecast);
      setAir(airQuality);
      setPlace(target);
      try { localStorage.setItem(storageKey, JSON.stringify(target)); } catch {}
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "天气加载失败");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let initial = defaultPlace;
    try {
      const saved = localStorage.getItem(storageKey);
      const savedRecent = localStorage.getItem(recentKey);
      if (saved) initial = JSON.parse(saved) as Place;
      if (savedRecent) setRecent((JSON.parse(savedRecent) as Place[]).slice(0, 8));
    } catch {}
    loadWeather(initial);
  }, [loadWeather]);

  useEffect(() => {
    const timer = window.setInterval(() => loadWeather(place, true), 10 * 60 * 1000);
    const onVisible = () => {
      if (document.visibilityState === "visible") loadWeather(place, true);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [loadWeather, place]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 300);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      setSearching(true);
      try {
        const params = new URLSearchParams({ name: query.trim(), count: "10", language: "zh", format: "json" });
        const body = await fetchJson<SearchResponse>(`https://geocoding-api.open-meteo.com/v1/search?${params}`);
        setResults((body.results ?? []).map((item) => ({
          id: String(item.id),
          name: item.name,
          admin1: item.admin1,
          country: item.country,
          latitude: item.latitude,
          longitude: item.longitude,
          timezone: item.timezone
        })));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  const choosePlace = (target: Place) => {
    const next = [target, ...recent.filter((item) => item.id !== target.id)].slice(0, 8);
    setRecent(next);
    try { localStorage.setItem(recentKey, JSON.stringify(next)); } catch {}
    setModalOpen(false);
    setQuery("");
    setResults([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
    loadWeather(target);
  };

  const locate = () => {
    if (!navigator.geolocation) {
      setError("当前浏览器不支持定位");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => choosePlace({
        id: `${position.coords.longitude},${position.coords.latitude}`,
        name: "当前位置",
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      }),
      () => setError("定位失败，请检查位置权限"),
      { timeout: 10000, maximumAge: 600000 }
    );
  };

  const nowIndex = useMemo(() => {
    if (!weather) return 0;
    const currentTime = new Date(weather.current.time).getTime();
    const found = weather.hourly.time.findIndex((time) => new Date(time).getTime() >= currentTime);
    return Math.max(0, found);
  }, [weather]);

  const hours = weather ? weather.hourly.time.slice(nowIndex, nowIndex + 24).map((time, offset) => ({
    time,
    temp: weather.hourly.temperature_2m[nowIndex + offset],
    code: weather.hourly.weather_code[nowIndex + offset],
    pop: weather.hourly.precipitation_probability[nowIndex + offset]
  })) : [];

  const rainPoints = useMemo(() => {
    if (!weather?.minutely_15) return [];
    const currentTime = new Date(weather.current.time).getTime();
    return weather.minutely_15.time
      .map((time, index) => ({ time, value: weather.minutely_15!.precipitation[index] ?? 0 }))
      .filter((item) => new Date(item.time).getTime() >= currentTime)
      .slice(0, 9);
  }, [weather]);

  const rainMax = Math.max(0.2, ...rainPoints.map((item) => item.value));
  const current = weather?.current;
  const today = weather?.daily;
  const theme = themeClass(current?.weather_code, current?.is_day);
  const aqi = air?.current?.us_aqi;

  return (
    <main className={`weather-app ${theme}`}>
      <div className="sky-texture" />
      <div className="sky-haze" />
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <div className={`compact-header ${scrolled ? "is-visible" : ""}`}>
        <button onClick={() => setModalOpen(true)} aria-label="切换城市">
          <strong>{place.name}</strong>
          {current && <span>{Math.round(current.temperature_2m)}°　|　{weatherText(current.weather_code)}</span>}
        </button>
      </div>

      <div className="shell">
        <header className="topbar desktop-topbar">
          <div className="brand"><span className="brand-dot" />清朗天气</div>
          <div className="top-actions">
            <button className="round-button" onClick={locate} aria-label="定位"><LocateFixed size={20} /></button>
            <button className="round-button" onClick={() => loadWeather(place)} aria-label="刷新"><RefreshCw size={20} className={loading ? "spinning" : ""} /></button>
          </div>
        </header>

        {error && <div className="error-banner">{error}</div>}

        <section className="hero">
          <button className="city-button" onClick={() => setModalOpen(true)} aria-label="选择城市">
            <span className="city-name">{place.name}<ChevronDown size={21} strokeWidth={1.6} /></span>
          </button>

          {loading && !current ? (
            <div className="loading">正在获取天气…</div>
          ) : current ? (
            <>
              <div className="temperature">{Math.round(current.temperature_2m)}<sup>°</sup></div>
              <div className="high-low-row">
                <span><small>最<br />高</small><strong>{Math.round(today?.temperature_2m_max[0] ?? current.temperature_2m)}°</strong></span>
                <span><small>最<br />低</small><strong>{Math.round(today?.temperature_2m_min[0] ?? current.temperature_2m)}°</strong></span>
              </div>
              <div className="condition">{weatherText(current.weather_code)}</div>
            </>
          ) : null}
        </section>

        {weather && current && (
          <div className="content-stack">
            <section className="glass-card air-card apple-card">
              <div className="aqi-heading">{aqi != null ? `${Math.round(aqi)} - ${aqiLabel(aqi)}` : "空气质量暂无"}</div>
              <div className="aqi-scale"><i style={{ left: `${Math.min(98, Math.max(2, ((aqi ?? 0) / 500) * 100))}%` }} /></div>
              <div className="aqi-description">当前 US AQI 为 {aqi != null ? Math.round(aqi) : "—"}。</div>
            </section>

            <section className="glass-card hourly-card apple-card">
              <div className="card-title"><Clock3 size={16} />每小时天气预报</div>
              <div className="hourly-summary">
                今天将持续{weatherText(weather.daily.weather_code[0])}。最高 {Math.round(weather.daily.temperature_2m_max[0])}°，最低 {Math.round(weather.daily.temperature_2m_min[0])}°。
              </div>
              <div className="hourly-scroll">
                {hours.map((hour, index) => {
                  const hourOfDay = new Date(hour.time).getHours();
                  const isDay = hourOfDay >= 7 && hourOfDay < 19;
                  return (
                    <div className="hour-item" key={hour.time}>
                      <span className="hour-time">{hourLabel(hour.time, index)}</span>
                      <span className="hour-pop">{hour.pop > 0 ? `${hour.pop}%` : ""}</span>
                      <WeatherGlyph code={hour.code} isDay={isDay} size={31} />
                      <strong>{Math.round(hour.temp)}°</strong>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="glass-card daily-card apple-card">
              <div className="card-title"><CalendarDays size={16} />10日天气预报</div>
              <div className="daily-list">
                {weather.daily.time.map((date, index) => {
                  const min = Math.min(...weather.daily.temperature_2m_min);
                  const max = Math.max(...weather.daily.temperature_2m_max);
                  const span = Math.max(1, max - min);
                  const left = ((weather.daily.temperature_2m_min[index] - min) / span) * 35;
                  const width = Math.max(18, ((weather.daily.temperature_2m_max[index] - weather.daily.temperature_2m_min[index]) / span) * 65);
                  const currentPosition = index === 0 ? ((current.temperature_2m - min) / span) * 100 : null;
                  const dayCode = weather.daily.weather_code[index];
                  return (
                    <div className="daily-row" key={date}>
                      <span className="day-name">{dayLabel(date, index)}</span>
                      <span className="day-weather">
                        <WeatherGlyph code={dayCode} size={28} />
                        {weather.daily.precipitation_probability_max[index] > 0 && <small>{weather.daily.precipitation_probability_max[index]}%</small>}
                      </span>
                      <span className="day-min">{Math.round(weather.daily.temperature_2m_min[index])}°</span>
                      <span className="temp-track">
                        <i style={{ left: `${left}%`, width: `${width}%` }} />
                        {currentPosition != null && <b style={{ left: `${Math.min(98, Math.max(2, currentPosition))}%` }} />}
                      </span>
                      <span className="day-max">{Math.round(weather.daily.temperature_2m_max[index])}°</span>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="glass-card rain-card apple-card">
              <div className="card-title"><CloudRain size={16} />未来两小时降水</div>
              <div className="rain-chart">
                {rainPoints.length ? rainPoints.map((point) => (
                  <div className="rain-column" key={point.time}>
                    <div className="rain-bar-wrap"><i style={{ height: `${Math.max(3, (point.value / rainMax) * 100)}%` }} /></div>
                    <span>{new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(point.time))}</span>
                  </div>
                )) : <div className="empty-state">暂无15分钟降水数据</div>}
              </div>
              <div className="rain-summary">{rainPoints.some((item) => item.value > 0.05) ? "未来两小时可能有降水" : "未来两小时降水概率较低"}</div>
            </section>

            <section className="metrics-grid" aria-label="天气详情">
              <div className="glass-card metric apple-card"><Droplets /><span>湿度</span><strong>{current.relative_humidity_2m}%</strong><small>当前相对湿度</small></div>
              <div className="glass-card metric apple-card"><Wind /><span>风速</span><strong>{Math.round(current.wind_speed_10m)} km/h</strong><small>{windDirection(current.wind_direction_10m)}风</small></div>
              <div className="glass-card metric apple-card"><Eye /><span>能见度</span><strong>{(current.visibility / 1000).toFixed(1)} km</strong><small>地面能见度</small></div>
              <div className="glass-card metric apple-card"><Gauge /><span>气压</span><strong>{Math.round(current.surface_pressure)} hPa</strong><small>地面气压</small></div>
            </section>
          </div>
        )}

        <footer>天气与空气质量数据来自 Open-Meteo · 每10分钟自动更新</footer>
      </div>

      {modalOpen && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false); }}>
          <section className="city-modal">
            <div className="modal-handle" />
            <div className="modal-head"><h2>选择城市</h2><button onClick={() => setModalOpen(false)} aria-label="关闭"><X size={21} /></button></div>
            <label className="search-box"><Search size={18} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索城市，例如合肥、泉州" /><button type="button" onClick={locate} aria-label="使用当前位置"><LocateFixed size={18} /></button></label>
            {query ? (
              <div className="place-section">
                <h3>{searching ? "正在搜索…" : "搜索结果"}</h3>
                <div className="place-list">
                  {results.map((item) => <button key={item.id} onClick={() => choosePlace(item)}><span><b>{item.name}</b><small>{[item.admin1, item.country].filter(Boolean).join(" · ")}</small></span><span>›</span></button>)}
                  {!searching && !results.length && <div className="empty-state">没有找到匹配城市</div>}
                </div>
              </div>
            ) : (
              <>
                <div className="location-action"><button onClick={locate}><LocateFixed size={19} /><span><b>我的位置</b><small>使用手机定位查看当地天气</small></span></button></div>
                <div className="place-section"><h3>热门城市</h3><div className="popular-grid">{popularPlaces.map((item) => <button key={item.id} onClick={() => choosePlace(item)}>{item.name}</button>)}</div></div>
                <div className="place-section"><h3>最近查看</h3><div className="place-list">{recent.map((item) => <button key={item.id} onClick={() => choosePlace(item)}><span><b>{item.name}</b><small>{[item.admin1, item.country].filter(Boolean).join(" · ")}</small></span><span>›</span></button>)}</div></div>
              </>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
