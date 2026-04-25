"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { compressImage, fileToBase64, getMediaType } from "@/lib/image";
import { AITagResult } from "@/types";
import Button from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { Camera, Upload, Check, Edit3 } from "lucide-react";

type Step = "capture" | "tagging" | "review";

export default function WardrobeAddPage() {
  const [step, setStep] = useState<Step>("capture");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [tags, setTags] = useState<AITagResult | null>(null);
  const [isUniform, setIsUniform] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleFile(selectedFile: File) {
    setError(null);
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setStep("tagging");
    setLoading(true);

    try {
      // Compress image
      const compressed = await compressImage(selectedFile);
      const base64 = await fileToBase64(compressed);
      const mediaType = getMediaType(compressed);

      // Send to Claude Vision for tagging
      const res = await fetch("/api/wardrobe/tag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, mediaType }),
      });

      if (!res.ok) throw new Error("Tagging failed");

      const tagResult: AITagResult = await res.json();
      setTags(tagResult);
      setStep("review");
    } catch (err) {
      setError("Couldn't analyze this image. Try another photo?");
      setStep("capture");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!file || !tags) return;
    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      // Compress and upload to Supabase Storage
      const compressed = await compressImage(file);
      const itemId = crypto.randomUUID();
      const path = `wardrobe/${user.id}/${itemId}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("wardrobe")
        .upload(path, compressed, { contentType: "image/jpeg" });

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("wardrobe").getPublicUrl(path);

      // Save to database
      const { error: dbError } = await supabase.from("wardrobe_items").insert({
        id: itemId,
        user_id: user.id,
        image_url: publicUrl,
        item_type: tags.item_type,
        color_primary: tags.color_primary,
        color_secondary: tags.color_secondary,
        pattern: tags.pattern,
        formality: tags.formality,
        season: tags.season,
        fabric_guess: tags.fabric_guess,
        description: tags.description,
        is_uniform: isUniform,
      });

      if (dbError) throw dbError;

      toast("Added to your wardrobe!");
      router.push("/wardrobe");
    } catch (err) {
      toast("Couldn't save. Please try again.", "error");
      setError("Couldn't save. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-warm-50">
      <div className="page-container">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="text-neutral-600 hover:text-neutral-800"
          >
            ← Back
          </button>
          <h1 className="font-display text-heading-md text-warm-800">
            Add to wardrobe
          </h1>
        </div>

        {/* Step: Capture */}
        {step === "capture" && (
          <div className="space-y-4">
            <p className="text-body-md text-neutral-600">
              Take a photo or upload from your gallery. Lay the item flat or
              hang it up for best results!
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="card flex flex-col items-center gap-3 py-10 hover:shadow-lifted transition-shadow"
              >
                <div className="w-14 h-14 rounded-full bg-sage-50 flex items-center justify-center">
                  <Camera size={24} className="text-sage-600" />
                </div>
                <span className="text-body-md font-medium text-neutral-800">
                  Take photo
                </span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="card flex flex-col items-center gap-3 py-10 hover:shadow-lifted transition-shadow"
              >
                <div className="w-14 h-14 rounded-full bg-warm-50 flex items-center justify-center">
                  <Upload size={24} className="text-warm-600" />
                </div>
                <span className="text-body-md font-medium text-neutral-800">
                  Upload photo
                </span>
              </button>
            </div>

            {error && (
              <p className="text-body-sm text-blush-600 bg-blush-50 rounded-card px-3 py-2">
                {error}
              </p>
            )}

            {/* Hidden inputs */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>
        )}

        {/* Step: Tagging (loading) */}
        {step === "tagging" && (
          <div className="text-center py-10">
            {preview && (
              <div className="w-48 h-48 mx-auto rounded-card overflow-hidden mb-6 shadow-soft">
                <img
                  src={preview}
                  alt="Uploading"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="w-8 h-8 border-3 border-sage-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="font-display text-heading-sm text-warm-800 mb-1">
              Analyzing your item...
            </p>
            <p className="text-body-sm text-neutral-600">
              Our AI is figuring out the colors, fabric, and vibe
            </p>
          </div>
        )}

        {/* Step: Review */}
        {step === "review" && tags && (
          <div className="space-y-5">
            {/* Preview */}
            {preview && (
              <div className="w-full aspect-square rounded-card overflow-hidden shadow-soft">
                <img
                  src={preview}
                  alt="Item preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* AI tags */}
            <div className="card space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Check size={16} className="text-sage-600" />
                <span className="text-body-sm font-medium text-sage-600">
                  AI tagged this item
                </span>
              </div>

              <div>
                <p className="text-body-lg font-medium text-neutral-800">
                  {tags.description}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="chip-warm capitalize">{tags.item_type.replace("_", " ")}</span>
                <span className="chip-blush capitalize">{tags.pattern}</span>
                <span className="chip-sage capitalize">{tags.fabric_guess}</span>
                <span className="chip-warm">
                  Formality: {tags.formality}/5
                </span>
              </div>

              {/* Color swatches */}
              <div className="flex items-center gap-2">
                <span className="text-body-sm text-neutral-600">Colors:</span>
                <div
                  className="w-6 h-6 rounded-full border border-neutral-200"
                  style={{ backgroundColor: tags.color_primary }}
                />
                {tags.color_secondary && (
                  <div
                    className="w-6 h-6 rounded-full border border-neutral-200"
                    style={{ backgroundColor: tags.color_secondary }}
                  />
                )}
              </div>
            </div>

            {/* Uniform toggle */}
            <button
              onClick={() => setIsUniform(!isUniform)}
              className={`w-full card flex items-center gap-3 transition-all duration-200 ${
                isUniform ? "ring-2 ring-warm-400 bg-warm-50" : ""
              }`}
            >
              <span className="text-2xl">👔</span>
              <div className="flex-1 text-left">
                <p className="text-body-md font-medium text-neutral-800">
                  This is a uniform piece
                </p>
                <p className="text-body-sm text-neutral-600">
                  We&apos;ll know how to restyle it for after-school plans
                </p>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  isUniform
                    ? "border-warm-400 bg-warm-400"
                    : "border-neutral-400"
                }`}
              >
                {isUniform && <Check size={12} className="text-white" />}
              </div>
            </button>

            {error && (
              <p className="text-body-sm text-blush-600 bg-blush-50 rounded-card px-3 py-2">
                {error}
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setStep("capture");
                  setFile(null);
                  setPreview(null);
                  setTags(null);
                }}
              >
                Retake
              </Button>
              <Button onClick={handleSave} className="flex-1" loading={loading}>
                Save to wardrobe
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
