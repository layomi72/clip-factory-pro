// TikTok verification file route (new)
// Returns plain text verification content
import { useEffect } from 'react';

export default function TikTokVerification2() {
  useEffect(() => {
    // Replace entire page content with plain text
    document.documentElement.innerHTML = 'tiktok-developers-site-verification=7jnWfAGd5smRtWZ94dKVYDTMwNmIzEu3';
  }, []);

  // Return minimal content
  return (
    <pre style={{ 
      margin: 0, 
      padding: 0,
      fontFamily: 'monospace',
      whiteSpace: 'pre'
    }}>
      tiktok-developers-site-verification=7jnWfAGd5smRtWZ94dKVYDTMwNmIzEu3
    </pre>
  );
}

