# Implementation Plan - What Needs to Be Built

## ✅ What's Already Done

1. **TikTok OAuth** - OAuth flow implemented ✅
2. **Database Schema** - Tables for accounts and scheduled posts ✅
3. **Frontend UI** - StreamImporter, ClipEditor, Dashboard components ✅
4. **Supabase Integration** - Client setup and types ✅
5. **Basic Structure** - Project scaffolded with React + Vite ✅

---

## 🚧 What Needs to Be Implemented

### **PRIORITY 1: Core Video Pipeline**

#### 1. **Video Download Service** ⚠️ CRITICAL
**Status**: Currently using mock data
**Location**: `src/components/StreamImporter.tsx` (lines 46-61 are mock)

**What to Build:**
- **YouTube Download**: Use `yt-dlp` or `youtube-dl` library
- **Twitch Download**: Use Twitch API + `yt-dlp` for VODs
- **TikTok Download**: Use `yt-dlp` (supports TikTok)

**Implementation:**
```typescript
// New file: supabase/functions/download-video/index.ts
// Downloads video from URL and stores in Cloudflare R2
```

**Dependencies Needed:**
- `yt-dlp` (Python) or `@distube/ytdl-core` (Node.js)
- Cloudflare R2 bucket setup

---

#### 2. **Video Processing Service** ⚠️ CRITICAL
**Status**: ClipEditor is UI-only, no actual processing
**Location**: `src/components/ClipEditor.tsx` (just preview, no FFmpeg)

**What to Build:**
- **FFmpeg Processing**: Clip videos based on start/end times
- **Video Compression**: Optimize for platform requirements
- **Format Conversion**: Convert to platform-specific formats
- **Thumbnail Generation**: Create thumbnails for previews

**Implementation:**
```typescript
// New file: supabase/functions/process-clip/index.ts
// Uses FFmpeg to clip and process videos
```

**Dependencies Needed:**
- FFmpeg (install in Supabase Edge Function or use GitHub Actions)
- Video processing library (fluent-ffmpeg for Node.js)

**Platform Requirements:**
- **YouTube**: MP4, H.264, max 256GB, 12+ hours
- **Instagram**: MP4, H.264, max 4GB, 60s (Reels)
- **TikTok**: MP4, H.264, max 287MB, 10min

---

#### 3. **Storage Setup** ⚠️ CRITICAL
**Status**: No storage configured
**What to Build:**
- Cloudflare R2 bucket (free 10GB)
- Upload/download functions
- Cleanup job (delete after posting)

**Implementation:**
```typescript
// New file: supabase/functions/storage-utils.ts
// Helper functions for R2 operations
```

---

### **PRIORITY 2: Platform APIs**

#### 4. **YouTube API Integration** ⚠️ HIGH
**Status**: Not implemented
**What to Build:**
- OAuth flow (similar to TikTok)
- Video upload endpoint
- Token refresh handling
- Rate limiting

**Implementation:**
```typescript
// New files:
// - supabase/functions/youtube-oauth/index.ts
// - supabase/functions/youtube-oauth-callback/index.ts
// - supabase/functions/post-to-youtube/index.ts
```

**API Requirements:**
- YouTube Data API v3
- OAuth 2.0
- Upload quota: 6 videos/day per API key (need multiple keys for 10 accounts)

---

#### 5. **Instagram API Integration** ⚠️ HIGH
**Status**: Not implemented
**What to Build:**
- Meta Business API setup
- OAuth flow
- Video upload (Reels)
- Token refresh

**Implementation:**
```typescript
// New files:
// - supabase/functions/instagram-oauth/index.ts
// - supabase/functions/instagram-oauth-callback/index.ts
// - supabase/functions/post-to-instagram/index.ts
```

**API Requirements:**
- Instagram Graph API
- Meta Business Account required
- App Review process (can take weeks)

---

#### 6. **TikTok Posting** ⚠️ MEDIUM (You said this is done)
**Status**: OAuth done, posting needs implementation
**Location**: `supabase/functions/tiktok-oauth/` exists

**What to Build:**
- Actual video upload using TikTok API
- Handle TikTok's upload flow (initiate, upload chunks, publish)

**Implementation:**
```typescript
// Update: supabase/functions/post-to-tiktok/index.ts
// Use TikTok Creative Center API or Upload API
```

**Note**: TikTok has limited/no official API - may need alternative approach

---

#### 7. **Twitch API Integration** ⚠️ LOW (Optional)
**Status**: Not implemented
**What to Build:**
- OAuth flow
- Clip creation API
- VOD access

**Note**: Twitch is source platform, not posting platform in your use case

---

### **PRIORITY 3: Automation & Scheduling**

#### 8. **Cron Job Setup** ⚠️ HIGH
**Status**: pg_cron extension enabled, but no jobs configured
**Location**: Migration exists but no actual cron jobs

**What to Build:**
- Cron job to trigger `process-scheduled-posts` function
- Schedule: Every 1-2 hours
- Handle timezone conversion
- Error handling and retries

**Implementation:**
```sql
-- New migration: supabase/migrations/XXXX_setup_cron_jobs.sql
SELECT cron.schedule(
  'process-scheduled-posts',
  '0 */2 * * *',  -- Every 2 hours
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/process-scheduled-posts',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.service_role_key'))
  );
  $$
);
```

---

#### 9. **Update process-scheduled-posts Function** ⚠️ CRITICAL
**Status**: Placeholder only (lines 62-76 are simulation)
**Location**: `supabase/functions/process-scheduled-posts/index.ts`

**What to Build:**
- Actually call platform posting functions
- Handle different platforms (YouTube, Instagram, TikTok)
- Error handling and retry logic
- Update database status

**Current Code (needs replacement):**
```typescript
// Lines 62-76: Just simulates posting
// Need to replace with actual API calls
```

**Implementation:**
```typescript
// Update process-scheduled-posts/index.ts
// Call post-to-youtube, post-to-instagram, post-to-tiktok based on platform
```

---

### **PRIORITY 4: Backend Services**

#### 10. **Video Processing Queue** ⚠️ MEDIUM
**Status**: Not implemented
**What to Build:**
- Queue system for video processing jobs
- Track processing status
- Handle failures

**Implementation:**
```sql
-- New table: processing_jobs
CREATE TABLE processing_jobs (
  id UUID PRIMARY KEY,
  source_video_url TEXT,
  clip_start_time FLOAT,
  clip_end_time FLOAT,
  status TEXT, -- pending, processing, completed, failed
  output_url TEXT,
  created_at TIMESTAMP
);
```

---

#### 11. **Stream Import Backend** ⚠️ MEDIUM
**Status**: Frontend has mock data
**Location**: `src/components/StreamImporter.tsx` (lines 115-138)

**What to Build:**
- API endpoint to fetch streams from platforms
- YouTube Data API for user's videos
- Twitch API for VODs
- Store in database

**Implementation:**
```typescript
// New file: supabase/functions/fetch-streams/index.ts
// Fetches streams from connected accounts
```

---

### **PRIORITY 5: Enhancements**

#### 12. **Error Handling & Monitoring** ⚠️ MEDIUM
**What to Build:**
- Error logging
- Retry mechanisms
- Alert system
- Status tracking

---

#### 13. **Content Variation** ⚠️ LOW (Important for scale)
**What to Build:**
- Different clips per account
- Caption variations
- Thumbnail variations
- Overlay customization

---

## 📋 Implementation Order (Recommended)

### **Phase 1: Core Functionality (Week 1)**
1. ✅ Set up Cloudflare R2 storage
2. ✅ Build video download service
3. ✅ Build video processing service (FFmpeg)
4. ✅ Update process-scheduled-posts to actually post

### **Phase 2: Platform APIs (Week 2)**
5. ✅ YouTube OAuth + posting
6. ✅ Instagram OAuth + posting  
7. ✅ TikTok posting (complete the OAuth you started)
8. ✅ Test with 1 account per platform

### **Phase 3: Automation (Week 3)**
9. ✅ Set up cron jobs
10. ✅ Build stream import backend
11. ✅ Add error handling
12. ✅ Test with 2-3 accounts

### **Phase 4: Scale (Week 4)**
13. ✅ Add content variation
14. ✅ Optimize processing
15. ✅ Scale to 10 accounts per platform

---

## 🛠️ Technical Stack Needed

### **New Dependencies:**
```json
{
  "dependencies": {
    "@distube/ytdl-core": "^4.14.4",  // YouTube download
    "fluent-ffmpeg": "^2.1.2",        // Video processing
    "@aws-sdk/client-s3": "^3.0.0",    // Cloudflare R2 (S3-compatible)
    "googleapis": "^128.0.0",          // YouTube API
    "axios": "^1.6.0"                   // HTTP requests
  }
}
```

### **Services to Set Up:**
1. **Cloudflare R2** - Free tier (10GB storage)
2. **YouTube API Keys** - 10 projects (one per account)
3. **Meta Business Account** - For Instagram API
4. **GitHub Actions** - For video processing (optional, if not using local)

---

## 🚨 Critical Missing Pieces

1. **Video Download**: Currently impossible - StreamImporter just shows mock data
2. **Video Processing**: ClipEditor can't actually create clips - no FFmpeg integration
3. **Posting**: process-scheduled-posts doesn't actually post - just simulates
4. **Storage**: No place to store videos - need R2 setup
5. **Cron Jobs**: Enabled but not configured - no automation running

---

## 📝 Next Steps

1. **Start with Storage**: Set up Cloudflare R2 (free, 10GB)
2. **Build Download Service**: Use yt-dlp to download videos
3. **Build Processing Service**: Use FFmpeg to clip videos
4. **Complete Posting**: Update process-scheduled-posts to actually post
5. **Add Platform APIs**: YouTube and Instagram OAuth + posting
6. **Set Up Cron**: Configure pg_cron to run automation

Would you like me to start implementing any of these? I recommend starting with:
1. Cloudflare R2 setup
2. Video download service
3. Video processing service

These are the foundation everything else builds on!

