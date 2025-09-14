import { useEffect } from "react";

export default function PrivacyPolicy() {
  useEffect(() => {
    document.title = "Privacy Policy - My Branches";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-6">My Branches - Privacy Policy</h1>
          <p className="text-lg text-muted-foreground mb-8"><strong>Effective Date: September 12, 2025</strong></p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Introduction</h2>
          <p>My Branches ("we," "us," or "our") is committed to protecting the privacy and security of our users and their families. This Privacy Policy explains how we collect, use, and protect your information when you use the My Branches family collaboration application (the "Service").</p>
          <p><strong>My Branches is designed specifically for families and prioritizes privacy, safety, and security for users of all ages.</strong></p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Information We Collect</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Personal Information You Provide</h3>
          <ul className="list-disc ml-6 space-y-2">
            <li><strong>Account Information</strong>: Name, email address, phone number, profile photo</li>
            <li><strong>Family Information</strong>: Household details, family member relationships, mailing addresses</li>
            <li><strong>Communication Data</strong>: Messages, photos, and content you share within your family groups</li>
            <li><strong>Event Information</strong>: Family events, tasks, and calendar data you create or participate in</li>
            <li><strong>Payment Information</strong>: Billing details for premium subscriptions (processed securely by our payment partners)</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">Information Collected Automatically</h3>
          <ul className="list-disc ml-6 space-y-2">
            <li><strong>Usage Data</strong>: How you interact with the app features and navigation patterns</li>
            <li><strong>Device Information</strong>: Device type, operating system, browser type, unique device identifiers</li>
            <li><strong>Location Data</strong>: Only when you explicitly share your location for events or family coordination</li>
            <li><strong>Technical Data</strong>: IP address, app version, crash reports, and performance metrics</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">Information from Third Parties</h3>
          <ul className="list-disc ml-6 space-y-2">
            <li><strong>Authentication Services</strong>: Profile information from authentication providers (Replit Auth)</li>
            <li><strong>Payment Processors</strong>: Transaction information from Stripe and RevenueCat for subscription management</li>
            <li><strong>Push Notification Services</strong>: Device tokens from Firebase for delivering family notifications</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">How We Use Your Information</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Core Family Features</h3>
          <ul className="list-disc ml-6 space-y-2">
            <li><strong>Family Organization</strong>: Enable household and group management for family coordination</li>
            <li><strong>Communication</strong>: Facilitate secure messaging and photo sharing within your family</li>
            <li><strong>Event Planning</strong>: Coordinate family events, tasks, and calendar management</li>
            <li><strong>Profile Management</strong>: Maintain family member profiles and contact information</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">Premium Features</h3>
          <ul className="list-disc ml-6 space-y-2">
            <li><strong>Subscription Services</strong>: Process payments and manage premium feature access</li>
            <li><strong>Mailing Labels</strong>: Generate professional labels for family events and correspondence</li>
            <li><strong>Advanced Planning</strong>: Provide enhanced event and household management tools</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Information Sharing and Disclosure</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Within Your Family Network</h3>
          <ul className="list-disc ml-6 space-y-2">
            <li><strong>Family Members Only</strong>: Your information is shared only with family members you invite to your household or groups</li>
            <li><strong>Household Sharing</strong>: Basic profile information is visible to other members of your household</li>
            <li><strong>Group Participation</strong>: Event and task information is shared with members of specific family groups</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">No Public Sharing</h3>
          <p><strong>We never sell, rent, or publicly share your personal or family information with third parties for marketing purposes.</strong></p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Children's Privacy (COPPA Compliance)</h2>
          <p>My Branches is designed to be family-friendly and safe for children:</p>
          <ul className="list-disc ml-6 space-y-2">
            <li><strong>Parental Control</strong>: Parents and household administrators control family group membership</li>
            <li><strong>Private Networks</strong>: Children can only interact with invited family members</li>
            <li><strong>No Public Features</strong>: No public posting, stranger contact, or open social networking</li>
            <li><strong>Limited Data Collection</strong>: We collect minimal information from children under 13</li>
            <li><strong>Parental Access</strong>: Parents can review, modify, or delete their child's information</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Data Security</h2>
          <p>We implement robust security measures to protect your family's information:</p>
          <ul className="list-disc ml-6 space-y-2">
            <li><strong>Encryption</strong>: All data is encrypted in transit and at rest</li>
            <li><strong>Access Controls</strong>: Strict access controls limit who can view your family data</li>
            <li><strong>Family-Only Access</strong>: Your data is only accessible to your invited family members</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Your Privacy Rights</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Account Management</h3>
          <ul className="list-disc ml-6 space-y-2">
            <li><strong>Access</strong>: View and download your personal and family data</li>
            <li><strong>Correction</strong>: Update or correct inaccurate information</li>
            <li><strong>Deletion</strong>: Request deletion of your account and associated data through the app</li>
            <li><strong>Portability</strong>: Export your family data in a portable format</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Contact Us</h2>
          <p>If you have questions about this Privacy Policy or our privacy practices, please contact us:</p>
          <ul className="list-disc ml-6 space-y-2">
            <li><strong>Email</strong>: support@mybranches.app</li>
            <li><strong>Privacy Requests</strong>: Use the account deletion feature in your profile settings for data removal requests</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Effective Date" at the top.</p>
          
          <p className="mt-8 text-sm text-muted-foreground">
            This privacy policy is designed to comply with applicable privacy laws including GDPR, CCPA, and COPPA to ensure your family's privacy and safety.
          </p>
        </div>
      </div>
    </div>
  );
}