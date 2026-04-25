import Anthropic from "@anthropic-ai/sdk";
import {
  AITagResult,
  AIOutfitResult,
  AIProfileAnalysis,
  WardrobeItem,
  Profile,
  WeatherData,
} from "@/types";

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
// 3. Outfit generation (Claude text)
// ──────────────────────────────────────

export async function generateOutfit(
  wardrobe: WardrobeItem[],
  mood: string,
  occasion: string,
  weather: WeatherData,
  profile: Profile
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

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1500,
    messages: [
      {
        role: "user",
        content: `You are "Looks Good, Feels Good" — a fun, warm, fashion-savvy best friend and personal stylist for girls and women in Singapore.

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

TASK:
Generate the perfect outfit from the user's own wardrobe. Consider body proportions for flattering fits, skin undertone for color harmony, and hair for overall aesthetic cohesion. Respect ALL style rules.

Return ONLY a JSON object:
{
  "outfit_items": ["item_id_1", "item_id_2"],
  "styling_notes": "Specific how-to-wear advice — tucking, rolling, layering. Reference body shape for fit tips.",
  "color_analysis": "Why these colors work with the user's skin tone and undertone. Be specific about warm/cool harmony.",
  "hair_suggestion": "A quick hair styling tip that complements this outfit and neckline.",
  "makeup_tip": "Age-appropriate makeup look that ties the outfit together, considering skin tone.",
  "accessory_tip": "Accessory picks from wardrobe or general suggestions. Respect any jewelry/accessory rules.",
  "vibe_line": "Fun hype one-liner about the outfit.",
  "weather_note": "Why this outfit works for today's Singapore weather.",
  "height_fit_tips": "Specific tips based on height and body shape — e.g. how the high waist elongates legs, how the oversized blazer balances frame."
}

RULES:
- ONLY use item IDs from the wardrobe provided
- If uniform items exist AND occasion involves school/post-school → restyle creatively
- Prioritize breathable fabrics for Singapore's tropical climate
- Match formality to occasion, energy to mood
- Be SPECIFIC in styling notes (exactly how to wear each piece)
- RESPECT all style rules (e.g. if "no gold jewelry" → only suggest silver/other metals)
- Tone: fun best friend hyping her up before she walks out the door
- Age-appropriate makeup (light for teens, can be editorial for 20s-30s)
- If wardrobe lacks items for a complete outfit, say what's missing

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
// Generates 2 realistic photos side by side
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

  const prompt = `Generate 2 photorealistic fashion photographs side by side of ${physicalDesc} wearing this exact outfit: ${outfitDescription}. 

Photo 1: Full body shot, standing confidently at a ${occasion} setting in Singapore. Natural lighting, candid pose.
Photo 2: Same person, same outfit, slightly different angle or pose, slightly different background within the same ${occasion} setting.

IMPORTANT: Make it look like a real photograph taken on a high-end smartphone, NOT an illustration or drawing. Real skin texture, real fabric texture, natural shadows. The person should look natural and confident, like a real fashion photo on Instagram. No cartoon, no watercolor, no sketch, no illustration style. Photorealistic only. Do NOT include any text or watermarks.`;

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