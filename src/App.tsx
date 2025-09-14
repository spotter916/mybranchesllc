import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import MobileBottomNav from "@/components/MobileBottomNav";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Contacts from "@/pages/Contacts";
import Groups from "@/pages/Groups";
import Events from "@/pages/Events";
import Chat from "@/pages/Chat";
import Profile from "@/pages/Profile";
import Pricing from "@/pages/Pricing";
import JoinHousehold from "@/pages/JoinHousehold";
import Search from "@/pages/Search";
import Household from "@/pages/Household";
import Layout from "@/components/Layout";
import GroupSettings from "@/pages/GroupSettings";
import HouseholdDetail from "@/pages/HouseholdDetail";
import InviteAccept from "@/pages/InviteAccept";
import MailingLabels from "@/pages/MailingLabels";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Initialize push notifications for authenticated users
  usePushNotifications();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Routes accessible to everyone */}
      <Route path="/invite/:token" component={InviteAccept} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms-of-service" component={TermsOfService} />
      
      {!isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <Layout>
          <Route path="/" component={Dashboard} />
          <Route path="/household" component={Household} />
          <Route path="/contacts" component={Contacts} />
          <Route path="/groups" component={Groups} />
          <Route path="/groups/:groupId/settings" component={GroupSettings} />
          <Route path="/groups/:groupId/labels" component={MailingLabels} />
          <Route path="/household/:id" component={HouseholdDetail} />
          <Route path="/events" component={Events} />
          <Route path="/chat" component={Chat} />
          <Route path="/chat/:groupId" component={Chat} />
          <Route path="/profile" component={Profile} />
          <Route path="/pricing" component={Pricing} />
          <Route path="/join-household" component={JoinHousehold} />
          <Route path="/search" component={Search} />
          <MobileBottomNav />
        </Layout>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <PWAInstallPrompt />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
