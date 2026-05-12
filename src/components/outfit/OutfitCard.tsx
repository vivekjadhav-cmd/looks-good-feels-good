"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { AIOutfitResult, WardrobeItem, WeatherData } from "@/types";
import Button from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import {
  Heart,
  Calendar,
  Shirt,
  Palette,
  Sparkles,
  CloudSun,
  Ruler,
  Paintbrush,
  Share2,
} from "lucide-react";

interface OutfitCardProps {
  result: AIOutfitResult & { outfitImage?: string | null };
  wardrobeItems: WardrobeItem[];
  mood: string;
  occasion: string;
  weather: WeatherData;
}

export default function OutfitCard({
  result,
  wardrobeItems,
  mood,
  occasion,
  weather,
}: OutfitCardProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sharing, setSharing] = useState(false);
  const supabase = createClient();

  const outfitItems = wardrobeItems.filter((item) =>
    result.outfit_items.includes(item.id)
  );

  async function handleSave() {
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase.from("outfits").insert({
      user_id: user.id,
      item_ids: result.outfit_items,
      occasion,
      mood,
      weather_temp: weather.temperature,
      weather_condition: weather.condition,
      styling_notes: result.styling_notes,
      color_analysis: result.color_analysis,
      hair_suggestion: result.hair_suggestion,
      makeup_tip: result.makeup_tip,
      accessory_tip: result.accessory_tip,
      vibe_line: result.vibe_line,
      weather_note: result.weather_note,
      height_fit_tips: result.height_fit_tips,
      outfit_image_url: result.outfitImage || null,
    });

    if (error) {
      toast("Couldn't save — try again!", "error");
    } else {
      setSaved(true);
      toast("Outfit saved to your calendar!");
    }
    setSaving(false);
  }

  async function handleShare() {
    setSharing(true);
    const shareText = `${result.vibe_line}\n\nStyled by Looks Good, Feels Good\nhttps://looks-good-feels-good.vercel.app`;

    // Try native share API first (works on mobile)
    if (navigator.share && result.outfitImage) {
      try {
        // Convert base64 to blob for sharing
        const response = await fetch(result.outfitImage);
        const blob = await response.blob();
        const file = new File([blob], "my-outfit.png", { type: "image/png" });

        await navigator.share({
          text: shareText,
          files: [file],
        });
        setSharing(false);
        return;
      } catch {
        // Fall through to clipboard
      }
    }

    // Fallback: copy text + link to clipboard
    try {
      await navigator.clipboard.writeText(shareText);
      toast("Copied! Paste it in WhatsApp or any chat");
    } catch {
      toast("Couldn't copy — try again", "error");
    }
    setSharing(false);
  }

  return (
    <div className="card space-y-4">
      {/* Vibe line */}
      <div className="bg-warm-50 rounded-card px-4 py-3 text-center">
        <p className="font-display text-heading-sm text-warm-800">
          {result.vibe_line}
        </p>
      </div>

      {/* AI Generated outfit image */}
      {result.outfitImage && (
        <div className="rounded-card overflow-hidden shadow-soft">
          <img
            src={result.outfitImage}
            alt="Your outfit styled"
            className="w-full h-auto"
          />
        </div>
      )}

      {/* Share button (#5) */}
      <button
        onClick={handleShare}
        disabled={sharing}
        className="w-full flex items-center justify-center gap-2 bg-warm-50 text-warm-800 font-medium py-2.5 rounded-card hover:bg-warm-100 transition-colors text-body-sm"
      >
        <Share2 size={15} />
        {sharing ? "Sharing..." : "Share this look"}
      </button>

      {/* Outfit items as compact tags */}
      <div>
        <p className="text-body-sm font-medium text-neutral-600 mb-2">
          Your pieces
        </p>
        <div className="flex flex-wrap gap-1">
          {outfitItems.map((item) => (
            <span key={item.id} className="chip-warm text-[11px]">
              {item.description}
            </span>
          ))}
        </div>
      </div>

      {/* Styling details — concise (#6) */}
      <div className="space-y-2">
        <div className="flex items-start gap-3 bg-sage-50 rounded-card p-3">
          <Shirt size={14} className="text-sage-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[11px] font-medium text-sage-800 mb-0.5">
              How to wear it
            </p>
            <p className="text-[12px] text-sage-600 leading-relaxed">
              {result.styling_notes}
            </p>
          </div>
        </div>

        {result.color_analysis && (
          <div className="flex items-start gap-3 bg-warm-50 rounded-card p-3">
            <Paintbrush size={14} className="text-warm-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[11px] font-medium text-warm-800 mb-0.5">
                Colors
              </p>
              <p className="text-[12px] text-warm-600 leading-relaxed">
                {result.color_analysis}
              </p>
            </div>
          </div>
        )}

        {result.hair_suggestion && (
          <div className="flex items-start gap-3 bg-neutral-100 rounded-card p-3">
            <Sparkles size={14} className="text-neutral-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[11px] font-medium text-neutral-800 mb-0.5">
                Hair
              </p>
              <p className="text-[12px] text-neutral-600 leading-relaxed">
                {result.hair_suggestion}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-start gap-3 bg-blush-50 rounded-card p-3">
          <Palette size={14} className="text-blush-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[11px] font-medium text-blush-600 mb-0.5">
              Makeup
            </p>
            <p className="text-[12px] text-blush-600 leading-relaxed">
              {result.makeup_tip}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 bg-warm-50 rounded-card p-3">
          <Sparkles size={14} className="text-warm-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[11px] font-medium text-warm-800 mb-0.5">
              Accessories
            </p>
            <p className="text-[12px] text-warm-600 leading-relaxed">
              {result.accessory_tip}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 bg-sage-50 rounded-card p-3">
          <CloudSun size={14} className="text-sage-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[11px] font-medium text-sage-800 mb-0.5">
              Weather
            </p>
            <p className="text-[12px] text-sage-600 leading-relaxed">
              {result.weather_note}
            </p>
          </div>
        </div>

        {result.height_fit_tips && (
          <div className="flex items-start gap-3 bg-neutral-100 rounded-card p-3">
            <Ruler size={14} className="text-neutral-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[11px] font-medium text-neutral-800 mb-0.5">
                Fit tips
              </p>
              <p className="text-[12px] text-neutral-600 leading-relaxed">
                {result.height_fit_tips}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Save button */}
      <Button
        onClick={handleSave}
        className="w-full flex items-center justify-center gap-2"
        loading={saving}
        disabled={saved}
        variant={saved ? "secondary" : "primary"}
      >
        {saved ? (
          <>
            <Calendar size={16} />
            Saved to calendar!
          </>
        ) : (
          <>
            <Heart size={16} />
            Save this outfit
          </>
        )}
      </Button>
    </div>
  );
}
