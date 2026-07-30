"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  CloudRain,
  Compass,
  Droplets,
  Eye,
  Gauge,
  LocateFixed,
  MapPin,
  Navigation,
  RefreshCw,
  Search,
  SunMedium,
  Thermometer,
  Wind,
  X
} from "lucide-react";
import { WeatherIcon } from "@/components/WeatherIcon";
import type { Place, WeatherPayload } from "@/lib/types";

const defaultLocation = process.env.NEXT_PUBLIC_DEFAULT_LOCATION ?? "117.23,31.82";
const [defaultLon, defaultLat] = defaultLocation.split(",");
const defaultPlace: Place = {
  id: defaultLocation,
  name: process.env.NEXT_PUBLIC_DEFAULT_LOCATION_NAME ?? "合肥",
  adm1: "安徽省",
  adm2: "合肥市",
  country: "中国",
  lat: defaultLat ?? "31.82",
  lon: defaultLon ?? "117.23",
  tz: "Asia/Shanghai"
};

const cityStorageKey = "clean-weather:saved-cities";
const activeCityStorageKey = "clean-weather:active-city";

const popularPlaces: Place[] = [
  { id: "116.4074,39.9042", name: "北京", adm1: "北京市", adm2: "北京市", country: "中国", lon: "116.4074", lat: "39.9042", tz: "Asia/Shanghai" },
  { id: "121.4737,31.2304", name: "上海", adm1: "上海市", adm2: "上海市", country: "中国", lon: "121.4737", lat: "31.2304", tz: "Asia/Shanghai" },
  { id: "113.2644,23.1291", name: "广州", adm1: "广东省", adm2: "广州市", country: "中国", lon: "113.2644", lat: "23.1291", tz: "Asia/Shanghai" },
  { id: "114.0579,22.5431", name: "深圳", adm1: "广东省", adm2: "深圳市", country: "中国", lon: "114.0579", lat: "22.5431", tz: "Asia/Shanghai" },
  { id: "117.2272,31.8206", name: "合肥", adm1: "安徽省", adm2: "合肥市", country: "中国", lon: "117.2272", lat: "31.8206", tz: "Asia/Shanghai" },
  { id: "118.6757,24.8741", name: "泉州", adm1: "福建省", adm2: "泉州市", country: "中国", lon: "118.6757", lat: "24.8741", tz: "Asia/Shanghai" },
  { id: "120.1551,30.2741", name: "杭州", adm1: "浙江省", adm2: "杭州市", country: "中国", lon: "120.1551", lat: "30.2741", tz: "Asia/Shanghai" },
  { id: "104.0665,30.5728", name: "成都", adm1: "四川省", adm2: "成都市", country: "中国", lon: "104.0665", lat: "30.5728", tz: "Asia/Shanghai" },
  { id: "114.3054,30.5931", name: "武汉", adm1: "湖北省", adm2: "武汉市", country: "中国", lon: "114.3054", lat: "30.5931", tz: "Asia/Shanghai" },
  { id: "108.9398,34.3416", name: "西安", adm1: "陕西省", adm2: "西安市", country: "中国", lon: "108.9398", lat: "34.3416", tz: "Asia/Shanghai" }
];

function hourLabel(value: string, index: number): string {
  if (index === 0) return "现在";
  return new Intl.DateTimeFormat("zh-CN", { hour: "numeric", hour12: false }).format(new Date(value));
}

function dayLabel(value: string, index: number): string {
  if (index === 0) return "今天";
  if (index === 1) return "明天";
  return new Intl.DateTimeFormat("zh-CN", { weekday: "short" }).format(new Date(`${value}T12:00:00`));
}

function themeClass(code: string): string {
  const number = Number(code);
  const night = number >= 150 && number < 200;
  if ((number >= 300 && number <= 399) || number === 305) return "theme-rain";
  if (number >= 400 && number <= 499) return "theme-snow";
  if (number >= 500) return "theme-fog";
  if (night) return "theme-night";
  if ([100, 101, 102, 103].includes(number)) return "theme-clear";
  return "theme-cloud";
}

function aqiLevel(aqi?: number): string {
  if (aqi == null) return "暂无";
  if (aqi <= 50) return "优";
  if (aqi <= 100) return "良";
  if (aqi <= 150) return "轻度污染";
  if (aqi <= 200) return "中度污染";
  return "重度污染";
}

export default function HomePage() {
  const [weather, setWeather] = useState<WeatherPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const [searching, setSearching] = useState(false);
  const [activeLocation, setActiveLocation] = useState(defaultLocation);
  const [activePlace, setActivePlace] = useState<Place>(defaultPlace);
  const [savedPlaces, setSavedPlaces] = useState<Place[]>([defaultPlace]);
  const requestId = useRef(0);

  const loadWeather = useCallback(async (location: string, place?: Place) => {
    const id = ++requestId.current;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ location });
      if (place) {
        params.set("name", place.name);
        if (place.adm1) params.set("adm1", place.adm1);
        if (place.adm2) params.set("adm2", place.adm2);
        if (place.country) params.set("country", place.country);
      }
      const response = await fetch(`/api/weather?${params}`);
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "天气数据加载失败");
      if (id === requestId.current) {
        setWeather(body);
        setActiveLocation(location);
        if (place) setActivePlace(place);
      }
    } catch (cause) {
      if (id === requestId.current) setError(cause instanceof Error ? cause.message : "天气数据加载失败");
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let initialPlace = defaultPlace;
    try {
      const storedCities = window.localStorage.getItem(cityStorageKey);
      const storedActive = window.localStorage.getItem(activeCityStorageKey);
      if (storedCities) {
        const parsed = JSON.parse(storedCities) as Place[];
        if (Array.isArray(parsed) && parsed.length > 0) setSavedPlaces(parsed.slice(0, 8));
      }
      if (storedActive) initialPlace = JSON.parse(storedActive) as Place;
    } catch {
      // Ignore damaged local data and fall back to the configured default city.
    }
    setActivePlace(initialPlace);
    setActiveLocation(initialPlace.id);
    loadWeather(initialPlace.id, initialPlace);
  }, [loadWeather]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      setSearching(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        const body = await response.json();
        setResults(response.ok ? body.locations ?? [] : []);
      } finally {
        setSearching(false);
      }
    }, 280);
    return () => window.clearTimeout(timer);
  }, [query]);

  const locate = () => {
    if (!navigator.geolocation) {
      setError("当前浏览器不支持定位");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const value = `${position.coords.longitude.toFixed(4)},${position.coords.latitude.toFixed(4)}`;
        const place: Place = {
          id: value,
          name: "当前位置",
          adm1: "",
          adm2: "",
          country: "",
          lon: String(position.coords.longitude),
          lat: String(position.coords.latitude),
          tz: "auto"
        };
        const nextSaved = [place, ...savedPlaces.filter((item) => item.id !== place.id)].slice(0, 8);
        setSavedPlaces(nextSaved);
        try {
          window.localStorage.setItem(cityStorageKey, JSON.stringify(nextSaved));
          window.localStorage.setItem(activeCityStorageKey, JSON.stringify(place));
        } catch {
          // Ignore storage restrictions.
        }
        loadWeather(value, place);
      },
      () => setError("定位失败，请检查浏览器的位置权限"),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 10 * 60 * 1000 }
    );
  };

  const selectPlace = (place: Place) => {
    const nextSaved = [place, ...savedPlaces.filter((item) => item.id !== place.id)].slice(0, 8);
    setSavedPlaces(nextSaved);
    setSearchOpen(false);
    setQuery("");
    setResults([]);
    try {
      window.localStorage.setItem(cityStorageKey, JSON.stringify(nextSaved));
      window.localStorage.setItem(activeCityStorageKey, JSON.stringify(place));
    } catch {
      // The website still works when storage is blocked.
    }
    loadWeather(place.id, place);
  };

  const minutelyMax = useMemo(() => {
    const values = weather?.minutely?.minutely.map((item) => Number(item.precip)) ?? [];
    return Math.max(...values, 0.1);
  }, [weather]);

  const dailyMin = Math.min(...(weather?.daily.map((day) => Number(day.tempMin)) ?? [0]));
  const dailyMax = Math.max(...(weather?.daily.map((day) => Number(day.tempMax)) ?? [1]));
  const range = Math.max(dailyMax - dailyMin, 1);

  return (
    <main className={`weather-app ${weather ? themeClass(weather.now.icon) : "theme-clear"}`}>
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="topbar shell">
        <button className="round-button" aria-label="选择城市" onClick={() => setSearchOpen(true)}>
          <Search size={21} />
        </button>
        <div className="brand"><span className="brand-dot" />清朗天气</div>
        <div className="top-actions">
          <button className="round-button" aria-label="使用当前位置" onClick={locate}><LocateFixed size={21} /></button>
          <button className="round-button" aria-label="刷新" onClick={() => loadWeather(activeLocation, activePlace)}><RefreshCw size={20} className={loading ? "spinning" : ""} /></button>
        </div>
      </header>

      <section className="shell page-content">
        {error && <div className="error-banner">{error}</div>}

        <section className="hero">
          <button className="hero-location-button" onClick={() => setSearchOpen(true)} aria-label="切换城市">
            <span className="location-line"><MapPin size={15} />{weather?.location.adm2 || weather?.location.name || "正在定位"}<ChevronDown size={15} /></span>
            <span className="hero-city-name">{weather?.location.name ?? "天气"}</span>
          </button>
          <div className="hero-temperature">{weather?.now.temp ?? "--"}<sup>°</sup></div>
          <div className="hero-condition">{weather?.now.text ?? (loading ? "正在更新…" : "暂无数据")}</div>
          <div className="hero-range">
            最高 {weather?.daily[0]?.tempMax ?? "--"}°　最低 {weather?.daily[0]?.tempMin ?? "--"}°
          </div>
        </section>

        {weather?.alerts?.length ? (
          <section className="alert-card glass-card">
            <div className="alert-dot" style={{ background: weather.alerts[0].color ? `rgb(${weather.alerts[0].color.red},${weather.alerts[0].color.green},${weather.alerts[0].color.blue})` : undefined }} />
            <div><strong>{weather.alerts[0].headline}</strong><p>{weather.alerts[0].description}</p></div>
            <ChevronRight size={20} />
          </section>
        ) : null}

        <div className="content-grid">
          <section className="glass-card card-span-2">
            <div className="card-title"><CloudRain size={17} />未来两小时降水 · 15分钟间隔</div>
            <div className="rain-summary">{weather?.minutely?.summary ?? "当前地点暂无分钟级降水数据"}</div>
            <div className="rain-chart" aria-label="未来两小时降水图">
              {(weather?.minutely?.minutely ?? Array.from({ length: 24 }, () => ({ precip: "0" }))).map((item, index) => (
                <div className="rain-column" key={index}>
                  <span style={{ height: `${Math.max(2, (Number(item.precip) / minutelyMax) * 100)}%` }} />
                </div>
              ))}
            </div>
            <div className="chart-labels"><span>现在</span><span>1小时</span><span>2小时</span></div>
          </section>

          <section className="glass-card card-span-2 hourly-card">
            <div className="card-title"><Gauge size={17} />逐小时预报</div>
            <div className="hourly-scroll">
              {weather?.hourly.map((hour, index) => (
                <div className="hour-item" key={hour.fxTime}>
                  <span>{hourLabel(hour.fxTime, index)}</span>
                  <WeatherIcon code={hour.icon} size={30} />
                  <strong>{hour.temp}°</strong>
                  <small>{Number(hour.pop ?? 0) > 0 ? `${hour.pop}%` : "　"}</small>
                </div>
              ))}
            </div>
          </section>

          <section className="glass-card card-span-2">
            <div className="card-title"><Compass size={17} />7日天气</div>
            <div className="daily-list">
              {weather?.daily.map((day, index) => {
                const left = ((Number(day.tempMin) - dailyMin) / range) * 58;
                const width = Math.max(18, ((Number(day.tempMax) - Number(day.tempMin)) / range) * 58);
                return (
                  <div className="day-row" key={day.fxDate}>
                    <strong>{dayLabel(day.fxDate, index)}</strong>
                    <span className="day-rain">{Number(day.precip ?? 0) > 0 ? `${day.precip}mm` : ""}</span>
                    <WeatherIcon code={day.iconDay} size={28} />
                    <span className="temp-low">{day.tempMin}°</span>
                    <div className="temperature-track"><span style={{ left: `${left}%`, width: `${width}%` }} /></div>
                    <span className="temp-high">{day.tempMax}°</span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="detail-card glass-card">
            <div className="card-title"><Thermometer size={17} />体感温度</div>
            <strong>{weather?.now.feelsLike ?? "--"}°</strong>
            <p>体感与实际温度{weather && Number(weather.now.feelsLike) > Number(weather.now.temp) ? "略高" : "接近"}</p>
          </section>

          <section className="detail-card glass-card">
            <div className="card-title"><Droplets size={17} />湿度</div>
            <strong>{weather?.now.humidity ?? "--"}%</strong>
            <p>露点与闷热感会受湿度影响</p>
          </section>

          <section className="detail-card glass-card">
            <div className="card-title"><Wind size={17} />风</div>
            <strong>{weather?.now.windSpeed ?? "--"}<small> km/h</small></strong>
            <p>{weather?.now.windDir ?? "--"} · {weather?.now.windScale ?? "--"}级</p>
          </section>

          <section className="detail-card glass-card">
            <div className="card-title"><Eye size={17} />能见度</div>
            <strong>{weather?.now.vis ?? "--"}<small> km</small></strong>
            <p>当前观测站附近水平能见度</p>
          </section>

          <section className="detail-card glass-card air-card">
            <div className="card-title"><Navigation size={17} />空气质量</div>
            <strong>{weather?.air?.aqi ?? "--"}</strong>
            <p>{weather?.air?.category ?? aqiLevel(weather?.air?.aqi)}{weather?.air?.advice ? ` · ${weather.air.advice}` : ""}</p>
            <div className="aqi-bar"><span style={{ width: `${Math.min(100, ((weather?.air?.aqi ?? 0) / 300) * 100)}%` }} /></div>
          </section>

          <section className="detail-card glass-card sun-card">
            <div className="card-title"><SunMedium size={17} />日落</div>
            <strong>{weather?.daily[0]?.sunset ?? "--:--"}</strong>
            <p>日出 {weather?.daily[0]?.sunrise ?? "--:--"}</p>
            <div className="sun-arc"><span /></div>
          </section>
        </div>

        <footer>
          <span>最近更新：{weather ? new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit" }).format(new Date(weather.updateTime)) : "--:--"}</span>
          <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">天气数据：Open-Meteo · 空气质量：CAMS</a>
        </footer>
      </section>

      {searchOpen && (
        <div
          className="search-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="选择城市"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSearchOpen(false);
          }}
        >
          <div className="search-panel">
            <div className="search-header">
              <div className="search-input-wrap"><Search size={20} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索城市或地区" /><button aria-label="清空" onClick={() => setQuery("")}><X size={18} /></button></div>
              <button className="text-button" onClick={() => setSearchOpen(false)}>完成</button>
            </div>
            <button className="current-location-row" onClick={() => { setSearchOpen(false); locate(); }}><LocateFixed size={20} /><span><strong>我的位置</strong><small>使用浏览器定位并显示当地天气</small></span><ChevronRight size={19} /></button>
            <div className="search-results">
              {searching && <div className="search-state">正在搜索…</div>}
              {!searching && query && results.length === 0 && <div className="search-state">没有找到匹配地点</div>}
              {query && results.map((place) => (
                <button key={place.id} className="place-row" onClick={() => selectPlace(place)}>
                  <MapPin size={19} />
                  <span><strong>{place.name}</strong><small>{[place.adm2, place.adm1, place.country].filter((item, index, array) => item && array.indexOf(item) === index).join(" · ")}</small></span>
                  {activePlace.id === place.id ? <Check size={19} /> : <ChevronRight size={19} />}
                </button>
              ))}

              {!query && (
                <>
                  <div className="city-section">
                    <div className="city-section-title"><span>最近城市</span><small>最多保留 8 个</small></div>
                    <div className="saved-city-grid">
                      {savedPlaces.map((place) => (
                        <button key={place.id} className={`saved-city-card ${activePlace.id === place.id ? "active" : ""}`} onClick={() => selectPlace(place)}>
                          <span><strong>{place.name}</strong><small>{place.adm1 || place.country || "已保存地点"}</small></span>
                          {activePlace.id === place.id && <Check size={18} />}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="city-section popular-section">
                    <div className="city-section-title"><span>热门城市</span><small>点击即可切换</small></div>
                    <div className="popular-city-grid">
                      {popularPlaces.map((place) => (
                        <button key={place.id} onClick={() => selectPlace(place)}>{place.name}</button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
