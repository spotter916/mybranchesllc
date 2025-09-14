import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { purchasesService, type SubscriptionProduct, type ActiveSubscription } from '@/services/purchases';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface PurchasesHook {
  // State
  isInitialized: boolean;
  isLoading: boolean;
  products: SubscriptionProduct[];
  activeSubscription: ActiveSubscription | null;
  
  // Methods
  initialize: () => Promise<void>;
  fetchProducts: () => Promise<void>;
  purchaseProduct: (productId: string) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  verifyWithBackend: () => Promise<void>;
  
  // Computed
  isNativePlatform: boolean;
  hasPremium: boolean;
}

export function usePurchases(): PurchasesHook {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<SubscriptionProduct[]>([]);
  const [activeSubscription, setActiveSubscription] = useState<ActiveSubscription | null>(null);
  const { toast } = useToast();

  const isNativePlatform = Capacitor.isNativePlatform();
  const hasPremium = activeSubscription?.isActive || false;

  /**
   * Initialize RevenueCat SDK and set user ID
   */
  const initialize = async (): Promise<void> => {
    try {
      if (!isNativePlatform) {
        console.log('Not on native platform, skipping RevenueCat initialization');
        return;
      }

      setIsLoading(true);
      await purchasesService.initialize();
      
      // Get current user ID and set it in RevenueCat
      try {
        const userResponse = await apiRequest('GET', '/api/auth/profile');
        const userData = await userResponse.json();
        
        if (userData.id) {
          await purchasesService.setUserId(userData.id);
        }
      } catch (error) {
        console.error('Failed to set RevenueCat user ID:', error);
      }

      setIsInitialized(true);
      console.log('RevenueCat initialized successfully');
    } catch (error) {
      console.error('Failed to initialize RevenueCat:', error);
      toast({
        title: "Initialization Error",
        description: "Failed to initialize purchases. Please restart the app.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Fetch available subscription products
   */
  const fetchProducts = async (): Promise<void> => {
    try {
      if (!isInitialized || !isNativePlatform) {
        return;
      }

      setIsLoading(true);
      const availableProducts = await purchasesService.getSubscriptionProducts();
      setProducts(availableProducts);

      // Also check for active subscription
      const activeSubscription = await purchasesService.getActiveSubscription();
      setActiveSubscription(activeSubscription);

    } catch (error) {
      console.error('Failed to fetch products:', error);
      toast({
        title: "Products Error",
        description: "Failed to load subscription products.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Purchase a subscription product
   */
  const purchaseProduct = async (productId: string): Promise<boolean> => {
    try {
      if (!isInitialized || !isNativePlatform) {
        throw new Error('Purchases not available on this platform');
      }

      setIsLoading(true);
      
      const result = await purchasesService.purchaseProduct(productId);
      
      if (result.success && result.customerInfo) {
        // Purchase successful
        const activeSubscription = await purchasesService.getActiveSubscription();
        setActiveSubscription(activeSubscription);
        
        // Verify with backend using server-side RevenueCat API
        await verifyWithBackend();
        
        toast({
          title: "Purchase Successful!",
          description: "Welcome to Premium! Your subscription is now active.",
        });
        
        return true;
      } else if (result.error) {
        // Handle specific error cases
        if (result.error.code === 'PURCHASE_CANCELLED') {
          // User cancelled - don't show error toast
          return false;
        }
        
        toast({
          title: "Purchase Failed",
          description: result.error.message,
          variant: "destructive",
        });
        
        return false;
      }
      
      return false;
    } catch (error: any) {
      console.error('Purchase failed:', error);
      toast({
        title: "Purchase Error",
        description: error.message || "Purchase failed. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Restore previous purchases
   */
  const restorePurchases = async (): Promise<boolean> => {
    try {
      if (!isInitialized || !isNativePlatform) {
        throw new Error('Purchases not available on this platform');
      }

      setIsLoading(true);
      
      const result = await purchasesService.restorePurchases();
      
      if (result.success && result.customerInfo) {
        // Restore successful
        const activeSubscription = await purchasesService.getActiveSubscription();
        setActiveSubscription(activeSubscription);
        
        // Verify with backend using server-side RevenueCat API
        await verifyWithBackend();
        
        if (activeSubscription?.isActive) {
          toast({
            title: "Purchases Restored!",
            description: "Your Premium subscription has been restored.",
          });
        } else {
          toast({
            title: "No Purchases Found",
            description: "No active subscriptions found to restore.",
          });
        }
        
        return true;
      } else if (result.error) {
        toast({
          title: "Restore Failed",
          description: result.error.message,
          variant: "destructive",
        });
        return false;
      }
      
      return false;
    } catch (error: any) {
      console.error('Restore failed:', error);
      toast({
        title: "Restore Error", 
        description: error.message || "Failed to restore purchases.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * SECURITY FIXED: Server-side verification (no longer trusts client data)
   * Triggers server to independently verify subscription with RevenueCat API
   */
  const verifyWithBackend = async (): Promise<void> => {
    try {
      if (!isNativePlatform) return;

      console.log('Requesting server-side RevenueCat verification...');
      
      // Server will independently verify with RevenueCat API using server credentials
      await apiRequest('POST', '/api/revenuecat/verify', {
        // No customer info sent - server verifies independently for security
      });

      console.log('RevenueCat subscription verified by server');
      
      // Force refresh of household subscription status after verification
      // This ensures household members see premium access immediately
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('subscription-status-changed'));
      }, 1000);
    } catch (error) {
      console.error('Failed to verify with backend:', error);
      // Don't show user error for verification issues
    }
  };

  // Initialize on mount (only on native platforms)
  useEffect(() => {
    if (isNativePlatform && !isInitialized) {
      initialize();
    }
  }, []);

  // Fetch products and subscription status after initialization
  useEffect(() => {
    if (isInitialized && isNativePlatform) {
      fetchProducts();
    }
  }, [isInitialized]);

  return {
    // State
    isInitialized,
    isLoading,
    products,
    activeSubscription,
    
    // Methods
    initialize,
    fetchProducts,
    purchaseProduct,
    restorePurchases,
    verifyWithBackend,
    
    // Computed
    isNativePlatform,
    hasPremium,
  };
}

export default usePurchases;