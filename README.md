# Looks Good, Feels Good

AI-powered personal styling app for girls and women in Singapore.

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Set up Supabase
1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase/migration.sql`
3. Go to **Storage** → Create a new bucket called `wardrobe` (set to **Public**)
4. Go to **Authentication** → **Providers** → Enable **Google** (add OAuth credentials from Google Cloud Console)

### 3. Set up environment variables
```bash
cp .env.local.example .env.local
```
Fill in:
- `NEXT_PUBLIC_SUPABASE_URL` — from Supabase project settings
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from Supabase project settings → API
- `ANTHROPIC_API_KEY` — from [console.anthropic.com](https://console.anthropic.com)

### 4. Run locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

### 5. Deploy to Vercel
```bash
npx vercel
```
Add the same environment variables in Vercel's dashboard.

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Landing page
│   ├── layout.tsx            # Root layout
│   ├── login/page.tsx        # Auth (email + Google)
│   ├── onboarding/page.tsx   # Style quiz
│   ├── wardrobe/
│   │   ├── page.tsx          # Wardrobe gallery
│   │   └── add/page.tsx      # Upload + AI tagging
│   ├── style-me/page.tsx     # Main outfit generation
│   ├── calendar/page.tsx     # Saved outfits by date
│   ├── profile/page.tsx      # Settings
│   └── api/
│       ├── auth/callback/    # Google OAuth callback
│       ├── wardrobe/tag/     # Claude Vision tagging
│       └── outfit/generate/  # Claude outfit generation
├── components/
│   ├── ui/                   # Button, ChipGroup, Skeleton
│   ├── layout/               # AppShell, BottomNav
│   └── outfit/               # OutfitCard
├── lib/
│   ├── supabase.ts           # Browser + server clients
│   ├── claude.ts             # AI tagging + outfit generation
│   ├── weather.ts            # Open-Meteo Singapore weather
│   └── image.ts              # Client-side compression
├── styles/globals.css        # Tailwind + design system
└── types/index.ts            # All TypeScript types
```

## Tech Stack
- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS** (warm & approachable design system)
- **Supabase** (Auth, Postgres, Storage)
- **Claude API** (Vision + text for styling)
- **Vercel** (hosting)
