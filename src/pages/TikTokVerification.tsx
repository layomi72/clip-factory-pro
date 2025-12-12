// TikTok verification file route
// Returns plain text verification content
export default function TikTokVerification() {
  // This component should never render - the route should serve the file directly
  // But if it does render, return the text
  return (
    <div style={{ 
      fontFamily: 'monospace', 
      whiteSpace: 'pre',
      padding: '20px',
      textAlign: 'center'
    }}>
      tiktok-developers-site-verification=aBemzEm9f1y23n4ldc4LNvwd1k6yMkyc
    </div>
  );
}

