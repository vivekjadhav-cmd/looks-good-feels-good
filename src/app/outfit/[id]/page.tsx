"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase";
import { Outfit, WardrobeItem } from "@/types";
import AppShell from "@/components/layout/AppShell";
import { Skeleton } from "@/components/ui/Skeleton";
import { format, parseISO } from "date-fns";
import {
  ArrowLeft,
  Shirt,
  Palette,
  Sparkles,
  CloudSun,
  CalendarDays,
  Trash2,
} from "lucide-react";
import Button from "@/components/ui/Button";

export default function OutfitDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [outfit, setOutfit] = useState<Outfit | null>(null);
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: outfitData } = await supabase
        .from("outfits")
        .select("*")
        .eq("id", id)
        .single();

      if (!outfitData) {
        setLoading(false);
        return;
      }

      setOutfit(outfitData as Outfit);

      const { data: wardrobeData } = await supabase
        .from("wardrobe_items")
        .select("*")
        .in("id", outfitData.item_ids);

      setItems((wardrobeData as WardrobeItem[]) || []);
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleDelete() {
    if (!outfit) return;
    setDeleting(true);
    await supabase.from("outfits").delete().eq("id", outfit.id);
    router.push("/calendar");
  }

  if (loading) {
    return (
      <AppShell>
        <div className="page-container space-y-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </AppShell>
    );
  }

  if (!outfit) {
    return (
      <AppShell>
        <div className="page-container text-center py-16">
          <p className="text-2xl mb-3">🤔</p>
          <p className="text-body-md text-neutral-600">
            Outfit not found — it may have been deleted.
          </p>
          <Button
            variant="ghost"
            onClick={() => router.push("/calendar")}
            className="mt-4"
          >
            ← Back to calendar
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="page-container">
        {/* Back button + date */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => router.back()}
            className="text-neutral-600 hover:text-neutral-800 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2 text-body-sm text-warm-600">
            <CalendarDays size={14} />
            {format(parseISO(outfit.outfit_date), "EEEE, MMMM d, yyyy")}
          </div>
        </div>

        {/* Vibe line hero */}
        {outfit.vibe_line && (
          <div className="bg-warm-50 rounded-card px-5 py-4 text-center mb-5">
            <p className="font-display text-heading-md text-warm-800">
              {outfit.vibe_line}
            </p>
          </div>
        )}

        {/* Occasion + mood tags */}
        <div className="flex flex-wrap gap-2 mb-5">
          {outfit.occasion && (
            <span className="chip-sage">{outfit.occasion}</span>
          )}
          {outfit.mood && <span className="chip-blush">{outfit.mood}</span>}
          {outfit.weather_temp && (
            <span className="chip-warm">
              {outfit.weather_temp}°C · {outfit.weather_condition}
            </span>
          )}
        </div>

        {/* Outfit items — large grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {items.map((item) => (
            <div key={item.id}>
              <div className="aspect-square rounded-card overflow-hidden bg-neutral-100 shadow-soft">
                <Image
                  src={item.image_url}
                  alt={item.description || "Outfit item"}
                  width={400}
                  height={400}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="mt-1.5 px-0.5">
                <p className="text-body-sm font-medium text-neutral-800 truncate">
                  {item.description}
                </p>
                <p className="text-[11px] text-neutral-400 capitalize">
                  {item.item_type.replace("_", " ")} · {item.pattern}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Styling details */}
        <div className="space-y-3 mb-6">
          {outfit.styling_notes && (
            <div className="flex items-start gap-3 bg-sage-50 rounded-card p-4">
              <Shirt size={18} className="text-sage-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-body-sm font-medium text-sage-800 mb-1">
                  How to wear it
                </p>
                <p className="text-body-md text-sage-600 leading-relaxed">
                  {outfit.styling_notes}
                </p>
              </div>
            </div>
          )}

          {outfit.makeup_tip && (
            <div className="flex items-start gap-3 bg-blush-50 rounded-card p-4">
              <Palette
                size={18}
                className="text-blush-600 mt-0.5 flex-shrink-0"
              />
              <div>
                <p className="text-body-sm font-medium text-blush-600 mb-1">
                  Makeup look
                </p>
                <p className="text-body-md text-blush-600 leading-relaxed">
                  {outfit.makeup_tip}
                </p>
              </div>
            </div>
          )}

          {outfit.accessory_tip && (
            <div className="flex items-start gap-3 bg-warm-50 rounded-card p-4">
              <Sparkles
                size={18}
                className="text-warm-600 mt-0.5 flex-shrink-0"
              />
              <div>
                <p className="text-body-sm font-medium text-warm-800 mb-1">
                  Accessories
                </p>
                <p className="text-body-md text-warm-600 leading-relaxed">
                  {outfit.accessory_tip}
                </p>
              </div>
            </div>
          )}

          {outfit.weather_note && (
            <div className="flex items-start gap-3 bg-neutral-100 rounded-card p-4">
              <CloudSun
                size={18}
                className="text-neutral-600 mt-0.5 flex-shrink-0"
              />
              <div>
                <p className="text-body-sm font-medium text-neutral-800 mb-1">
                  Weather check
                </p>
                <p className="text-body-md text-neutral-600 leading-relaxed">
                  {outfit.weather_note}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Delete */}
        <Button
          variant="ghost"
          onClick={handleDelete}
          loading={deleting}
          className="w-full flex items-center justify-center gap-2 text-blush-600"
        >
          <Trash2 size={14} />
          Delete this outfit
        </Button>
      </div>
    </AppShell>
  );
}
