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

// ──────────────────────────────────────
// Claude — text analysis & styling logic
// ──────────────────────────────────────

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
            source: {
              type: "base64",
              media_type: mediaType as
                | "image/jpeg"
                | "image/png"
                | "image/webp"
                | "image/gif",
              data: imageBase64,
            },
          },
          {
            type: "text",
            text: `You are a personal styling assistant analyzing a full body photo to estimate physical attributes for outfit recommendations. This is for a fashion app — be specific but kind.

Analyze the photo and return ONLY a JSON object:
{
  "height_estimate": "estimated height in feet/inches and cm, e.g. 5'3\\" (160cm)",
  "body_shape": "brief description e.g. 'Petite, slim frame' or 'Average build, hourglass proportions' or 'Tall, athletic build'",
  "skin_tone": "description e.g. 'Light, fair complexion' or 'Medium-warm, golden undertone' or 'Deep, rich complexion'",
  "skin_undertone": "warm | cool | neutral",
  "hair_length": "e.g. 'Shoulder-length' or 'Long, past shoulders' or 'Short bob'",
  "hair_color": "e.g. 'Dark brown' or 'Black' or 'Light brown with highlights'",
  "hair_texture": "e.g. 'Straight' or 'Wavy' or 'Curly' or 'Coily'",
  "size_estimate": "e.g. 'XS-S (US 0-2)' or 'S-M (US 4-6)' or 'M-L (US 8-10)'"
}

Be encouraging and fashion-focused in descriptions. Return valid JSON only. No other text.`,
          },
        ],
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  const cleaned = text.replace(/```json\n?|```/g, "").trim();
  return JSON.parse(cleaned) as AIProfileAnalysis;
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
            source: {
              type: "base64",
              media_type: mediaType as
                | "image/jpeg"
                | "image/png"
                | "image/webp"
                | "image/gif",
              data: imageBase64,
            },
          },
          {
            type: "text",
            text: `You are a fashion-savvy wardrobe cataloguer for a women's styling app. Analyze this clothing photo and return ONLY a JSON object:
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
Return valid JSON only. No other text.`,
          },
        ],
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  const cleaned = text.replace(/```json\n?|```/g, "").trim();
  return JSON.parse(cleaned) as AITagResult;
}

// ──────────────────────────────────────
// Styling angles — rotated randomly each
// request to force variety
// ──────────────────────────────────────

const STYLING_ANGLES = [
  "Lead with COLOR — pick the most vibrant or interesting colored item first, then build around it. Apply the 3-color rule.",
  "Lead with TEXTURE — pick an item with interesting fabric (knit, denim, satin, linen) and contrast it with something smooth. Reference the fabric mixing principle.",
  "Lead with a STATEMENT PIECE — find the boldest item and make it the center. Style like a Reformation/Cool Girl lookbook.",
  "Lead with SILHOUETTE — think proportion play. Go for contrast: fitted top + loose bottom, or oversized top + slim bottom. Reference the rule of thirds.",
  "Lead with PATTERN — if there's a patterned piece, build the outfit around it. Use the 3-color rule with the pattern's colors.",
  "Lead with LAYERING — even in Singapore's heat, creative Korean-style layering works. Open shirt over tank, vest over tee. Add depth.",
  "Lead with the BOTTOM — start with the most interesting bottom and build up. Apply Zara aesthetic: take something structured and dress it down.",
  "Lead with UNEXPECTED PAIRINGS — combine items the user never wears together. Think COS minimalism meets streetwear energy.",
];

// ──────────────────────────────────────
// 3. Outfit generation (Claude text)
// Uses fashion knowledge base + variety
// logic + recent outfit avoidance
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
    ? `
PHYSICAL PROFILE (estimated from profile photo):
- Height: ${profile.physical_profile.height_estimate}
- Body shape: ${profile.physical_profile.body_shape}
- Skin tone & undertone: ${profile.physical_profile.skin_tone} (${profile.physical_profile.skin_undertone})
- Hair: ${profile.physical_profile.hair_length}, ${profile.physical_profile.hair_color}, ${profile.physical_profile.hair_texture}
- Size estimate: ${profile.physical_profile.size_estimate}`
    : "PHYSICAL PROFILE: Not provided";

  const rulesContext =
    profile.style_rules && profile.style_rules.length > 0
      ? `\nSTYLE RULES/RESTRICTIONS:\n${profile.style_rules.map((r) => `- ${r}`).join("\n")}`
      : "\nSTYLE RULES: None specified";

  // Random styling angle for variety
  const randomAngle =
    STYLING_ANGLES[Math.floor(Math.random() * STYLING_ANGLES.length)];

  // Recent outfits to avoid repetition
  const recentContext =
    recentOutfitItemIds.length > 0
      ? `\nRECENTLY SUGGESTED OUTFITS (DO NOT REPEAT THESE EXACT COMBOS):\n${recentOutfitItemIds.map((ids, i) => `- Outfit ${i + 1}: items [${ids.join(", ")}]`).join("\n")}`
      : "";

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: `You are "Looks Good, Feels Good" — a fun, warm, fashion-savvy best friend and personal stylist who ACTUALLY knows fashion theory. You style girls and women in Singapore. You are CREATIVE and NEVER give boring or repetitive suggestions.

You have been trained on a comprehensive fashion styling knowledge base. USE IT in every recommendation:

${FASHION_KNOWLEDGE_BASE}

═══════════════════════════════════════
USER CONTEXT
═══════════════════════════════════════

${physicalContext}
${rulesContext}

WARDROBE:
${JSON.stringify(wardrobeSummary)}

OCCASION: ${occasion}
MOOD: ${mood}
WEATHER: ${weather.temperature}°C, ${weather.humidity}% humidity, ${weather.condition}
STYLE PREFERENCES: ${profile.style_preferences.join(", ")}
AGE RANGE: ${profile.age_range}
HAS UNIFORM: ${wardrobe.some((i) => i.is_uniform) ? "yes" : "no"}
${recentContext}

═══════════════════════════════════════
YOUR CREATIVE DIRECTION FOR THIS REQUEST:
${randomAngle}
═══════════════════════════════════════

VARIETY RULES:
1. NEVER default to "black top + neutral bottom" unless the occasion truly calls for it
2. Use the 3-color rule — pick colors intentionally, not randomly
3. Apply proportion play — explain WHY the silhouette works
4. Hair MUST match the occasion intensity from the hair guide AND suit the outfit's neckline
5. Makeup MUST match the occasion intensity from the makeup guide AND the user's skin tone and age
6. Shoes MUST match the occasion from the shoe guide AND the user's height
7. If you suggested items recently (see above), DO NOT repeat — find a different combination
8. Reference specific styling principles in your notes (e.g., "Using the rule of thirds here...")
9. The vibe line should reference the ACTUAL occasion, not generic hype

Return ONLY a JSON object:
{
  "outfit_items": ["item_id_1", "item_id_2"],
  "styling_notes": "How to wear each piece for THIS occasion. Reference styling principles (proportion play, rule of thirds, fabric mixing, etc.). Be specific — tucking, rolling, layering, and WHY.",
  "color_analysis": "Why these colors work with the user's skin tone/undertone AND the occasion. Reference the color theory guide. Apply the 3-color rule.",
  "hair_suggestion": "A specific hairstyle from the hair guide matching the occasion intensity AND the outfit neckline. Describe exactly how to do it.",
  "makeup_tip": "Specific makeup from the makeup guide matching occasion intensity, skin tone, AND age. Name products and placement.",
  "accessory_tip": "Specific accessories matching occasion intensity. Reference shoe guide for footwear. Consider height.",
  "vibe_line": "Fun one-liner capturing the SPECIFIC occasion energy.",
  "weather_note": "How this outfit handles Singapore's weather. Reference climate rules.",
  "height_fit_tips": "How this outfit flatters their body shape. Reference the body shape guide with specific principles."
}

CRITICAL: Match EVERYTHING to the occasion intensity. Groceries = 1/10. Club = 8/10. The outfit, hair, makeup, shoes, and accessories should ALL reflect this intensity level. DO NOT give dinner-level styling for groceries.

Return valid JSON only. No other text.`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  const cleaned = text.replace(/```json\n?|```/g, "").trim();
  return JSON.parse(cleaned) as AIOutfitResult;
}

// ──────────────────────────────────────
// 4. Gemini — Image generation
// ──────────────────────────────────────

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const GEMINI_MODEL = "gemini-2.5-flash-image";

export async function generateOutfitImage(
  outfitDescription: string,
  occasion: string,
  profile: Profile
): Promise<string | null> {
  const physicalDesc = profile.physical_profile
    ? `a ${profile.physical_profile.body_shape} young woman, ${profile.physical_profile.height_estimate} tall, with ${profile.physical_profile.skin_tone} skin, ${profile.physical_profile.hair_length} ${profile.physical_profile.hair_color} ${profile.physical_profile.hair_texture} hair`
    : "a stylish young woman";

  const prompt = `Create a 2x2 grid of 4 photorealistic fashion photographs of ${physicalDesc} wearing this exact outfit: ${outfitDescription}. The setting is a ${occasion} location in Singapore.

The 4 photos should each have a DIFFERENT camera angle, framing, and focus:

Photo 1 (top-left): Full body shot from the front. Standing naturally, confident posture. Show the complete outfit head to toe. Slight smile, looking at camera. Warm natural lighting.

Photo 2 (top-right): Three-quarter angle from the side. Walking or mid-stride. This captures the silhouette and how the outfit moves and drapes on the body. Slightly candid, like a street style photo.

Photo 3 (bottom-left): Close-up detail shot. Focus on an interesting design element — could be the fabric texture, the way a collar sits, how the top is tucked, sleeve details, or a pattern close-up. Shallow depth of field, blurred background.

Photo 4 (bottom-right): Lifestyle shot from behind or at a creative angle. The person interacting with the ${occasion} setting — sitting at a table, leaning on a railing, walking away. Shows the outfit in context.

CRITICAL RULES:
- ALL 4 photos must show the SAME person wearing the EXACT SAME outfit
- Photorealistic ONLY — like photos taken on a high-end smartphone
- Real skin texture, real fabric texture, natural shadows and lighting
- NOT an illustration, NOT a drawing, NOT a sketch
- The 4 photos arranged in a clean 2x2 grid with thin white borders
- Do NOT include any text or watermarks
- Singapore setting — tropical plants, modern architecture, warm lighting`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            responseModalities: ["IMAGE", "TEXT"],
          },
        }),
      }
    );

    if (!response.ok) {
      console.error(
        "Gemini API error:",
        response.status,
        await response.text()
      );
      return null;
    }

    const data = await response.json();

    const parts = data.candidates?.[0]?.content?.parts;
    if (!parts) return null;

    for (const part of parts) {
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
