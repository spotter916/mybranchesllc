import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, UserPlus, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import GroupCard from "@/components/GroupCard";
import GroupForm from "@/components/forms/GroupForm";
import { useAuth } from "@/hooks/useAuth";
import { hasReachedLimit, getPlanLimits, canUserAccessFeature } from "@shared/subscription-utils";
import { useHouseholdSubscription } from '@/hooks/useHouseholdSubscription';
import UpgradePrompt from "@/components/UpgradePrompt";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Groups() {
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth() as {
    user?: {
      subscriptionPlan?: string;
    };
  };
  const { hasPremium, canAccessFeature } = useHouseholdSubscription();

  const syncSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/sync-subscription');
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorData}`);
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Subscription Updated",
        description: data.message,
      });
      // Invalidate all subscription-related queries
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/household/subscription'] });
    },
    onError: (error: any) => {
      console.error('Sync subscription error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to sync subscription status",
        variant: "destructive",
      });
    },
  });

  const manualUpgradeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/manual-premium-upgrade');
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorData}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return response.json();
      } else {
        // If not JSON, assume it's a successful text response
        const text = await response.text();
        return { message: "Successfully upgraded to Premium!", subscriptionPlan: "premium" };
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Upgrade Complete! 🎉",
        description: data.message,
      });
      // Invalidate all subscription-related queries
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/household/subscription'] });
    },
    onError: (error: any) => {
      console.error('Manual upgrade error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to upgrade subscription",
        variant: "destructive",
      });
    },
  });

  const { data: groups, isLoading } = useQuery<Array<{ 
    id: string; 
    name: string; 
    description: string;
    memberCount: number;
    messageCount: number;
    createdAt: string;
  }>>({
    queryKey: ['/api/groups'],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground" data-testid="text-groups-title">
          Family Groups
        </h1>
        <div className="flex gap-2">
          {!hasPremium && (
            <>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => syncSubscriptionMutation.mutate()}
                disabled={syncSubscriptionMutation.isPending}
                data-testid="button-sync-subscription"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${syncSubscriptionMutation.isPending ? 'animate-spin' : ''}`} />
                Sync Status
              </Button>
              <Button 
                variant="default" 
                size="sm"
                onClick={() => manualUpgradeMutation.mutate()}
                disabled={manualUpgradeMutation.isPending}
                data-testid="button-manual-upgrade"
              >
                ✨ Activate Premium
              </Button>
            </>
          )}
          <Button 
            variant="secondary" 
            onClick={() => setShowJoinDialog(true)}
            data-testid="button-join-group"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Join Group
          </Button>
          <Button 
            onClick={() => {
              const canCreate = canAccessFeature('canUseAdvancedFeatures');
              if (canCreate) {
                setShowGroupForm(true);
              }
            }}
            data-testid="button-create-group"
            disabled={!canAccessFeature('canUseAdvancedFeatures')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Group
          </Button>
        </div>
      </div>

      {/* Groups Grid or Upgrade Prompt */}
      {(() => {
        const currentGroupCount = groups?.length || 0;
        
        if (!hasPremium && !canAccessFeature('canUseAdvancedFeatures')) {
          return (
            <div className="space-y-6">
              <UpgradePrompt
                feature="Create Groups"
                description="Upgrade to Premium to create and organize family groups. Basic users can join groups when invited."
              />
              {groups && groups.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groups.map((group) => (
                    <GroupCard 
                      key={group.id} 
                      group={group}
                      data-testid={`group-card-${group.id}`}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        }

        return groups && groups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <GroupCard 
                key={group.id} 
                group={group}
                data-testid={`group-card-${group.id}`}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2" data-testid="text-no-groups-title">
                No groups yet
              </h3>
              <p className="text-muted-foreground mb-4" data-testid="text-no-groups-description">
                Create your first family group or join an existing one to get started
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button 
                  onClick={() => setShowGroupForm(true)}
                  data-testid="button-create-first-group"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Group
                </Button>
                <Button 
                  variant="secondary"
                  onClick={() => setShowJoinDialog(true)}
                  data-testid="button-join-first-group"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Join Group
                </Button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Create Group Dialog */}
      <Dialog open={showGroupForm} onOpenChange={setShowGroupForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle data-testid="text-create-group-title">Create New Group</DialogTitle>
          </DialogHeader>
          <GroupForm
            onSave={() => setShowGroupForm(false)}
            onCancel={() => setShowGroupForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Join Group Dialog */}
      <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle data-testid="text-join-group-title">Join Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground" data-testid="text-join-group-description">
              Ask a family member to invite you to their group, or share a group invitation link.
            </p>
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                onClick={() => setShowJoinDialog(false)}
                data-testid="button-join-group-close"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
