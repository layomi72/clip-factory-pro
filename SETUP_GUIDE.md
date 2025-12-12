# Setup Guide - Clip Factory Pro

This guide will help you configure all the services and APIs needed for the application.

## 📋 Prerequisites

1. **Supabase Project** - Already set up ✅
2. **Cloudflare Account** - For R2 storage (free tier: 10GB)
3. **YouTube API Credentials** - Google Cloud Console
4. **Instagram API Credentials** - Meta Business Account
5. **TikTok API Credentials** - TikTok Developer Portal (if available)

---

## 🔧 Step-by-Step Setup

### 1. Cloudflare R2 Storage Setup

#### Create R2 Bucket:
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **R2** → **Create bucket**
3. Name it: `clip-factory` (or your preferred name)
4. Set it to **Public** if you want direct URLs, or use **Presigned URLs**

#### Get R2 Credentials:
1. Go to **R2** → **Manage R2 API Tokens**
2. Click **Create API Token**
3. Select **Object Read & Write** permissions
4. Copy the credentials:
   - **Account ID**
   - **Access Key ID**
   - **Secret Access Key**

#### Configure Public Access (Optional):
If you want public URLs:
1. Go to your bucket → **Settings**
2. Enable **Public Access**
3. Note the public URL (e.g., `https://pub-xxxxx.r2.dev`)

---

### 2. YouTube API Setup

#### Create Google Cloud Project:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use existing)
3. Enable **YouTube Data API v3**

#### Create OAuth Credentials:
1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Authorized redirect URIs:
   ```
   https://YOUR_SUPABASE_PROJECT.supabase.co/functions/v1/youtube-oauth-callback
   ```
5. Copy **Client ID** and **Client Secret**

#### API Quota:
- Default: 10,000 units/day
- Video upload: 1,600 units each
- **For 10 accounts**: Create 10 separate API projects (each gets 10,000 units/day)
- Or request quota increase from Google

---

### 3. Instagram API Setup

#### Create Meta App:
1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create a new app → **Business** type
3. Add **Instagram Basic Display** and **Instagram Graph API** products

#### Configure OAuth:
1. Go to **Settings** → **Basic**
2. Add **Valid OAuth Redirect URIs**:
   ```
   https://YOUR_SUPABASE_PROJECT.supabase.co/functions/v1/instagram-oauth-callback
   ```
3. Copy **App ID** and **App Secret**

#### App Review (Required):
1. Go to **App Review** → **Permissions and Features**
2. Request these permissions:
   - `instagram_basic`
   - `instagram_content_publish`
   - `pages_read_engagement`
3. Submit for review (can take 1-2 weeks)

#### Requirements:
- **Meta Business Account** (not personal)
- **Facebook Page** connected to Instagram Business account
- **App Review approval** (required for production)

---

### 4. TikTok API Setup

#### Create TikTok App:
1. Go to [TikTok Developer Portal](https://developers.tiktok.com/)
2. Create a new app
3. Request **Content Publishing** permissions
4. Copy **Client Key** and **Client Secret**

#### Note:
- TikTok API access is **very limited**
- Requires business verification
- May not be available in all regions
- Consider manual posting as alternative

---

### 5. Environment Variables

Add these to your Supabase project:

#### Go to Supabase Dashboard:
1. **Project Settings** → **Edge Functions** → **Secrets**

#### Add These Secrets:

```bash
# Cloudflare R2
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=clip-factory
R2_PUBLIC_URL=https://pub-xxxxx.r2.dev  # Optional, if bucket is public

# YouTube API
YOUTUBE_CLIENT_ID=your_youtube_client_id
YOUTUBE_CLIENT_SECRET=your_youtube_client_secret

# Instagram API
INSTAGRAM_APP_ID=your_instagram_app_id
INSTAGRAM_APP_SECRET=your_instagram_app_secret

# TikTok API (if available)
TIKTOK_CLIENT_KEY=your_tiktok_client_key
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret

# Frontend URL (for OAuth redirects)
FRONTEND_URL=https://your-app.vercel.app  # or localhost:5173 for dev

# Optional: External Services (if using)
YTDLP_SERVICE_URL=https://your-ytdlp-service.com  # Optional
FFMPEG_SERVICE_URL=https://your-ffmpeg-service.com  # Optional
```

---

### 6. Database Migrations

Run the migrations in order:

```bash
# In Supabase Dashboard → SQL Editor, run:
1. 20251213000000_create_processing_jobs.sql
2. 20251213000001_setup_cron_jobs.sql
```

Or use Supabase CLI:
```bash
supabase db push
```

---

### 7. Video Processing Setup

#### Option A: GitHub Actions (Recommended for Free Tier)

Create `.github/workflows/process-videos.yml`:

```yaml
name: Process Videos
on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch:

jobs:
  process:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node
        uses: actions/setup-node@v3
      - name: Install FFmpeg
        run: sudo apt-get install -y ffmpeg
      - name: Install yt-dlp
        run: pip install yt-dlp
      - name: Process Videos
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
        run: |
          # Your processing script here
          node scripts/process-videos.js
```

#### Option B: Local Processing

Install on your computer:
```bash
# Install FFmpeg
# Windows: Download from https://ffmpeg.org/download.html
# Mac: brew install ffmpeg
# Linux: sudo apt-get install ffmpeg

# Install yt-dlp
pip install yt-dlp
```

#### Option C: External Service

Deploy a service that runs FFmpeg and yt-dlp, then set:
- `FFMPEG_SERVICE_URL`
- `YTDLP_SERVICE_URL`

---

### 8. Testing the Setup

#### Test R2 Storage:
```bash
# Call the storage function
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/test-storage \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"test": "upload"}'
```

#### Test OAuth Flows:
1. Go to your app
2. Click "Connect YouTube" / "Connect Instagram"
3. Complete OAuth flow
4. Check `connected_accounts` table in Supabase

#### Test Posting:
1. Create a scheduled post in the UI
2. Wait for cron job (or trigger manually)
3. Check `scheduled_posts` table for status

---

## 🚨 Important Notes

### Rate Limits:
- **YouTube**: 6 uploads/day per API key (need multiple keys for 10 accounts)
- **Instagram**: ~25 posts/day per account
- **TikTok**: Very limited, may not work

### Processing Limitations:
- **Deno Edge Functions**: Limited CPU/memory, not ideal for video processing
- **Recommended**: Use GitHub Actions or external service for processing
- **Free Tier**: GitHub Actions = 2,000 min/month (limited)

### Storage:
- **R2 Free Tier**: 10GB storage
- **Strategy**: Delete videos after posting to save space
- **Cleanup**: Cron job runs daily to clean old files

### Security:
- Never commit API keys to git
- Use Supabase Secrets for all credentials
- Enable RLS (Row Level Security) on all tables ✅

---

## 📝 Next Steps

1. ✅ Configure all environment variables
2. ✅ Run database migrations
3. ✅ Test OAuth flows
4. ✅ Set up video processing (GitHub Actions or local)
5. ✅ Test with 1 account per platform
6. ✅ Scale to 10 accounts per platform

---

## 🆘 Troubleshooting

### OAuth Not Working:
- Check redirect URIs match exactly
- Verify environment variables are set
- Check Supabase logs for errors

### Video Processing Fails:
- Verify FFmpeg/yt-dlp is installed
- Check processing service URL is correct
- Review processing_jobs table for errors

### Posting Fails:
- Verify access tokens are valid
- Check token expiration (refresh if needed)
- Review platform API status
- Check rate limits

### Cron Jobs Not Running:
- Verify pg_cron extension is enabled
- Check cron job is scheduled correctly
- Review Supabase logs

---

## 📚 Additional Resources

- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)
- [YouTube Data API](https://developers.google.com/youtube/v3)
- [Instagram Graph API](https://developers.facebook.com/docs/instagram-api)
- [TikTok Developer Portal](https://developers.tiktok.com/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

---

Good luck! 🚀

