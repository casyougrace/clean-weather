import { NextRequest, NextResponse } from "next/server";
import { openMeteoFetch, type OpenMeteoGeocodingResponse } from "@/lib/openmeteo";
import type { Place } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (query.length < 2) return NextResponse.json({ locations: [] });

  try {
    const params = new URLSearchParams({
      name: query,
      count: "10",
      language: "zh",
      format: "json"
    });
    const data = await openMeteoFetch<OpenMeteoGeocodingResponse>(
      `https://geocoding-api.open-meteo.com/v1/search?${params}`,
      86400
    );

    const locations: Place[] = (data.results ?? []).map((item) => ({
      id: `${item.longitude},${item.latitude}`,
      name: item.name,
      adm1: item.admin1 ?? "",
      adm2: item.admin2 ?? "",
      country: item.country ?? item.country_code ?? "",
      lat: String(item.latitude),
      lon: String(item.longitude),
      tz: item.timezone ?? "auto"
    }));

    return NextResponse.json({ locations }, {
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "城市搜索失败" }, { status: 502 });
  }
}
