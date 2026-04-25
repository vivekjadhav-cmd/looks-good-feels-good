"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase";
import { Outfit, WardrobeItem } from "@/types";
import AppShell from "@/components/layout/AppShell";
import { WardrobeGridSkeleton } from "@/components/ui/Skeleton";
import { format, parseISO } from "date-fns";
import { CalendarDays, Sparkles } from "lucide-react";

export default function CalendarPage() {
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const [outfitRes, wardrobeRes] = await Promise.all([
        supabase
          .from("outfits")
          .select("*")
          .order("outfit_date", { ascending: false }),
        supabase.from("wardrobe_items").select("*"),
      ]);

      setOutfits((outfitRes.data as Outfit[]) || []);
      setWardrobe((wardrobeRes.data as WardrobeItem[]) || []);
      setLoading(false);
    }
    load();
  }, []);

  function getItemsForOutfit(outfit: Outfit): WardrobeItem[] {
    return wardrobe.filter((w) => outfit.item_ids.includes(w.id));
  }

  // Group outfits by date
  const grouped = outfits.reduce(
    (acc, outfit) => {
      const date = outfit.outfit_date;
      if (!acc[date]) acc[date] = [];
      acc[date].push(outfit);
      return acc;
    },
    {} as Record<string, Outfit[]>
  );

  return (
    <AppShell>
      <div className="page-container">
        <div className="mb-6">
          <h1 className="font-display text-heading-lg text-warm-800 mb-1">
            Outfit calendar
          </h1>
          <p className="text-body-sm text-neutral-600">
            Your style history — never repeat an outfit accidentally
          </p>
        </div>

        {loading ? (
          <WardrobeGridSkeleton />
        ) : outfits.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📅</div>
            <h3 className="font-display text-heading-sm text-warm-800 mb-2">
              No outfits saved yet
            </h3>
            <p className="text-body-md text-neutral-600 mb-6">
              Head to Style Me and save your first look!
            </p>
            <a href="/style-me" className="btn-primary inline-flex items-center gap-2">
              <Sparkles size={16} />
              Style me
            </a>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([date, dateOutfits]) => (
              <div key={date}>
                <div className="flex items-center gap-2 mb-3">
                  <CalendarDays size={14} className="text-warm-600" />
                  <h3 className="text-body-sm font-medium text-warm-600">
                    {format(parseISO(date), "EEEE, MMMM d")}
                  </h3>
                </div>

                <div className="space-y-3">
                  {dateOutfits.map((outfit) => {
                    const items = getItemsForOutfit(outfit);
                    return (
                      <a
                        key={outfit.id}
                        href={`/outfit/${outfit.id}`}
                        className="card block hover:shadow-lifted transition-shadow duration-200"
                      >
                        {/* Vibe line */}
                        {outfit.vibe_line && (
                          <p className="font-display text-body-md text-warm-800 mb-3">
                            {outfit.vibe_line}
                          </p>
                        )}

                        {/* Mini item grid */}
                        <div className="flex gap-2 mb-3">
                          {items.slice(0, 4).map((item) => (
                            <div
                              key={item.id}
                              className="w-16 h-16 rounded-lg overflow-hidden bg-neutral-100 flex-shrink-0"
                            >
                              <Image
                                src={item.image_url}
                                alt={item.description || ""}
                                width={64}
                                height={64}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                          {items.length > 4 && (
                            <div className="w-16 h-16 rounded-lg bg-neutral-100 flex items-center justify-center text-body-sm text-neutral-600">
                              +{items.length - 4}
                            </div>
                          )}
                        </div>

                        {/* Tags */}
                        <div className="flex gap-2">
                          {outfit.occasion && (
                            <span className="chip-sage text-[11px]">
                              {outfit.occasion}
                            </span>
                          )}
                          {outfit.mood && (
                            <span className="chip-blush text-[11px]">
                              {outfit.mood}
                            </span>
                          )}
                          {outfit.weather_temp && (
                            <span className="chip-warm text-[11px]">
                              {outfit.weather_temp}°C
                            </span>
                          )}
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
