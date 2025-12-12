export default function Privacy() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-4 text-4xl font-bold text-primary">Privacy Policy</h1>
        <p className="mb-8 text-muted-foreground italic">Last Updated: December 12, 2025</p>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold">1. Information We Collect</h2>
            <p>We collect the following types of information:</p>
            <ul className="list-disc pl-6">
              <li><strong>Account Information:</strong> Email address, username, and authentication credentials</li>
              <li><strong>Content Data:</strong> Videos, clips, and metadata you upload or create</li>
              <li><strong>Platform Credentials:</strong> OAuth tokens for connected social media accounts (stored securely)</li>
              <li><strong>Usage Data:</strong> Information about how you use the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">2. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul className="list-disc pl-6">
              <li>Provide and improve the Service</li>
              <li>Process and store your video content</li>
              <li>Connect to social media platforms on your behalf</li>
              <li>Send service-related communications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">3. Data Storage and Security</h2>
            <p>Your data is stored securely using industry-standard encryption and security practices. We use Supabase for database storage and Cloudflare R2 for video storage.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">4. Third-Party Services</h2>
            <p>We integrate with the following third-party services:</p>
            <ul className="list-disc pl-6">
              <li><strong>Supabase:</strong> Database and authentication services</li>
              <li><strong>Cloudflare R2:</strong> Video storage</li>
              <li><strong>Social Media Platforms:</strong> YouTube, Instagram, TikTok (via OAuth)</li>
            </ul>
            <p>Your use of these services is subject to their respective privacy policies.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">5. OAuth Tokens</h2>
            <p>We store OAuth tokens securely to enable posting to your connected social media accounts. You can revoke access at any time through the Service or directly through the platform.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">6. Data Retention</h2>
            <p>We retain your data for as long as your account is active. You can delete your account and data at any time through the Service.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">7. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Delete your account and data</li>
              <li>Export your data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">8. Cookies and Tracking</h2>
            <p>We use cookies and similar technologies to maintain your session and improve the Service. You can control cookies through your browser settings.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">9. Children's Privacy</h2>
            <p>The Service is not intended for users under 13 years of age. We do not knowingly collect information from children.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">10. Changes to Privacy Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">11. Contact Us</h2>
            <p>For questions about this Privacy Policy, please contact us through the Service.</p>
          </section>
        </div>
      </div>
    </div>
  );
}

