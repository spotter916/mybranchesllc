import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, ArrowRight, ArrowLeft, Home, Users, Calendar, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface TourStep {
  id: string;
  title: string;
  description: string;
  target: string;
  icon: React.ComponentType<{ className?: string }>;
  position: 'top' | 'bottom' | 'left' | 'right';
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to My Branches!',
    description: 'Let\'s take a quick tour to show you how to keep your family connected and organized.',
    target: 'main-content',
    icon: Home,
    position: 'bottom'
  },
  {
    id: 'dashboard',
    title: 'Your Dashboard',
    description: 'See your family activity, upcoming events, and important notifications all in one place.',
    target: 'main-content',
    icon: Home,
    position: 'bottom'
  },
  {
    id: 'navigation',
    title: 'Easy Navigation',
    description: 'Use the sidebar to quickly access different sections of the app.',
    target: 'sidebar-desktop',
    icon: Users,
    position: 'right'
  },
  {
    id: 'groups',
    title: 'Family Groups',
    description: 'Create or join family groups to organize different branches of your family tree.',
    target: 'nav-groups',
    icon: Users,
    position: 'right'
  },
  {
    id: 'events',
    title: 'Plan Events Together',
    description: 'Organize family gatherings, birthdays, and special occasions with collaborative planning.',
    target: 'nav-events',
    icon: Calendar,
    position: 'right'
  },
  {
    id: 'chat',
    title: 'Stay Connected',
    description: 'Chat with your family groups in real-time to coordinate and share updates.',
    target: 'nav-chat',
    icon: MessageCircle,
    position: 'right'
  },
  {
    id: 'profile',
    title: 'Your Profile',
    description: 'Manage your personal information and privacy settings.',
    target: 'nav-profile',
    icon: User,
    position: 'right'
  }
];

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OnboardingTour({ isOpen, onClose }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      highlightCurrentStep();
    } else {
      removeHighlight();
    }
    
    return () => removeHighlight();
  }, [isOpen, currentStep]);

  const highlightCurrentStep = () => {
    removeHighlight();
    
    const step = tourSteps[currentStep];
    const element = document.querySelector(`[data-testid="${step.target}"]`) as HTMLElement;
    
    if (element) {
      setHighlightedElement(element);
      element.classList.add('tour-highlight');
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Position tour card relative to highlighted element
      positionTourCard(element);
    }
  };

  const positionTourCard = (element: HTMLElement) => {
    const tourCard = document.querySelector('.tour-card') as HTMLElement;
    if (!tourCard) return;

    const rect = element.getBoundingClientRect();
    const step = tourSteps[currentStep];
    
    // Calculate position based on step configuration
    let top = 0;
    let left = 0;

    switch (step.position) {
      case 'top':
        top = rect.top - tourCard.offsetHeight - 20;
        left = rect.left + (rect.width - tourCard.offsetWidth) / 2;
        break;
      case 'bottom':
        top = rect.bottom + 20;
        left = rect.left + (rect.width - tourCard.offsetWidth) / 2;
        break;
      case 'left':
        top = rect.top + (rect.height - tourCard.offsetHeight) / 2;
        left = rect.left - tourCard.offsetWidth - 20;
        break;
      case 'right':
        top = rect.top + (rect.height - tourCard.offsetHeight) / 2;
        left = rect.right + 20;
        break;
    }

    // Keep within viewport bounds
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    if (left < 10) left = 10;
    if (left + tourCard.offsetWidth > viewportWidth - 10) {
      left = viewportWidth - tourCard.offsetWidth - 10;
    }
    if (top < 10) top = 10;
    if (top + tourCard.offsetHeight > viewportHeight - 10) {
      top = viewportHeight - tourCard.offsetHeight - 10;
    }

    tourCard.style.top = `${top}px`;
    tourCard.style.left = `${left}px`;
  };

  const removeHighlight = () => {
    if (highlightedElement) {
      highlightedElement.classList.remove('tour-highlight');
    }
    setHighlightedElement(null);
  };

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      finishTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const finishTour = () => {
    removeHighlight();
    onClose();
  };

  const skipTour = () => {
    removeHighlight();
    onClose();
  };

  if (!isOpen) return null;

  const currentTourStep = tourSteps[currentStep];
  const StepIcon = currentTourStep.icon;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-[100]" />
      
      {/* Tour Card */}
      <div className="tour-card fixed z-[101] max-w-sm">
        <Card className="shadow-2xl border-2 border-primary">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-primary/10 rounded-full">
                  <StepIcon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">{currentTourStep.title}</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={skipTour}
                data-testid="button-skip-tour"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{currentTourStep.description}</p>
            
            {/* Progress */}
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
                />
              </div>
              <span className="text-sm text-muted-foreground">
                {currentStep + 1} / {tourSteps.length}
              </span>
            </div>
            
            {/* Navigation */}
            <div className="flex justify-between items-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={prevStep}
                disabled={currentStep === 0}
                data-testid="button-tour-prev"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={skipTour}
                  data-testid="button-tour-skip"
                >
                  Skip Tour
                </Button>
                <Button
                  size="sm"
                  onClick={nextStep}
                  data-testid="button-tour-next"
                >
                  {currentStep === tourSteps.length - 1 ? 'Finish' : 'Next'}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}