import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudSun,
  Moon,
  Snowflake,
  Sun
} from "lucide-react";

export function WeatherIcon({ code, size = 34, className = "" }: { code: string; size?: number; className?: string }) {
  const value = Number(code);
  const night = value >= 150 && value < 200;
  const props = { size, strokeWidth: 1.7, className, "aria-hidden": true };

  if ([100].includes(value)) return <Sun {...props} />;
  if ([150].includes(value)) return <Moon {...props} />;
  if ([101, 102, 103].includes(value)) return <CloudSun {...props} />;
  if ([151, 152, 153].includes(value)) return <CloudMoon {...props} />;
  if ([104, 154].includes(value)) return <Cloud {...props} />;
  if (value >= 300 && value <= 304) return <CloudLightning {...props} />;
  if (value === 305 || value === 309 || value === 350) return <CloudDrizzle {...props} />;
  if ((value >= 306 && value <= 399) || value === 351) return <CloudRain {...props} />;
  if (value >= 400 && value <= 499) return value === 499 ? <Snowflake {...props} /> : <CloudSnow {...props} />;
  if (value >= 500 && value <= 515) return <CloudFog {...props} />;
  return night ? <CloudMoon {...props} /> : <CloudSun {...props} />;
}
