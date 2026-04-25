import { NextRequest, NextResponse } from "next/server";
import { analyzeProfilePhoto } from "@/lib/claude";

export async function POST(request: NextRequest) {
  try {
    const { image, mediaType } = await request.json();

    if (!image || !mediaType) {
      return NextResponse.json(
        { error: "Missing image or mediaType" },
        { status: 400 }
      );
    }

    const analysis = await analyzeProfilePhoto(image, mediaType);
    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Profile analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze profile photo" },
      { status: 500 }
    );
  }
}
