// TikTok verification file route
// This ensures the verification file is accessible even with React Router
export default function TikTokVerification() {
  // Return the verification content as plain text
  return (
    <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
      tiktok-developers-site-verification=aBemzEm9f1y23n4ldc4LNvwd1k6yMkyc
    </pre>
  );
}

