"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { AIOutfitResult, WardrobeItem, WeatherData, OCCASIONS, MOODS } from "@/types";
import AppShell from "@/components/layout/AppShell";
import Button from "@/components/ui/Button";
import ChipGroup from "@/components/ui/ChipGroup";
import { OutfitSkeleton } from "@/components/ui/Skeleton";
import OutfitCard from "@/components/outfit/OutfitCard";
import { Sparkles, CloudSun } from "lucide-react";

export default function StyleMePage() {
  const [mood, setMood] = useState<string[]>([]);
  const [occasion, setOccasion] = useState<string[]>([]);
  const [freeText, setFreeText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<(AIOutfitResult & { weather: WeatherData }) | null>(null);
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      const [wardrobeRes, weatherRes] = await Promise.all([
        supabase
          .from("wardrobe_items")
          .select("*")
          .order("created_at", { ascending: false }),
        fetch("/api/weather").then((r) => r.ok ? r.json() : null).catch(() => null),
      ]);
      setWardrobe((wardrobeRes.data as WardrobeItem[]) || []);
      if (weatherRes) setWeather(weatherRes);
    }
    loadData();
  }, []);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setResult(null);

    const moodText = freeText || mood.join(", ");
    const occasionText = occasion.join(", ") || "casual hangout";

    try {
      const res = await fetch("/api/outfit/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood: moodText, occasion: occasionText }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Something went wrong");
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function toggleMood(value: string) {
    setMood((prev) =>
      prev.includes(value) ? prev.filter((m) => m !== value) : [...prev, value]
    );
  }

  function toggleOccasion(value: string) {
    setOccasion([value]); // Single select for occasion
  }

  const canGenerate = (mood.length > 0 || freeText.trim()) && wardrobe.length > 0;

  return (
    <AppShell>
      <div className="page-container">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-display text-heading-lg text-warm-800 mb-1">
                Style me!
              </h1>
              <p className="text-body-md text-neutral-600">
                Tell me your mood and where you&apos;re going — I&apos;ll do the rest
              </p>
            </div>
            {weather && (
              <div className="flex-shrink-0 bg-white rounded-card px-3 py-2 shadow-soft text-center">
                <p className="text-heading-sm text-warm-800 font-medium">
                  {weather.temperature}°
                </p>
                <p className="text-[10px] text-neutral-400">
                  {weather.condition}
                </p>
              </div>
            )}
          </div>
        </div>

        {wardrobe.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-2xl mb-3">👗</p>
            <p className="text-body-md text-neutral-600 mb-4">
              You need some clothes in your wardrobe first!
            </p>
            <a href="/wardrobe/add" className="btn-primary inline-block">
              Add your first item
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Free text input */}
            <div>
              <label className="text-body-sm font-medium text-neutral-600 mb-2 block">
                What&apos;s the vibe? (optional — or use the tags below)
              </label>
              <textarea
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                placeholder="e.g. Going to the mall and feeling excited, or straight to dinner from school..."
                className="input-field resize-none h-20"
              />
            </div>

            {/* Mood chips */}
            <div>
              <label className="text-body-sm font-medium text-neutral-600 mb-2 block">
                How are you feeling?
              </label>
              <ChipGroup
                options={MOODS}
                selected={mood}
                onToggle={toggleMood}
                variant="blush"
                multi
              />
            </div>

            {/* Occasion chips */}
            <div>
              <label className="text-body-sm font-medium text-neutral-600 mb-2 block">
                Where are you going?
              </label>
              <ChipGroup
                options={OCCASIONS}
                selected={occasion}
                onToggle={toggleOccasion}
                variant="sage"
              />
            </div>

            {error && (
              <p className="text-body-sm text-blush-600 bg-blush-50 rounded-card px-3 py-2">
                {error}
              </p>
            )}

            {/* Generate button */}
            <Button
              onClick={handleGenerate}
              className="w-full flex items-center justify-center gap-2"
              loading={loading}
              disabled={!canGenerate}
            >
              <Sparkles size={18} />
              {loading ? "Finding your perfect look..." : "Style me!"}
            </Button>

            {/* Loading skeleton */}
            {loading && <OutfitSkeleton />}

            {/* Result */}
            {result && !loading && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sage-600">
                  <CloudSun size={16} />
                  <span className="text-body-sm">
                    {result.weather.temperature}°C, {result.weather.condition} in
                    Singapore
                  </span>
                </div>
                <OutfitCard
                  result={result}
                  wardrobeItems={wardrobe}
                  mood={freeText || mood.join(", ")}
                  occasion={occasion[0] || "casual"}
                  weather={result.weather}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
