import { NextResponse } from "next/server";
import { getWeather } from "@/lib/weather";

export async function GET() {
  try {
    const weather = await getWeather();
    return NextResponse.json(weather);
  } catch (error) {
    console.error("Weather fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch weather" },
      { status: 500 }
    );
  }
}
