"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Profile, StylePreference, AIProfileAnalysis } from "@/types";
import AppShell from "@/components/layout/AppShell";
import Button from "@/components/ui/Button";
import ChipGroup from "@/components/ui/ChipGroup";
import { toast } from "@/components/ui/Toast";
import { compressImage, fileToBase64, getMediaType } from "@/lib/image";
import { LogOut, User, Camera, Edit3, Check, X, RefreshCw } from "lucide-react";

const STYLE_OPTIONS: StylePreference[] = [
  "casual", "smart", "edgy", "feminine", "minimal", "bold",
];

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [styles, setStyles] = useState<string[]>([]);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadProfile() {
      const { data } = await supabase.from("profiles").select("*").single();
      if (data) {
        setProfile(data as any);
        setStyles(data.style_preferences || []);
        setEditValues({
          height_estimate: data.height_estimate || "",
          body_shape: data.body_shape || "",
          skin_tone: data.skin_tone || "",
          hair_length: data.hair_length || "",
          hair_color: data.hair_color || "",
          hair_texture: data.hair_texture || "",
          size_estimate: data.size_estimate || "",
        });
      }
      setLoading(false);
    }
    loadProfile();
  }, []);

  async function handleSaveStyles() {
    if (!profile) return;
    setSaving(true);
    await supabase
      .from("profiles")
      .update({ style_preferences: styles })
      .eq("id", profile.id);
    setSaving(false);
    toast("Saved!");
  }

  async function handleSaveField(field: string, value: string) {
    if (!profile) return;
    await supabase
      .from("profiles")
      .update({ [field]: value })
      .eq("id", profile.id);
    setEditValues((prev) => ({ ...prev, [field]: value }));
    setEditingField(null);
    toast("Updated!");
  }

  async function handlePhotoChange(file: File) {
    if (!profile) return;
    setUploadingPhoto(true);
    try {
      const compressed = await compressImage(file);

      // Use unique filename with timestamp to bust CDN cache
      const timestamp = Date.now();
      const path = `profiles/${profile.id}/profile_${timestamp}.jpg`;

      // Delete old photo if it exists
      if (profile.profile_photo_url) {
        try {
          const oldPath = profile.profile_photo_url.split("/wardrobe/")[1];
          if (oldPath) {
            await supabase.storage.from("wardrobe").remove([oldPath]);
          }
        } catch {
          // Old photo cleanup failed — not critical
        }
      }

      // Upload new photo
      const { error: uploadError } = await supabase.storage
        .from("wardrobe")
        .upload(path, compressed, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        toast("Couldn't upload photo", "error");
        setUploadingPhoto(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage.from("wardrobe").getPublicUrl(path);

      // Save new URL to database
      await supabase
        .from("profiles")
        .update({ profile_photo_url: publicUrl })
        .eq("id", profile.id);

      // Re-analyze the new photo with AI
      toast("Photo uploaded! Analyzing...");
      try {
        const base64 = await fileToBase64(compressed);
        const mediaType = getMediaType(compressed);

        const res = await fetch("/api/profile/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64, mediaType }),
        });

        if (res.ok) {
          const analysis: AIProfileAnalysis = await res.json();

          // Update physical profile in database
          await supabase
            .from("profiles")
            .update({
              height_estimate: analysis.height_estimate,
              body_shape: analysis.body_shape,
              skin_tone: analysis.skin_tone,
              skin_undertone: analysis.skin_undertone,
              hair_length: analysis.hair_length,
              hair_color: analysis.hair_color,
              hair_texture: analysis.hair_texture,
              size_estimate: analysis.size_estimate,
            })
            .eq("id", profile.id);

          // Update local state
          setEditValues({
            height_estimate: analysis.height_estimate,
            body_shape: analysis.body_shape,
            skin_tone: analysis.skin_tone,
            hair_length: analysis.hair_length,
            hair_color: analysis.hair_color,
            hair_texture: analysis.hair_texture,
            size_estimate: analysis.size_estimate,
          });

          toast("Photo and profile updated!");
        }
      } catch {
        toast("Photo saved but analysis failed — you can edit fields manually");
      }

      setProfile({ ...profile, profile_photo_url: publicUrl });
    } catch {
      toast("Couldn't upload photo", "error");
    }
    setUploadingPhoto(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  function toggleStyle(value: string) {
    setStyles((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]
    );
  }

  function EditableRow({ label, field }: { label: string; field: string }) {
    const [temp, setTemp] = useState(editValues[field] || "");

    if (editingField === field) {
      return (
        <div className="py-2 border-b border-neutral-100 last:border-0">
          <label className="text-[11px] text-neutral-400 mb-1 block">{label}</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={temp}
              onChange={(e) => setTemp(e.target.value)}
              className="input-field text-body-sm py-2 flex-1"
              autoFocus
            />
            <button
              onClick={() => handleSaveField(field, temp)}
              className="bg-sage-50 text-sage-800 px-3 rounded-card flex-shrink-0"
            >
              <Check size={14} />
            </button>
            <button
              onClick={() => setEditingField(null)}
              className="text-neutral-400 px-2"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex justify-between items-center py-2 border-b border-neutral-100 last:border-0">
        <span className="text-body-sm text-neutral-400">{label}</span>
        <button
          onClick={() => { setTemp(editValues[field] || ""); setEditingField(field); }}
          className="flex items-center gap-1 group"
        >
          <span className="text-body-sm font-medium text-neutral-800">
            {editValues[field] || "Not set"}
          </span>
          <Edit3 size={12} className="text-neutral-400 group-hover:text-warm-600 transition-colors" />
        </button>
      </div>
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

        {/* Profile photo + name */}
        <div className="card flex items-center gap-4 mb-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-sage-50 flex items-center justify-center overflow-hidden">
              {profile?.profile_photo_url ? (
                <img
                  src={profile.profile_photo_url}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={28} className="text-sage-600" />
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="absolute -bottom-1 -right-1 w-6 h-6 bg-warm-200 rounded-full flex items-center justify-center shadow-soft"
            >
              {uploadingPhoto ? (
                <RefreshCw size={12} className="text-warm-800 animate-spin" />
              ) : (
                <Camera size={12} className="text-warm-800" />
              )}
            </button>
          </div>
          <div>
            <p className="text-body-lg font-medium text-neutral-800">
              {profile?.display_name || "Hey there!"}
            </p>
            <p className="text-body-sm text-neutral-600 capitalize">
              {profile?.age_range || ""} · Singapore
            </p>
            {uploadingPhoto && (
              <p className="text-[11px] text-sage-600 mt-0.5">Updating photo...</p>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handlePhotoChange(e.target.files[0])}
          />
        </div>

        {/* Physical profile — editable */}
        <div className="card mb-6">
          <h3 className="text-body-sm font-medium text-neutral-600 mb-3">Physical profile</h3>
          <EditableRow label="Height" field="height_estimate" />
          <EditableRow label="Build" field="body_shape" />
          <EditableRow label="Skin tone" field="skin_tone" />
          <EditableRow label="Hair length" field="hair_length" />
          <EditableRow label="Hair color" field="hair_color" />
          <EditableRow label="Hair texture" field="hair_texture" />
          <EditableRow label="Size" field="size_estimate" />
        </div>

        {/* Style prefs */}
        <div className="mb-6">
          <h3 className="text-body-sm font-medium text-neutral-600 mb-3">Style preferences</h3>
          <ChipGroup
            options={STYLE_OPTIONS}
            selected={styles}
            onToggle={toggleStyle}
            variant="sage"
            multi
          />
          <Button
            onClick={handleSaveStyles}
            className="mt-4"
            loading={saving}
            variant="secondary"
          >
            Save changes
          </Button>
        </div>

       {/* Uniform toggle */}
        <div className="card mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">👔</span>
              <div>
                <p className="text-body-md font-medium text-neutral-800">
                  School uniform
                </p>
                <p className="text-body-sm text-neutral-600">
                  {profile?.has_uniform
                    ? "We'll restyle it for after-school plans"
                    : "Toggle on if you wear a uniform"}
                </p>
              </div>
            </div>
            <button
              onClick={async () => {
                if (!profile) return;
                const newVal = !profile.has_uniform;
                await supabase.from("profiles").update({ has_uniform: newVal }).eq("id", profile.id);
                setProfile({ ...profile, has_uniform: newVal });
                toast(newVal ? "Uniform mode on!" : "Uniform mode off");
              }}
              className={`w-12 h-7 rounded-full transition-colors duration-200 relative ${
                profile?.has_uniform ? "bg-sage-400" : "bg-neutral-300"
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform duration-200 shadow-soft ${
                profile?.has_uniform ? "translate-x-6" : "translate-x-1"
              }`} />
            </button>
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
