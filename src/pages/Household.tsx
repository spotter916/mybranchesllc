import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Building2, UserPlus, Users, Copy, CheckCircle, MapPin, Edit, UserCheck, UserX, Clock, Settings, LogOut, Crown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDistanceToNow } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";

interface Household {
  id: string;
  name: string;
  details?: string;
  ownerId: string;
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  createdAt: Date;
}

interface HouseholdMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImageUrl?: string;
  role: string;
  joinedAt: Date;
}

interface JoinRequest {
  id: string;
  type: string;
  targetId: string;
  requesterId: string;
  status: string;
  message?: string;
  createdAt: string;
  requester: {
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  };
}

const addressSchema = z.object({
  name: z.string().min(1, "Household name is required"),
  details: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
});

export default function Household() {
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth() as { user?: { id: string } };

  const { data: household } = useQuery<Household>({
    queryKey: ['/api/households/mine'],
  });

  const { data: members } = useQuery<HouseholdMember[]>({
    queryKey: [`/api/households/${household?.id}/members`],
    enabled: !!household?.id,
  });

  // Helper function to check if user is household admin (owner or admin role)
  const isCurrentUserHouseholdAdmin = useMemo(() => {
    if (!user?.id || !household || !members) return false;
    const currentUserMember = members.find(m => m.id === user.id);
    return user.id === household.ownerId || currentUserMember?.role === 'admin';
  }, [user?.id, household?.ownerId, members]);

  const { data: joinRequests } = useQuery<JoinRequest[]>({
    queryKey: [`/api/join-requests/household/${household?.id}`],
    enabled: !!household?.id && !!user?.id && isCurrentUserHouseholdAdmin,
  });

  const form = useForm<z.infer<typeof addressSchema>>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      name: household?.name || "",
      details: household?.details || "",
      street: household?.street || "",
      city: household?.city || "",
      state: household?.state || "",
      zipCode: household?.zipCode || "",
      country: household?.country || "United States",
    },
  });

  const generateInviteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/households/invite');
      const data = await response.json();
      return data.inviteCode;
    },
    onSuccess: (code) => {
      setInviteCode(code);
      setShowInviteDialog(true);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate invitation code",
        variant: "destructive",
      });
    },
  });

  const updateHouseholdMutation = useMutation({
    mutationFn: async (data: z.infer<typeof addressSchema>) => {
      const response = await apiRequest('PUT', `/api/households/${household?.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Household information updated successfully",
      });
      setShowEditDialog(false);
      queryClient.invalidateQueries({ queryKey: ['/api/households/mine'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update household information",
        variant: "destructive",
      });
    },
  });

  const handleJoinRequestMutation = useMutation({
    mutationFn: async ({ requestId, action }: { requestId: string; action: 'approve' | 'deny' }) => {
      const response = await apiRequest('PUT', `/api/join-requests/${requestId}/${action}`, {});
      return response.json();
    },
    onSuccess: (_, { action }) => {
      toast({
        title: "Success",
        description: `Join request ${action}d successfully`,
      });
      if (household?.id) {
        queryClient.invalidateQueries({ queryKey: [`/api/join-requests/household/${household.id}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/households/${household.id}/members`] });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process join request",
        variant: "destructive",
      });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const response = await apiRequest('PUT', `/api/users/${userId}/role/household/${household?.id}`, { role });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Member role updated successfully",
      });
      if (household?.id) {
        queryClient.invalidateQueries({ queryKey: [`/api/households/${household?.id}/members`] });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update member role",
        variant: "destructive",
      });
    },
  });

  const handleRoleChange = (userId: string, newRole: string) => {
    updateRoleMutation.mutate({ userId, role: newRole });
  };

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest('DELETE', `/api/households/${household?.id}/members/${userId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Member removed from household successfully",
      });
      if (household?.id) {
        queryClient.invalidateQueries({ queryKey: [`/api/households/${household.id}/members`] });
        queryClient.invalidateQueries({ queryKey: ['/api/households/mine'] });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove member from household",
        variant: "destructive",
      });
    },
  });

  const handleRemoveMember = (userId: string, memberName: string) => {
    if (window.confirm(`Are you sure you want to remove ${memberName} from this household? This action cannot be undone.`)) {
      removeMemberMutation.mutate(userId);
    }
  };

  // Leave household mutation (for non-owners)
  const leaveHouseholdMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', `/api/households/${household?.id}/members/${user?.id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "You have left the household successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/households/mine'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to leave household",
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedToClipboard(true);
      toast({
        title: "Copied!",
        description: "Invitation code copied to clipboard",
      });
      setTimeout(() => setCopiedToClipboard(false), 2000);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleLeaveHousehold = () => {
    if (window.confirm("Are you sure you want to leave this household? You will need to be re-invited to rejoin.")) {
      leaveHouseholdMutation.mutate();
    }
  };

  if (!household) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-household-title">
            Household Management
          </h1>
          <p className="text-muted-foreground">
            You're not part of a household yet. Create one or join an existing household.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Get Started
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              To manage your family's activities, events, and communication, you need to be part of a household.
            </p>
            <div className="flex gap-4">
              <Button asChild>
                <a href="/profile">Create Household</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/join-household">Join Household</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-household-title">
          Household Management
        </h1>
        <p className="text-muted-foreground">
          Manage your household members and settings
        </p>
      </div>

      {/* Household Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {household.name}
            </div>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => setShowEditDialog(true)}
              data-testid="button-edit-household"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">
                Household ID: {household.id}
              </p>
              <p className="text-sm text-muted-foreground">
                Created: {new Date(household.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              {(household.street || household.city || household.state) && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="text-sm">
                    {household.street && <p>{household.street}</p>}
                    {(household.city || household.state || household.zipCode) && (
                      <p>
                        {household.city}{household.city && household.state && ', '}
                        {household.state} {household.zipCode}
                      </p>
                    )}
                    {household.country && household.country !== 'United States' && (
                      <p>{household.country}</p>
                    )}
                  </div>
                </div>
              )}
              {!household.street && !household.city && !household.state && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  No address set
                </p>
              )}
            </div>
          </div>
          <div className="flex justify-end">
            <Button 
              onClick={() => generateInviteMutation.mutate()}
              disabled={generateInviteMutation.isPending}
              data-testid="button-invite-member"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Household Members ({members?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members && members.length > 0 ? (
              members.map((member) => (
                <div 
                  key={member.id}
                  className="flex items-center justify-between p-4 bg-muted rounded-lg"
                  data-testid={`member-${member.id}`}
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={member.profileImageUrl || `https://ui-avatars.com/api/?name=${member.firstName}+${member.lastName}`}
                      alt={`${member.firstName} ${member.lastName}`}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <p className="font-medium text-foreground">
                        {member.firstName} {member.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {member.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={member.role === 'owner' ? 'default' : 'secondary'}>
                      {member.role === 'owner' ? 'Owner' : member.role === 'admin' ? 'Admin' : 'Member'}
                    </Badge>
                    {user && member.id === user.id && (
                      <Badge variant="outline">You</Badge>
                    )}
                    {/* Role Management - Only for admins/owners and not for themselves */}
                    {isCurrentUserHouseholdAdmin && member.id !== user.id && member.role !== 'owner' && (
                      <Select
                        value={member.role}
                        onValueChange={(newRole) => handleRoleChange(member.id, newRole)}
                      >
                        <SelectTrigger className="w-24 h-8 text-xs">
                          <Settings className="h-3 w-3" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    {/* Remove Member - Only for owners/admins and not for themselves or the owner */}
                    {user?.id && household?.ownerId && (
                      (user.id === household.ownerId || (user && members?.find(m => m.id === user.id)?.role === 'admin'))
                    ) && member.id !== user.id && member.role !== 'owner' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveMember(member.id, `${member.firstName} ${member.lastName}`)}
                        disabled={removeMemberMutation.isPending}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        data-testid={`button-remove-household-member-${member.id}`}
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No household members found
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Invite Household Member</DialogTitle>
            <DialogDescription>
              Share this invitation code with someone to invite them to your household.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="invite-code">Invitation Code</Label>
              <div className="flex space-x-2">
                <Input
                  id="invite-code"
                  value={inviteCode}
                  readOnly
                  className="font-mono"
                  data-testid="input-invite-code"
                />
                <Button
                  onClick={() => copyToClipboard(inviteCode)}
                  variant="outline"
                  size="sm"
                  data-testid="button-copy-code"
                >
                  {copiedToClipboard ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Instructions:</strong><br />
                1. Copy the invitation code above<br />
                2. Share it with the person you want to invite<br />
                3. They can use it on the "Join Household" page
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Household Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Household Information</DialogTitle>
            <DialogDescription>
              Update your household details and address information.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => updateHouseholdMutation.mutate(data))} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Household Name</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-household-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="details"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Details</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional details to help people find and join your household..."
                        rows={3}
                        {...field}
                        data-testid="textarea-household-details"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Address</Label>
                <FormField
                  control={form.control}
                  name="street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="123 Main Street" data-testid="input-street" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Springfield" data-testid="input-city" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State/Province</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="CA" data-testid="input-state" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP/Postal Code</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="12345" data-testid="input-zip" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="United States" data-testid="input-country" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowEditDialog(false)}
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateHouseholdMutation.isPending}
                  data-testid="button-save-household"
                >
                  {updateHouseholdMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Join Requests - Only for household owners */}
      {isCurrentUserHouseholdAdmin && joinRequests && joinRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Join Requests ({joinRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {joinRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`join-request-${request.id}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-medium" data-testid="text-requester-name">
                        {request.requester.firstName} {request.requester.lastName}
                      </p>
                      <Badge variant="outline">
                        {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1" data-testid="text-requester-email">
                      {request.requester.email}
                    </p>
                    {request.message && (
                      <p className="text-sm text-muted-foreground italic" data-testid="text-request-message">
                        "{request.message}"
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleJoinRequestMutation.mutate({ requestId: request.id, action: 'approve' })}
                      disabled={handleJoinRequestMutation.isPending}
                      data-testid="button-approve-request"
                    >
                      <UserCheck className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleJoinRequestMutation.mutate({ requestId: request.id, action: 'deny' })}
                      disabled={handleJoinRequestMutation.isPending}
                      data-testid="button-deny-request"
                    >
                      <UserX className="h-4 w-4 mr-1" />
                      Deny
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leave Household Action - Only for non-owners */}
      {user && household && user.id !== household.ownerId ? (
        <Card className="border-orange-500">
          <CardHeader>
            <CardTitle className="text-orange-600 flex items-center gap-2" data-testid="text-leave-household-title">
              <LogOut className="h-5 w-5" />
              Leave Household
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Remove yourself from this household. You will need to be re-invited to rejoin.
            </p>
            <Button
              variant="outline"
              onClick={handleLeaveHousehold}
              disabled={leaveHouseholdMutation.isPending}
              className="w-full border-orange-500 text-orange-600 hover:bg-orange-50"
              data-testid="button-leave-household"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {leaveHouseholdMutation.isPending ? "Leaving..." : "Leave Household"}
            </Button>
          </CardContent>
        </Card>
      ) : user && household && (
        <Card className="border-blue-500">
          <CardHeader>
            <CardTitle className="text-blue-600 flex items-center gap-2" data-testid="text-owner-info-title">
              <Crown className="h-5 w-5" />
              Household Owner
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              As the household owner, you cannot leave the household. To leave, you must first transfer ownership to another member or delete the household.
            </p>
            <Button
              variant="outline"
              disabled
              className="w-full border-blue-500 text-blue-600"
              data-testid="button-owner-cannot-leave"
            >
              <Crown className="h-4 w-4 mr-2" />
              Transfer Ownership to Leave
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}