# Simplest FFmpeg Deployment

## Easiest Method: Render (No GitHub Issues)

### Step-by-Step:

1. **Go to Render:** https://render.com
2. **Sign up** (free, with GitHub or email)
3. **New** → **Web Service**
4. **Connect GitHub** (one-time setup)
   - Click "Connect GitHub"
   - Authorize Render
   - Select your `clip-factory-pro` repo
5. **Configure:**
   - **Name:** `ffmpeg-analysis` (or any name)
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node scripts/ffmpeg-analysis-service.js`
   - **Add Environment Variable:**
     - Key: `PORT`
     - Value: `10000`
6. **Click "Create Web Service"**
7. **Wait 2-3 minutes** for deployment
8. **Copy your URL** (e.g., `https://ffmpeg-analysis.onrender.com`)

### Add to Supabase:
1. Supabase Dashboard → Settings → Edge Functions → Secrets
2. Add: `FFMPEG_ANALYSIS_SERVICE_URL` = your Render URL

**Done!** ✅

---

## If Render Also Has Issues: Local Server

Run it on your own computer temporarily:

```bash
# Install FFmpeg
# Windows: Download from https://ffmpeg.org/download.html
# Mac: brew install ffmpeg
# Linux: sudo apt-get install ffmpeg

# In project directory
cd clip-factory-pro
npm install express

# Start service
node scripts/ffmpeg-analysis-service.js
```

Then use a tunneling service:
- **ngrok:** `ngrok http 3001` (gives you a public URL)
- **Cloudflare Tunnel:** Free alternative
- **localtunnel:** `npx localtunnel --port 3001`

Use the tunnel URL in Supabase.

---

**Render is the easiest - try that first!** 🚀

