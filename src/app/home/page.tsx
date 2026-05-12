"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { Profile, Outfit } from "@/types";
import AppShell from "@/components/layout/AppShell";
import {
  Sparkles,
  ChevronRight,
  Heart,
  Bell,
  Clock,
  Sun,
} from "lucide-react";

const STYLE_TIPS = [
  "Try cuffing your jeans once at the ankle — cleaner line, any shoe looks intentional.",
  "Tuck just the front of your top in — adds shape without looking too put-together.",
  "When in doubt, monochrome. One color head to toe always looks expensive.",
  "Roll your sleeves to just below the elbow — instant cool energy.",
  "A white tee + statement earrings = instant upgrade with zero effort.",
  "Match your bag to your shoes for a pulled-together look.",
  "Layer a fitted top under an oversized shirt — leave it unbuttoned.",
];

const INSPIRATION = [
  { image: "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=240&h=320&fit=crop&crop=top", label: "Casual chic" },
  { image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=240&h=320&fit=crop&crop=top", label: "Power dressing" },
  { image: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=240&h=320&fit=crop&crop=top", label: "Weekend vibes" },
  { image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=240&h=320&fit=crop&crop=top", label: "Night out" },
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getTimeContext() {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) {
    return {
      question: "What's this morning looking like?",
      suggestions: [
        { title: "Heading to school?", subtitle: "Let me style your uniform", occasion: "School", color: "sage" as const },
        { title: "Brunch plans?", subtitle: "Cute and casual", occasion: "Brunch", color: "blush" as const },
        { title: "Coffee run?", subtitle: "Quick but cute", occasion: "Coffee run", color: "warm" as const },
      ],
    };
  } else if (hour >= 12 && hour < 17) {
    return {
      question: "What's this afternoon looking like?",
      suggestions: [
        { title: "Lunch with friends?", subtitle: "Let me pick your look", occasion: "Lunch", color: "sage" as const },
        { title: "Mall trip?", subtitle: "Mall-ready in seconds", occasion: "Mall trip", color: "blush" as const },
        { title: "After-school plans?", subtitle: "Restyle and go", occasion: "Casual hangout", color: "warm" as const },
      ],
    };
  } else if (hour >= 17 && hour < 21) {
    return {
      question: "What's tonight looking like?",
      suggestions: [
        { title: "Dinner tonight?", subtitle: "Let me style you", occasion: "Dinner", color: "sage" as const },
        { title: "Going out later?", subtitle: "Party-ready in seconds", occasion: "Party", color: "blush" as const },
        { title: "Date night?", subtitle: "You're going to look amazing", occasion: "Date night", color: "warm" as const },
      ],
    };
  } else {
    return {
      question: "Planning ahead?",
      suggestions: [
        { title: "Plan tomorrow's look", subtitle: "Get ahead of the morning", occasion: "Casual hangout", color: "sage" as const },
        { title: "Weekend outfit?", subtitle: "Something fun", occasion: "Casual hangout", color: "blush" as const },
        { title: "Special event?", subtitle: "Let's find the perfect outfit", occasion: "Wedding guest", color: "warm" as const },
      ],
    };
  }
}

const colorMap = {
  sage: { bg: "bg-sage-50", title: "text-sage-800", subtitle: "text-sage-600", icon: "text-sage-600" },
  blush: { bg: "bg-blush-50", title: "text-blush-600", subtitle: "text-blush-400", icon: "text-blush-600" },
  warm: { bg: "bg-warm-50", title: "text-warm-800", subtitle: "text-warm-600", icon: "text-warm-600" },
};
const iconMap = { sage: Bell, blush: Clock, warm: Sun };

export default function HomePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [recentOutfits, setRecentOutfits] = useState<Outfit[]>([]);
  const [outfitCount, setOutfitCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const todayTip = STYLE_TIPS[new Date().getDate() % STYLE_TIPS.length];
  const timeContext = getTimeContext();

  useEffect(() => {
    async function load() {
      const { data: p } = await supabase.from("profiles").select("*").single();
      if (p) setProfile(p as any);
      const { data: o } = await supabase.from("outfits").select("*").order("created_at", { ascending: false }).limit(3);
      if (o) setRecentOutfits(o as Outfit[]);
      const { count } = await supabase.from("outfits").select("*", { count: "exact", head: true });
      setOutfitCount(count || 0);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <AppShell>
        <div className="page-container">
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-neutral-200 rounded-card" />
            <div className="h-40 bg-neutral-200 rounded-card" />
          </div>
        </div>
      </AppShell>
    );
  }

  const displayName = profile?.display_name || "there";

  return (
    <AppShell>
      <div className="page-container">
        {/* Hero with profile photo (#1) */}
        <div className="card flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-warm-100 flex items-center justify-center overflow-hidden ring-2 ring-warm-200 flex-shrink-0">
            {profile?.profile_photo_url ? (
              <img
                src={profile.profile_photo_url}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl font-display text-warm-600">
                {displayName[0]?.toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <p className="text-body-sm text-neutral-400">{getGreeting()}</p>
            <h1 className="font-display text-heading-md text-warm-800">
              Hey, {displayName}
            </h1>
            <p className="text-[11px] text-sage-600 font-medium">Looking good today</p>
          </div>
        </div>

        {/* Proactive suggestions (#2 — links to Style Me with occasion pre-filled) */}
        <div className="card mb-4">
          <p className="text-[11px] text-neutral-400 uppercase tracking-wider mb-3">
            {timeContext.question}
          </p>
          <div className="space-y-2">
            {timeContext.suggestions.map((sug, i) => {
              const colors = colorMap[sug.color];
              const Icon = iconMap[sug.color];
              return (
                <Link
                  key={i}
                  href={`/style-me?occasion=${encodeURIComponent(sug.occasion)}`}
                  className={`${colors.bg} rounded-card p-3 flex items-center justify-between group hover:shadow-soft transition-shadow`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={16} className={colors.icon} />
                    <div>
                      <p className={`text-body-sm font-medium ${colors.title}`}>{sug.title}</p>
                      <p className={`text-[11px] ${colors.subtitle}`}>{sug.subtitle}</p>
                    </div>
                  </div>
                  <ChevronRight size={14} className={colors.icon} />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Style Me CTA */}
        <div className="bg-sage-50 rounded-card p-5 text-center mb-4">
          <p className="font-display text-heading-sm text-sage-800 mb-3">
            Or just tell me your mood
          </p>
          <Link
            href="/style-me"
            className="inline-flex items-center gap-2 bg-sage-800 text-sage-50 font-medium px-6 py-3 rounded-pill transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lifted"
          >
            <Sparkles size={16} />
            Style me
          </Link>
        </div>

        {/* Style inspiration */}
        <div className="mb-4">
          <p className="text-body-sm font-medium text-neutral-600 mb-2">
            Looks we think you&apos;d love
          </p>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
            {INSPIRATION.map((item, i) => (
              <div key={i} className="flex-shrink-0 w-[120px]">
                <div className="h-[160px] rounded-card overflow-hidden">
                  <img src={item.image} alt={item.label} className="w-full h-full object-cover" />
                </div>
                <p className="text-[11px] font-medium text-warm-600 mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Style tip */}
        <div className="card flex gap-3 items-start mb-4">
          <div className="w-7 h-7 rounded-full bg-warm-50 flex items-center justify-center flex-shrink-0">
            <Sparkles size={14} className="text-warm-600" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-warm-600 mb-0.5">Style tip</p>
            <p className="text-body-sm text-neutral-600 leading-relaxed">{todayTip}</p>
          </div>
        </div>

        {/* Recent looks */}
        {recentOutfits.length > 0 && (
          <div className="mb-4">
            <p className="text-body-sm font-medium text-neutral-600 mb-2">Recent looks</p>
            <div className="space-y-2">
              {recentOutfits.map((outfit) => (
                <Link
                  key={outfit.id}
                  href={`/outfit/${outfit.id}`}
                  className="card flex items-center gap-3 p-3 hover:shadow-lifted transition-shadow"
                >
                  <div className="w-11 h-11 rounded-lg bg-neutral-100 flex-shrink-0 overflow-hidden">
                    {outfit.outfit_image_url ? (
                      <img src={outfit.outfit_image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-warm-50" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm font-medium text-neutral-800 truncate">
                      {outfit.vibe_line || "Styled outfit"}
                    </p>
                    <p className="text-[11px] text-neutral-400">
                      {outfit.occasion || "Casual"}
                    </p>
                  </div>
                  <ChevronRight size={14} className="text-neutral-400" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Streak */}
        {outfitCount > 0 && (
          <div className="bg-blush-50 rounded-card p-3 flex items-center gap-3">
            <Heart size={18} className="text-blush-600" />
            <div>
              <p className="text-body-sm font-medium text-blush-600">
                {outfitCount} {outfitCount === 1 ? "look" : "looks"} styled
              </p>
              <p className="text-[11px] text-blush-400">Keep the streak going!</p>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
