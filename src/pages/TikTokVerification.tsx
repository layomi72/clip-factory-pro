// TikTok verification file route
// This ensures the verification file is accessible even with React Router
import { useEffect } from 'react';

export default function TikTokVerification() {
  useEffect(() => {
    // Set content type to plain text
    document.contentType = 'text/plain';
    // Replace the entire document with just the verification text
    document.body.innerHTML = 'tiktok-developers-site-verification=aBemzEm9f1y23n4ldc4LNvwd1k6yMkyc';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
  }, []);

  return null;
}

