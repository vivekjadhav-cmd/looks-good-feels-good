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
        content: `You are "Looks Good, Feels Good" — a fashion-savvy best friend and stylist for girls and women. You ACTUALLY know fashion theory.

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
  "styling_notes": "1-2 sentences MAX. How to wear it for THIS occasion. One key styling principle.",
  "color_analysis": "1 sentence. Why these colors work with skin tone.",
  "hair_suggestion": "1 sentence. Specific hairstyle name + one detail.",
  "makeup_tip": "1 sentence. Key products only, matched to occasion intensity.",
  "accessory_tip": "1 sentence. Shoes + one accessory.",
  "vibe_line": "Fun one-liner for this SPECIFIC occasion.",
  "weather_note": "1 sentence max.",
  "height_fit_tips": "1 sentence. One key flattering detail."
}

CRITICAL RULES:
- Match EVERYTHING to occasion intensity. Groceries=1/10. Club=8/10.
- BE CONCISE. Each field should be 1-2 sentences, not paragraphs. Think text message, not essay.

Return valid JSON only. No other text.`,
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return JSON.parse(text.replace(/```json\n?|```/g, "").trim());
}

// ──────────────────────────────────────
// 4. Gemini — Image generation
// Detailed photography brief + occasion
// background instructions + profile photo
// ──────────────────────────────────────

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const GEMINI_MODEL = "gemini-2.5-flash-image";

// Occasion-specific background briefs
const BACKGROUND_BRIEFS: Record<string, string> = {
  "errands": "Quiet residential street in the late morning. Dappled sunlight through trees. Sidewalk, low-rise buildings, maybe a corner shop or parked bicycle in the background. The vibe is unhurried, everyday life. Soft warm light, nothing dramatic.",
  "groceries": "Quiet residential street in the late morning. Dappled sunlight through trees. Sidewalk, low-rise buildings, maybe a corner shop or parked bicycle in the background. The vibe is unhurried, everyday life. Soft warm light, nothing dramatic.",
  "casual hangout": "Busy but stylish urban street with shopfronts and cafe awnings. People blurred in the background. String lights or signage softly out of focus. Late afternoon light bouncing off glass and concrete. The vibe is city energy without chaos.",
  "mall": "Busy but stylish urban street with shopfronts and cafe awnings. People blurred in the background. String lights or signage softly out of focus. Late afternoon light bouncing off glass and concrete. The vibe is city energy without chaos.",
  "brunch": "Outdoor cafe terrace with white tables, greenery, hanging plants. Morning light streaming in. Coffee cups and pastries slightly visible on a table nearby. The vibe is bright, fresh, social, and relaxed. Lots of natural green and white tones.",
  "dinner": "Restaurant patio or rooftop with warm string lights and candles. Evening golden hour fading into blue hour. Warm amber lighting on the subject's face. Wine glasses or table settings softly blurred behind. The vibe is intimate, romantic, glowing.",
  "date night": "Restaurant patio or rooftop with warm string lights and candles. Evening golden hour fading into blue hour. Warm amber lighting on the subject's face. Wine glasses or table settings softly blurred behind. The vibe is intimate, romantic, glowing.",
  "party": "Dark moody interior with neon accents — pink, blue, purple. Bokeh lights everywhere. Other people blurred in the background. Low ambient lighting with one strong light source on the subject. The vibe is electric, bold, nightlife energy.",
  "club": "Dark moody interior with neon accents — pink, blue, purple. Bokeh lights everywhere. Other people blurred in the background. Low ambient lighting with one strong light source on the subject. The vibe is electric, bold, nightlife energy.",
  "school": "Bright outdoor courtyard or tree-lined walkway. Clean, open space with natural light. Lockers or campus buildings softly blurred behind. Afternoon light. The vibe is youthful, fresh, optimistic.",
  "wedding guest": "Elegant garden or outdoor venue. Lush greenery, floral arrangements, maybe an archway or fountain softly blurred behind. Late afternoon golden light. The vibe is elegant, celebratory, romantic.",
  "job interview": "Clean modern building entrance or lobby. Glass, steel, minimal architecture. Bright even lighting. A few blurred professionals walking in the background. The vibe is polished, confident, professional.",
  "beach day": "Sandy beach with turquoise water. Palm trees swaying. Late afternoon golden sun low on the horizon. Warm highlights on skin. The vibe is carefree, sun-kissed, tropical.",
  "workout": "Park or outdoor trail in the early morning. Dewy grass, trees, soft morning light filtering through. Open space with a path or bench. The vibe is energetic, fresh, healthy.",
};

function getBackgroundBrief(occasion: string): string {
  const key = occasion.toLowerCase();
  // Check for exact match first
  if (BACKGROUND_BRIEFS[key]) return BACKGROUND_BRIEFS[key];
  // Check for partial match
  for (const [k, v] of Object.entries(BACKGROUND_BRIEFS)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  // Default fallback
  return "Stylish urban environment with warm natural lighting. Soft bokeh background with architectural details. Late afternoon golden hour. The vibe is aspirational but real.";
}

export async function generateOutfitImage(
  outfitDescription: string,
  occasion: string,
  profile: Profile,
  profilePhotoBase64?: string | null,
  stylingContext?: {
    userRequest?: string;
    mood?: string;
    hairSuggestion?: string;
    makeupTip?: string;
    accessoryTip?: string;
    stylingNotes?: string;
  }
): Promise<string | null> {
  const physicalDesc = profile.physical_profile
    ? `a ${profile.physical_profile.body_shape} young woman, ${profile.physical_profile.height_estimate} tall, with ${profile.physical_profile.skin_tone} skin, ${profile.physical_profile.hair_length} ${profile.physical_profile.hair_color} ${profile.physical_profile.hair_texture} hair`
    : "a stylish young woman";

  const backgroundBrief = getBackgroundBrief(occasion);

  // Build styling details from Claude's response + user's request
  const stylingDetails = [];
  if (stylingContext?.userRequest) {
    stylingDetails.push(`USER'S SPECIFIC REQUEST: "${stylingContext.userRequest}" — this MUST be reflected in the image.`);
  }
  if (stylingContext?.hairSuggestion) {
    stylingDetails.push(`HAIR: ${stylingContext.hairSuggestion}`);
  }
  if (stylingContext?.makeupTip) {
    stylingDetails.push(`MAKEUP: ${stylingContext.makeupTip}`);
  }
  if (stylingContext?.accessoryTip) {
    stylingDetails.push(`ACCESSORIES & SHOES: ${stylingContext.accessoryTip}`);
  }
  if (stylingContext?.stylingNotes) {
    stylingDetails.push(`HOW THE OUTFIT IS WORN: ${stylingContext.stylingNotes}`);
  }
  const stylingBlock = stylingDetails.length > 0
    ? `\n═══ STYLING DETAILS — show ALL of these in the image ═══\n${stylingDetails.join("\n")}\n`
    : "";

  const prompt = `Generate 2 photorealistic fashion photographs side by side of ${physicalDesc} wearing this exact outfit: ${outfitDescription}.

${profilePhotoBase64 ? "CRITICAL: I have attached a reference photo of the actual person. The generated photos MUST closely match this person's face, skin tone, hair color, hair texture, and body proportions. Make it look like the SAME PERSON in the reference photo wearing the described outfit." : ""}
${stylingBlock}

═══ PHOTOGRAPHY STYLE BRIEF — follow this exactly ═══

CAMERA & FRAMING:
- Shot on a high-end mirrorless camera (Sony A7IV / Fujifilm X-T5 aesthetic)
- Full body framing — the complete outfit must be visible from head to shoes
- Camera at eye level or slightly below (never looking down at the subject)
- Subject positioned slightly off-center using rule of thirds
- Leave breathing room around the subject — not cropped tight

LIGHTING:
- Golden hour natural light — warm, soft, directional
- Sun coming from the side or slightly behind (rim lighting on hair and shoulders)
- No harsh shadows on the face — open shade or reflected fill light
- Warm color temperature — think 5000-5500K with a slight warm shift
- No flash, no studio lighting, no fluorescent — purely natural light

DEPTH OF FIELD:
- Shallow depth of field (f/2.8 - f/4 equivalent)
- Subject is tack sharp, background is softly blurred (creamy bokeh)
- Background elements are recognizable but not distracting
- This separation makes the subject and outfit the clear focal point

POSING:
Photo 1 — The "walking shot": Subject mid-stride, one foot forward, arms relaxed at sides or one hand touching hair/bag. Slight smile, looking at camera or just past it. Body angled 15-20 degrees from camera (not perfectly squared). This gives movement and energy — like a street style photographer caught them walking by.

Photo 2 — The "lifestyle moment": Subject interacting naturally with the environment — leaning against a wall, sitting at a table, standing by a railing, looking at something off-camera. Three-quarter angle showing the outfit's silhouette. More candid, less posed — like a friend took this photo while they weren't fully paying attention. Shows how the outfit moves and sits on the body in real life.

COLOR GRADE:
- Warm tones throughout — golden highlights, soft warm shadows
- Skin tones are natural and warm, never desaturated or cold
- Colors are rich but not oversaturated — think Kodak Portra 400 film look
- Slight fade in the deepest shadows (lifted blacks) for that editorial feel
- Greens in foliage are warm-toned, not neon

═══ BACKGROUND & SETTING FOR THIS OCCASION ═══
${backgroundBrief}

═══ MOOD & ENERGY ═══
- The overall feeling is "my most stylish friend just sent me this photo from her day"
- Confident but not stiff — natural body language
- Approachable and real — not high-fashion editorial or runway
- The kind of photo that gets saved on Instagram for outfit inspiration
- Street style blog meets lifestyle content creator aesthetic

═══ ABSOLUTE RULES ═══
- Photorealistic ONLY — must look like an actual photograph taken by a real camera
- NOT an illustration, NOT a drawing, NOT AI-looking, NOT plastic-skinned
- Real skin texture with natural imperfections, real fabric texture with natural draping
- Natural hair movement — not perfectly styled to the point of looking fake
- Clothing must look like real fabric on a real body — natural wrinkles, draping, movement
- No text, watermarks, or labels anywhere on the image
- The 2 photos should be arranged side by side with a thin white gap between them`;

  try {
    const parts: any[] = [];

    // Add profile photo as face/body reference if available
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
