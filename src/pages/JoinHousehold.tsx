import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

export default function JoinHousehold() {
  const [inviteCode, setInviteCode] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const joinHouseholdMutation = useMutation({
    mutationFn: async (code: string) => {
      // Parse the invitation code to get household ID
      const parts = code.split('-');
      if (parts.length < 2) {
        throw new Error("Invalid invitation code format");
      }
      
      const householdId = parts[0];
      
      // Create a join request for the household
      const response = await apiRequest('POST', '/api/join-requests', {
        type: 'household',
        targetId: householdId,
        message: `Joining with invitation code: ${code}`,
      });
      
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Join Request Sent",
        description: "Your request to join the household has been sent. You'll be notified when it's approved.",
      });
      setInviteCode("");
      queryClient.invalidateQueries({ queryKey: ['/api/households/mine'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to join household. Please check your invitation code.",
        variant: "destructive",
      });
    },
  });

  const handleJoinHousehold = () => {
    if (!inviteCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter an invitation code",
        variant: "destructive",
      });
      return;
    }
    joinHouseholdMutation.mutate(inviteCode.trim());
  };

  return (
    <div className="max-w-md mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-join-title">
          Join a Household
        </h1>
        <p className="text-muted-foreground">
          Enter the invitation code you received to join a family household
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Home className="h-5 w-5 mr-2" />
            Household Invitation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="invite-code">Invitation Code</Label>
            <Input
              id="invite-code"
              placeholder="Enter invitation code..."
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              data-testid="input-invitation-code"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleJoinHousehold();
                }
              }}
            />
            <p className="text-sm text-muted-foreground mt-2">
              The invitation code should look like: household-id-timestamp
            </p>
          </div>

          <Button
            onClick={handleJoinHousehold}
            disabled={joinHouseholdMutation.isPending || !inviteCode.trim()}
            className="w-full"
            data-testid="button-join-household"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            {joinHouseholdMutation.isPending ? "Joining..." : "Join Household"}
          </Button>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an invitation code?{" "}
              <span className="text-primary font-medium">
                Ask a household member to send you one from their profile page.
              </span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}