# Setup Guide: R2 Storage & OAuth Credentials

## Part 1: Cloudflare R2 Storage Setup

### Step 1: Create Cloudflare Account (if needed)
1. Go to https://dash.cloudflare.com
2. Sign up or log in (free tier available)

### Step 2: Create R2 Bucket
1. In Cloudflare Dashboard, go to **R2** (left sidebar)
2. Click **Create bucket**
3. Name it: `clip-factory` (or your preferred name)
4. Choose location: **Auto** (or closest to you)
5. Click **Create bucket**

### Step 3: Create R2 API Token
1. In R2 dashboard, click **Manage R2 API Tokens**
2. Click **Create API Token**
3. Settings:
   - **Token name**: `clip-factory-service`
   - **Permissions**: **Object Read & Write**
   - **TTL**: Leave empty (no expiration) or set expiration date
   - **Buckets**: Select your bucket (`clip-factory`)
4. Click **Create API Token**
5. **IMPORTANT**: Copy these values immediately (you won't see them again):
   - **Access Key ID**
   - **Secret Access Key**

### Step 4: Get Your Account ID
1. In Cloudflare Dashboard, look at the right sidebar
2. Find **Account ID** (under your account name)
3. Copy it

### Step 5: Make Bucket Public (Optional but Recommended)
1. Go to your bucket → **Settings**
2. Under **Public Access**, click **Allow Access**
3. This enables direct URLs to your videos

### Step 6: Add R2 Credentials to Supabase
1. Go to Supabase Dashboard → Your Project
2. **Settings** → **Edge Functions** → **Secrets**
3. Add these 4 secrets:

```
Name: R2_ACCOUNT_ID
Value: [Your Cloudflare Account ID]
```

```
Name: R2_ACCESS_KEY_ID
Value: [Your R2 Access Key ID]
```

```
Name: R2_SECRET_ACCESS_KEY
Value: [Your R2 Secret Access Key]
```

```
Name: R2_BUCKET_NAME
Value: clip-factory
```

```
Name: R2_PUBLIC_URL (Optional)
Value: https://clip-factory.r2.dev
(Or your custom domain if you set one up)
```

### Step 7: Add R2 Credentials to Render Service
1. Go to Render Dashboard → Your service (`clip-factory-pro`)
2. Go to **Environment** tab
3. Add these environment variables:

```
R2_ACCOUNT_ID = [Your Account ID]
R2_ACCESS_KEY_ID = [Your Access Key ID]
R2_SECRET_ACCESS_KEY = [Your Secret Access Key]
R2_BUCKET_NAME = clip-factory
R2_PUBLIC_URL = https://clip-factory.r2.dev
```

4. Click **Save Changes**
5. Render will automatically redeploy

---

## Part 2: YouTube OAuth Setup

### Step 1: Create Google Cloud Project
1. Go to https://console.cloud.google.com
2. Click **Create Project**
3. Name: `Clip Factory Pro`
4. Click **Create**

### Step 2: Enable YouTube Data API
1. In Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for "YouTube Data API v3"
3. Click it → **Enable**

### Step 3: Create OAuth Credentials
1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. If prompted, configure OAuth consent screen:
   - **User Type**: External (or Internal if using Google Workspace)
   - **App name**: Clip Factory Pro
   - **Support email**: Your email
   - **Developer contact**: Your email
   - Click **Save and Continue**
   - **Scopes**: Add `https://www.googleapis.com/auth/youtube.upload`
   - Click **Save and Continue**
   - **Test users**: Add your email (if external)
   - Click **Save and Continue**
4. Back to credentials:
   - **Application type**: Web application
   - **Name**: Clip Factory Pro Web Client
   - **Authorized redirect URIs**: 
     ```
     https://your-project-ref.supabase.co/functions/v1/youtube-oauth-callback
     ```
     (Replace with your actual Supabase project URL)
   - Click **Create**
5. **Copy these values**:
   - **Client ID**
   - **Client Secret**

### Step 4: Add to Supabase Secrets
```
Name: YOUTUBE_CLIENT_ID
Value: [Your Client ID]
```

```
Name: YOUTUBE_CLIENT_SECRET
Value: [Your Client Secret]
```

---

## Part 3: Instagram OAuth Setup

### Step 1: Create Meta App
1. Go to https://developers.facebook.com
2. Click **My Apps** → **Create App**
3. Choose **Business** type
4. Fill in:
   - **App name**: Clip Factory Pro
   - **App contact email**: Your email
   - **Business account**: Select or create
5. Click **Create App**

### Step 2: Add Instagram Product
1. In your app dashboard, find **Instagram** product
2. Click **Set Up**
3. Go to **Basic Display** or **Instagram Graph API** (depending on your needs)

### Step 3: Configure OAuth
1. Go to **Settings** → **Basic**
2. Add **Valid OAuth Redirect URIs**:
   ```
   https://your-project-ref.supabase.co/functions/v1/instagram-oauth-callback
   ```
3. Go to **Instagram** → **Basic Display** (or Graph API)
4. Create **Instagram App ID** and **Instagram App Secret**
5. **Copy these values**

### Step 4: Add to Supabase Secrets
```
Name: INSTAGRAM_APP_ID
Value: [Your Instagram App ID]
```

```
Name: INSTAGRAM_APP_SECRET
Value: [Your Instagram App Secret]
```

**Note**: Instagram API requires app review for production. For testing, use test users.

---

## Part 4: TikTok OAuth Setup

### Step 1: Create TikTok App
1. Go to https://developers.tiktok.com
2. Sign in with your TikTok account
3. Click **Create an app**
4. Fill in:
   - **App name**: Clip Factory Pro
   - **Category**: Entertainment
   - **Description**: Video clip automation tool
5. Click **Submit**

### Step 2: Get Credentials
1. In your app dashboard, go to **Basic Information**
2. **Copy these values**:
   - **Client Key**
   - **Client Secret**

### Step 3: Configure Redirect URI
1. Go to **Platform Management** → **Web**
2. Add **Redirect URI**:
   ```
   https://your-project-ref.supabase.co/functions/v1/tiktok-oauth-callback
   ```

### Step 4: Request Permissions
1. Go to **Permissions**
2. Request:
   - `video.upload` (for posting videos)
   - `user.info.basic` (for account info)

### Step 5: Add to Supabase Secrets
```
Name: TIKTOK_CLIENT_KEY
Value: [Your Client Key]
```

```
Name: TIKTOK_CLIENT_SECRET
Value: [Your Client Secret]
```

---

## Part 5: Frontend URL Setup

### Add to Supabase Secrets
```
Name: FRONTEND_URL
Value: https://your-app.vercel.app
(Or your production frontend URL)
```

For local development:
```
Name: FRONTEND_URL_DEV (Optional)
Value: http://localhost:5173
```

---

## Verification Checklist

### R2 Storage
- [ ] Bucket created
- [ ] API token created
- [ ] Account ID copied
- [ ] All 4 secrets added to Supabase
- [ ] All 4 secrets added to Render
- [ ] Bucket is public (optional)

### YouTube OAuth
- [ ] Google Cloud project created
- [ ] YouTube Data API enabled
- [ ] OAuth consent screen configured
- [ ] OAuth client created
- [ ] Redirect URI added
- [ ] Client ID and Secret added to Supabase

### Instagram OAuth
- [ ] Meta app created
- [ ] Instagram product added
- [ ] Redirect URI configured
- [ ] App ID and Secret added to Supabase

### TikTok OAuth
- [ ] TikTok app created
- [ ] Redirect URI configured
- [ ] Permissions requested
- [ ] Client Key and Secret added to Supabase

### Frontend
- [ ] FRONTEND_URL added to Supabase

---

## Testing

After setup, test each OAuth flow:

1. **YouTube**: Go to your app → Connect Account → YouTube → Should redirect to Google
2. **Instagram**: Connect Account → Instagram → Should redirect to Meta
3. **TikTok**: Connect Account → TikTok → Should redirect to TikTok

If redirects work, OAuth is configured correctly!

---

## Troubleshooting

### R2 Upload Fails
- Check all credentials are correct
- Verify bucket name matches
- Check bucket permissions
- Ensure bucket is in same region

### OAuth Redirect Fails
- Verify redirect URI matches exactly (no trailing slashes)
- Check OAuth app is in correct state (development/production)
- Ensure frontend URL is correct

### Instagram App Review
- Instagram requires app review for production
- Use test users for development
- Submit for review when ready

---

**Once all credentials are added, your system is fully configured!** 🎉

