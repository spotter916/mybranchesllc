import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { Capacitor } from '@capacitor/core';

// Firebase configuration - these values should be set in environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Check if Firebase configuration is complete
const isFirebaseConfigured = () => {
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  const missingFields = requiredFields.filter(field => !firebaseConfig[field as keyof typeof firebaseConfig]);
  
  if (missingFields.length > 0) {
    console.warn('Firebase configuration incomplete. Missing environment variables:', 
      missingFields.map(field => `VITE_FIREBASE_${field.replace(/([A-Z])/g, '_$1').toUpperCase()}`).join(', ')
    );
    return false;
  }
  return true;
};

// Initialize Firebase only if properly configured
let app: any = null;
if (isFirebaseConfigured()) {
  try {
    app = initializeApp(firebaseConfig);
    console.log('Firebase app initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase app:', error);
  }
} else {
  console.log('Firebase not initialized due to missing configuration');
}

// Initialize Firebase Cloud Messaging (only for web platform)
let messaging: any = null;

if (!Capacitor.isNativePlatform() && app) {
  // Only initialize messaging for web platform when Firebase is properly configured
  const initializeMessaging = async () => {
    try {
      const supported = await isSupported();
      if (supported) {
        messaging = getMessaging(app);
        console.log('Firebase Messaging initialized for web platform');
        
        // Send Firebase config to service worker
        await sendConfigToServiceWorker();
        
      } else {
        console.log('Firebase Messaging not supported in this browser');
      }
    } catch (error) {
      console.error('Error initializing Firebase Messaging:', error);
    }
  };
  
  initializeMessaging();
} else if (!Capacitor.isNativePlatform()) {
  console.log('Firebase Messaging not initialized: Firebase app not configured');
}

// Get FCM token for web platform
export const getFirebaseToken = async (): Promise<string | null> => {
  if (Capacitor.isNativePlatform()) {
    // For native platforms, token registration is handled by Capacitor
    return null;
  }

  if (!messaging) {
    console.log('Firebase Messaging not available');
    return null;
  }

  try {
    // Get the VAPID key from environment variables
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.error('VAPID key not configured');
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey: vapidKey,
    });

    if (token) {
      console.log('FCM token received:', token.substring(0, 50) + '...');
      return token;
    } else {
      console.log('No registration token available');
      return null;
    }
  } catch (error) {
    console.error('An error occurred while retrieving token:', error);
    return null;
  }
};

// Listen for foreground messages (web platform only)
export const onForegroundMessage = (callback: (payload: any) => void) => {
  if (!messaging || Capacitor.isNativePlatform()) {
    return () => {}; // Return empty cleanup function
  }

  return onMessage(messaging, (payload) => {
    console.log('Foreground message received:', payload);
    callback(payload);
  });
};

// Send Firebase config to service worker
const sendConfigToServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      // Get the service worker registration
      const registration = await navigator.serviceWorker.ready;
      
      if (registration.active) {
        // Send Firebase config to service worker
        registration.active.postMessage({
          type: 'FIREBASE_CONFIG',
          config: firebaseConfig
        });
        
        console.log('Firebase config sent to service worker');
      } else {
        console.warn('Service worker not active, config not sent');
      }
    } catch (error) {
      console.error('Error sending config to service worker:', error);
    }
  }
};

export { app, sendConfigToServiceWorker };