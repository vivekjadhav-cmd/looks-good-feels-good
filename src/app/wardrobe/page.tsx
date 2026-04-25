"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase";
import { WardrobeItem } from "@/types";
import { WardrobeGridSkeleton } from "@/components/ui/Skeleton";
import AppShell from "@/components/layout/AppShell";
import { Plus, Trash2 } from "lucide-react";

export default function WardrobePage() {
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const supabase = createClient();

  useEffect(() => {
    loadWardrobe();
  }, []);

  async function loadWardrobe() {
    const { data } = await supabase
      .from("wardrobe_items")
      .select("*")
      .order("created_at", { ascending: false });

    setItems((data as WardrobeItem[]) || []);
    setLoading(false);
  }

  async function deleteItem(id: string) {
    setDeleting(id);
    await supabase.from("wardrobe_items").delete().eq("id", id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    setDeleting(null);
  }

  // Get unique item types for filter bar
  const itemTypes = Array.from(new Set(items.map((i) => i.item_type)));

  const filteredItems =
    filter === "all" ? items : items.filter((i) => i.item_type === filter);

  const grouped = filteredItems.reduce(
    (acc, item) => {
      const type = item.item_type;
      if (!acc[type]) acc[type] = [];
      acc[type].push(item);
      return acc;
    },
    {} as Record<string, WardrobeItem[]>
  );

  return (
    <AppShell>
      <div className="page-container">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-display text-heading-lg text-warm-800">
              My wardrobe
            </h1>
            <p className="text-body-sm text-neutral-600">
              {items.length} {items.length === 1 ? "item" : "items"}
            </p>
          </div>
          <Link
            href="/wardrobe/add"
            className="btn-primary flex items-center gap-2 text-body-md"
          >
            <Plus size={18} />
            Add
          </Link>
        </div>

        {/* Filter bar */}
        {items.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 mb-5 -mx-4 px-4 scrollbar-hide">
            <button
              onClick={() => setFilter("all")}
              className={`chip-warm whitespace-nowrap ${
                filter === "all" ? "chip-active" : ""
              }`}
            >
              All ({items.length})
            </button>
            {itemTypes.map((type) => {
              const count = items.filter((i) => i.item_type === type).length;
              return (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={`chip-sage whitespace-nowrap capitalize ${
                    filter === type ? "chip-active" : ""
                  }`}
                >
                  {type.replace("_", " ")}s ({count})
                </button>
              );
            })}
          </div>
        )}

        {loading ? (
          <WardrobeGridSkeleton />
        ) : items.length === 0 ? (
          /* Empty state */
          <div className="text-center py-16">
            <div className="text-5xl mb-4">👗</div>
            <h3 className="font-display text-heading-sm text-warm-800 mb-2">
              Your wardrobe is waiting!
            </h3>
            <p className="text-body-md text-neutral-600 mb-6">
              Start adding your faves so we can style you perfectly.
            </p>
            <Link href="/wardrobe/add" className="btn-primary inline-block">
              Add your first item
            </Link>
          </div>
        ) : (
          /* Grouped grid */
          <div className="space-y-8">
            {Object.entries(grouped).map(([type, typeItems]) => (
              <div key={type}>
                <h3 className="text-body-sm font-medium text-neutral-600 uppercase tracking-wider mb-3">
                  {type.replace("_", " ")}s ({typeItems.length})
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {typeItems.map((item) => (
                    <div key={item.id} className="relative group">
                      <div className="aspect-square rounded-card overflow-hidden bg-neutral-100">
                        <Image
                          src={item.image_url}
                          alt={item.description || "Wardrobe item"}
                          width={300}
                          height={300}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Uniform badge */}
                      {item.is_uniform && (
                        <span className="absolute top-1.5 left-1.5 bg-warm-200 text-warm-800 text-[10px] font-medium px-1.5 py-0.5 rounded-pill">
                          Uniform
                        </span>
                      )}

                      {/* Delete button on hover/tap */}
                      <button
                        onClick={() => deleteItem(item.id)}
                        disabled={deleting === item.id}
                        className="absolute top-1.5 right-1.5 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-soft"
                      >
                        <Trash2
                          size={14}
                          className={
                            deleting === item.id
                              ? "text-neutral-400 animate-spin"
                              : "text-blush-600"
                          }
                        />
                      </button>

                      {/* Description */}
                      <p className="text-[11px] text-neutral-600 mt-1 truncate">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
