import { NextRequest, NextResponse } from "next/server";
import { generateOutfit, generateOutfitImage } from "@/lib/claude";
import { getWeather } from "@/lib/weather";
import { createServerSupabase } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const { mood, occasion } = await request.json();

    if (!mood || !occasion) {
      return NextResponse.json({ error: "Missing mood or occasion" }, { status: 400 });
    }

    const supabase = await createServerSupabase();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Re-fetch profile fresh each time to get latest photo URL
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
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

    // Fetch last 5 outfits to avoid repetition
    const { data: recentOutfits } = await supabase
      .from("outfits")
      .select("item_ids")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    const recentOutfitItemIds = (recentOutfits || []).map((o: any) => o.item_ids || []);

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

    const result = await generateOutfit(
      wardrobe, mood, occasion, weather, fullProfile, recentOutfitItemIds
    );

    // Build outfit description for image generation
    const outfitItems = wardrobe.filter((item: any) =>
      result.outfit_items.includes(item.id)
    );
    const outfitDescription = outfitItems
      .map((item: any) => item.description)
      .join(", ");

    // Fetch profile photo as base64 for Gemini reference
    // Use cache-busting to ensure we get the latest photo
    let profilePhotoBase64: string | null = null;
    if (profile.profile_photo_url) {
      try {
        const cacheBuster = `?t=${Date.now()}`;
        const photoUrl = profile.profile_photo_url.includes("?")
          ? `${profile.profile_photo_url}&cb=${Date.now()}`
          : `${profile.profile_photo_url}${cacheBuster}`;

        console.log("Fetching profile photo:", photoUrl);

        const photoResponse = await fetch(photoUrl, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });

        if (photoResponse.ok) {
          const buffer = await photoResponse.arrayBuffer();
          profilePhotoBase64 = Buffer.from(buffer).toString("base64");
          console.log("Profile photo fetched successfully, size:", profilePhotoBase64.length);
        } else {
          console.error("Profile photo fetch failed:", photoResponse.status);
        }
      } catch (photoErr) {
        console.error("Failed to fetch profile photo:", photoErr);
      }
    } else {
      console.log("No profile photo URL found");
    }

    // Generate outfit image via Gemini with profile photo reference
    let outfitImage = null;
    try {
      outfitImage = await generateOutfitImage(
        outfitDescription,
        occasion,
        fullProfile,
        profilePhotoBase64
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
