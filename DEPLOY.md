# Deploy to Vercel

This is a one-time setup. After it's done, every `git push` deploys automatically.

## 0. Tick list of what you need

- [ ] Vercel project (you've already created this)
- [ ] Upstash Redis database (created in section 1 below)
- [ ] Google OAuth client ID + secret (created in section 2 below)
- [ ] Vercel env vars set (section 3)
- [ ] First deploy (section 4)
- [ ] Seed KV with the MP data (section 5)

---

## 1. Create the Upstash Redis database

1. Go to <https://console.upstash.com/redis>.
2. Click **Create database**.
3. Name: `fantasy-uk-cabinet` · Type: **Regional** · Region: `eu-west-1` (London — same as your other projects) · Eviction: **disabled** (this is the cheapest tier; don't pay for global replication).
4. After creation, open the database → **REST API** tab. Copy these two values — you'll paste them into Vercel:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

---

## 2. Create Google OAuth credentials

1. Go to <https://console.cloud.google.com/>.
2. Create a new project (or pick an existing one). Top-left dropdown → **New Project** → name `fantasy-uk-cabinet`.
3. **APIs & Services** → **OAuth consent screen**:
   - User type: **External**
   - App name: `Fantasy UK Cabinet`
   - User support email: your address
   - Developer contact: your address
   - Scopes: leave empty (NextAuth requests the basic ones automatically — `openid`, `email`, `profile`)
   - Test users: leave empty (you'll publish below)
   - Click **Save and continue** through each step
   - At the end, click **Publish app** so anyone can sign in (still works without Google Verification — there's just a warning screen for the first 100 users)
4. **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID**:
   - Application type: **Web application**
   - Name: `Vercel — fantasy-uk-cabinet`
   - **Authorised redirect URIs** — add **two**:
     - `https://<your-vercel-domain>.vercel.app/api/auth/callback/google`
     - `http://localhost:3000/api/auth/callback/google` (for local dev with Google)
5. Click **Create**. Copy `Client ID` and `Client secret` — you'll paste them into Vercel.

> Once the app has a real custom domain (e.g. `fantasycabinet.com`), come back and add `https://fantasycabinet.com/api/auth/callback/google` as a third redirect URI.

---

## 3. Set Vercel environment variables

In your Vercel project: **Settings** → **Environment Variables**. Add each of these for **Production** (and **Preview** if you want preview deploys to work too):

| Name                          | Value                                                                                | Notes |
|-------------------------------|--------------------------------------------------------------------------------------|-------|
| `STORE_BACKEND`               | `kv`                                                                                 | Tells the app to use Redis instead of JSON files |
| `UPSTASH_REDIS_REST_URL`      | from section 1                                                                       | |
| `UPSTASH_REDIS_REST_TOKEN`    | from section 1                                                                       | |
| `AUTH_GOOGLE_ID`              | from section 2 (Client ID)                                                           | |
| `AUTH_GOOGLE_SECRET`          | from section 2 (Client secret)                                                       | |
| `AUTH_SECRET`                 | run `openssl rand -base64 32` and paste output                                        | NextAuth uses this to sign JWTs — any random 32-byte string |
| `AUTH_TRUST_HOST`             | `true`                                                                                | Required for NextAuth on Vercel |
| `ADMIN_EMAILS`                | `isar.bhattacharjee@ig.com`                                                          | Comma-separated allowlist for the admin panel |

**Optional:**

| Name             | Value                | Notes |
|------------------|----------------------|-------|
| `KV_KEY_PREFIX`  | `fcuk:` (default)    | Change if you ever share an Upstash DB with another app |

---

## 4. First deploy

Two options.

### Option A — connect GitHub repo in Vercel UI (recommended)

1. In your Vercel project, **Settings → Git** → connect to the `Isar-b/fantasy-uk-cabinet` GitHub repo.
2. Pushing to `master` deploys automatically.

### Option B — use Vercel CLI

```bash
npm i -g vercel
vercel link        # link this directory to your existing Vercel project
vercel --prod      # deploy production
```

After the first deploy, the live URL will look like `https://fantasy-uk-cabinet.vercel.app`. **Go back to section 2 step 4** and add this URL as a redirect URI in Google Cloud — the `vercel.app` URL Vercel assigned isn't known until after the first deploy.

---

## 5. Seed Upstash with the MP roster

The MP data lives in `data/mps.seed.json` (generated by `npm run seed:mps`). For production you need to copy it into Upstash. You only do this once — re-runs overwrite the same keys.

```bash
# from C:\Users\BhattI\fantasy-uk-cabinet
# Set the env vars in your shell (paste the same values from Vercel):
UPSTASH_REDIS_REST_URL=https://...     \
UPSTASH_REDIS_REST_TOKEN=...           \
npm run seed:kv
```

On Windows PowerShell:

```powershell
$env:UPSTASH_REDIS_REST_URL="https://..."
$env:UPSTASH_REDIS_REST_TOKEN="..."
npm run seed:kv
```

You should see:

```
Seeding (prefix='fcuk:')
  403 MPs
  25 role assignments
  0 users
  0 cabinets
  0 leagues
  source: seed files
Done.
```

Reload the production site — the leaderboard and picker should now work.

> Want to refresh role assignments after a reshuffle? Easiest path is to use the **Admin** page on the live site (it writes directly to Upstash). Re-running `npm run seed:kv` is only needed when refreshing the MP list itself.

---

## 6. Local development with the new stack

Local dev still uses file storage and mock auth by default. Nothing changes:

```bash
npm run dev
```

If you want to test Google OAuth locally, set these in a `.env.local` file:

```
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...
AUTH_SECRET=any-random-string
```

…and ensure `http://localhost:3000/api/auth/callback/google` is in your Google Cloud authorised redirect URIs.

If you want to test KV locally:

```
STORE_BACKEND=kv
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

(Use a separate `KV_KEY_PREFIX=fcuk-dev:` to keep dev data separate from prod data in the same Upstash DB.)
