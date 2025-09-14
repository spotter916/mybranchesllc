import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { SecureStoragePlugin } from '@evva/capacitor-secure-storage-plugin';

/**
 * Mobile Authentication Service
 * Handles OIDC + PKCE flow for mobile app authentication
 */

interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresAt: number;
  userInfo?: any;
  nonce?: string;
  audience?: string;
  issuer?: string;
}

interface PKCECodes {
  codeVerifier: string;
  codeChallenge: string;
  state: string;
  nonce: string;
}

class MobileAuthService {
  private static readonly STORAGE_KEY = 'auth_tokens';
  private static readonly PKCE_KEY = 'pkce_codes';
  
  // OIDC configuration - matches server configuration
  private readonly issuerUrl = import.meta.env.VITE_ISSUER_URL || 'https://replit.com/oidc';
  private readonly clientId = import.meta.env.VITE_REPL_ID;
  private readonly redirectUri = 'mybranches://auth/callback';
  private readonly scope = 'openid email profile offline_access';
  private readonly expectedAudience = import.meta.env.VITE_REPL_ID;
  private readonly expectedIssuer = import.meta.env.VITE_ISSUER_URL || 'https://replit.com/oidc';

  /**
   * Check if running on mobile platform
   */
  isMobile(): boolean {
    return Capacitor.isNativePlatform();
  }

  /**
   * Generate PKCE code challenge and verifier
   */
  private async generatePKCE(): Promise<PKCECodes> {
    // Generate random code verifier (43-128 characters)
    const codeVerifier = this.base64URLEncode(crypto.getRandomValues(new Uint8Array(32)));
    
    // Create code challenge using SHA256
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    const codeChallenge = this.base64URLEncode(new Uint8Array(digest));
    
    // Generate state parameter
    const state = this.base64URLEncode(crypto.getRandomValues(new Uint8Array(16)));
    
    // Generate nonce for OIDC security
    const nonce = this.base64URLEncode(crypto.getRandomValues(new Uint8Array(16)));
    
    return {
      codeVerifier,
      codeChallenge,
      state,
      nonce
    };
  }

  /**
   * Base64 URL encode without padding
   */
  private base64URLEncode(array: Uint8Array): string {
    return btoa(String.fromCharCode(...array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Store PKCE codes temporarily using secure storage
   */
  private async storePKCECodes(codes: PKCECodes): Promise<void> {
    try {
      await SecureStoragePlugin.set({
        key: MobileAuthService.PKCE_KEY,
        value: JSON.stringify(codes)
      });
    } catch (error) {
      console.error('Failed to store PKCE codes securely:', error);
      throw new Error('Failed to store authentication codes securely');
    }
  }

  /**
   * Retrieve and clear PKCE codes from secure storage
   */
  private async getPKCECodes(): Promise<PKCECodes | null> {
    try {
      const { value } = await SecureStoragePlugin.get({ key: MobileAuthService.PKCE_KEY });
      if (!value) return null;

      // Clear codes after retrieval (single use)
      await SecureStoragePlugin.remove({ key: MobileAuthService.PKCE_KEY });
      
      return JSON.parse(value);
    } catch (error) {
      console.error('Failed to retrieve PKCE codes:', error);
      return null;
    }
  }

  /**
   * Discover OIDC endpoints
   */
  private async discoverEndpoints() {
    try {
      const response = await fetch(`${this.issuerUrl}/.well-known/openid_configuration`);
      return await response.json();
    } catch (error) {
      console.error('Failed to discover OIDC endpoints:', error);
      throw new Error('Failed to discover OIDC configuration');
    }
  }

  /**
   * Initialize mobile authentication flow
   */
  async login(): Promise<void> {
    if (!this.isMobile()) {
      throw new Error('Mobile auth service called on non-mobile platform');
    }

    if (!this.clientId) {
      throw new Error('VITE_REPL_ID environment variable not configured');
    }

    try {
      // Generate PKCE codes
      const pkceCodes = await this.generatePKCE();
      await this.storePKCECodes(pkceCodes);

      // Discover OIDC endpoints
      const oidcConfig = await this.discoverEndpoints();

      // Build authorization URL
      const authUrl = new URL(oidcConfig.authorization_endpoint);
      authUrl.searchParams.set('client_id', this.clientId);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', this.scope);
      authUrl.searchParams.set('redirect_uri', this.redirectUri);
      authUrl.searchParams.set('code_challenge', pkceCodes.codeChallenge);
      authUrl.searchParams.set('code_challenge_method', 'S256');
      authUrl.searchParams.set('state', pkceCodes.state);
      authUrl.searchParams.set('nonce', pkceCodes.nonce);
      authUrl.searchParams.set('prompt', 'login consent');

      // Open browser for authentication
      await Browser.open({
        url: authUrl.toString(),
        windowName: '_self',
        presentationStyle: 'popover',
        // Close browser automatically after redirect
        toolbarColor: '#7c3aed'
      });

    } catch (error) {
      console.error('Failed to initiate mobile authentication:', error);
      throw error;
    }
  }

  /**
   * Handle authentication callback from deep link
   */
  async handleAuthCallback(url: string): Promise<AuthTokens | null> {
    try {
      const urlObj = new URL(url);
      const code = urlObj.searchParams.get('code');
      const state = urlObj.searchParams.get('state');
      const error = urlObj.searchParams.get('error');

      if (error) {
        throw new Error(`Authentication error: ${error}`);
      }

      if (!code || !state) {
        throw new Error('Missing authorization code or state parameter');
      }

      // Retrieve and validate PKCE codes
      const pkceCodes = await this.getPKCECodes();
      if (!pkceCodes || pkceCodes.state !== state) {
        throw new Error('Invalid or missing PKCE codes');
      }

      // Exchange code for tokens
      const tokens = await this.exchangeCodeForTokens(code, pkceCodes.codeVerifier, pkceCodes.nonce);
      
      // Validate tokens before storing
      await this.validateTokens(tokens);
      
      // Store tokens securely
      await this.storeTokens(tokens);
      
      // Close the browser
      await Browser.close();

      return tokens;

    } catch (error) {
      console.error('Failed to handle auth callback:', error);
      // Clean up
      await Browser.close();
      await this.clearPKCECodes();
      throw error;
    }
  }

  /**
   * Exchange authorization code for tokens
   */
  private async exchangeCodeForTokens(code: string, codeVerifier: string, nonce: string): Promise<AuthTokens> {
    const oidcConfig = await this.discoverEndpoints();
    
    const tokenRequest = {
      grant_type: 'authorization_code',
      client_id: this.clientId!,
      code,
      redirect_uri: this.redirectUri,
      code_verifier: codeVerifier
    };

    const response = await fetch(oidcConfig.token_endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams(tokenRequest).toString()
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Token exchange failed: ${response.status} ${errorData}`);
    }

    const tokenResponse = await response.json();
    
    // Calculate expiration time
    const expiresAt = Date.now() + (tokenResponse.expires_in * 1000);
    
    // Get user info if we have an access token
    let userInfo = null;
    if (tokenResponse.access_token) {
      try {
        userInfo = await this.getUserInfo(tokenResponse.access_token, oidcConfig.userinfo_endpoint);
      } catch (error) {
        console.warn('Failed to fetch user info:', error);
      }
    }

    return {
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      idToken: tokenResponse.id_token,
      expiresAt,
      userInfo,
      nonce,
      audience: this.expectedAudience,
      issuer: this.expectedIssuer
    };
  }

  /**
   * Get user information from userinfo endpoint
   */
  private async getUserInfo(accessToken: string, userinfoEndpoint: string): Promise<any> {
    const response = await fetch(userinfoEndpoint, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user info: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Store authentication tokens securely using secure storage
   */
  private async storeTokens(tokens: AuthTokens): Promise<void> {
    try {
      await SecureStoragePlugin.set({
        key: MobileAuthService.STORAGE_KEY,
        value: JSON.stringify(tokens)
      });
    } catch (error) {
      console.error('Failed to store tokens securely:', error);
      throw new Error('Failed to store authentication tokens securely');
    }
  }

  /**
   * Retrieve stored authentication tokens from secure storage
   */
  async getStoredTokens(): Promise<AuthTokens | null> {
    try {
      const { value } = await SecureStoragePlugin.get({ key: MobileAuthService.STORAGE_KEY });
      if (!value) return null;

      const tokens: AuthTokens = JSON.parse(value);
      
      // Validate tokens before returning
      try {
        await this.validateTokens(tokens);
      } catch (error) {
        console.error('Stored tokens failed validation:', error);
        await this.clearTokens();
        return null;
      }
      
      // Check if tokens are expired
      if (tokens.expiresAt <= Date.now()) {
        // Try to refresh if we have refresh token
        if (tokens.refreshToken) {
          return await this.refreshTokens(tokens.refreshToken);
        } else {
          // Tokens expired and no refresh token
          await this.clearTokens();
          return null;
        }
      }

      return tokens;
    } catch (error) {
      console.error('Failed to retrieve tokens from secure storage:', error);
      return null;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshTokens(refreshToken: string): Promise<AuthTokens | null> {
    try {
      const oidcConfig = await this.discoverEndpoints();
      
      const refreshRequest = {
        grant_type: 'refresh_token',
        client_id: this.clientId!,
        refresh_token: refreshToken
      };

      const response = await fetch(oidcConfig.token_endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams(refreshRequest).toString()
      });

      if (!response.ok) {
        // Refresh failed, clear tokens
        await this.clearTokens();
        return null;
      }

      const tokenResponse = await response.json();
      const expiresAt = Date.now() + (tokenResponse.expires_in * 1000);
      
      let userInfo = null;
      if (tokenResponse.access_token) {
        try {
          userInfo = await this.getUserInfo(tokenResponse.access_token, oidcConfig.userinfo_endpoint);
        } catch (error) {
          console.warn('Failed to fetch user info during refresh:', error);
        }
      }

      const newTokens: AuthTokens = {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token || refreshToken, // Keep old refresh token if not provided
        idToken: tokenResponse.id_token,
        expiresAt,
        userInfo,
        audience: this.expectedAudience,
        issuer: this.expectedIssuer
      };

      // Validate refreshed tokens
      await this.validateTokens(newTokens);

      await this.storeTokens(newTokens);
      return newTokens;

    } catch (error) {
      console.error('Failed to refresh tokens:', error);
      await this.clearTokens();
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const tokens = await this.getStoredTokens();
    return tokens !== null;
  }

  /**
   * Get current user information
   */
  async getCurrentUser(): Promise<any> {
    const tokens = await this.getStoredTokens();
    return tokens?.userInfo || null;
  }

  /**
   * Logout user - clear local tokens and end session
   */
  async logout(): Promise<void> {
    try {
      const tokens = await this.getStoredTokens();
      
      // Clear local storage first
      await this.clearTokens();
      await this.clearPKCECodes();

      // If we have tokens, try to end the session at the provider
      if (tokens?.idToken) {
        const oidcConfig = await this.discoverEndpoints();
        if (oidcConfig.end_session_endpoint) {
          const logoutUrl = new URL(oidcConfig.end_session_endpoint);
          logoutUrl.searchParams.set('client_id', this.clientId!);
          logoutUrl.searchParams.set('id_token_hint', tokens.idToken);
          logoutUrl.searchParams.set('post_logout_redirect_uri', this.redirectUri);

          // Open logout URL in browser briefly
          await Browser.open({
            url: logoutUrl.toString(),
            windowName: '_self'
          });
          
          // Close browser after a short delay
          setTimeout(() => {
            Browser.close();
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Error during logout:', error);
      // Even if logout fails, ensure local tokens are cleared
      await this.clearTokens();
      await this.clearPKCECodes();
    }
  }

  /**
   * Validate OIDC tokens for security compliance
   */
  private async validateTokens(tokens: AuthTokens): Promise<void> {
    if (!tokens.accessToken) {
      throw new Error('Missing access token');
    }

    // Validate audience if present
    if (tokens.audience && tokens.audience !== this.expectedAudience) {
      throw new Error('Token audience validation failed');
    }

    // Validate issuer if present
    if (tokens.issuer && tokens.issuer !== this.expectedIssuer) {
      throw new Error('Token issuer validation failed');
    }

    // Validate expiry
    if (tokens.expiresAt <= Date.now()) {
      throw new Error('Token has expired');
    }

    // Additional ID token validation if present
    if (tokens.idToken) {
      try {
        const idTokenPayload = this.parseJWTPayload(tokens.idToken);
        
        // Validate audience in ID token
        if (idTokenPayload.aud && idTokenPayload.aud !== this.expectedAudience) {
          throw new Error('ID token audience validation failed');
        }
        
        // Validate issuer in ID token
        if (idTokenPayload.iss && idTokenPayload.iss !== this.expectedIssuer) {
          throw new Error('ID token issuer validation failed');
        }
        
        // Validate nonce if available
        if (tokens.nonce && idTokenPayload.nonce && idTokenPayload.nonce !== tokens.nonce) {
          throw new Error('ID token nonce validation failed');
        }
        
        // Validate ID token expiry
        if (idTokenPayload.exp && idTokenPayload.exp * 1000 <= Date.now()) {
          throw new Error('ID token has expired');
        }
      } catch (error) {
        console.error('ID token validation failed:', error);
        throw new Error('ID token validation failed');
      }
    }
  }

  /**
   * Parse JWT payload without verification (for validation only)
   */
  private parseJWTPayload(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }
      
      const payload = parts[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded);
    } catch (error) {
      throw new Error('Failed to parse JWT payload');
    }
  }

  /**
   * Clear stored tokens from secure storage
   */
  private async clearTokens(): Promise<void> {
    try {
      await SecureStoragePlugin.remove({ key: MobileAuthService.STORAGE_KEY });
    } catch (error) {
      console.error('Failed to clear tokens from secure storage:', error);
      // Continue with logout even if clear fails
    }
  }

  /**
   * Clear PKCE codes from secure storage
   */
  private async clearPKCECodes(): Promise<void> {
    try {
      await SecureStoragePlugin.remove({ key: MobileAuthService.PKCE_KEY });
    } catch (error) {
      console.error('Failed to clear PKCE codes from secure storage:', error);
      // Continue with cleanup even if clear fails
    }
  }

  /**
   * Get access token for API requests
   */
  async getAccessToken(): Promise<string | null> {
    const tokens = await this.getStoredTokens();
    return tokens?.accessToken || null;
  }
}

export const mobileAuthService = new MobileAuthService();
export type { AuthTokens };