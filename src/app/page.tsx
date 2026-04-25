"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Sparkles, Camera, Sun, ChevronRight, Heart } from "lucide-react";

const ROTATING_VIBES = [
  "brunch with the girls",
  "date night",
  "straight from school to dinner",
  "a job interview",
  "beach day in Sentosa",
  "a house party",
  "casual mall hangout",
];

const SHOWCASE_CARDS = [
  {
    image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=440&h=600&fit=crop&crop=top",
    location: "Tiong Bahru",
    vibeLine: "Effortlessly chic and ready for mimosas",
    going: "Brunch with friends",
    feeling: "Confident, playful",
    userName: "Aisha, 17",
    initial: "A",
    temp: "28°C",
  },
  {
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=440&h=600&fit=crop&crop=top",
    location: "Marina Bay",
    vibeLine: "Main character energy — all eyes on you",
    going: "Date night at Marina Bay",
    feeling: "Bold, edgy",
    userName: "Sophie, 24",
    initial: "S",
    temp: "30°C",
  },
  {
    image: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=440&h=600&fit=crop&crop=top",
    location: "Orchard Rd",
    vibeLine: "School uniform? Never heard of her",
    going: "Mall after school",
    feeling: "Edgy, free",
    userName: "Mili, 16",
    initial: "M",
    temp: "32°C",
  },
  {
    image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=440&h=600&fit=crop&crop=top",
    location: "Raffles Place",
    vibeLine: "Confident, polished, and totally you",
    going: "Job interview",
    feeling: "Focused, sharp",
    userName: "Priya, 22",
    initial: "P",
    temp: "31°C",
  },
];

export default function LandingPage() {
  const [vibeIndex, setVibeIndex] = useState(0);
  const [vibeVisible, setVibeVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVibeVisible(false);
      setTimeout(() => {
        setVibeIndex((prev) => (prev + 1) % ROTATING_VIBES.length);
        setVibeVisible(true);
      }, 300);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-warm-50 overflow-hidden">
      {/* Header */}
      <header className="px-4 pt-6 pb-2 max-w-lg mx-auto flex items-center justify-between animate-fade-in">
        <div>
          <span className="font-display text-lg text-warm-800">looks good, </span>
          <span className="font-display text-lg text-warm-600">feels good</span>
        </div>
        <Link
          href="/login"
          className="text-body-sm text-sage-600 font-medium hover:text-sage-800 transition-colors"
        >
          Log in
        </Link>
      </header>

      {/* Hero */}
      <section className="px-4 pt-12 pb-10 max-w-lg mx-auto text-center">
        <h2 className="font-display text-[34px] leading-[1.15] text-warm-800 mb-5 animate-fade-in-up opacity-0 stagger-1">
          Your wardrobe,
          <br />
          <span className="text-sage-600">styled perfectly</span> for
          <br />
          <span className="relative inline-block min-w-[200px]">
            <span
              className={`transition-all duration-300 ${
                vibeVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-2"
              }`}
            >
              {ROTATING_VIBES[vibeIndex]}
            </span>
            <span className="absolute -bottom-1 left-0 right-0 h-[3px] bg-warm-200 rounded-full" />
          </span>
        </h2>

        <p className="text-body-lg text-neutral-600 mb-8 max-w-xs mx-auto animate-fade-in-up opacity-0 stagger-2">
          Snap your clothes, tell us your mood, and get the perfect outfit — like
          texting your most stylish best friend.
        </p>

        <div className="animate-fade-in-up opacity-0 stagger-3">
          <Link
            href="/login"
            className="btn-primary inline-flex items-center gap-2 text-body-lg shadow-lifted"
          >
            Get started
            <ChevronRight size={18} />
          </Link>
        </div>
      </section>

      {/* ── Styled This Morning ── */}
      <section className="pb-14 animate-fade-in-up opacity-0 stagger-4">
        <h3 className="font-display text-heading-md text-warm-800 text-center mb-3">
          Styled this morning
        </h3>

        <div className="flex gap-4 overflow-x-auto px-4 pb-4 snap-x snap-mandatory scrollbar-hide">
          {SHOWCASE_CARDS.map((card, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-[260px] snap-center bg-white rounded-[16px] overflow-hidden shadow-soft"
            >
              {/* Full body photo */}
              <div className="h-[340px] overflow-hidden relative">
                <img
                  src={card.image}
                  alt={card.going}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 right-2 bg-white/90 rounded-pill px-2 py-0.5">
                  <span className="text-[10px] text-neutral-600">
                    {card.location}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-3">
                {/* Vibe line */}
                <p className="font-display text-body-sm text-warm-800 mb-2 leading-snug">
                  &quot;{card.vibeLine}&quot;
                </p>

                {/* Going + Feeling */}
                <div className="flex flex-col gap-1 text-body-sm mb-2">
                  <div className="flex items-center gap-1">
                    <span className="text-neutral-400 min-w-[46px]">Going</span>
                    <span className="text-neutral-800 font-medium">
                      {card.going}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-neutral-400 min-w-[46px]">Feeling</span>
                    <span className="text-neutral-800 font-medium">
                      {card.feeling}
                    </span>
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-neutral-200 mb-2" />

                {/* User */}
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-warm-200 flex items-center justify-center text-[9px] font-medium text-warm-800">
                    {card.initial}
                  </div>
                  <span className="text-body-sm font-medium text-neutral-800">
                    {card.userName}
                  </span>
                  <span className="text-[11px] text-neutral-400 ml-auto">
                    {card.temp}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 pb-14 max-w-lg mx-auto">
        <h3 className="font-display text-heading-md text-warm-800 text-center mb-8">
          Three steps to feeling amazing
        </h3>
        <div className="space-y-4">
          <StepCard
            number={1}
            icon={<Camera size={20} />}
            title="Snap your wardrobe"
            description="Take photos of your clothes — colors, fabrics, and vibes are tagged instantly. Even your school uniform."
            color="warm"
          />
          <StepCard
            number={2}
            icon={<Sparkles size={20} />}
            title="Tell us the vibe"
            description="Going to brunch? Heading to dinner straight from school? Just type it or tap a mood — we get it."
            color="sage"
          />
          <StepCard
            number={3}
            icon={<Sun size={20} />}
            title="See yourself styled"
            description="Get a realistic photo of you wearing the outfit, plus styling tips, makeup ideas, and weather-smart picks."
            color="blush"
          />
        </div>
      </section>

      {/* Feature grid */}
      <section className="px-4 pb-14 max-w-lg mx-auto">
        <div className="grid grid-cols-2 gap-3">
          <FeatureBox
            emoji="🌤️"
            title="Weather-smart"
            description="Knows it's 32°C and humid — keeps your outfit breezy"
            bg="bg-sage-50"
          />
          <FeatureBox
            emoji="👔"
            title="Uniform magic"
            description="Restyle your school uniform for after-school plans"
            bg="bg-warm-50"
          />
          <FeatureBox
            emoji="💄"
            title="Makeup matched"
            description="Get a makeup look that complements your outfit"
            bg="bg-blush-50"
          />
          <FeatureBox
            emoji="📅"
            title="Never repeat"
            description="Track what you wore — no more outfit amnesia"
            bg="bg-sage-50"
          />
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 pb-14 max-w-lg mx-auto">
        <div className="bg-sage-50 rounded-[20px] p-8 text-center">
          <h3 className="font-display text-heading-lg text-sage-800 mb-3">
            Ready to feel amazing?
          </h3>
          <p className="text-body-md text-sage-600 mb-6">
            2 minutes to your first outfit. Your wardrobe (and your mornings)
            will thank you.
          </p>
          <Link
            href="/login"
            className="btn-primary inline-flex items-center gap-2 bg-white text-sage-800 hover:bg-neutral-100 shadow-soft"
          >
            <Heart size={16} />
            Start styling
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 pb-8 max-w-lg mx-auto text-center">
        <div className="flex items-center justify-center gap-1 mb-2">
          <span className="font-display text-body-sm text-warm-800">looks good,</span>
          <span className="font-display text-body-sm text-warm-600">feels good</span>
        </div>
        <p className="text-[11px] text-neutral-400">
          © 2025 · Made with love in Singapore
        </p>
      </footer>
    </div>
  );
}

function StepCard({
  number,
  icon,
  title,
  description,
  color,
}: {
  number: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  color: "warm" | "sage" | "blush";
}) {
  const bgMap = { warm: "bg-warm-50", sage: "bg-sage-50", blush: "bg-blush-50" };
  const iconBgMap = {
    warm: "bg-warm-200 text-warm-800",
    sage: "bg-sage-200 text-sage-800",
    blush: "bg-blush-200 text-blush-600",
  };
  const numMap = { warm: "text-warm-600", sage: "text-sage-600", blush: "text-blush-600" };

  return (
    <div className={`${bgMap[color]} rounded-card p-5 flex gap-4`}>
      <div className="flex-shrink-0">
        <div className={`w-10 h-10 rounded-full ${iconBgMap[color]} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <div>
        <span className={`text-body-sm font-medium ${numMap[color]}`}>Step {number}</span>
        <h4 className="text-heading-sm text-neutral-800 mb-1">{title}</h4>
        <p className="text-body-md text-neutral-600">{description}</p>
      </div>
    </div>
  );
}

function FeatureBox({ emoji, title, description, bg }: { emoji: string; title: string; description: string; bg: string }) {
  return (
    <div className={`${bg} rounded-card p-4`}>
      <span className="text-2xl block mb-2">{emoji}</span>
      <h4 className="text-body-sm font-medium text-neutral-800 mb-1">{title}</h4>
      <p className="text-[11px] text-neutral-600 leading-relaxed">{description}</p>
    </div>
  );
}
