# TikTok App Submission - Product Description

## Explain how each product and scope works within your app or website

**Products:**
- **Login Kit**: Allows users to securely authenticate with their TikTok account using OAuth 2.0. Users click "Connect TikTok" in the app, are redirected to TikTok's authorization page, and after granting permission, are redirected back to the app with their account connected. This enables the app to access their TikTok profile information and post content on their behalf.

- **Content Posting API**: After users connect their TikTok account via Login Kit, they can create video clips from YouTube, Twitch, or TikTok streams. The app automatically processes these clips and allows users to schedule or immediately post them to their connected TikTok account. The Content Posting API enables the app to upload videos directly to the user's TikTok account as drafts or published posts, depending on user preference.

**Scopes:**
- **user.info.basic**: This scope allows the app to read the user's basic profile information (open_id, avatar, display name) which is displayed in the app's account management interface so users can see which TikTok account is connected.

- **video.upload**: This scope enables the app to upload video content to the user's TikTok account. When a user creates a clip and chooses to post it to TikTok, the app uses this scope to upload the video file to TikTok's servers, either as a draft for the user to review and edit, or as a direct post to their profile.

**How it works:**
1. User visits the Clip Factory Pro website and logs in
2. User navigates to the Accounts page and clicks "Connect TikTok"
3. User is redirected to TikTok's authorization page where they grant permissions
4. User is redirected back to the app with their TikTok account connected
5. User imports a video stream (YouTube, Twitch, or TikTok URL)
6. App automatically generates clips from the stream
7. User selects a clip and chooses to post to TikTok
8. App uploads the video to TikTok using the Content Posting API
9. Video appears on the user's TikTok account (as draft or published, based on user selection)

The app provides a streamlined workflow for content creators to repurpose long-form content into short-form clips and distribute them across multiple social media platforms, including TikTok.

