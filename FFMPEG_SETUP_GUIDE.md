# FFmpeg Analysis Service Setup Guide

## Quick Start (5 minutes)

### Option 1: Deploy to Railway (Recommended - Free Tier Available)

1. **Create Railway Account:**
   - Go to [railway.app](https://railway.app)
   - Sign up (free tier available)

2. **Deploy Service:**
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your `clip-factory-pro` repository
   - Add service → Select `scripts/ffmpeg-analysis-service.js`
   - Railway will auto-detect it's a Node.js app

3. **Install FFmpeg:**
   - In Railway, go to your service → Settings
   - Add build command:
     ```bash
     apt-get update && apt-get install -y ffmpeg && npm install
     ```
   - Or use Railway's Nixpacks which auto-detects FFmpeg

4. **Set Port:**
   - Railway auto-assigns PORT, but make sure service uses `process.env.PORT`

5. **Get URL:**
   - Railway gives you a URL like: `https://your-service.railway.app`
   - Copy this URL

6. **Add to Supabase:**
   - Supabase Dashboard → Edge Functions → Secrets
   - Add: `FFMPEG_ANALYSIS_SERVICE_URL=https://your-service.railway.app`

---

### Option 2: Deploy to Render (Free Tier)

1. **Create Render Account:**
   - Go to [render.com](https://render.com)
   - Sign up (free tier available)

2. **Create Web Service:**
   - New → Web Service
   - Connect GitHub repo
   - Settings:
     - **Build Command:** `npm install`
     - **Start Command:** `node scripts/ffmpeg-analysis-service.js`
     - **Environment:** Node
     - **Add Environment Variable:**
       - `PORT=10000` (Render uses port from env or 10000)

3. **Install FFmpeg:**
   - Render doesn't have FFmpeg by default
   - Use Dockerfile (see below) or use a different platform

4. **Get URL:**
   - Render gives you: `https://your-service.onrender.com`
   - Add to Supabase as `FFMPEG_ANALYSIS_SERVICE_URL`

---

### Option 3: Deploy to Your Own Server (VPS)

If you have a VPS (DigitalOcean, Linode, etc.):

```bash
# SSH into your server
ssh user@your-server.com

# Install Node.js and FFmpeg
sudo apt-get update
sudo apt-get install -y nodejs npm ffmpeg

# Clone your repo
git clone https://github.com/your-username/clip-factory-pro.git
cd clip-factory-pro

# Install dependencies
npm install

# Install PM2 for process management
npm install -g pm2

# Start the service
pm2 start scripts/ffmpeg-analysis-service.js --name ffmpeg-analysis

# Make it start on boot
pm2 startup
pm2 save

# Set up reverse proxy (nginx) if needed
# Point to http://localhost:3001
```

---

### Option 4: Use GitHub Actions (Free but Limited)

You can run FFmpeg analysis in GitHub Actions, but it's slower and has time limits.

---

## Docker Setup (Recommended for Any Platform)

Create `Dockerfile` in project root:

```dockerfile
FROM node:18

# Install FFmpeg
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy scripts
COPY scripts/ ./scripts/

# Expose port
EXPOSE 3001

# Start service
CMD ["node", "scripts/ffmpeg-analysis-service.js"]
```

Then deploy to any Docker platform (Railway, Render, Fly.io, etc.)

---

## Local Testing (Before Deploying)

Test the service locally first:

```bash
# Install FFmpeg (if not installed)
# Windows: Download from https://ffmpeg.org/download.html
# Mac: brew install ffmpeg
# Linux: sudo apt-get install ffmpeg

# Install dependencies
cd clip-factory-pro
npm install express

# Start service
node scripts/ffmpeg-analysis-service.js

# Test it
curl -X POST http://localhost:3001/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "videoUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "duration": 212
  }'
```

---

## Environment Variables

### For the FFmpeg Service:
```bash
PORT=3001  # Optional, defaults to 3001
```

### For Supabase Edge Functions:
```
FFMPEG_ANALYSIS_SERVICE_URL=https://your-service.railway.app
```

---

## Verification

After setup, test from your app:

1. Import a video with "Auto-generate clips" enabled
2. Check Supabase logs for analysis calls
3. Verify clips are generated with real analysis
4. Check the FFmpeg service logs

---

## Troubleshooting

### Service won't start:
- Check FFmpeg is installed: `ffmpeg -version`
- Check Node.js version: `node --version` (needs 18+)
- Check port is available

### Analysis fails:
- Check video URL is accessible
- Check FFmpeg can process the video format
- Check service logs for errors

### Slow analysis:
- Normal: 1-2 minutes per hour of video
- Consider caching results
- Use faster server for processing

---

## Recommended: Railway (Easiest)

**Why Railway:**
- ✅ Free tier available
- ✅ Auto-detects Node.js
- ✅ Easy FFmpeg installation
- ✅ Auto HTTPS
- ✅ Simple deployment

**Steps:**
1. Sign up at railway.app
2. New Project → Deploy from GitHub
3. Select your repo
4. Add service → it auto-detects
5. Get URL → add to Supabase
6. Done!

---

## Cost

- **Railway Free Tier:** $5 credit/month (enough for testing)
- **Render Free Tier:** Free (but slower, sleeps after inactivity)
- **Your Own Server:** Varies ($5-10/month for basic VPS)

**For production:** Railway Pro ($20/month) or your own VPS is recommended.

---

Ready to deploy! 🚀

