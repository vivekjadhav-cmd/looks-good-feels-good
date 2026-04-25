import { NextRequest, NextResponse } from "next/server";
import { generateOutfitImage } from "@/lib/claude";
import { createServerSupabase } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const { outfitDescription, occasion } = await request.json();

    if (!outfitDescription || !occasion) {
      return NextResponse.json(
        { error: "Missing outfitDescription or occasion" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabase();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    // Reconstruct physical_profile from flat DB columns
    const fullProfile = {
      ...profile,
      physical_profile: profile.height_estimate
        ? {
            height_estimate: profile.height_estimate,
            body_shape: profile.body_shape,
            skin_tone: profile.skin_tone,
            skin_undertone: profile.skin_undertone,
            hair_length: profile.hair_length,
            hair_color: profile.hair_color,
            hair_texture: profile.hair_texture,
            size_estimate: profile.size_estimate,
          }
        : null,
    };

    const imageDataUrl = await generateOutfitImage(
      outfitDescription,
      occasion,
      fullProfile
    );

    if (!imageDataUrl) {
      return NextResponse.json(
        { error: "Image generation failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ image: imageDataUrl });
  } catch (error) {
    console.error("Image generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate outfit image" },
      { status: 500 }
    );
  }
}
