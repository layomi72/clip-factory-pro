# Quick FFmpeg Setup (5 Minutes)

## Easiest Way: Railway (Recommended)

### Step 1: Deploy to Railway
1. Go to [railway.app](https://railway.app) and sign up
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your `clip-factory-pro` repository
4. Railway will auto-detect it's Node.js
5. **Add this to build settings:**
   - Build Command: `apt-get update && apt-get install -y ffmpeg && npm install`
   - Or use the Dockerfile (Railway auto-detects it)

### Step 2: Get Your URL
- Railway gives you a URL like: `https://ffmpeg-analysis-production.up.railway.app`
- Copy this URL

### Step 3: Add to Supabase
1. Go to Supabase Dashboard → Your Project
2. **Settings** → **Edge Functions** → **Secrets**
3. Add new secret:
   ```
   Name: FFMPEG_ANALYSIS_SERVICE_URL
   Value: https://your-railway-url.railway.app
   ```

### Step 4: Test It
1. Go to your app
2. Import a video with "Auto-generate clips" enabled
3. Check if clips are generated with real analysis!

---

## Alternative: Render (Also Free)

1. Go to [render.com](https://render.com)
2. **New** → **Web Service**
3. Connect GitHub repo
4. Settings:
   - **Build Command:** `npm install`
   - **Start Command:** `node scripts/ffmpeg-analysis-service.js`
   - **Add Environment Variable:** `PORT=10000`
5. Deploy
6. Get URL and add to Supabase as above

---

## What You Get

✅ Real audio analysis (loud moments, reactions)  
✅ Real scene change detection  
✅ Real motion analysis  
✅ Smart scoring based on actual video features  
✅ FREE (runs on free tier)  

---

## Verify It's Working

After setup, test:
```bash
curl -X POST https://your-service-url/health
```

Should return: `{"status":"ok","service":"ffmpeg-analysis"}`

Then test analysis:
```bash
curl -X POST https://your-service-url/analyze \
  -H "Content-Type: application/json" \
  -d '{"videoUrl": "https://youtube.com/watch?v=...", "duration": 300}'
```

---

**That's it!** Your system will now use real FFmpeg analysis to find viral clips automatically! 🚀

