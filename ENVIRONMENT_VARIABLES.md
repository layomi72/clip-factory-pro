# Environment Variables Reference

Complete list of all environment variables needed for Clip Factory Pro.

## 🔐 Required Environment Variables

### Cloudflare R2 Storage
```bash
R2_ACCOUNT_ID=          # Your Cloudflare account ID
R2_ACCESS_KEY_ID=       # R2 API token access key
R2_SECRET_ACCESS_KEY=   # R2 API token secret key
R2_BUCKET_NAME=         # R2 bucket name (e.g., "clip-factory")
R2_PUBLIC_URL=          # Optional: Public URL if bucket is public
```

### YouTube API
```bash
YOUTUBE_CLIENT_ID=      # Google OAuth client ID
YOUTUBE_CLIENT_SECRET=  # Google OAuth client secret
```

### Instagram API
```bash
INSTAGRAM_APP_ID=       # Meta/Facebook app ID
INSTAGRAM_APP_SECRET=   # Meta/Facebook app secret
```

### TikTok API (Optional)
```bash
TIKTOK_CLIENT_KEY=      # TikTok app client key
TIKTOK_CLIENT_SECRET=    # TikTok app client secret
```

### Application URLs
```bash
FRONTEND_URL=           # Your frontend URL (for OAuth redirects)
                        # Production: https://your-app.vercel.app
                        # Development: http://localhost:5173
```

### Optional: External Services
```bash
YTDLP_SERVICE_URL=      # URL to yt-dlp service (if using external)
FFMPEG_SERVICE_URL=     # URL to FFmpeg service (if using external)
```

---

## 📍 Where to Set These

### Supabase Dashboard:
1. Go to your Supabase project
2. **Settings** → **Edge Functions** → **Secrets**
3. Add each variable as a secret

### Local Development:
Create `.env.local` file:
```bash
# Copy this template
cp .env.example .env.local
# Edit .env.local with your values
```

---

## 🔒 Security Best Practices

1. **Never commit** `.env` files to git
2. Add `.env*` to `.gitignore`
3. Use Supabase Secrets for production
4. Rotate keys regularly
5. Use different keys for dev/staging/production

---

## ✅ Verification Checklist

- [ ] R2 credentials configured
- [ ] YouTube OAuth credentials set
- [ ] Instagram OAuth credentials set
- [ ] TikTok credentials set (if using)
- [ ] FRONTEND_URL matches your deployment
- [ ] All redirect URIs configured in OAuth apps
- [ ] Secrets added to Supabase dashboard

---

## 🧪 Testing Environment Variables

You can test if variables are set correctly by calling:

```bash
# Test R2 connection
curl https://YOUR_PROJECT.supabase.co/functions/v1/test-storage

# Check Supabase logs for any missing variable errors
```

---

## 📝 Notes

- Some variables are optional (marked with "Optional")
- Missing required variables will cause functions to fail
- Check Supabase function logs for specific error messages
- Environment variables are case-sensitive

