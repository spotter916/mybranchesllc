import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Home, Users, Calendar, MessageCircle, User, LogOut, Building2, Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useOnboarding } from "@/hooks/useOnboarding";
import { cn } from "@/lib/utils";
import OnboardingTour from "@/components/OnboardingTour";

import app_icon_1024 from "@assets/app icon 1024.png";

interface LayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Household", href: "/household", icon: Building2 },
  { name: "Contacts", href: "/contacts", icon: Users },
  { name: "Groups", href: "/groups", icon: Users },
  { name: "Search", href: "/search", icon: Search },
  { name: "Events", href: "/events", icon: Calendar },
  { name: "Chat", href: "/chat", icon: MessageCircle },
  { name: "Profile", href: "/profile", icon: User },
];

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();
  const { user } = useAuth() as {
    user?: {
      id: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      profileImageUrl?: string;
      updatedAt?: string;
    };
  };
  const { showTour, completeTour } = useOnboarding();

  // Fetch current user's household information
  const { data: household } = useQuery<{
    id: string;
    name: string;
  }>({
    queryKey: ['/api/households/current'],
    enabled: !!user?.id,
  });

  const NavItems = ({ mobile = false }: { mobile?: boolean }) => (
    <nav className="space-y-1">
      {navigation.map((item) => {
        const isActive = location === item.href;
        const Icon = item.icon;
        
        return (
          <Link 
            key={item.name} 
            href={item.href}
            className={cn(
              "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted",
              mobile && "justify-start"
            )}
            onClick={() => mobile && setSidebarOpen(false)}
            data-testid={`nav-${item.name.toLowerCase()}`}
          >
            <Icon className="h-5 w-5 mr-3" />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <header className="lg:hidden bg-card border-b border-border p-4 print:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img src={app_icon_1024} alt="My Branches" className="w-8 h-8" />
            <h1 className="text-xl font-bold text-foreground" data-testid="text-mobile-title">
              My Branches
            </h1>
          </div>
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" data-testid="button-mobile-menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-8">
                  <img src={app_icon_1024} alt="My Branches" className="w-10 h-10" />
                  <h1 className="text-2xl font-bold text-foreground" data-testid="text-sidebar-title">
                    My Branches
                  </h1>
                </div>
                
                {/* User Profile Section */}
                <div className="mb-8">
                  <div className="flex items-center space-x-3 mb-4">
                    <img
                      key={user?.profileImageUrl || 'default'}
                      src={user?.profileImageUrl ? `${user.profileImageUrl}?t=${Date.now()}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.firstName || 'U')}+${encodeURIComponent(user?.lastName || 'ser')}&background=6366f1&color=white&size=40`}
                      alt="Profile"
                      className="w-10 h-10 rounded-full bg-gray-200"
                      data-testid="img-mobile-profile"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `data:image/svg+xml;base64,${btoa(`<svg width="40" height="40" xmlns="http://www.w3.org/2000/svg"><rect width="40" height="40" fill="#6366f1"/><text x="50%" y="50%" text-anchor="middle" dy="0.3em" fill="white" font-family="Arial" font-size="16">${(user?.firstName?.[0] || 'U').toUpperCase()}${(user?.lastName?.[0] || '').toUpperCase()}</text></svg>`)}`
                      }}
                    />
                    <div>
                      <p className="font-medium text-foreground" data-testid="text-mobile-user-name">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground" data-testid="text-mobile-household">
                        {household?.name || "No Household"}
                      </p>
                    </div>
                  </div>
                </div>

                <NavItems mobile />

                <div className="mt-8 pt-4 border-t border-border">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-muted-foreground hover:text-foreground"
                    onClick={() => window.location.href = '/api/logout'}
                    data-testid="button-mobile-logout"
                  >
                    <LogOut className="h-5 w-5 mr-3" />
                    Log Out
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>
      <div className="flex">
        {/* Desktop Sidebar */}
        <nav className="hidden lg:block w-64 bg-card border-r border-border min-h-screen print:hidden" data-testid="sidebar-desktop">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-8">
              <img src={app_icon_1024} alt="My Branches" className="w-10 h-10" />
              <h1 className="text-2xl font-bold text-foreground" data-testid="text-desktop-title">
                My Branches
              </h1>
            </div>
            
            {/* User Profile Section */}
            <div className="mb-8">
              <div className="flex items-center space-x-3 mb-4">
                <img
                  key={user?.profileImageUrl || 'default'}
                  src={user?.profileImageUrl ? `${user.profileImageUrl}?t=${Date.now()}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.firstName || 'U')}+${encodeURIComponent(user?.lastName || 'ser')}&background=6366f1&color=white&size=40`}
                  alt="Profile"
                  className="w-10 h-10 rounded-full bg-gray-200"
                  data-testid="img-desktop-profile"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `data:image/svg+xml;base64,${btoa(`<svg width="40" height="40" xmlns="http://www.w3.org/2000/svg"><rect width="40" height="40" fill="#6366f1"/><text x="50%" y="50%" text-anchor="middle" dy="0.3em" fill="white" font-family="Arial" font-size="16">${(user?.firstName?.[0] || 'U').toUpperCase()}${(user?.lastName?.[0] || '').toUpperCase()}</text></svg>`)}`
                  }}
                />
                <div>
                  <p className="font-medium text-foreground" data-testid="text-desktop-user-name">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground" data-testid="text-desktop-household">
                    {household?.name || "No Household"}
                  </p>
                </div>
              </div>
            </div>

            <NavItems />

            <div className="mt-8 pt-4 border-t border-border">
              <Button
                variant="ghost"
                className="w-full justify-start text-muted-foreground hover:text-foreground"
                onClick={() => window.location.href = '/api/logout'}
                data-testid="button-desktop-logout"
              >
                <LogOut className="h-5 w-5 mr-3" />
                Log Out
              </Button>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8 pb-20 lg:pb-8 print:p-0 print:w-full" data-testid="main-content">
          {children}
        </main>
      </div>
      {/* Onboarding Tour */}
      <OnboardingTour isOpen={showTour} onClose={completeTour} />
    </div>
  );
}
