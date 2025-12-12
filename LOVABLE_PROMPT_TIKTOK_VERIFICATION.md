# Prompt for Lovable Dev - TikTok Verification File Issue

Copy and paste this into Lovable Dev:

---

**I need help serving a TikTok verification file as a static plain text file.**

## The Problem:
TikTok requires a verification file to be accessible at:
`https://clip-weaver-studio.lovable.app/tiktok7jnWfAGd5smRtWZ94dKVYDTMwNmIzEu3.txt`

The file must:
- Be accessible as plain text (Content-Type: text/plain)
- Be at the root of the domain
- Contain exactly: `tiktok-developers-site-verification=7jnWfAGd5smRtWZ94dKVYDTMwNmIzEu3`

## Current Situation:
- File exists in `public/tiktok7jnWfAGd5smRtWZ94dKVYDTMwNmIzEu3.txt`
- `robots.txt` from `public/` folder IS accessible (works fine)
- But the TikTok verification file returns 404
- React Router might be intercepting `.txt` files

## What I've Tried:
1. Added file to `public/` folder (should work like `robots.txt`)
2. Added React route as fallback (doesn't work - TikTok needs plain text, not HTML)
3. File content is correct: `tiktok-developers-site-verification=7jnWfAGd5smRtWZ94dKVYDTMwNmIzEu3`

## What I Need:
The file at `public/tiktok7jnWfAGd5smRtWZ94dKVYDTMwNmIzEu3.txt` needs to be:
1. Served as a static file (not through React Router)
2. Accessible at the root URL
3. Returned with `Content-Type: text/plain` header
4. Work exactly like `robots.txt` does (which currently works)

## Technical Details:
- Using Vite + React + React Router
- Files in `public/` should be served at root
- `robots.txt` works, so static files should work
- But the TikTok file doesn't work

**Can you help configure the app so this verification file is accessible as a static plain text file?**

---

