// ──────────────────────────────────────
// User / Profile
// ──────────────────────────────────────

export type AgeRange = "10-12" | "13-15" | "16-18" | "20s" | "30s";

export type StylePreference =
  | "casual"
  | "smart"
  | "edgy"
  | "feminine"
  | "minimal"
  | "bold";

// AI-estimated from profile photo
export interface PhysicalProfile {
  height_estimate: string;
  body_shape: string;
  skin_tone: string;
  skin_undertone: "warm" | "cool" | "neutral";
  hair_length: string;
  hair_color: string;
  hair_texture: string;
  size_estimate: string;
}

export interface Profile {
  id: string;
  display_name: string | null;
  age_range: AgeRange | null;
  style_preferences: StylePreference[];
  style_rules: string[];
  has_uniform: boolean;
  onboarding_complete: boolean;
  profile_photo_url: string | null;
  physical_profile: PhysicalProfile | null;
  created_at: string;
}

// ──────────────────────────────────────
// Wardrobe
// ──────────────────────────────────────

export type ItemType =
  | "top"
  | "bottom"
  | "dress"
  | "skirt"
  | "outerwear"
  | "shoes"
  | "bag"
  | "accessory"
  | "swimwear"
  | "activewear"
  | "uniform_top"
  | "uniform_bottom";

export type Pattern =
  | "solid"
  | "striped"
  | "floral"
  | "plaid"
  | "graphic"
  | "abstract"
  | "polka_dot"
  | "animal_print"
  | "other";

export type FabricGuess =
  | "cotton"
  | "denim"
  | "silk"
  | "chiffon"
  | "polyester"
  | "linen"
  | "knit"
  | "leather"
  | "satin"
  | "tulle"
  | "other";

export type Season = "hot" | "cool" | "rainy" | "all";

export interface WardrobeItem {
  id: string;
  user_id: string;
  image_url: string;
  item_type: ItemType;
  color_primary: string | null;
  color_secondary: string | null;
  pattern: Pattern;
  formality: number;
  season: Season[];
  fabric_guess: FabricGuess | null;
  description: string | null;
  is_uniform: boolean;
  created_at: string;
}

export interface AITagResult {
  item_type: ItemType;
  color_primary: string;
  color_secondary: string | null;
  pattern: Pattern;
  formality: number;
  season: Season[];
  fabric_guess: FabricGuess;
  description: string;
}

// ──────────────────────────────────────
// Outfits
// ──────────────────────────────────────

export interface Outfit {
  id: string;
  user_id: string;
  item_ids: string[];
  occasion: string | null;
  mood: string | null;
  weather_temp: number | null;
  weather_condition: string | null;
  styling_notes: string | null;
  color_analysis: string | null;
  hair_suggestion: string | null;
  makeup_tip: string | null;
  accessory_tip: string | null;
  vibe_line: string | null;
  weather_note: string | null;
  height_fit_tips: string | null;
  outfit_image_url: string | null;
  outfit_date: string;
  created_at: string;
}

export interface AIProfileAnalysis {
  height_estimate: string;
  body_shape: string;
  skin_tone: string;
  skin_undertone: "warm" | "cool" | "neutral";
  hair_length: string;
  hair_color: string;
  hair_texture: string;
  size_estimate: string;
}

export interface AIOutfitResult {
  outfit_items: string[];
  styling_notes: string;
  color_analysis: string;
  hair_suggestion: string;
  makeup_tip: string;
  accessory_tip: string;
  vibe_line: string;
  weather_note: string;
  height_fit_tips: string;
}

// ──────────────────────────────────────
// Weather
// ──────────────────────────────────────

export interface WeatherData {
  temperature: number;
  humidity: number;
  condition: string;
  fetched_at: number;
}

// ──────────────────────────────────────
// UI
// ──────────────────────────────────────

export const OCCASIONS = [
  "School",
  "Date night",
  "Brunch",
  "Dinner",
  "Casual hangout",
  "Party",
  "Wedding guest",
  "Job interview",
  "Workout",
  "Beach day",
] as const;

export const MOODS = [
  "Confident",
  "Chill",
  "Bold",
  "Minimal",
  "Cozy",
  "Edgy",
  "Feminine",
  "Playful",
] as const;

export type Occasion = (typeof OCCASIONS)[number];
export type Mood = (typeof MOODS)[number];
