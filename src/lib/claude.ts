import Anthropic from "@anthropic-ai/sdk";
import {
  AITagResult,
  AIOutfitResult,
  AIProfileAnalysis,
  WardrobeItem,
  Profile,
  WeatherData,
} from "@/types";
import { FASHION_KNOWLEDGE_BASE } from "@/lib/fashion-knowledge";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const CLAUDE_MODEL = "claude-haiku-4-5-20251001";

// ──────────────────────────────────────
// 1. Profile photo analysis (Claude Vision)
// ──────────────────────────────────────

export async function analyzeProfilePhoto(
  imageBase64: string,
  mediaType: string
): Promise<AIProfileAnalysis> {
  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 600,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType as any, data: imageBase64 },
          },
          {
            type: "text",
            text: `You are a personal styling assistant analyzing a full body photo to estimate physical attributes for outfit recommendations. Be specific but kind.

Return ONLY a JSON object:
{
  "height_estimate": "e.g. 5'3\\" (160cm)",
  "body_shape": "e.g. 'Petite, slim frame'",
  "skin_tone": "e.g. 'Medium-warm, golden undertone'",
  "skin_undertone": "warm | cool | neutral",
  "hair_length": "e.g. 'Shoulder-length'",
  "hair_color": "e.g. 'Dark brown'",
  "hair_texture": "e.g. 'Straight'",
  "size_estimate": "e.g. 'XS-S (US 0-2)'"
}
Return valid JSON only.`,
          },
        ],
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return JSON.parse(text.replace(/```json\n?|```/g, "").trim());
}

// ──────────────────────────────────────
// 2. Wardrobe item tagging (Claude Vision)
// ──────────────────────────────────────

export async function tagWardrobeItem(
  imageBase64: string,
  mediaType: string
): Promise<AITagResult> {
  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType as any, data: imageBase64 },
          },
          {
            type: "text",
            text: `You are a fashion-savvy wardrobe cataloguer. Analyze this clothing photo and return ONLY a JSON object:
{
  "item_type": "top | bottom | dress | skirt | outerwear | shoes | bag | accessory | swimwear | activewear | uniform_top | uniform_bottom",
  "color_primary": "#hex",
  "color_secondary": "#hex or null",
  "pattern": "solid | striped | floral | plaid | graphic | abstract | polka_dot | animal_print | other",
  "formality": 1-5,
  "season": ["hot", "cool", "rainy", "all"],
  "fabric_guess": "cotton | denim | silk | chiffon | polyester | linen | knit | leather | satin | tulle | other",
  "description": "Brief 1-line description"
}
Return valid JSON only.`,
          },
        ],
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return JSON.parse(text.replace(/```json\n?|```/g, "").trim());
}

// ──────────────────────────────────────
// Styling angles for variety
// ──────────────────────────────────────

const STYLING_ANGLES = [
  "Lead with COLOR — pick the most vibrant item first. Apply the 3-color rule.",
  "Lead with TEXTURE — contrast fabrics. Reference the fabric mixing principle.",
  "Lead with a STATEMENT PIECE — find the boldest item. Style like Reformation/Cool Girl.",
  "Lead with SILHOUETTE — think proportion play. Fitted top + loose bottom or vice versa.",
  "Lead with PATTERN — build around a patterned piece. Use 3-color rule with pattern colors.",
  "Lead with LAYERING — Korean-style layering even in heat. Open shirt over tank, vest over tee.",
  "Lead with the BOTTOM — start with the most interesting bottom and build up. Zara aesthetic.",
  "Lead with UNEXPECTED PAIRINGS — items the user never wears together. COS meets streetwear.",
];

// ──────────────────────────────────────
// 3. Outfit generation (Claude text)
// ──────────────────────────────────────

export async function generateOutfit(
  wardrobe: WardrobeItem[],
  mood: string,
  occasion: string,
  weather: WeatherData,
  profile: Profile,
  recentOutfitItemIds: string[][] = []
): Promise<AIOutfitResult> {
  const wardrobeSummary = wardrobe.map((item) => ({
    id: item.id,
    type: item.item_type,
    color: item.color_primary,
    pattern: item.pattern,
    formality: item.formality,
    fabric: item.fabric_guess,
    description: item.description,
    is_uniform: item.is_uniform,
  }));

  const physicalContext = profile.physical_profile
    ? `PHYSICAL PROFILE:
- Height: ${profile.physical_profile.height_estimate}
- Body shape: ${profile.physical_profile.body_shape}
- Skin tone: ${profile.physical_profile.skin_tone} (${profile.physical_profile.skin_undertone})
- Hair: ${profile.physical_profile.hair_length}, ${profile.physical_profile.hair_color}, ${profile.physical_profile.hair_texture}
- Size: ${profile.physical_profile.size_estimate}`
    : "PHYSICAL PROFILE: Not provided";

  const rulesContext = profile.style_rules?.length > 0
    ? `STYLE RULES:\n${profile.style_rules.map((r) => `- ${r}`).join("\n")}`
    : "STYLE RULES: None";

  const randomAngle = STYLING_ANGLES[Math.floor(Math.random() * STYLING_ANGLES.length)];

  const recentContext = recentOutfitItemIds.length > 0
    ? `RECENTLY SUGGESTED (DO NOT REPEAT):\n${recentOutfitItemIds.map((ids, i) => `- Outfit ${i + 1}: [${ids.join(", ")}]`).join("\n")}`
    : "";

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4000,
    messages: [
      {
        role: "user",
        content: `You are "Looks Good, Feels Good" — a fashion-savvy best friend and stylist for girls and women in Singapore. You ACTUALLY know fashion theory.

${FASHION_KNOWLEDGE_BASE}

${physicalContext}
${rulesContext}

WARDROBE: ${JSON.stringify(wardrobeSummary)}

OCCASION: ${occasion}
MOOD: ${mood}
WEATHER: ${weather.temperature}°C, ${weather.humidity}% humidity, ${weather.condition}
STYLE PREFERENCES: ${profile.style_preferences.join(", ")}
AGE RANGE: ${profile.age_range}
${recentContext}

CREATIVE DIRECTION: ${randomAngle}

Return ONLY a JSON object:
{
  "outfit_items": ["item_id_1", "item_id_2"],
  "styling_notes": "How to wear each piece for THIS occasion. Reference styling principles.",
  "color_analysis": "Why these colors work with skin tone AND occasion. Apply 3-color rule.",
  "hair_suggestion": "Specific hairstyle from the hair guide matching occasion intensity AND neckline.",
  "makeup_tip": "Specific makeup matching occasion intensity, skin tone, AND age.",
  "accessory_tip": "Accessories + shoes matching occasion. Consider height.",
  "vibe_line": "Fun one-liner for this SPECIFIC occasion.",
  "weather_note": "Weather suitability.",
  "height_fit_tips": "How this flatters their body shape."
}

CRITICAL: Match EVERYTHING to occasion intensity. Groceries=1/10. Club=8/10. DO NOT give dinner styling for groceries.

Return valid JSON only. No other text.`,
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return JSON.parse(text.replace(/```json\n?|```/g, "").trim());
}

// ──────────────────────────────────────
// 4. Gemini — Image generation
// Now sends user's profile photo as reference
// ──────────────────────────────────────

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const GEMINI_MODEL = "gemini-2.5-flash-image";

export async function generateOutfitImage(
  outfitDescription: string,
  occasion: string,
  profile: Profile,
  profilePhotoBase64?: string | null
): Promise<string | null> {
  const physicalDesc = profile.physical_profile
    ? `a ${profile.physical_profile.body_shape} young woman, ${profile.physical_profile.height_estimate} tall, with ${profile.physical_profile.skin_tone} skin, ${profile.physical_profile.hair_length} ${profile.physical_profile.hair_color} ${profile.physical_profile.hair_texture} hair`
    : "a stylish young woman";

  const prompt = `Generate 2 photorealistic fashion photographs side by side of ${physicalDesc} wearing this exact outfit: ${outfitDescription}. The setting is a ${occasion} location in Singapore.

${profilePhotoBase64 ? "IMPORTANT: I have attached a reference photo of the actual person. The generated photos must closely match this person's face, skin tone, hair, and body proportions. Make it look like the SAME PERSON in the reference photo wearing the described outfit." : ""}

Photo 1: Full body shot from the front. Standing naturally, confident posture. Complete outfit head to toe. Warm natural lighting.
Photo 2: Three-quarter angle, slightly candid, like a street style photo. Different background within the same ${occasion} setting.

RULES:
- Photorealistic ONLY — like high-end smartphone photos
- Real skin texture, real fabric texture, natural shadows
- NOT illustration, NOT drawing, NOT sketch
- Singapore setting — tropical, modern, warm lighting
- No text or watermarks`;

  try {
    // Build the request parts
    const parts: any[] = [];

    // Add profile photo as reference if available
    if (profilePhotoBase64) {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: profilePhotoBase64,
        },
      });
    }

    parts.push({ text: prompt });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            responseModalities: ["IMAGE", "TEXT"],
          },
        }),
      }
    );

    if (!response.ok) {
      console.error("Gemini API error:", response.status, await response.text());
      return null;
    }

    const data = await response.json();
    const responseParts = data.candidates?.[0]?.content?.parts;
    if (!responseParts) return null;

    for (const part of responseParts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }

    return null;
  } catch (error) {
    console.error("Gemini image generation error:", error);
    return null;
  }
}
