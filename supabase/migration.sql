-- ============================================
-- "Looks Good, Feels Good" — Database Setup
-- Run this in your Supabase SQL editor
-- ============================================

-- 1. User profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT,
  age_range TEXT CHECK (age_range IN ('teen', '20s', '30s')),
  style_preferences TEXT[] DEFAULT '{}',
  style_rules TEXT[] DEFAULT '{}',
  has_uniform BOOLEAN DEFAULT false,
  onboarding_complete BOOLEAN DEFAULT false,
  profile_photo_url TEXT,
  -- AI-estimated from profile photo
  height_estimate TEXT,
  body_shape TEXT,
  skin_tone TEXT,
  skin_undertone TEXT CHECK (skin_undertone IN ('warm', 'cool', 'neutral')),
  hair_length TEXT,
  hair_color TEXT,
  hair_texture TEXT,
  size_estimate TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Wardrobe items
CREATE TABLE IF NOT EXISTS wardrobe_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  item_type TEXT NOT NULL,
  color_primary TEXT,
  color_secondary TEXT,
  pattern TEXT DEFAULT 'solid',
  formality INT CHECK (formality BETWEEN 1 AND 5),
  season TEXT[] DEFAULT '{all}',
  fabric_guess TEXT,
  description TEXT,
  is_uniform BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Generated outfits
CREATE TABLE IF NOT EXISTS outfits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  item_ids UUID[] NOT NULL,
  occasion TEXT,
  mood TEXT,
  weather_temp NUMERIC,
  weather_condition TEXT,
  styling_notes TEXT,
  color_analysis TEXT,
  hair_suggestion TEXT,
  makeup_tip TEXT,
  accessory_tip TEXT,
  vibe_line TEXT,
  weather_note TEXT,
  height_fit_tips TEXT,
  outfit_image_url TEXT,
  outfit_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wardrobe_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE outfits ENABLE ROW LEVEL SECURITY;

-- Policies: users can only access their own data
CREATE POLICY "Users manage own profile"
  ON profiles FOR ALL
  USING (auth.uid() = id);

CREATE POLICY "Users manage own wardrobe"
  ON wardrobe_items FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users manage own outfits"
  ON outfits FOR ALL
  USING (auth.uid() = user_id);

-- 5. Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Storage bucket for wardrobe photos
-- (Run this separately or create via Supabase dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('wardrobe', 'wardrobe', true);

-- Storage policy: users can upload to their own folder
-- CREATE POLICY "Users upload own wardrobe photos"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'wardrobe' AND (storage.foldername(name))[1] = 'wardrobe' AND (storage.foldername(name))[2] = auth.uid()::text);

-- CREATE POLICY "Public wardrobe read"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'wardrobe');
