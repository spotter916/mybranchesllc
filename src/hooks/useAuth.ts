import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useState, useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import { App, URLOpenListenerEvent } from "@capacitor/app";
import { mobileAuthService } from "@/lib/mobileAuth";
import { queryClient } from "@/lib/queryClient";

interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  profileImageUrl?: string;
  phone?: string;
  birthday?: string;
  householdId?: string;
  showBirthday?: boolean;
  showPhone?: boolean;
  emailNotifications?: boolean;
}

export function useAuth() {
  const [isMobileReady, setIsMobileReady] = useState(!Capacitor.isNativePlatform());
  const isMobile = Capacitor.isNativePlatform();

  // Mobile authentication query - uses tokens
  const mobileAuthQuery = useQuery<User>({
    queryKey: ["/api/mobile/user"],
    enabled: isMobile && isMobileReady,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 0,
    queryFn: async () => {
      const token = await mobileAuthService.getAccessToken();
      if (!token) {
        throw new Error('No access token available');
      }
      
      const response = await fetch('/api/mobile/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }
      
      return response.json();
    },
  });

  // Web authentication query - uses cookies
  const webAuthQuery = useQuery<User>({
    queryKey: ["/api/auth/user"],
    enabled: !isMobile,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  // Mobile login mutation
  const mobileLoginMutation = useMutation({
    mutationFn: async () => {
      if (!isMobile) {
        throw new Error('Mobile login called on non-mobile platform');
      }
      await mobileAuthService.login();
    },
    onError: (error) => {
      console.error('Mobile login failed:', error);
    },
  });

  // Mobile logout mutation
  const mobileLogoutMutation = useMutation({
    mutationFn: async () => {
      if (!isMobile) {
        throw new Error('Mobile logout called on non-mobile platform');
      }
      await mobileAuthService.logout();
      await queryClient.clear();
    },
  });

  // Handle deep link authentication callback
  const handleDeepLink = useCallback(async (event: URLOpenListenerEvent) => {
    const url = event.url;
    console.log('Deep link received:', url);
    
    if (url.includes('mybranches://auth/callback') || url.includes('/auth/callback')) {
      try {
        console.log('Handling auth callback...');
        const tokens = await mobileAuthService.handleAuthCallback(url);
        if (tokens) {
          console.log('Authentication successful');
          // Refetch user data after successful authentication
          await queryClient.invalidateQueries({ queryKey: ["/api/mobile/user"] });
        }
      } catch (error) {
        console.error('Failed to handle auth callback:', error);
      }
    }
  }, []);

  // Initialize mobile authentication and deep link handling
  useEffect(() => {
    if (!isMobile) {
      return;
    }

    const initializeMobile = async () => {
      try {
        // Check if user is already authenticated
        const isAuthenticated = await mobileAuthService.isAuthenticated();
        console.log('Mobile auth check - authenticated:', isAuthenticated);
        
        // Set up deep link listener
        const listener = await App.addListener('appUrlOpen', handleDeepLink);
        
        // Mark mobile as ready
        setIsMobileReady(true);
        
        return () => {
          listener.remove();
        };
      } catch (error) {
        console.error('Failed to initialize mobile auth:', error);
        setIsMobileReady(true); // Set ready even on error to avoid infinite loading
      }
    };

    initializeMobile();
  }, [isMobile, handleDeepLink]);

  // Web login function (redirect to /api/login)
  const webLogin = useCallback(() => {
    window.location.href = '/api/login';
  }, []);

  // Web logout function (redirect to /api/logout)
  const webLogout = useCallback(() => {
    window.location.href = '/api/logout';
  }, []);

  // Unified login function
  const login = useCallback(async () => {
    if (isMobile) {
      await mobileLoginMutation.mutateAsync();
    } else {
      webLogin();
    }
  }, [isMobile, mobileLoginMutation, webLogin]);

  // Unified logout function
  const logout = useCallback(async () => {
    if (isMobile) {
      await mobileLogoutMutation.mutateAsync();
    } else {
      webLogout();
    }
  }, [isMobile, mobileLogoutMutation, webLogout]);

  // Choose the appropriate query based on platform
  const currentQuery = isMobile ? mobileAuthQuery : webAuthQuery;
  
  // Unified refresh function
  const refreshUser = useCallback(async () => {
    await currentQuery.refetch();
  }, [currentQuery]);

  return {
    user: currentQuery.data,
    isLoading: currentQuery.isLoading || (isMobile && !isMobileReady),
    isAuthenticated: !!currentQuery.data,
    refreshUser,
    login,
    logout,
    isMobile,
    isLoginPending: mobileLoginMutation.isPending,
    isLogoutPending: mobileLogoutMutation.isPending,
  };
}
