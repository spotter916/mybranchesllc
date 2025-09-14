import { useQuery } from "@tanstack/react-query";
import { Capacitor } from "@capacitor/core";
import { canHouseholdAccessFeature, type SubscriptionLimits } from "@shared/subscription-utils";
import { useAuth } from "@/hooks/useAuth";
import { usePurchases } from "@/hooks/usePurchases";

interface HouseholdSubscriptionStatus {
  hasPremium: boolean;
  subscriptionProvider?: 'stripe' | 'revenuecat';
  premiumUser?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    subscriptionProvider?: 'stripe' | 'revenuecat';
  };
  household?: {
    id: string;
    name: string;
  };
}

export function useHouseholdSubscription() {
  const { data: householdStatus, isLoading: householdLoading } = useQuery<HouseholdSubscriptionStatus>({
    queryKey: ['/api/household/subscription'],
    retry: false,
  });
  
  // Get mobile subscription status (only on native platforms)
  const { hasPremium: mobileHasPremium, isLoading: mobileLoading } = usePurchases();
  const isNativePlatform = Capacitor.isNativePlatform();
  
  // Get user-level subscription from auth
  const { user } = useAuth() as { user?: { subscriptionPlan?: string; subscriptionProvider?: string } };
  const userIsPremium = user?.subscriptionPlan === 'premium';
  
  // Determine final subscription status
  // Priority: Household > Mobile (if native) > User-level
  const computedHasPremium = 
    householdStatus?.hasPremium || 
    (isNativePlatform && mobileHasPremium) || 
    userIsPremium;
  
  // Determine subscription provider
  const subscriptionProvider = 
    householdStatus?.subscriptionProvider || 
    (isNativePlatform && mobileHasPremium ? 'revenuecat' : 'stripe') ||
    user?.subscriptionProvider || 
    'stripe';

  // Combined loading state
  const isLoading = householdLoading || (isNativePlatform && mobileLoading);

  return {
    householdStatus,
    isLoading,
    hasPremium: computedHasPremium,
    subscriptionProvider,
    premiumUser: householdStatus?.premiumUser,
    household: householdStatus?.household,
    isNativePlatform,
    mobileHasPremium: isNativePlatform ? mobileHasPremium : false,
    canAccessFeature: (feature: keyof SubscriptionLimits) => {
      return canHouseholdAccessFeature(computedHasPremium, feature);
    }
  };
}