import { useEffect } from "react";

export default function TermsOfService() {
  useEffect(() => {
    document.title = "Terms of Service - My Branches";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-6">My Branches - Terms of Service</h1>
          <p className="text-lg text-muted-foreground mb-8"><strong>Effective Date: September 12, 2025</strong></p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Acceptance of Terms</h2>
          <p>By downloading, accessing, or using the My Branches family collaboration application ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these Terms, you may not use our Service.</p>
          <p><strong>My Branches is designed specifically for family communication and organization. These Terms are crafted with family safety and collaboration in mind.</strong></p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Description of Service</h2>
          <p>My Branches is a family collaboration platform that provides:</p>

          <h3 className="text-xl font-semibold mt-6 mb-3">Free Features (Basic Plan)</h3>
          <ul className="list-disc ml-6 space-y-2">
            <li>Family household creation and management</li>
            <li>Group messaging and photo sharing within your family</li>
            <li>Event planning and coordination</li>
            <li>Task assignment and tracking</li>
            <li>Family member profiles and contact management</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">Premium Features (My Branches Premium - $5.99/month)</h3>
          <ul className="list-disc ml-6 space-y-2">
            <li>Professional mailing label printing (Avery 5160 format)</li>
            <li>Advanced event planning and coordination tools</li>
            <li>Enhanced group management capabilities</li>
            <li>Priority customer support</li>
            <li>Extended family network features</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Account Registration and Family Households</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Account Creation</h3>
          <ul className="list-disc ml-6 space-y-2">
            <li>You must provide accurate and complete information when creating your account</li>
            <li>You are responsible for maintaining the security of your account credentials</li>
            <li>You must be at least 13 years old to create an account independently</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">Family Households</h3>
          <ul className="list-disc ml-6 space-y-2">
            <li><strong>Household Owners</strong> have administrative control over their family household</li>
            <li>Household Owners can invite family members and manage household settings</li>
            <li>Each user can belong to one primary household and participate in multiple family groups</li>
            <li>Household Owners are responsible for the conduct of their household members</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Subscription Terms</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Billing and Payment</h3>
          <ul className="list-disc ml-6 space-y-2">
            <li>Premium subscriptions are billed monthly at $5.99 USD or annually at $60 USD</li>
            <li>Subscriptions automatically renew unless cancelled before the next billing cycle</li>
            <li>Payment is processed securely through our payment partners (Stripe for web, RevenueCat for mobile)</li>
            <li>Household-level subscriptions benefit all members of the subscribing household</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">Subscription Management</h3>
          <ul className="list-disc ml-6 space-y-2">
            <li>You may cancel your subscription at any time through account settings</li>
            <li>Cancellation takes effect at the end of the current billing period</li>
            <li>No refunds for partial months or unused premium features</li>
            <li>Downgrade to Basic plan occurs immediately upon subscription expiration</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Acceptable Use Policy</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Family-Friendly Communication</h3>
          <ul className="list-disc ml-6 space-y-2">
            <li>My Branches is designed for family communication and must be used respectfully</li>
            <li>Content must be appropriate for family environments, including children</li>
            <li>No harassment, bullying, or inappropriate behavior toward family members</li>
            <li>Respect privacy and boundaries of all family members</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">Prohibited Content</h3>
          <ul className="list-disc ml-6 space-y-2">
            <li>Illegal content, activities, or materials</li>
            <li>Hate speech, discriminatory language, or offensive content</li>
            <li>Spam, commercial advertising, or promotional content unrelated to family coordination</li>
            <li>Content that violates intellectual property rights</li>
            <li>Malicious software, viruses, or harmful code</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Family Content and Privacy</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Content Ownership</h3>
          <ul className="list-disc ml-6 space-y-2">
            <li>You retain ownership of content you create and share within your family</li>
            <li>By sharing content in My Branches, you grant family members permission to view and interact with that content</li>
            <li>Shared family content (photos, messages, events) may remain accessible to other family members even if you leave a group</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Children and Family Safety</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Parental Responsibility</h3>
          <ul className="list-disc ml-6 space-y-2">
            <li>Parents/guardians are responsible for supervising their children's use of My Branches</li>
            <li>Household Owners can manage and monitor family member participation</li>
            <li>Parents may review, edit, or delete content associated with their children's accounts</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">Child Safety Features</h3>
          <ul className="list-disc ml-6 space-y-2">
            <li>Children can only interact with invited family members (no stranger contact)</li>
            <li>No public posting or open social networking features</li>
            <li>Parents control which family groups children can participate in</li>
            <li>COPPA-compliant design with minimal data collection from children under 13</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">8. Account Termination</h2>
          <p>You may delete your account at any time through the account deletion feature in your profile settings. Upon account deletion:</p>
          <ul className="list-disc ml-6 space-y-2">
            <li>Your account and personal data will be permanently removed</li>
            <li>Shared family content may remain accessible to other family members</li>
            <li>Any active subscriptions will be cancelled</li>
            <li>This action cannot be undone</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">9. Limitation of Liability</h2>
          <p>My Branches is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the service, except as required by applicable law.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">10. Changes to Terms</h2>
          <p>We may modify these Terms from time to time. We will notify users of material changes via email or in-app notification. Continued use of the service after changes constitutes acceptance of new terms.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">11. Contact Information</h2>
          <p>If you have questions about these Terms, please contact us:</p>
          <ul className="list-disc ml-6 space-y-2">
            <li><strong>Email</strong>: support@mybranches.app</li>
            <li><strong>Account Deletion</strong>: Use the account deletion feature in your profile settings</li>
          </ul>

          <p className="mt-8 text-sm text-muted-foreground">
            These terms are designed to protect families while enabling meaningful connections and coordination through our platform.
          </p>
        </div>
      </div>
    </div>
  );
}