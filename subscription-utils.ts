// Subscription plan types and utilities
export type SubscriptionPlan = 'basic' | 'premium';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due';
export type SubscriptionProvider = 'stripe' | 'revenuecat';

export interface SubscriptionLimits {
  maxGroups: number;
  maxEventsPerMonth: number;
  maxMembersPerGroup: number;
  canUseAdvancedFeatures: boolean;
  hasRealTimeChat: boolean;
  hasTaskManagement: boolean;
  hasEventPlanning: boolean;
  hasMailingLabels: boolean;
}

// Plan configurations
export const PLAN_LIMITS: Record<SubscriptionPlan, SubscriptionLimits> = {
  basic: {
    maxGroups: 0, // Can't create groups, only join
    maxEventsPerMonth: 0, // Can't create events
    maxMembersPerGroup: -1, // unlimited when joining
    canUseAdvancedFeatures: false,
    hasRealTimeChat: true, // Basic users can chat
    hasTaskManagement: true, // Basic users can participate in tasks
    hasEventPlanning: false, // Can't create events, only participate
    hasMailingLabels: false, // Cannot print mailing labels
  },
  premium: {
    maxGroups: -1, // unlimited creation
    maxEventsPerMonth: -1, // unlimited creation
    maxMembersPerGroup: -1, // unlimited
    canUseAdvancedFeatures: true,
    hasRealTimeChat: true,
    hasTaskManagement: true,
    hasEventPlanning: true,
    hasMailingLabels: true, // Can print mailing labels
  },
};

// Plan features for display
export const PLAN_FEATURES = {
  basic: {
    name: 'Basic',
    price: 'Free',
    description: 'Perfect for joining and participating in family activities',
    features: [
      'Create and manage your profile and household',
      'Join unlimited family groups (when invited)',
      'Participate in real-time group chat',
      'View and complete assigned tasks',
      'Participate in family events',
      'View family member contact details',
    ],
    limitations: [
      'Cannot create new groups',
      'Cannot create or organize events',
      'Cannot invite others to groups',
    ],
  },
  premium: {
    name: 'Premium',
    price: '$5.99/month',
    description: 'Full access to all family collaboration features',
    features: [
      'Everything in Basic',
      'Unlimited family groups',
      'Unlimited group members',
      'Real-time group chat',
      'Advanced event planning with shared to-do lists',
      'Task assignment and management',
      'Unlimited events',
      'Priority customer support',
    ],
    limitations: [],
  },
};

// Utility functions
export function getPlanLimits(plan: SubscriptionPlan): SubscriptionLimits {
  return PLAN_LIMITS[plan];
}

export function canUserAccessFeature(userPlan: SubscriptionPlan, feature: keyof SubscriptionLimits): boolean {
  const limits = getPlanLimits(userPlan);
  return limits[feature] as boolean;
}

// New household-based feature access check
export function canHouseholdAccessFeature(hasPremiumInHousehold: boolean, feature: keyof SubscriptionLimits): boolean {
  const plan = hasPremiumInHousehold ? 'premium' : 'basic';
  return canUserAccessFeature(plan, feature);
}

export function hasReachedLimit(currentCount: number, limit: number): boolean {
  if (limit === -1) return false; // unlimited
  return currentCount >= limit;
}

export function isBasicPlan(plan: SubscriptionPlan): boolean {
  return plan === 'basic';
}

export function isPremiumPlan(plan: SubscriptionPlan): boolean {
  return plan === 'premium';
}

// Subscription provider utilities
export function isStripeSubscription(provider?: string): boolean {
  return !provider || provider === 'stripe';
}

export function isRevenueCatSubscription(provider?: string): boolean {
  return provider === 'revenuecat';
}

// Unified subscription status check that works with both Stripe and RevenueCat
export function hasActiveSubscription(
  subscriptionPlan?: string,
  subscriptionStatus?: string,
  subscriptionEndsAt?: Date | string,
  subscriptionProvider?: string
): boolean {
  // Check if plan is premium
  if (subscriptionPlan !== 'premium') {
    return false;
  }

  // Check if subscription is active
  if (subscriptionStatus !== 'active') {
    return false;
  }

  // For time-based subscriptions, check expiration
  if (subscriptionEndsAt) {
    const expirationDate = new Date(subscriptionEndsAt);
    const now = new Date();
    
    if (expirationDate <= now) {
      return false; // Subscription has expired
    }
  }

  return true;
}

// Get subscription display information based on provider
export function getSubscriptionDisplayInfo(provider?: string): {
  providerName: string;
  managementInstructions: string;
  upgradeInstructions: string;
} {
  if (isRevenueCatSubscription(provider)) {
    return {
      providerName: 'Mobile App Store',
      managementInstructions: 'Manage your subscription in your device settings or the app store where you purchased it.',
      upgradeInstructions: 'Upgrade through the app on your mobile device for the best experience.'
    };
  }

  return {
    providerName: 'Web Payment',
    managementInstructions: 'Manage your subscription through our web portal.',
    upgradeInstructions: 'Upgrade on our website or mobile app.'
  };
}