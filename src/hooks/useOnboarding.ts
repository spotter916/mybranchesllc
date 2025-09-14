import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

export function useOnboarding() {
  const { user } = useAuth() as { user?: { id: string } };
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    if (user) {
      // Check if user has completed onboarding
      const hasCompletedOnboarding = localStorage.getItem(`onboarding-completed-${user.id}`);
      
      if (!hasCompletedOnboarding) {
        // Small delay to ensure DOM is ready
        const timer = setTimeout(() => {
          setShowTour(true);
        }, 1000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [user]);

  const completeTour = () => {
    if (user) {
      localStorage.setItem(`onboarding-completed-${user.id}`, 'true');
    }
    setShowTour(false);
  };

  const startTour = () => {
    setShowTour(true);
  };

  return {
    showTour,
    completeTour,
    startTour,
  };
}