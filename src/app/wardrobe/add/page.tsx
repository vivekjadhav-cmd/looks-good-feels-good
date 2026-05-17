"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { compressImage, fileToBase64, getMediaType } from "@/lib/image";
import AppShell from "@/components/layout/AppShell";
import Button from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { Camera, X, Check, Loader2, ImagePlus } from "lucide-react";

interface QueuedPhoto {
  id: string;
  file: File;
  preview: string;
  status: "pending" | "uploading" | "tagging" | "done" | "error";
  description?: string;
  error?: string;
}

export default function WardrobeAddPage() {
  const [photos, setPhotos] = useState<QueuedPhoto[]>([]);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  function handleFilesSelected(files: FileList | null) {
    if (!files) return;

    const newPhotos: QueuedPhoto[] = Array.from(files).map((file) => ({
      id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      file,
      preview: URL.createObjectURL(file),
      status: "pending" as const,
    }));

    setPhotos((prev) => [...prev, ...newPhotos]);
  }

  function removePhoto(id: string) {
    setPhotos((prev) => {
      const photo = prev.find((p) => p.id === id);
      if (photo) URL.revokeObjectURL(photo.preview);
      return prev.filter((p) => p.id !== id);
    });
  }

  function updatePhotoStatus(id: string, updates: Partial<QueuedPhoto>) {
    setPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  }

  async function processAllPhotos() {
    setProcessing(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast("Please log in first", "error");
      setProcessing(false);
      return;
    }

    const pendingPhotos = photos.filter((p) => p.status === "pending");

    for (const photo of pendingPhotos) {
      try {
        // Step 1: Upload to storage
        updatePhotoStatus(photo.id, { status: "uploading" });

        const compressed = await compressImage(photo.file);
        const itemId = crypto.randomUUID();
        const path = `${user.id}/${itemId}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from("wardrobe")
          .upload(path, compressed, { contentType: "image/jpeg" });

        if (uploadError) throw new Error("Upload failed");

        const {
          data: { publicUrl },
        } = supabase.storage.from("wardrobe").getPublicUrl(path);

        // Step 2: AI tag the item
        updatePhotoStatus(photo.id, { status: "tagging" });

        const base64 = await fileToBase64(compressed);
        const mediaType = getMediaType(compressed);

        const tagRes = await fetch("/api/wardrobe/tag", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64, mediaType }),
        });

        if (!tagRes.ok) throw new Error("Tagging failed");
        const tagsArray = await tagRes.json();

        // Handle multiple items detected in one photo
        const items = Array.isArray(tagsArray) ? tagsArray : [tagsArray];
        const descriptions: string[] = [];

        for (let i = 0; i < items.length; i++) {
          const tags = items[i];
          const currentItemId = i === 0 ? itemId : crypto.randomUUID();
          
          // Step 3: Save each item to database
          const { error: dbError } = await supabase
            .from("wardrobe_items")
            .insert({
              id: currentItemId,
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
              is_uniform: tags.item_type?.includes("uniform") || false,
            });

          if (dbError) throw new Error("Save failed");
          descriptions.push(tags.description);
        }

        updatePhotoStatus(photo.id, {
          status: "done",
          description: descriptions.join(" + "),
        });
      } catch (err: any) {
        updatePhotoStatus(photo.id, {
          status: "error",
          error: err.message || "Something went wrong",
        });
      }
    }

    setProcessing(false);

    const doneCount = photos.filter(
      (p) => p.status === "done" || pendingPhotos.find((pp) => pp.id === p.id)
    ).length;
    toast(`${doneCount} items added to your wardrobe!`);
  }

  const pendingCount = photos.filter((p) => p.status === "pending").length;
  const doneCount = photos.filter((p) => p.status === "done").length;
  const allDone =
    photos.length > 0 && photos.every((p) => p.status === "done" || p.status === "error");

  return (
    <AppShell>
      <div className="page-container">
        <div className="mb-6">
          <h1 className="font-display text-heading-lg text-warm-800 mb-1">
            Add to wardrobe
          </h1>
          <p className="text-body-md text-neutral-600">
            Upload multiple photos at once — we&apos;ll tag them all
          </p>
        </div>

        {/* Upload area */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={processing}
          className="card w-full flex flex-col items-center gap-3 py-10 hover:shadow-lifted transition-shadow mb-4"
        >
          <div className="w-14 h-14 rounded-full bg-sage-50 flex items-center justify-center">
            <ImagePlus size={24} className="text-sage-600" />
          </div>
          <span className="text-body-md font-medium text-neutral-800">
            Tap to add photos
          </span>
          <span className="text-body-sm text-neutral-400">
            Select multiple photos from your gallery
          </span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFilesSelected(e.target.files)}
        />

        {/* Photo queue */}
        {photos.length > 0 && (
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between">
              <p className="text-body-sm font-medium text-neutral-600">
                {photos.length} {photos.length === 1 ? "photo" : "photos"} selected
                {doneCount > 0 && ` · ${doneCount} done`}
              </p>
              {!processing && pendingCount > 0 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-body-sm text-sage-600 font-medium"
                >
                  + Add more
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {photos.map((photo) => (
                <div key={photo.id} className="relative">
                  <div className="aspect-square rounded-card overflow-hidden bg-neutral-100">
                    <img
                      src={photo.preview}
                      alt="Clothing item"
                      className={`w-full h-full object-cover transition-opacity ${
                        photo.status === "done"
                          ? "opacity-100"
                          : photo.status === "error"
                          ? "opacity-50"
                          : "opacity-100"
                      }`}
                    />

                    {/* Status overlay */}
                    {photo.status === "uploading" && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <Loader2
                          size={20}
                          className="text-white animate-spin"
                        />
                      </div>
                    )}
                    {photo.status === "tagging" && (
                      <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center">
                        <Loader2
                          size={20}
                          className="text-white animate-spin"
                        />
                        <span className="text-[9px] text-white mt-1">
                          Tagging...
                        </span>
                      </div>
                    )}
                    {photo.status === "done" && (
                      <div className="absolute top-1 right-1 w-5 h-5 bg-sage-400 rounded-full flex items-center justify-center">
                        <Check size={12} className="text-white" />
                      </div>
                    )}
                    {photo.status === "error" && (
                      <div className="absolute inset-0 bg-blush-600/30 flex items-center justify-center">
                        <span className="text-[10px] text-white font-medium bg-blush-600 px-2 py-0.5 rounded">
                          Failed
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Remove button (only when not processing) */}
                  {!processing && photo.status !== "done" && (
                    <button
                      onClick={() => removePhoto(photo.id)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full shadow-soft flex items-center justify-center"
                    >
                      <X size={10} className="text-blush-600" />
                    </button>
                  )}

                  {/* Description tag */}
                  {photo.description && (
                    <p className="text-[9px] text-neutral-600 mt-1 truncate">
                      {photo.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        {photos.length > 0 && (
          <div className="space-y-3">
            {!allDone && (
              <Button
                onClick={processAllPhotos}
                className="w-full flex items-center justify-center gap-2"
                loading={processing}
                disabled={pendingCount === 0}
              >
                <Camera size={16} />
                {processing
                  ? "Processing..."
                  : `Upload & tag ${pendingCount} ${pendingCount === 1 ? "item" : "items"}`}
              </Button>
            )}

            {allDone && (
              <Button
                onClick={() => router.push("/wardrobe")}
                className="w-full"
              >
                View my wardrobe →
              </Button>
            )}

            {allDone && photos.some((p) => p.status === "error") && (
              <Button
                variant="secondary"
                onClick={() => {
                  setPhotos((prev) =>
                    prev.map((p) =>
                      p.status === "error" ? { ...p, status: "pending" as const } : p
                    )
                  );
                }}
                className="w-full"
              >
                Retry failed items
              </Button>
            )}
          </div>
        )}

        {/* Empty state */}
        {photos.length === 0 && (
          <div className="text-center py-6">
            <p className="text-body-sm text-neutral-400">
              Tip: Photograph each clothing item flat on a bed or hanging up for
              best results
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
