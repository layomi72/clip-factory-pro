# Railway Deployment Troubleshooting

## If Your Repo Isn't Showing

### Issue 1: GitHub Not Connected
1. In Railway, click your profile (top right)
2. Go to **Settings** → **GitHub**
3. Click **"Connect GitHub"** or **"Authorize Railway"**
4. Grant Railway access to your repositories
5. Try again - your repos should appear

### Issue 2: Repo is Private
- Railway needs permission for private repos
- When connecting GitHub, make sure to grant access to private repos
- Or make the repo public temporarily

### Issue 3: Repo Not Pushed to GitHub
- Make sure you've pushed your code to GitHub first:
  ```bash
  git add .
  git commit -m "Initial commit"
  git push origin main
  ```

### Issue 4: Wrong GitHub Account
- Make sure you're logged into Railway with the same GitHub account that owns the repo

---

## Alternative: Deploy Without GitHub

### Option A: Deploy from Local Directory

1. Install Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```

2. Login:
   ```bash
   railway login
   ```

3. Initialize project:
   ```bash
   cd clip-factory-pro
   railway init
   ```

4. Deploy:
   ```bash
   railway up
   ```

---

### Option B: Use Render Instead

Render is easier if GitHub isn't working:

1. Go to [render.com](https://render.com)
2. Sign up with GitHub (or email)
3. **New** → **Web Service**
4. **Build and deploy from a Git repository**
5. Connect GitHub (if not connected)
6. Select your repo
7. Settings:
   - **Name:** `ffmpeg-analysis`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node scripts/ffmpeg-analysis-service.js`
   - **Add Environment Variable:**
     - Key: `PORT`
     - Value: `10000`
8. Click **Create Web Service**
9. Wait for deployment
10. Get your URL (e.g., `https://ffmpeg-analysis.onrender.com`)

---

### Option C: Manual Deployment (Your Own Server)

If you have a VPS or server:

```bash
# SSH into server
ssh user@your-server.com

# Install Node.js and FFmpeg
sudo apt-get update
sudo apt-get install -y nodejs npm ffmpeg python3 python3-pip

# Install yt-dlp
pip3 install yt-dlp

# Clone your repo (or upload files)
git clone https://github.com/your-username/clip-factory-pro.git
cd clip-factory-pro

# Install dependencies
npm install express

# Install PM2 (process manager)
npm install -g pm2

# Start service
pm2 start scripts/ffmpeg-analysis-service.js --name ffmpeg-analysis

# Make it start on boot
pm2 startup
pm2 save

# Your service is now running on port 3001
# Set up nginx reverse proxy if you want HTTPS
```

Then use your server's IP/domain as the service URL.

---

## Quick Fix: Push to GitHub First

If you haven't pushed your code yet:

```bash
# In your project directory
cd clip-factory-pro

# Initialize git if not already
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - FFmpeg analysis service"

# Create repo on GitHub first, then:
git remote add origin https://github.com/your-username/clip-factory-pro.git
git branch -M main
git push -u origin main
```

Then try Railway again - your repo should appear!

---

## Recommended: Use Render (Easier)

**Render is simpler** if you're having GitHub issues:
- ✅ Easier setup
- ✅ Free tier
- ✅ Auto-detects everything
- ✅ Just connect GitHub once

Try Render instead - it's often easier! 🚀

