"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Profile, StylePreference } from "@/types";
import AppShell from "@/components/layout/AppShell";
import Button from "@/components/ui/Button";
import ChipGroup from "@/components/ui/ChipGroup";
import { LogOut, User } from "lucide-react";

const STYLE_OPTIONS: StylePreference[] = [
  "casual",
  "smart",
  "edgy",
  "feminine",
  "minimal",
  "bold",
];

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [styles, setStyles] = useState<string[]>([]);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadProfile() {
      const { data } = await supabase.from("profiles").select("*").single();
      if (data) {
        setProfile(data as Profile);
        setStyles(data.style_preferences || []);
      }
      setLoading(false);
    }
    loadProfile();
  }, []);

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    await supabase
      .from("profiles")
      .update({ style_preferences: styles })
      .eq("id", profile.id);
    setSaving(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  function toggleStyle(value: string) {
    setStyles((prev) =>
      prev.includes(value)
        ? prev.filter((s) => s !== value)
        : [...prev, value]
    );
  }

  if (loading) {
    return (
      <AppShell>
        <div className="page-container">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-neutral-200 rounded w-32" />
            <div className="h-20 bg-neutral-200 rounded-card" />
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="page-container">
        <h1 className="font-display text-heading-lg text-warm-800 mb-6">
          Profile
        </h1>

        {/* User info */}
        <div className="card flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-sage-50 flex items-center justify-center">
            <User size={24} className="text-sage-600" />
          </div>
          <div>
            <p className="text-body-lg font-medium text-neutral-800">
              {profile?.display_name || "Hey there!"}
            </p>
            <p className="text-body-sm text-neutral-600 capitalize">
              {profile?.age_range === "teen"
                ? "Teenager"
                : profile?.age_range || ""}{" "}
              · Singapore
            </p>
          </div>
        </div>

        {/* Style prefs */}
        <div className="mb-6">
          <h3 className="section-title mb-3">Style preferences</h3>
          <ChipGroup
            options={STYLE_OPTIONS}
            selected={styles}
            onToggle={toggleStyle}
            variant="sage"
            multi
          />
          <Button
            onClick={handleSave}
            className="mt-4"
            loading={saving}
            variant="secondary"
          >
            Save changes
          </Button>
        </div>

        {/* Uniform status */}
        <div className="card mb-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">👔</span>
            <div>
              <p className="text-body-md font-medium text-neutral-800">
                School uniform
              </p>
              <p className="text-body-sm text-neutral-600">
                {profile?.has_uniform
                  ? "You have uniform items — we'll restyle them for you"
                  : "No uniform registered"}
              </p>
            </div>
          </div>
        </div>

        {/* Logout */}
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 text-blush-600"
        >
          <LogOut size={16} />
          Log out
        </Button>
      </div>
    </AppShell>
  );
}
