import { NextRequest, NextResponse } from "next/server";
import { generateOutfit, generateOutfitImage } from "@/lib/claude";
import { getWeather } from "@/lib/weather";
import { createServerSupabase } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const { mood, occasion } = await request.json();

    if (!mood || !occasion) {
      return NextResponse.json(
        { error: "Missing mood or occasion" },
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

    const { data: wardrobe } = await supabase
      .from("wardrobe_items")
      .select("*")
      .eq("user_id", user.id);

    if (!wardrobe || wardrobe.length === 0) {
      return NextResponse.json(
        { error: "No wardrobe items found. Add some clothes first!" },
        { status: 400 }
      );
    }

    const weather = await getWeather();

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

    const result = await generateOutfit(wardrobe, mood, occasion, weather, fullProfile);

    // Build outfit description for image generation
    const outfitItems = wardrobe.filter((item) =>
      result.outfit_items.includes(item.id)
    );
    const outfitDescription = outfitItems
      .map((item) => item.description)
      .join(", ");

    // Generate outfit image via Gemini (don't block if it fails)
    let outfitImage = null;
    try {
      outfitImage = await generateOutfitImage(
        outfitDescription,
        occasion,
        fullProfile
      );
    } catch (imgError) {
      console.error("Image generation failed:", imgError);
    }

    return NextResponse.json({ ...result, weather, outfitImage });
  } catch (error) {
    console.error("Outfit generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate outfit" },
      { status: 500 }
    );
  }
}