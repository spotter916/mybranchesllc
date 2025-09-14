import { Purchases, LOG_LEVEL, PurchasesOffering, PurchasesPackage, PurchasesEntitlementInfo, CustomerInfo } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';

interface PurchasesError {
  message: string;
  code: string;
}

export interface SubscriptionProduct {
  identifier: string;
  title: string;
  description: string;
  price: string;
  priceString: string;
  currencyCode: string;
  introPrice?: {
    price: string;
    priceString: string;
    period: string;
  };
}

export interface ActiveSubscription {
  productId: string;
  isActive: boolean;
  renewalDate?: Date;
  expirationDate?: Date;
  originalTransactionId?: string;
  entitlements: { [key: string]: PurchasesEntitlementInfo };
}

class PurchasesService {
  private static instance: PurchasesService;
  private isInitialized = false;
  private readonly REVENUECAT_API_KEY_APPLE = import.meta.env.VITE_REVENUECAT_API_KEY_APPLE || '';
  private readonly REVENUECAT_API_KEY_GOOGLE = import.meta.env.VITE_REVENUECAT_API_KEY_GOOGLE || '';

  // Product identifiers - these should match your RevenueCat dashboard and app store configurations
  public readonly PRODUCT_IDS = {
    PREMIUM_MONTHLY: 'my_branches_premium_monthly',
    PREMIUM_ANNUAL: 'my_branches_premium_annual'
  };

  public readonly ENTITLEMENTS = {
    PREMIUM: 'premium'
  };

  private constructor() {}

  public static getInstance(): PurchasesService {
    if (!PurchasesService.instance) {
      PurchasesService.instance = new PurchasesService();
    }
    return PurchasesService.instance;
  }

  /**
   * Initialize RevenueCat SDK
   */
  public async initialize(): Promise<void> {
    try {
      if (this.isInitialized) {
        return;
      }

      if (!Capacitor.isNativePlatform()) {
        console.log('RevenueCat: Not running on native platform, skipping initialization');
        return;
      }

      // Determine which API key to use based on platform
      let apiKey = '';
      if (Capacitor.getPlatform() === 'ios') {
        apiKey = this.REVENUECAT_API_KEY_APPLE;
      } else if (Capacitor.getPlatform() === 'android') {
        apiKey = this.REVENUECAT_API_KEY_GOOGLE;
      }

      if (!apiKey) {
        throw new Error(`RevenueCat API key not configured for platform: ${Capacitor.getPlatform()}`);
      }

      // Configure and initialize Purchases
      await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
      await Purchases.configure({
        apiKey,
        appUserID: undefined, // Will be set later with setUserId
      });

      this.isInitialized = true;
      console.log('RevenueCat: Successfully initialized');
    } catch (error) {
      console.error('RevenueCat: Failed to initialize', error);
      throw error;
    }
  }

  /**
   * Set user ID for RevenueCat
   */
  public async setUserId(userId: string): Promise<void> {
    try {
      if (!this.isInitialized || !Capacitor.isNativePlatform()) {
        return;
      }

      await Purchases.logIn({ appUserID: userId });
      console.log(`RevenueCat: User ID set to ${userId}`);
    } catch (error) {
      console.error('RevenueCat: Failed to set user ID', error);
      throw error;
    }
  }

  /**
   * Get available offerings
   */
  public async getOfferings(): Promise<PurchasesOffering[]> {
    try {
      if (!this.isInitialized || !Capacitor.isNativePlatform()) {
        return [];
      }

      const offerings = await Purchases.getOfferings();
      
      if (offerings.current && offerings.current.availablePackages) {
        console.log('RevenueCat: Available offerings retrieved', offerings.current);
        return [offerings.current];
      }

      return [];
    } catch (error) {
      console.error('RevenueCat: Failed to get offerings', error);
      return [];
    }
  }

  /**
   * Get subscription products
   */
  public async getSubscriptionProducts(): Promise<SubscriptionProduct[]> {
    try {
      const offerings = await this.getOfferings();
      const products: SubscriptionProduct[] = [];

      for (const offering of offerings) {
        if (offering.availablePackages) {
          for (const packageData of offering.availablePackages) {
            const product = packageData.product;
            if (product) {
              products.push({
                identifier: product.identifier,
                title: product.title,
                description: product.description,
                price: product.price.toString(),
                priceString: product.priceString,
                currencyCode: product.currencyCode,
                introPrice: product.introPrice ? {
                  price: product.introPrice.price.toString(),
                  priceString: product.introPrice.priceString,
                  period: product.introPrice.periodNumberOfUnits + ' ' + product.introPrice.periodUnit
                } : undefined
              });
            }
          }
        }
      }

      return products;
    } catch (error) {
      console.error('RevenueCat: Failed to get subscription products', error);
      return [];
    }
  }

  /**
   * Purchase a product
   */
  public async purchaseProduct(productId: string): Promise<{ success: boolean; customerInfo?: CustomerInfo; error?: PurchasesError }> {
    try {
      if (!this.isInitialized || !Capacitor.isNativePlatform()) {
        throw new Error('RevenueCat not initialized or not on native platform');
      }

      const offerings = await this.getOfferings();
      let packageToPurchase: PurchasesPackage | null = null;

      // Find the package with matching product ID
      for (const offering of offerings) {
        if (offering.availablePackages) {
          packageToPurchase = offering.availablePackages.find(
            pkg => pkg.product?.identifier === productId
          ) || null;
          if (packageToPurchase) break;
        }
      }

      if (!packageToPurchase) {
        throw new Error(`Product ${productId} not found in offerings`);
      }

      const result = await Purchases.purchasePackage({
        aPackage: packageToPurchase
      });

      console.log('RevenueCat: Purchase successful', result);
      
      return {
        success: true,
        customerInfo: result.customerInfo
      };

    } catch (error: any) {
      console.error('RevenueCat: Purchase failed', error);
      
      return {
        success: false,
        error: {
          message: error.message || 'Purchase failed',
          code: error.code || 'UNKNOWN_ERROR'
        }
      };
    }
  }

  /**
   * Restore purchases
   */
  public async restorePurchases(): Promise<{ success: boolean; customerInfo?: CustomerInfo; error?: PurchasesError }> {
    try {
      if (!this.isInitialized || !Capacitor.isNativePlatform()) {
        throw new Error('RevenueCat not initialized or not on native platform');
      }

      const result = await Purchases.restorePurchases();
      console.log('RevenueCat: Purchases restored', result);
      
      return {
        success: true,
        customerInfo: result
      };

    } catch (error: any) {
      console.error('RevenueCat: Restore purchases failed', error);
      
      return {
        success: false,
        error: {
          message: error.message || 'Restore failed',
          code: error.code || 'UNKNOWN_ERROR'
        }
      };
    }
  }

  /**
   * Get customer info
   */
  public async getCustomerInfo(): Promise<CustomerInfo | null> {
    try {
      if (!this.isInitialized || !Capacitor.isNativePlatform()) {
        return null;
      }

      const customerInfo = await Purchases.getCustomerInfo();
      return customerInfo;
    } catch (error) {
      console.error('RevenueCat: Failed to get customer info', error);
      return null;
    }
  }

  /**
   * Check if user has active subscription
   */
  public async getActiveSubscription(): Promise<ActiveSubscription | null> {
    try {
      const customerInfo = await this.getCustomerInfo();
      if (!customerInfo) {
        return null;
      }

      const premiumEntitlement = customerInfo.entitlements.active[this.ENTITLEMENTS.PREMIUM];
      
      if (premiumEntitlement && premiumEntitlement.isActive) {
        return {
          productId: premiumEntitlement.productIdentifier,
          isActive: true,
          renewalDate: premiumEntitlement.willRenew ? new Date(premiumEntitlement.expirationDate) : undefined,
          expirationDate: new Date(premiumEntitlement.expirationDate),
          originalTransactionId: customerInfo.originalPurchaseDate ? 
            customerInfo.originalAppUserId : undefined,
          entitlements: customerInfo.entitlements.active
        };
      }

      return null;
    } catch (error) {
      console.error('RevenueCat: Failed to get active subscription', error);
      return null;
    }
  }

  /**
   * Check if user has premium entitlement
   */
  public async hasPremiumEntitlement(): Promise<boolean> {
    try {
      const activeSubscription = await this.getActiveSubscription();
      return activeSubscription?.isActive || false;
    } catch (error) {
      console.error('RevenueCat: Failed to check premium entitlement', error);
      return false;
    }
  }

  /**
   * Logout user from RevenueCat
   */
  public async logout(): Promise<void> {
    try {
      if (!this.isInitialized || !Capacitor.isNativePlatform()) {
        return;
      }

      await Purchases.logOut();
      console.log('RevenueCat: User logged out');
    } catch (error) {
      console.error('RevenueCat: Failed to logout', error);
    }
  }

  /**
   * Check if RevenueCat is available (native platform)
   */
  public isAvailable(): boolean {
    return Capacitor.isNativePlatform() && this.isInitialized;
  }

  /**
   * Handle purchase flow with error handling and user feedback
   */
  public async handlePurchaseFlow(
    productId: string,
    onSuccess?: (customerInfo: CustomerInfo) => void,
    onError?: (error: PurchasesError) => void,
    onLoading?: (isLoading: boolean) => void
  ): Promise<void> {
    try {
      onLoading?.(true);

      const result = await this.purchaseProduct(productId);
      
      if (result.success && result.customerInfo) {
        onSuccess?.(result.customerInfo);
      } else if (result.error) {
        onError?.(result.error);
      }
    } catch (error: any) {
      onError?.({
        message: error.message || 'Purchase failed',
        code: error.code || 'UNKNOWN_ERROR'
      });
    } finally {
      onLoading?.(false);
    }
  }
}

export const purchasesService = PurchasesService.getInstance();
export default purchasesService;