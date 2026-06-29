# Cloudflare R2 video upload Worker

This Worker verifies the current Supabase session, allows only the configured owner user, and uploads video files to Cloudflare R2 with multipart upload.

## Local setup

```powershell
copy wrangler.toml.example wrangler.toml
npm install
npx wrangler login
npx wrangler secret put OWNER_USER_ID
npx wrangler dev
```

Set `VIDEO_BUCKET`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `R2_PUBLIC_BASE_URL`, and `ALLOWED_ORIGINS` before deploy.

## Deploy

```powershell
npx wrangler deploy
```
