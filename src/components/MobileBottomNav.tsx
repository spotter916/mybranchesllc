import { Link, useLocation } from "wouter";
import { Home, Users, Calendar, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const navigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Groups", href: "/groups", icon: Users },
  { name: "Events", href: "/events", icon: Calendar },
  { name: "Chat", href: "/chat", icon: MessageCircle },
  { name: "Profile", href: "/profile", icon: User },
];

export default function MobileBottomNav() {
  const [location] = useLocation();
  const isMobile = useIsMobile();

  // Only show on mobile
  if (!isMobile) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40 lg:hidden">
      <div className="grid grid-cols-5 h-16">
        {navigation.map((item) => {
          const isActive = location === item.href || (item.href === "/" && location === "/");
          const Icon = item.icon;
          
          return (
            <Link key={item.name} href={item.href}>
              <a
                className={cn(
                  "flex flex-col items-center justify-center h-full px-2 py-1 text-xs font-medium transition-colors",
                  isActive
                    ? "text-primary bg-primary/5"
                    : "text-muted-foreground hover:text-foreground"
                )}
                data-testid={`mobile-nav-${item.name.toLowerCase()}`}
              >
                <Icon className={cn("h-5 w-5 mb-1", isActive && "text-primary")} />
                <span className="truncate">{item.name}</span>
              </a>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}