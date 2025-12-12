# Updated Prompt for Lovable Dev - TikTok Verification File

Copy and paste this into Lovable Dev:

---

**I need help making a TikTok verification file accessible as a static plain text file.**

## The Problem:
TikTok requires a verification file accessible at:
`https://clip-weaver-studio.lovable.app/tiktok7jnWfAGd5smRtWZ94dKVYDTMwNmIzEu3.txt`

**Requirements:**
- Must return `Content-Type: text/plain` (not HTML)
- Must be accessible at root URL (not through React Router)
- Must contain exactly: `tiktok-developers-site-verification=7jnWfAGd5smRtWZ94dKVYDTMwNmIzEu3`
- TikTok's bot checks this file and fails if it gets HTML or 404

## Current Status:
✅ **File exists:** `public/tiktok7jnWfAGd5smRtWZ94dKVYDTMwNmIzEu3.txt`
✅ **Content is correct:** `tiktok-developers-site-verification=7jnWfAGd5smRtWZ94dKVYDTMwNmIzEu3`
✅ **Other static files work:** `robots.txt` from `public/` folder IS accessible at root
❌ **TikTok file returns 404:** The verification file is not accessible

## What I've Tried:
1. ✅ Placed file in `public/` folder (same location as `robots.txt` which works)
2. ❌ Added React route - doesn't work (TikTok needs plain text, not HTML)
3. ✅ Verified file content is exactly what TikTok requires
4. ✅ Confirmed `robots.txt` works, proving static files should work

## The Issue:
- Files in `public/` should be served at root (Vite standard behavior)
- `robots.txt` works fine, so the mechanism works
- But `tiktok7jnWfAGd5smRtWZ94dKVYDTMwNmIzEu3.txt` returns 404
- React Router has catch-all route `path="*"` - might be intercepting `.txt` files?

## What I Need:
The file `public/tiktok7jnWfAGd5smRtWZ94dKVYDTMwNmIzEu3.txt` must be:
1. Served as a static file (bypass React Router)
2. Accessible at: `https://clip-weaver-studio.lovable.app/tiktok7jnWfAGd5smRtWZ94dKVYDTMwNmIzEu3.txt`
3. Returned with `Content-Type: text/plain` header
4. Work exactly like `robots.txt` (which currently works)

## Technical Stack:
- Vite + React + React Router
- Files in `public/` should be copied to `dist/` root during build
- Using `BrowserRouter` with catch-all route: `<Route path="*" element={<NotFound />} />`

**Question: Why does `robots.txt` work but the TikTok file doesn't? How can I ensure the TikTok verification file is served as a static plain text file?**

---

