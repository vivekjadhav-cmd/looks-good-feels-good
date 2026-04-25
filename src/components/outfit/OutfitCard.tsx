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

  return (
    <div className="card space-y-4">
      {/* Vibe line */}
      <div className="bg-warm-50 rounded-card px-4 py-3 text-center">
        <p className="font-display text-heading-sm text-warm-800">
          {result.vibe_line}
        </p>
      </div>

      {/* AI Generated outfit image — 4 photo editorial grid */}
      {result.outfitImage && (
        <div className="rounded-card overflow-hidden shadow-soft">
          <img
            src={result.outfitImage}
            alt="Your outfit styled four ways"
            className="w-full h-auto"
          />
        </div>
      )}

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

      {/* Styling details */}
      <div className="space-y-3">
        <div className="flex items-start gap-3 bg-sage-50 rounded-card p-3">
          <Shirt size={16} className="text-sage-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-body-sm font-medium text-sage-800 mb-0.5">
              How to wear it
            </p>
            <p className="text-body-sm text-sage-600">
              {result.styling_notes}
            </p>
          </div>
        </div>

        {result.color_analysis && (
          <div className="flex items-start gap-3 bg-warm-50 rounded-card p-3">
            <Paintbrush
              size={16}
              className="text-warm-600 mt-0.5 flex-shrink-0"
            />
            <div>
              <p className="text-body-sm font-medium text-warm-800 mb-0.5">
                Color analysis
              </p>
              <p className="text-body-sm text-warm-600">
                {result.color_analysis}
              </p>
            </div>
          </div>
        )}

        {result.hair_suggestion && (
          <div className="flex items-start gap-3 bg-neutral-100 rounded-card p-3">
            <Sparkles
              size={16}
              className="text-neutral-600 mt-0.5 flex-shrink-0"
            />
            <div>
              <p className="text-body-sm font-medium text-neutral-800 mb-0.5">
                Hair suggestion
              </p>
              <p className="text-body-sm text-neutral-600">
                {result.hair_suggestion}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-start gap-3 bg-blush-50 rounded-card p-3">
          <Palette
            size={16}
            className="text-blush-600 mt-0.5 flex-shrink-0"
          />
          <div>
            <p className="text-body-sm font-medium text-blush-600 mb-0.5">
              Makeup look
            </p>
            <p className="text-body-sm text-blush-600">{result.makeup_tip}</p>
          </div>
        </div>

        <div className="flex items-start gap-3 bg-warm-50 rounded-card p-3">
          <Sparkles
            size={16}
            className="text-warm-600 mt-0.5 flex-shrink-0"
          />
          <div>
            <p className="text-body-sm font-medium text-warm-800 mb-0.5">
              Accessories
            </p>
            <p className="text-body-sm text-warm-600">
              {result.accessory_tip}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 bg-sage-50 rounded-card p-3">
          <CloudSun
            size={16}
            className="text-sage-600 mt-0.5 flex-shrink-0"
          />
          <div>
            <p className="text-body-sm font-medium text-sage-800 mb-0.5">
              Weather check
            </p>
            <p className="text-body-sm text-sage-600">{result.weather_note}</p>
          </div>
        </div>

        {result.height_fit_tips && (
          <div className="flex items-start gap-3 bg-neutral-100 rounded-card p-3">
            <Ruler
              size={16}
              className="text-neutral-600 mt-0.5 flex-shrink-0"
            />
            <div>
              <p className="text-body-sm font-medium text-neutral-800 mb-0.5">
                Height & fit tips
              </p>
              <p className="text-body-sm text-neutral-600">
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
