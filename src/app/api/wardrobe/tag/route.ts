import { NextRequest, NextResponse } from "next/server";
import { tagWardrobeItem } from "@/lib/claude";

export async function POST(request: NextRequest) {
  try {
    const { image, mediaType } = await request.json();

    if (!image || !mediaType) {
      return NextResponse.json(
        { error: "Missing image or mediaType" },
        { status: 400 }
      );
    }

    const tags = await tagWardrobeItem(image, mediaType);
    return NextResponse.json(tags);
  } catch (error) {
    console.error("Tagging error:", error);
    return NextResponse.json(
      { error: "Failed to tag item" },
      { status: 500 }
    );
  }
}
