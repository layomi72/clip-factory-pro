# Next Steps - What To Do Now

## ✅ What's Already Done

1. ✅ Video processing script created (`scripts/process-videos.js`)
2. ✅ GitHub Actions workflow updated
3. ✅ All frontend-backend integrations complete
4. ✅ OAuth flows implemented
5. ✅ Database migration file ready

---

## 🎯 What You Need To Do Now

### **Step 1: Run Database Migration** (5 minutes)

**Option A: Supabase Dashboard (Easiest)**
1. Go to your Supabase project: https://supabase.com/dashboard
2. Click on your project
3. Go to **SQL Editor** (left sidebar)
4. Click **New query**
5. Open file: `supabase/migrations/20251213000002_create_imported_streams.sql`
6. Copy ALL the SQL code
7. Paste into SQL Editor
8. Click **Run** (or press Ctrl+Enter)
9. ✅ Should see "Success" message

**Option B: Supabase CLI** (if you have it)
```bash
cd clip-factory-pro
supabase db push
```

**Verify it worked:**
```sql
-- Run this in SQL Editor to check
SELECT * FROM information_schema.tables 
WHERE table_name = 'imported_streams';
```
Should return 1 row.

---

### **Step 2: Set Up GitHub Actions Secrets** (10 minutes)

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add these 6 secrets:

#### Secret 1: SUPABASE_URL
```
Name: SUPABASE_URL
Value: https://jpndzcsqfuumdrcyjfxl.supabase.co
```
*(Use your actual Supabase project URL)*

#### Secret 2: SUPABASE_SERVICE_ROLE_KEY
```
Name: SUPABASE_SERVICE_ROLE_KEY
Value: [Get from Supabase Dashboard → Settings → API → service_role key]
```

#### Secret 3: R2_ACCOUNT_ID
```
Name: R2_ACCOUNT_ID
Value: [Your Cloudflare Account ID]
```

#### Secret 4: R2_ACCESS_KEY_ID
```
Name: R2_ACCESS_KEY_ID
Value: [Your R2 Access Key]
```

#### Secret 5: R2_SECRET_ACCESS_KEY
```
Name: R2_SECRET_ACCESS_KEY
Value: [Your R2 Secret Key]
```

#### Secret 6: R2_BUCKET_NAME
```
Name: R2_BUCKET_NAME
Value: clip-factory
```
*(Or whatever you named your bucket)*

**Where to find these:**
- **Supabase keys**: Dashboard → Settings → API
- **R2 credentials**: Cloudflare Dashboard → R2 → Manage R2 API Tokens

---

### **Step 3: Test the Workflow** (15 minutes)

#### Test 1: Import a Video
1. Start your app: `bun run dev`
2. Log in to your app
3. Go to **Import Streams** page
4. Paste a YouTube URL (e.g., `https://www.youtube.com/watch?v=dQw4w9WgXcQ`)
5. Click **Generate Clips**
6. ✅ Should see "Stream imported" message
7. Check Supabase → Table Editor → `imported_streams` - should see your video

#### Test 2: Create a Clip
1. Go to **Clip Editor** page
2. Paste a video URL (can be the imported stream URL or any video URL)
3. Click **Load Video**
4. Set trim points (start/end time)
5. Click **Process & Schedule Clip**
6. ✅ Should see "Clip processed" message
7. Check Supabase → Table Editor → `processing_jobs` - should see a job with status "pending"

#### Test 3: Connect Accounts
1. Go to **Accounts** page
2. Click **Connect** for YouTube
3. ✅ Should redirect to Google OAuth
4. Complete OAuth flow
5. ✅ Should redirect back and show connected account
6. Repeat for Instagram and TikTok

#### Test 4: Schedule a Post
1. Go to **Dashboard**
2. Click **Schedule New** button
3. Enter clip URL (from processed clip)
4. Select connected account
5. Set date/time
6. Add caption
7. Click **Schedule Post**
8. ✅ Should see "Post scheduled" message
9. Check Supabase → Table Editor → `scheduled_posts` - should see scheduled post

#### Test 5: Manual GitHub Actions Run
1. Go to GitHub repository → **Actions** tab
2. Click **Process Videos** workflow
3. Click **Run workflow** → **Run workflow** (button)
4. ✅ Should start processing
5. Check logs - should see it fetching jobs and processing
6. After completion, check `processing_jobs` table - status should be "completed"

---

### **Step 4: Verify Everything Works**

#### Check Database Tables:
```sql
-- Should have data
SELECT COUNT(*) FROM imported_streams;
SELECT COUNT(*) FROM processing_jobs;
SELECT COUNT(*) FROM scheduled_posts;
SELECT COUNT(*) FROM connected_accounts;
```

#### Check Cron Jobs:
```sql
-- Should see scheduled cron jobs
SELECT * FROM cron.job;
```

#### Check Edge Functions:
- Go to Supabase → Edge Functions
- All functions should be deployed
- Test each one manually if needed

---

## 🐛 Troubleshooting

### Migration Fails:
- Check if table already exists
- Verify you have admin permissions
- Check error message in Supabase logs

### GitHub Actions Fails:
- Verify all secrets are set correctly
- Check workflow logs for specific errors
- Ensure R2 bucket exists and is accessible

### OAuth Not Working:
- Check redirect URIs match exactly
- Verify environment variables in Supabase
- Check browser console for errors

### Processing Not Working:
- Verify FFmpeg and yt-dlp are installed in GitHub Actions
- Check processing_jobs table for error messages
- Verify R2 credentials are correct

---

## 📋 Quick Checklist

- [ ] Run database migration
- [ ] Set up 6 GitHub Actions secrets
- [ ] Test video import
- [ ] Test clip processing
- [ ] Test OAuth connections (YouTube, Instagram, TikTok)
- [ ] Test scheduling a post
- [ ] Test GitHub Actions workflow
- [ ] Verify cron jobs are running
- [ ] Check all database tables have proper data

---

## 🚀 Once Everything Works

1. **Monitor the system:**
   - Check `processing_jobs` for failed jobs
   - Check `scheduled_posts` for posting status
   - Monitor GitHub Actions runs

2. **Scale up:**
   - Add more accounts
   - Increase posting frequency
   - Monitor rate limits

3. **Optimize:**
   - Adjust cron job frequency
   - Optimize video processing
   - Add error notifications

---

## 📞 Need Help?

If something doesn't work:
1. Check Supabase logs (Dashboard → Logs)
2. Check GitHub Actions logs (Actions tab)
3. Check browser console for frontend errors
4. Verify all environment variables are set
5. Check database tables for error messages

**You're almost there!** 🎉

