"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { compressImage, fileToBase64, getMediaType } from "@/lib/image";
import Button from "@/components/ui/Button";
import ChipGroup from "@/components/ui/ChipGroup";
import { AgeRange, StylePreference, AIProfileAnalysis } from "@/types";
import { Camera, Upload, X, Plus, Check } from "lucide-react";

const STYLE_OPTIONS: StylePreference[] = [
  "casual", "smart", "edgy", "feminine", "minimal", "bold",
];

const TOTAL_STEPS = 5;

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [ageRange, setAgeRange] = useState<AgeRange | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [physicalProfile, setPhysicalProfile] = useState<AIProfileAnalysis | null>(null);
  const [analyzingPhoto, setAnalyzingPhoto] = useState(false);
  const [styles, setStyles] = useState<string[]>([]);
  const [styleRules, setStyleRules] = useState<string[]>([]);
  const [ruleInput, setRuleInput] = useState("");
  const [hasUniform, setHasUniform] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleProfilePhoto(file: File) {
    setError(null);
    setProfileFile(file);
    setProfilePreview(URL.createObjectURL(file));
    setAnalyzingPhoto(true);

    try {
      const compressed = await compressImage(file);
      const base64 = await fileToBase64(compressed);
      const mediaType = getMediaType(compressed);

      const res = await fetch("/api/profile/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, mediaType }),
      });

      if (!res.ok) throw new Error("Analysis failed");
      const result: AIProfileAnalysis = await res.json();
      setPhysicalProfile(result);
    } catch {
      setError("Couldn't analyze the photo. Try another one?");
    } finally {
      setAnalyzingPhoto(false);
    }
  }

  function addRule() {
    if (ruleInput.trim() && styleRules.length < 10) {
      setStyleRules((prev) => [...prev, ruleInput.trim()]);
      setRuleInput("");
    }
  }

  function removeRule(idx: number) {
    setStyleRules((prev) => prev.filter((_, i) => i !== idx));
  }

  function toggleStyle(value: string) {
    setStyles((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]
    );
  }

  async function handleFinish() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    // Upload profile photo if provided
    let profilePhotoUrl: string | null = null;
    if (profileFile) {
      const compressed = await compressImage(profileFile);
      const path = `profiles/${user.id}/profile.jpg`;
      await supabase.storage.from("wardrobe").upload(path, compressed, {
        contentType: "image/jpeg",
        upsert: true,
      });
      const { data: { publicUrl } } = supabase.storage.from("wardrobe").getPublicUrl(path);
      profilePhotoUrl = publicUrl;
    }

    const { error: dbError } = await supabase.from("profiles").upsert({
      id: user.id,
      display_name: name || null,
      age_range: ageRange,
      style_preferences: styles,
      style_rules: styleRules,
      has_uniform: hasUniform,
      onboarding_complete: true,
      profile_photo_url: profilePhotoUrl,
      height_estimate: physicalProfile?.height_estimate || null,
      body_shape: physicalProfile?.body_shape || null,
      skin_tone: physicalProfile?.skin_tone || null,
      skin_undertone: physicalProfile?.skin_undertone || null,
      hair_length: physicalProfile?.hair_length || null,
      hair_color: physicalProfile?.hair_color || null,
      hair_texture: physicalProfile?.hair_texture || null,
      size_estimate: physicalProfile?.size_estimate || null,
    });

    if (dbError) {
      console.error("Profile save error:", dbError);
      setLoading(false);
      return;
    }

    router.push("/wardrobe");
  }

  return (
    <div className="min-h-screen bg-warm-50 flex flex-col">
      <div className="h-1 bg-neutral-200">
        <div
          className="h-full bg-sage-400 transition-all duration-500 ease-out"
          style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col page-container">

        {/* ── Step 1: Name + Age ── */}
        {step === 1 && (
          <div className="flex-1 flex flex-col">
            <h2 className="font-display text-heading-lg text-warm-800 mb-2">
              Hey there! Let&apos;s get to know you
            </h2>
            <p className="text-body-md text-neutral-600 mb-8">
              We&apos;ll use this to personalize your styling.
            </p>
            <div className="space-y-6">
              <div>
                <label className="text-body-sm font-medium text-neutral-600 mb-2 block">What should we call you?</label>
                <input type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="text-body-sm font-medium text-neutral-600 mb-3 block">Your age range</label>
                <div className="flex gap-3">
                  {([
                    { value: "teen" as const, label: "14–18", emoji: "🎓" },
                    { value: "20s" as const, label: "20s", emoji: "✨" },
                    { value: "30s" as const, label: "30s", emoji: "💫" },
                  ]).map((option) => (
                    <button key={option.value} type="button" onClick={() => setAgeRange(option.value)}
                      className={`flex-1 card text-center transition-all duration-200 ${ageRange === option.value ? "ring-2 ring-warm-400 bg-warm-50" : "hover:shadow-lifted"}`}>
                      <span className="text-2xl block mb-1">{option.emoji}</span>
                      <span className="text-body-md font-medium text-neutral-800">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-auto pt-8">
              <Button onClick={() => setStep(2)} className="w-full" disabled={!ageRange}>Next →</Button>
            </div>
          </div>
        )}

        {/* ── Step 2: Profile Photo + AI Analysis ── */}
        {step === 2 && (
          <div className="flex-1 flex flex-col">
            <h2 className="font-display text-heading-lg text-warm-800 mb-2">
              Let&apos;s see you!
            </h2>
            <p className="text-body-md text-neutral-600 mb-6">
              Upload a full body photo so we can understand your proportions, skin tone, and hair for better styling. This stays private.
            </p>

            {!profilePreview ? (
              <button onClick={() => fileInputRef.current?.click()}
                className="card flex flex-col items-center gap-4 py-12 hover:shadow-lifted transition-shadow">
                <div className="w-16 h-16 rounded-full bg-sage-50 flex items-center justify-center">
                  <Camera size={28} className="text-sage-600" />
                </div>
                <span className="text-body-md font-medium text-neutral-800">Upload full body photo</span>
                <span className="text-body-sm text-neutral-400">Standing straight, good lighting works best</span>
              </button>
            ) : (
              <div className="space-y-4">
                <div className="relative w-48 mx-auto">
                  <div className="aspect-[3/4] rounded-card overflow-hidden shadow-soft">
                    <img src={profilePreview} alt="Profile" className="w-full h-full object-cover" />
                  </div>
                  <button onClick={() => { setProfilePreview(null); setProfileFile(null); setPhysicalProfile(null); }}
                    className="absolute -top-2 -right-2 w-7 h-7 bg-white rounded-full shadow-soft flex items-center justify-center">
                    <X size={14} className="text-blush-600" />
                  </button>
                </div>

                {analyzingPhoto && (
                  <div className="text-center">
                    <div className="w-6 h-6 border-2 border-sage-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-body-sm text-neutral-600">Analyzing your photo...</p>
                  </div>
                )}

                {physicalProfile && (
                  <div className="card space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                      <Check size={14} className="text-sage-600" />
                      <span className="text-body-sm font-medium text-sage-600">AI profile ready</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-body-sm">
                      <span className="text-neutral-400">Height</span><span className="text-neutral-800">{physicalProfile.height_estimate}</span>
                      <span className="text-neutral-400">Build</span><span className="text-neutral-800">{physicalProfile.body_shape}</span>
                      <span className="text-neutral-400">Skin tone</span><span className="text-neutral-800">{physicalProfile.skin_tone}</span>
                      <span className="text-neutral-400">Undertone</span><span className="text-neutral-800 capitalize">{physicalProfile.skin_undertone}</span>
                      <span className="text-neutral-400">Hair</span><span className="text-neutral-800">{physicalProfile.hair_length}, {physicalProfile.hair_color}</span>
                      <span className="text-neutral-400">Texture</span><span className="text-neutral-800">{physicalProfile.hair_texture}</span>
                      <span className="text-neutral-400">Size est.</span><span className="text-neutral-800">{physicalProfile.size_estimate}</span>
                    </div>
                  </div>
                )}

                {error && <p className="text-body-sm text-blush-600 bg-blush-50 rounded-card px-3 py-2">{error}</p>}
              </div>
            )}

            <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => e.target.files?.[0] && handleProfilePhoto(e.target.files[0])} />

            <div className="mt-auto pt-8 flex gap-3">
              <Button variant="secondary" onClick={() => setStep(1)}>← Back</Button>
              <Button onClick={() => setStep(3)} className="flex-1" disabled={analyzingPhoto}>
                {profilePreview ? "Next →" : "Skip for now →"}
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 3: Style Preferences ── */}
        {step === 3 && (
          <div className="flex-1 flex flex-col">
            <h2 className="font-display text-heading-lg text-warm-800 mb-2">What&apos;s your style vibe?</h2>
            <p className="text-body-md text-neutral-600 mb-8">Pick all that describe you — no wrong answers!</p>
            <div className="grid grid-cols-2 gap-3">
              {STYLE_OPTIONS.map((style) => (
                <button key={style} type="button" onClick={() => toggleStyle(style)}
                  className={`card text-center py-6 transition-all duration-200 capitalize ${styles.includes(style) ? "ring-2 ring-sage-400 bg-sage-50" : "hover:shadow-lifted"}`}>
                  <span className="text-body-lg font-medium text-neutral-800">{style}</span>
                </button>
              ))}
            </div>
            <div className="mt-auto pt-8 flex gap-3">
              <Button variant="secondary" onClick={() => setStep(2)}>← Back</Button>
              <Button onClick={() => setStep(4)} className="flex-1" disabled={styles.length === 0}>Next →</Button>
            </div>
          </div>
        )}

        {/* ── Step 4: Style Rules ── */}
        {step === 4 && (
          <div className="flex-1 flex flex-col">
            <h2 className="font-display text-heading-lg text-warm-800 mb-2">Any style rules?</h2>
            <p className="text-body-md text-neutral-600 mb-6">
              Tell us what you never wear or specific preferences. We&apos;ll always respect these.
            </p>

            <div className="flex gap-2 mb-4">
              <input type="text" placeholder="e.g. no gold jewelry, only flats..." value={ruleInput}
                onChange={(e) => setRuleInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addRule()}
                className="input-field flex-1" />
              <Button onClick={addRule} disabled={!ruleInput.trim()} variant="secondary" className="flex-shrink-0 px-3">
                <Plus size={18} />
              </Button>
            </div>

            {styleRules.length > 0 && (
              <div className="space-y-2 mb-4">
                {styleRules.map((rule, i) => (
                  <div key={i} className="flex items-center gap-2 bg-blush-50 rounded-card px-3 py-2">
                    <span className="text-body-sm text-blush-600 flex-1">{rule}</span>
                    <button onClick={() => removeRule(i)} className="text-blush-400 hover:text-blush-600">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <p className="text-body-sm text-neutral-400">Examples:</p>
              <div className="flex flex-wrap gap-1">
                {["No gold jewelry", "Only silver accessories", "No heels over 3 inches", "No crop tops", "No yellow", "Nothing too tight"].map((ex) => (
                  <button key={ex} onClick={() => { setRuleInput(ex); }}
                    className="text-[11px] text-neutral-600 bg-neutral-100 px-2 py-1 rounded-pill hover:bg-neutral-200 transition-colors">
                    {ex}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-auto pt-8 flex gap-3">
              <Button variant="secondary" onClick={() => setStep(3)}>← Back</Button>
              <Button onClick={() => setStep(5)} className="flex-1">
                {styleRules.length > 0 ? "Next →" : "Skip — no rules →"}
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 5: Uniform ── */}
        {step === 5 && (
          <div className="flex-1 flex flex-col">
            <h2 className="font-display text-heading-lg text-warm-800 mb-2">One more thing!</h2>
            <p className="text-body-md text-neutral-600 mb-8">
              Do you wear a school uniform? We can help you restyle it for after-school plans.
            </p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setHasUniform(true)}
                className={`flex-1 card text-center py-8 transition-all duration-200 ${hasUniform ? "ring-2 ring-warm-400 bg-warm-50" : "hover:shadow-lifted"}`}>
                <span className="text-3xl block mb-2">👔</span>
                <span className="text-body-md font-medium text-neutral-800">Yes, I have a uniform</span>
              </button>
              <button type="button" onClick={() => setHasUniform(false)}
                className={`flex-1 card text-center py-8 transition-all duration-200 ${!hasUniform ? "ring-2 ring-sage-400 bg-sage-50" : "hover:shadow-lifted"}`}>
                <span className="text-3xl block mb-2">👗</span>
                <span className="text-body-md font-medium text-neutral-800">Nope!</span>
              </button>
            </div>
            {hasUniform && (
              <div className="mt-4 bg-warm-50 rounded-card p-4">
                <p className="text-body-sm text-warm-600">
                  Nice! When you upload your wardrobe, tag your uniform pieces. We&apos;ll know how to restyle them.
                </p>
              </div>
            )}
            <div className="mt-auto pt-8 flex gap-3">
              <Button variant="secondary" onClick={() => setStep(4)}>← Back</Button>
              <Button onClick={handleFinish} className="flex-1" loading={loading}>Let&apos;s go! ✨</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
