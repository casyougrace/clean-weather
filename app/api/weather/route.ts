import { NextRequest, NextResponse } from "next/server";
import { getOpenMeteoWeather } from "@/lib/openmeteo";
import type { Place } from "@/lib/types";

export const runtime = "nodejs";

const DEFAULT_COORDINATE = process.env.NEXT_PUBLIC_DEFAULT_LOCATION ?? "117.23,31.82";
const DEFAULT_NAME = process.env.NEXT_PUBLIC_DEFAULT_LOCATION_NAME ?? "合肥";

function parseCoordinate(value: string): { lon: number; lat: number } | null {
  const [lon, lat] = value.split(",").map(Number);
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
  if (Math.abs(lon) > 180 || Math.abs(lat) > 90) return null;
  return { lon, lat };
}

export async function GET(request: NextRequest) {
  const rawLocation = request.nextUrl.searchParams.get("location") ?? DEFAULT_COORDINATE;
  const coordinate = parseCoordinate(rawLocation);
  if (!coordinate) return NextResponse.json({ error: "地点坐标格式无效" }, { status: 400 });

  const place: Place = {
    id: `${coordinate.lon},${coordinate.lat}`,
    name: request.nextUrl.searchParams.get("name") || (rawLocation === DEFAULT_COORDINATE ? DEFAULT_NAME : "当前位置"),
    adm1: request.nextUrl.searchParams.get("adm1") ?? "",
    adm2: request.nextUrl.searchParams.get("adm2") ?? "",
    country: request.nextUrl.searchParams.get("country") ?? "",
    lon: String(coordinate.lon),
    lat: String(coordinate.lat),
    tz: "auto"
  };

  try {
    const payload = await getOpenMeteoWeather(place);
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "天气数据加载失败" }, { status: 502 });
  }
}
