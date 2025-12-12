# Static File Serving Issue - TikTok Verification & Terms/Privacy Pages

## Problem
Static files in the `public/` folder are not being served correctly on the deployed Lovable Cloud app. Specifically:

1. **TikTok Verification File**: `public/tiktok7jnWfAGd5smRtWZ94dKVYDTMwNmIzEu3.txt` returns 404
   - Expected URL: `https://clip-weaver-studio.lovable.app/tiktok7jnWfAGd5smRtWZ94dKVYDTMwNmIzEu3.txt`
   - Content should be: `tiktok-developers-site-verification=7jnWfAGd5smRtWZ94dKVYDTMwNmIzEu3`
   - TikTok requires this file to be accessible as plain text for domain verification

2. **Terms/Privacy Pages**: `public/terms.html` and `public/privacy.html` may not be accessible
   - Expected URLs: 
     - `https://clip-weaver-studio.lovable.app/terms.html`
     - `https://clip-weaver-studio.lovable.app/privacy.html`

## Current Setup
- Using Vite + React with React Router
- Files are in `public/` folder:
  - `public/tiktok7jnWfAGd5smRtWZ94dKVYDTMwNmIzEu3.txt`
  - `public/terms.html`
  - `public/privacy.html`
  - `public/robots.txt` (this one works, so static files should work in theory)

## What's Working
- `robots.txt` is accessible at `https://clip-weaver-studio.lovable.app/robots.txt`
- React Router routes work (e.g., `/terms` route works)
- App is deployed on Lovable Cloud

## What's Not Working
- TikTok verification `.txt` file returns 404
- Static HTML files may not be accessible with `.html` extension

## What We Need
1. **TikTok verification file must be accessible** as a plain text file at the root domain:
   - `https://clip-weaver-studio.lovable.app/tiktok7jnWfAGd5smRtWZ94dKVYDTMwNmIzEu3.txt`
   - Must return `Content-Type: text/plain`
   - Must return the exact content: `tiktok-developers-site-verification=7jnWfAGd5smRtWZ94dKVYDTMwNmIzEu3`

2. **Terms and Privacy pages** should be accessible as static HTML:
   - `https://clip-weaver-studio.lovable.app/terms.html`
   - `https://clip-weaver-studio.lovable.app/privacy.html`

## Possible Issues
- React Router may be intercepting all requests, including static files
- Vite static file serving may not be configured correctly for production
- Lovable Cloud may need special configuration for static files

## Request
Please help configure the app so that:
1. Static files in `public/` are served directly without React Router interference
2. The TikTok verification file is accessible as plain text
3. Static HTML files are accessible with their `.html` extensions

## Files in Repository
- `public/tiktok7jnWfAGd5smRtWZ94dKVYDTMwNmIzEu3.txt` - TikTok verification file
- `public/terms.html` - Terms of Service page
- `public/privacy.html` - Privacy Policy page
- `src/App.tsx` - React Router configuration
- `vite.config.ts` - Vite configuration

Thank you for your help!

