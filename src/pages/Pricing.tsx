import { useState, useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Check, Crown, Star, Tag, Smartphone, Globe, Loader2 } from "lucide-react";
import { PLAN_FEATURES, getSubscriptionDisplayInfo } from "@shared/subscription-utils";
import { useAuth } from "@/hooks/useAuth";
import { useHouseholdSubscription } from "@/hooks/useHouseholdSubscription";
import { usePurchases } from "@/hooks/usePurchases";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [showCouponDialog, setShowCouponDialog] = useState(false);
  const { toast } = useToast();
  
  // Get subscription status from multiple sources
  const { hasPremium, subscriptionProvider, isNativePlatform, isLoading: subscriptionLoading } = useHouseholdSubscription();
  const { 
    purchaseProduct, 
    restorePurchases, 
    products, 
    isInitialized: purchasesInitialized, 
    isLoading: purchasesLoading 
  } = usePurchases();
  
  const { user } = useAuth() as {
    user?: {
      id: string;
      subscriptionPlan?: string;
      subscriptionStatus?: string;
      subscriptionProvider?: string;
    };
  };

  const currentPlan = hasPremium ? 'premium' : 'basic';
  const displayInfo = getSubscriptionDisplayInfo(subscriptionProvider);

  const handleUpgrade = async (useCoupon = false) => {
    try {
      // CRITICAL: Block Stripe checkout on mobile apps (App Store compliance)
      if (Capacitor.isNativePlatform()) {
        toast({
          title: "Not Available",
          description: "Web subscriptions are not available in the mobile app. Please use the in-app purchase options.",
          variant: "destructive",
        });
        return;
      }
      
      setIsLoading(true);
      
      // Prepare request body
      const requestBody: any = {};
      if (useCoupon && couponCode.trim()) {
        requestBody.couponCode = couponCode.trim();
      }
      
      // Make API call to create checkout session
      const response = await apiRequest("POST", "/api/create-checkout-session", requestBody);
      const data = await response.json();
      
      if (data.url) {
        // Create a form and submit it - this is more reliable for external redirects
        const form = document.createElement('form');
        form.method = 'GET';
        form.action = data.url;
        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error) {
      toast({
        title: "Checkout Error",
        description: error instanceof Error ? error.message : "Failed to start checkout process",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleCouponUpgrade = () => {
    setShowCouponDialog(false);
    handleUpgrade(true);
  };

  // Mobile purchase handler using RevenueCat
  const handleMobilePurchase = async (productId: string) => {
    if (!purchasesInitialized) {
      toast({
        title: "Not Ready",
        description: "Purchase system is still initializing. Please wait a moment.",
        variant: "destructive",
      });
      return;
    }

    const success = await purchaseProduct(productId);
    // Purchase feedback is handled by the usePurchases hook
    return success;
  };

  // Restore purchases for mobile users
  const handleRestorePurchases = async () => {
    if (!purchasesInitialized) {
      toast({
        title: "Not Ready",
        description: "Purchase system is still initializing. Please wait a moment.",
        variant: "destructive",
      });
      return;
    }

    const success = await restorePurchases();
    // Restore feedback is handled by the usePurchases hook
    return success;
  };

  // Get monthly product from RevenueCat
  const monthlyProduct = products.find(p => 
    p.identifier === 'my_branches_premium_monthly'
  );

  // Get annual product from RevenueCat
  const annualProduct = products.find(p => 
    p.identifier === 'my_branches_premium_annual'
  );

  // Determine if loading
  const combinedLoading = isLoading || subscriptionLoading || purchasesLoading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <img src="@assets/app Icon_1757360708513.png" alt="My Branches" className="w-16 h-16" />
            <h1 className="text-4xl font-bold text-gray-900">
              My Branches Plans
            </h1>
          </div>
          <p className="text-xl text-gray-600 mb-8">
            Start with our free Basic plan or unlock all features with Premium
          </p>
          
          {/* Annual/Monthly Toggle */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            <span className={`text-sm ${!isAnnual ? 'font-semibold text-purple-600' : 'text-gray-500'}`}>
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative w-14 h-7 rounded-full transition-colors duration-200 ${
                isAnnual ? 'bg-purple-600' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
                  isAnnual ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-sm ${isAnnual ? 'font-semibold text-purple-600' : 'text-gray-500'}`}>
              Annual
            </span>
            {isAnnual && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Save 20%
              </Badge>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Basic Plan */}
          <Card className={`relative ${currentPlan === 'basic' ? 'ring-2 ring-purple-500' : ''}`}>
            {currentPlan === 'basic' && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-purple-600 text-white">Current Plan</Badge>
              </div>
            )}
            <CardHeader className="text-center pb-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Star className="h-8 w-8 text-gray-600" />
              </div>
              <CardTitle className="text-2xl">{PLAN_FEATURES.basic.name}</CardTitle>
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {PLAN_FEATURES.basic.price}
              </div>
              <CardDescription className="text-base">
                {PLAN_FEATURES.basic.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-8">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">What's included:</h4>
                  <ul className="space-y-2">
                    {PLAN_FEATURES.basic.features.map((feature, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {PLAN_FEATURES.basic.limitations.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Limitations:</h4>
                    <ul className="space-y-2">
                      {PLAN_FEATURES.basic.limitations.map((limitation, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <div className="w-5 h-5 flex-shrink-0 mt-0.5 flex items-center justify-center">
                            <div className="w-2 h-2 bg-gray-400 rounded-full" />
                          </div>
                          <span className="text-gray-500 text-sm">{limitation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <Button 
                variant="outline" 
                className="w-full"
                disabled={currentPlan === 'basic'}
              >
                {currentPlan === 'basic' ? 'Current Plan' : 'Downgrade'}
              </Button>
            </CardContent>
          </Card>

          {/* Premium Plan */}
          <Card className={`relative border-purple-200 ${currentPlan === 'premium' ? 'ring-2 ring-purple-500' : 'border-2'}`}>
            {currentPlan === 'premium' ? (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-purple-600 text-white">Current Plan</Badge>
              </div>
            ) : (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                  Most Popular
                </Badge>
              </div>
            )}
            <CardHeader className="text-center pb-8 bg-gradient-to-br from-purple-50 to-pink-50">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                <Crown className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl text-purple-900">{PLAN_FEATURES.premium.name}</CardTitle>
              <div className="text-4xl font-bold text-purple-900 mb-2">
                {isNativePlatform ? (
                  // Show RevenueCat pricing for mobile
                  isAnnual 
                    ? annualProduct?.priceString || '$60/year'
                    : monthlyProduct?.priceString || PLAN_FEATURES.premium.price
                ) : (
                  // Show Stripe pricing for web
                  isAnnual ? '$5.00/month' : PLAN_FEATURES.premium.price
                )}
                {isAnnual && !isNativePlatform && <span className="text-base text-purple-600 ml-2">billed annually</span>}
              </div>
              
              {/* Platform indicator */}
              <div className="flex items-center justify-center space-x-2 mb-2">
                {isNativePlatform ? (
                  <div className="flex items-center space-x-1 text-sm text-purple-700">
                    <Smartphone className="h-4 w-4" />
                    <span>{displayInfo.providerName}</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1 text-sm text-purple-700">
                    <Globe className="h-4 w-4" />
                    <span>{displayInfo.providerName}</span>
                  </div>
                )}</div>
              <CardDescription className="text-base text-purple-700">
                {PLAN_FEATURES.premium.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-8">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Everything included:</h4>
                  <ul className="space-y-2">
                    {PLAN_FEATURES.premium.features.map((feature, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="space-y-3">
                {currentPlan === 'premium' ? (
                  // Current premium user
                  <Button 
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                    disabled
                    data-testid="button-current-premium"
                  >
                    Current Plan
                  </Button>
                ) : isNativePlatform ? (
                  // Mobile platform - RevenueCat purchase buttons
                  <>
                    <Button 
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      onClick={() => {
                        const productId = isAnnual 
                          ? 'my_branches_premium_annual' 
                          : 'my_branches_premium_monthly';
                        handleMobilePurchase(productId);
                      }}
                      disabled={combinedLoading || !purchasesInitialized}
                      data-testid="button-mobile-upgrade"
                    >
                      {combinedLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        `Subscribe ${isAnnual ? 'Annually' : 'Monthly'}`
                      )}
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full border-purple-200 text-purple-600 hover:bg-purple-50"
                      onClick={handleRestorePurchases}
                      disabled={combinedLoading || !purchasesInitialized}
                      data-testid="button-restore-purchases"
                    >
                      Restore Purchases
                    </Button>
                  </>
                ) : (
                  // Web platform - Stripe purchase buttons
                  <>
                    <Button 
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      onClick={() => handleUpgrade(false)}
                      disabled={combinedLoading}
                      data-testid="button-upgrade-premium"
                    >
                      {combinedLoading 
                        ? 'Starting Checkout...' 
                        : 'Upgrade to Premium'
                      }
                    </Button>
                    
                    <Dialog open={showCouponDialog} onOpenChange={setShowCouponDialog}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="w-full border-purple-200 text-purple-600 hover:bg-purple-50"
                          disabled={combinedLoading}
                          data-testid="button-coupon-upgrade"
                        >
                          <Tag className="h-4 w-4 mr-2" />
                          Have a Coupon Code?
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Apply Coupon Code</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium mb-2 block">
                              Coupon Code
                            </label>
                            <Input
                              placeholder="Enter your coupon code"
                              value={couponCode}
                              onChange={(e) => setCouponCode(e.target.value)}
                              data-testid="input-coupon-code"
                            />
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              onClick={() => setShowCouponDialog(false)}
                              data-testid="button-cancel-coupon"
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleCouponUpgrade}
                              disabled={!couponCode.trim() || combinedLoading}
                              data-testid="button-apply-coupon"
                            >
                              Apply & Upgrade
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </>
                )}
              </div>
              
              {currentPlan !== 'premium' && (
                <p className="text-center text-sm text-gray-500 mt-3">
                  Start your 14-day free trial
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Platform-specific subscription management info */}
        {currentPlan === 'premium' && (
          <div className="mt-16 max-w-3xl mx-auto">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-purple-100">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                {isNativePlatform ? <Smartphone className="h-5 w-5 mr-2 text-purple-600" /> : <Globe className="h-5 w-5 mr-2 text-purple-600" />}
                Manage Your Subscription
              </h3>
              <p className="text-gray-600 mb-4">
                {displayInfo.managementInstructions}
              </p>
              <div className="text-sm text-gray-500">
                <strong>Subscription Provider:</strong> {displayInfo.providerName}
              </div>
            </div>
          </div>
        )}

        {/* FAQ Section */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">
                Can I change my plan at any time?
              </h3>
              <p className="text-gray-600">
                Yes! You can upgrade or downgrade your plan at any time. {isNativePlatform 
                  ? 'For mobile subscriptions, manage your subscription through your device settings.'
                  : 'Changes take effect immediately, and we\'ll prorate any billing differences.'
                }
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">
                What happens to my data if I downgrade?
              </h3>
              <p className="text-gray-600">
                Your data is always safe. If you downgrade to Basic, you'll keep access to your profile and primary group, but some advanced features will be disabled.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">
                Is there a family discount?
              </h3>
              <p className="text-gray-600">
                Premium plans are designed for the whole family to share. One Premium subscription covers unlimited family members in your household.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">
                Which payment method should I choose?
              </h3>
              <p className="text-gray-600">
                {isNativePlatform 
                  ? 'On mobile devices, we recommend subscribing through the app store for the best experience and easy subscription management.'
                  : 'You can subscribe through our website or the mobile app. Mobile subscriptions are managed through your device\'s app store.'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}