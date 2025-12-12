# GitHub Actions Secrets Setup Guide

## Required Secrets

Add these secrets to your GitHub repository:

### How to Add Secrets:
1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret below

### Secrets List:

#### 1. Supabase Secrets
```
Name: SUPABASE_URL
Value: https://your-project-id.supabase.co
```

```
Name: SUPABASE_SERVICE_ROLE_KEY
Value: your-service-role-key (from Supabase Dashboard → Settings → API)
```

#### 2. Cloudflare R2 Secrets
```
Name: R2_ACCOUNT_ID
Value: your-cloudflare-account-id
```

```
Name: R2_ACCESS_KEY_ID
Value: your-r2-access-key-id
```

```
Name: R2_SECRET_ACCESS_KEY
Value: your-r2-secret-access-key
```

```
Name: R2_BUCKET_NAME
Value: clip-factory (or your bucket name)
```

## Verification

After adding secrets, you can test the workflow:
1. Go to **Actions** tab in GitHub
2. Click **Process Videos** workflow
3. Click **Run workflow** (manual trigger)
4. Check the logs to verify it's working

## Notes

- Secrets are encrypted and only accessible to GitHub Actions
- Never commit secrets to your repository
- Service Role Key has admin access - keep it secure
- R2 credentials should have read/write access to your bucket


