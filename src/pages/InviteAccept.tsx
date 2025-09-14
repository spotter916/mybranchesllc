import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, Clock, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";

export default function InviteAccept() {
  const { token } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [acceptanceStatus, setAcceptanceStatus] = useState<'pending' | 'accepted' | 'error'>('pending');

  // Fetch invitation details
  const { data: invitation, isLoading, error } = useQuery({
    queryKey: [`/api/invitations/${token}`],
    enabled: !!token,
    retry: false,
  });

  // Accept invitation mutation
  const acceptMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/invitations/${token}/accept`);
      return response.json();
    },
    onSuccess: () => {
      setAcceptanceStatus('accepted');
      toast({
        title: "Welcome to My Branches!",
        description: "You've successfully joined the app. You can now create or join households.",
      });
      // Redirect to dashboard after a delay
      setTimeout(() => {
        navigate('/');
      }, 3000);
    },
    onError: (error: any) => {
      setAcceptanceStatus('error');
      toast({
        title: "Error accepting invitation",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    // Auto-accept if user is logged in and invitation is valid
    if (!authLoading && user && invitation && acceptanceStatus === 'pending') {
      acceptMutation.mutate();
    }
  }, [authLoading, user, invitation, acceptanceStatus]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-8 h-8 text-primary" />
            </div>
            <CardTitle>Join My Branches</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {invitation ? (
              <>
                <p className="text-muted-foreground">
                  {invitation.firstName} {invitation.lastName} has invited you to join My Branches!
                </p>
                {invitation.message && (
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-sm italic">"{invitation.message}"</p>
                  </div>
                )}
                <Button asChild className="w-full">
                  <a href="/api/login">Sign In to Accept Invitation</a>
                </Button>
                <p className="text-xs text-muted-foreground">
                  Don't have an account? Signing in will create one for you.
                </p>
              </>
            ) : isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
                <span className="ml-2">Loading invitation...</span>
              </div>
            ) : (
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-2" />
                <p className="text-destructive">This invitation is invalid or has expired.</p>
                <Button asChild className="mt-4">
                  <a href="/">Go to My Branches</a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            {acceptanceStatus === 'accepted' ? (
              <CheckCircle className="w-8 h-8 text-green-600" />
            ) : acceptanceStatus === 'error' ? (
              <AlertCircle className="w-8 h-8 text-destructive" />
            ) : (
              <Clock className="w-8 h-8 text-primary" />
            )}
          </div>
          <CardTitle>
            {acceptanceStatus === 'accepted' ? "Welcome!" :
             acceptanceStatus === 'error' ? "Error" :
             "Processing Invitation..."}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {acceptanceStatus === 'accepted' ? (
            <>
              <p className="text-muted-foreground">
                You've successfully joined My Branches! Redirecting you to the dashboard...
              </p>
              <div className="animate-pulse text-sm text-muted-foreground">
                Welcome to the family collaboration platform!
              </div>
            </>
          ) : acceptanceStatus === 'error' ? (
            <>
              <p className="text-destructive">
                There was an error processing your invitation.
              </p>
              <Button onClick={() => navigate('/')} className="w-full">
                Go to Dashboard
              </Button>
            </>
          ) : (
            <>
              <p className="text-muted-foreground">
                Processing your invitation to join My Branches...
              </p>
              <div className="flex items-center justify-center">
                <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}