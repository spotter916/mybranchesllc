import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mybranches.app',
  appName: 'My Branches',
  webDir: 'dist/public',
  server: {
    // Enable CORS for capacitor://localhost
    androidScheme: 'https',
    // For development - points to the local Vite dev server
    url: process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : undefined,
    cleartext: process.env.NODE_ENV === 'development',
    allowNavigation: [
      '*.replit.dev',
      'capacitor://localhost',
      'http://localhost:*',
      'https://localhost:*',
    ]
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#7c3aed",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "dark",
      backgroundColor: "#7c3aed",
    },
    App: {
      launchUrl: undefined,
      // Handle deep links for authentication
      urlScheme: 'mybranches',
      urlHostname: 'auth',
    },
    Keyboard: {
      resize: "body",
      style: "dark",
      resizeOnFullScreen: true,
    },
    PurchasesPlugin: {
      // RevenueCat configuration will be handled in the service
    }
  },
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true,
    backgroundColor: '#7c3aed',
  },
  android: {
    backgroundColor: '#7c3aed',
    webContentsDebuggingEnabled: process.env.NODE_ENV === 'development',
    allowMixedContent: process.env.NODE_ENV === 'development',
  }
};

export default config;