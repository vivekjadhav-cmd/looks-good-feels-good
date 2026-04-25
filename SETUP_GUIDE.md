# Supabase Setup Guide for "Looks Good, Feels Good"

Follow these steps to set up your Supabase backend.

---

## Step 1: Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in (GitHub login works)
2. Click **New project**
3. Name it `looks-good-feels-good`
4. Choose a strong database password (save it somewhere safe)
5. Select **Singapore (Southeast Asia)** as the region
6. Click **Create new project** and wait ~2 minutes

---

## Step 2: Run the database migration

1. In your Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **New query**
3. Copy the entire contents of `supabase/migration.sql` from the project
4. Paste it into the SQL editor
5. Click **Run** (or Cmd+Enter)
6. You should see "Success. No rows returned" — that means the tables and policies were created

**Verify:** Go to **Table Editor** in the sidebar. You should see three tables:
- `profiles`
- `wardrobe_items`
- `outfits`

---

## Step 3: Create the storage bucket

1. Go to **Storage** (left sidebar)
2. Click **New bucket**
3. Name: `wardrobe`
4. Toggle **Public bucket** to ON
5. Click **Create bucket**
6. Click on the `wardrobe` bucket → **Policies** tab
7. Click **New policy** → **For full customization**
8. Create two policies:

**Policy 1 — Upload (INSERT):**
- Name: `Users upload own photos`
- Allowed operation: `INSERT`
- Policy definition: `(storage.foldername(name))[2] = auth.uid()::text`

**Policy 2 — Read (SELECT):**
- Name: `Public read`
- Allowed operation: `SELECT`
- Policy definition: `true` (anyone can view, since wardrobe images need to load publicly)

---

## Step 4: Set up authentication

### Email/password (enabled by default)
1. Go to **Authentication** → **Providers**
2. Email should already be enabled
3. Under **Email Auth**, you can optionally disable "Confirm email" for faster testing (toggle off "Enable email confirmations")

### Google OAuth
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (or use existing)
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Name: `LGFG`
7. Authorized redirect URIs: Add your Supabase callback URL:
   ```
   https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
   ```
   (Find YOUR_PROJECT_REF in Supabase **Settings** → **General**)
8. Copy the **Client ID** and **Client Secret**
9. Back in Supabase, go to **Authentication** → **Providers** → **Google**
10. Toggle it on
11. Paste the Client ID and Client Secret
12. Click **Save**

---

## Step 5: Get your API keys

1. In Supabase dashboard, go to **Settings** → **API**
2. Copy these values:

| Key | Where to find it | Env variable |
|---|---|---|
| Project URL | Under "Project URL" | `NEXT_PUBLIC_SUPABASE_URL` |
| Anon public key | Under "Project API keys" → `anon` `public` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

3. Create your `.env.local` file:
```bash
cp .env.local.example .env.local
```

4. Paste in the values:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Step 6: Get your Anthropic API key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up / log in
3. Go to **API Keys**
4. Click **Create Key**
5. Name it `lgfg-app`
6. Copy the key and paste into your `.env.local` as `ANTHROPIC_API_KEY`

---

## Step 7: Test it all

```bash
npm install
npm run dev
```

1. Open `http://localhost:3000`
2. Click "Get started"
3. Sign up with email
4. Complete onboarding
5. Try uploading a clothing photo — it should get AI-tagged
6. Try generating an outfit

---

## Troubleshooting

| Issue | Fix |
|---|---|
| "Invalid API key" on signup | Double-check `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` |
| Google login redirects to error | Verify the redirect URI matches exactly in Google Cloud Console |
| Image upload fails | Make sure the `wardrobe` bucket exists and is set to Public |
| AI tagging returns error | Check `ANTHROPIC_API_KEY` is set and has credits |
| Profile not created on signup | Re-run the migration SQL — the trigger might not have been created |

---

## Deploy to Vercel

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import your repo
3. Add environment variables in Vercel dashboard (same 3 from `.env.local`)
4. Deploy!
5. Update your Google OAuth redirect URI to include your Vercel domain:
   ```
   https://your-app.vercel.app/api/auth/callback
   ```
