import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Settings, Users, Trash2, Save, UserX, Clock, UserCheck, Cog, LogOut, Home, Crown, Info, Plus, Search, ChevronDown, ChevronRight, Loader2, Printer } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useHouseholdSubscription } from "@/hooks/useHouseholdSubscription";
import UpgradePrompt from "@/components/UpgradePrompt";

interface Group {
  id: string;
  name: string;
  description: string;
  creatorId: string;
  memberCount: number;
  messageCount: number;
  createdAt: string;
}

interface GroupMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImageUrl?: string;
  joinedAt: string;
  role?: string;
}

interface JoinRequest {
  id: string;
  type: 'household' | 'group';
  targetId: string;
  requesterId: string;
  requesterHouseholdId: string | null;
  status: 'pending' | 'approved' | 'denied';
  message: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  requester: {
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  };
}

export default function GroupSettings() {
  const { groupId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth() as { user?: { id: string; householdId?: string } };
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [showInviteHousehold, setShowInviteHousehold] = useState(false);
  const [householdSearchQuery, setHouseholdSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [expandedHouseholds, setExpandedHouseholds] = useState<Set<string>>(new Set());

  // Fetch group details
  const { data: group, isLoading: groupLoading } = useQuery<Group>({
    queryKey: [`/api/groups/${groupId}`],
    enabled: !!groupId,
  });

  // Fetch group members
  const { data: members, isLoading: membersLoading } = useQuery<GroupMember[]>({
    queryKey: [`/api/groups/${groupId}/members`],
    enabled: !!groupId,
  });

  // Helper function to check if user is group admin (creator or admin role)
  const isCurrentUserGroupAdmin = useMemo(() => {
    if (!user?.id || !group || !members) return false;
    const currentUserMember = members.find(m => m.id === user.id);
    return user.id === group.creatorId || currentUserMember?.role === 'admin';
  }, [user?.id, group?.creatorId, members]);

  // Fetch join requests (for group admins and creators)
  const { data: joinRequests } = useQuery<JoinRequest[]>({
    queryKey: [`/api/join-requests/group/${groupId}`],
    enabled: !!groupId && !!group && isCurrentUserGroupAdmin,
  });

  // Fetch user's household data to check admin status  
  const { data: household } = useQuery<{ id: string; name: string; ownerId: string }>({
    queryKey: ['/api/households/mine'],
    enabled: !!user?.id,
  });

  // Check household subscription status for premium features
  const { hasPremium, canAccessFeature } = useHouseholdSubscription();

  // Initialize form data when group loads
  useEffect(() => {
    if (group) {
      setFormData({
        name: group.name || "",
        description: group.description || "",
      });
    }
  }, [group]);

  // Update group mutation
  const updateGroupMutation = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      const response = await apiRequest('PATCH', `/api/groups/${groupId}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Group updated successfully",
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: [`/api/groups/${groupId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/groups'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update group",
        variant: "destructive",
      });
    },
  });

  // Delete group mutation
  const deleteGroupMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', `/api/groups/${groupId}`);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Group deleted successfully",
      });
      navigate('/groups');
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete group",
        variant: "destructive",
      });
    },
  });

  // Handle join request mutation
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
      if (groupId) {
        queryClient.invalidateQueries({ queryKey: [`/api/join-requests/group/${groupId}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/groups/${groupId}/members`] });
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

  // Role management mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const response = await apiRequest('PUT', `/api/users/${userId}/role/group/${groupId}`, { role });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Member role updated successfully",
      });
      if (groupId) {
        queryClient.invalidateQueries({ queryKey: [`/api/groups/${groupId}/members`] });
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
      const response = await apiRequest('DELETE', `/api/groups/${groupId}/members/${userId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Member removed from group successfully",
      });
      if (groupId) {
        queryClient.invalidateQueries({ queryKey: [`/api/groups/${groupId}/members`] });
        queryClient.invalidateQueries({ queryKey: [`/api/groups/${groupId}`] });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove member from group",
        variant: "destructive",
      });
    },
  });

  const handleRemoveMember = (userId: string, memberName: string) => {
    if (window.confirm(`Are you sure you want to remove ${memberName} from this group? This action cannot be undone.`)) {
      removeMemberMutation.mutate(userId);
    }
  };

  // Remove household mutation
  const removeHouseholdMutation = useMutation({
    mutationFn: async (householdId: string) => {
      const response = await apiRequest('DELETE', `/api/groups/${groupId}/households/${householdId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Household removed from group successfully",
      });
      if (groupId) {
        queryClient.invalidateQueries({ queryKey: [`/api/groups/${groupId}/members`] });
        queryClient.invalidateQueries({ queryKey: [`/api/groups/${groupId}`] });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove household from group",
        variant: "destructive",
      });
    },
  });

  const handleRemoveHousehold = (householdId: string, householdName: string) => {
    if (window.confirm(`Are you sure you want to remove the entire "${householdName}" household from this group? All household members will be removed. This action cannot be undone.`)) {
      removeHouseholdMutation.mutate(householdId);
    }
  };


  // Household leave group mutation (household admin only)
  const householdLeaveGroupMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', `/api/households/${household?.id}/groups/${groupId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your household has left the group successfully",
      });
      navigate('/groups');
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove household from group",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateGroupMutation.mutate(formData);
  };

  const handleCancel = () => {
    if (group) {
      setFormData({
        name: group.name || "",
        description: group.description || "",
      });
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this group? This action cannot be undone.")) {
      deleteGroupMutation.mutate();
    }
  };


  const handleHouseholdLeaveGroup = () => {
    if (window.confirm(`Are you sure you want your entire household to leave this group? All household members will be removed.`)) {
      householdLeaveGroupMutation.mutate();
    }
  };

  // Search households functionality
  const searchHouseholdsMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await apiRequest('GET', `/api/search/households?q=${encodeURIComponent(query)}`);
      return response.json();
    },
    onSuccess: (data) => {
      setSearchResults(data || []);
      setIsSearching(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to search households",
        variant: "destructive",
      });
      setIsSearching(false);
    },
  });

  // Invite household functionality
  const inviteHouseholdMutation = useMutation({
    mutationFn: async (targetHouseholdId: string) => {
      // Get the household name from search results
      const targetHousehold = searchResults.find(h => h.id === targetHouseholdId);
      const householdName = targetHousehold?.name || 'Unknown Household';
      
      // Check if current user is a group admin
      const currentUserMember = members?.find(m => m.id === user?.id);
      const isGroupAdmin = currentUserMember?.role === 'admin' || user?.id === group?.creatorId;
      
      if (isGroupAdmin) {
        // Direct invite to household
        const response = await apiRequest('POST', '/api/join-requests', {
          type: 'group',
          targetId: groupId,
          householdId: targetHouseholdId,
          message: `The ${householdName} household has been invited to join ${group?.name}`,
        });
        return response.json();
      } else {
        // For non-admins, create a regular join request that will need admin approval
        const currentUserMember = members?.find(m => m.id === user?.id);
        const requesterName = [currentUserMember?.firstName, currentUserMember?.lastName].filter(Boolean).join(' ') || 'A member';
        const response = await apiRequest('POST', '/api/join-requests', {
          type: 'group',
          targetId: groupId,
          householdId: targetHouseholdId,
          message: `${requesterName} has requested to invite the "${householdName}" household to ${group?.name}`,
        });
        return response.json();
      }
    },
    onSuccess: () => {
      const currentUserMember = members?.find(m => m.id === user?.id);
      const isGroupAdmin = currentUserMember?.role === 'admin' || user?.id === group?.creatorId;
      
      toast({
        title: "Success",
        description: isGroupAdmin 
          ? "Household invitation sent successfully"
          : "Invitation request sent to group admins for approval",
      });
      setShowInviteHousehold(false);
      setHouseholdSearchQuery("");
      setSearchResults([]);
      
      // Refresh relevant queries
      if (groupId) {
        queryClient.invalidateQueries({ queryKey: [`/api/join-requests/group/${groupId}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/groups/${groupId}/members`] });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation",
        variant: "destructive",
      });
    },
  });

  const handleSearchHouseholds = (query: string) => {
    setHouseholdSearchQuery(query);
    if (query.trim().length >= 2) {
      setIsSearching(true);
      searchHouseholdsMutation.mutate(query.trim());
    } else {
      setSearchResults([]);
    }
  };

  const handleInviteHousehold = (householdId: string) => {
    inviteHouseholdMutation.mutate(householdId);
  };

  // Helper function to group members by household with memoization for performance
  const memberGroups = useMemo(() => {
    if (!members) return { householdGroups: [], ungroupedMembers: [] };
    
    const householdGroups = new Map<string, { household: any; members: any[] }>();
    const ungroupedMembers: any[] = [];
    
    members.forEach(member => {
      const household = (member as any).household;
      if (household) {
        const householdId = household.id;
        if (!householdGroups.has(householdId)) {
          householdGroups.set(householdId, {
            household: household,
            members: []
          });
        }
        householdGroups.get(householdId)!.members.push(member);
      } else {
        // Add members without households to ungrouped list
        ungroupedMembers.push(member);
      }
    });
    
    return {
      householdGroups: Array.from(householdGroups.values()),
      ungroupedMembers
    };
  }, [members]);

  // Toggle household expansion
  const toggleHouseholdExpansion = (householdId: string) => {
    const newExpanded = new Set(expandedHouseholds);
    if (newExpanded.has(householdId)) {
      newExpanded.delete(householdId);
    } else {
      newExpanded.add(householdId);
    }
    setExpandedHouseholds(newExpanded);
  };

  if (groupLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-foreground mb-2">Group not found</h2>
        <p className="text-muted-foreground mb-4">The group you're looking for doesn't exist.</p>
        <Link href="/groups">
          <Button>Back to Groups</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/groups">
            <Button variant="outline" size="sm" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Groups
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2" data-testid="text-group-settings-title">
              <Settings className="h-8 w-8" />
              Group Settings
            </h1>
            <p className="text-muted-foreground">Manage "{group.name}" settings and members</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Group Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Join Requests - For group admins and creators */}
          {isCurrentUserGroupAdmin && joinRequests && joinRequests.length > 0 && (
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
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle data-testid="text-group-info-title">Group Information</CardTitle>
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)} data-testid="button-edit-group">
                    Edit Group
                  </Button>
                ) : (
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      disabled={updateGroupMutation.isPending}
                      data-testid="button-cancel-edit"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={updateGroupMutation.isPending}
                      data-testid="button-save-group"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {updateGroupMutation.isPending ? "Saving..." : "Save"}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="group-name" className="block text-sm font-medium text-foreground mb-1">
                  Group Name
                </label>
                <Input
                  id="group-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={!isEditing}
                  data-testid="input-group-name"
                />
              </div>
              
              <div>
                <label htmlFor="group-description" className="block text-sm font-medium text-foreground mb-1">
                  Description
                </label>
                <Textarea
                  id="group-description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Enter a description for your group..."
                  data-testid="textarea-group-description"
                />
              </div>
            </CardContent>
          </Card>

          {/* Print Labels - For group admins only */}
          {isCurrentUserGroupAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2" data-testid="text-print-labels-title">
                  <Printer className="h-5 w-5" />
                  Mailing Labels
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Generate and print mailing labels for all group members' addresses.
                </p>
                {canAccessFeature('hasMailingLabels') ? (
                  <Link href={`/groups/${groupId}/labels`}>
                    <Button 
                      className="w-full"
                      data-testid="button-print-labels"
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Print Labels
                    </Button>
                  </Link>
                ) : (
                  <UpgradePrompt
                    feature="Mailing Labels"
                    description="Generate and print professional mailing labels with all group member addresses. Perfect for sending invitations, holiday cards, or important updates."
                    showInline={true}
                  />
                )}
              </CardContent>
            </Card>
          )}

          {/* Group Members */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between" data-testid="text-members-title">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Members ({members?.length || 0})
                </div>
                <Button
                  onClick={() => setShowInviteHousehold(true)}
                  variant="outline"
                  size="sm"
                  className="text-sm"
                  data-testid="button-invite-household"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Invite Household
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {membersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : members && members.length > 0 ? (
                <div className="space-y-3">
                  {/* Household Groups */}
                  {memberGroups.householdGroups.map((householdGroup) => {
                    const isExpanded = expandedHouseholds.has(householdGroup.household.id);
                    return (
                      <div key={householdGroup.household.id} className="border rounded-lg">
                        {/* Household Header */}
                        <div
                          className="flex items-center justify-between p-3 bg-muted/30 rounded-t-lg cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => toggleHouseholdExpansion(householdGroup.household.id)}
                          data-testid={`household-header-${householdGroup.household.id}`}
                        >
                          <div className="flex items-center gap-3">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                            <Home className="h-5 w-5 text-primary" />
                            <div>
                              <p className="font-medium text-foreground">
                                {householdGroup.household.name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {householdGroup.members.length} member{householdGroup.members.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Link href={`/household/${householdGroup.household.id}`}>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-xs"
                                data-testid={`button-view-household-${householdGroup.household.id}`}
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent triggering the expansion toggle
                                }}
                              >
                                View Household
                              </Button>
                            </Link>
                            {/* Remove Household button - only show for group admins/creators and not for their own household */}
                            {(user?.id === group?.creatorId || members?.find(m => m.id === user?.id)?.role === 'admin') && 
                             householdGroup.household.id !== household?.id && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-xs text-destructive hover:text-destructive"
                                data-testid={`button-remove-household-${householdGroup.household.id}`}
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent triggering the expansion toggle
                                  handleRemoveHousehold(householdGroup.household.id, householdGroup.household.name);
                                }}
                                disabled={removeHouseholdMutation.isPending && removeHouseholdMutation.variables === householdGroup.household.id}
                              >
                                {removeHouseholdMutation.isPending && removeHouseholdMutation.variables === householdGroup.household.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <UserX className="h-3 w-3" />
                                )}
                                Remove Household
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Expanded Members */}
                        {isExpanded && (
                          <div className="p-3 space-y-3 bg-background rounded-b-lg">
                            {householdGroup.members.map((member) => (
                              <div
                                key={member.id}
                                className="flex items-center justify-between p-3 bg-muted rounded-lg ml-6"
                                data-testid={`member-${member.id}`}
                              >
                                <div className="flex items-center space-x-3">
                                  <img
                                    src={member.profileImageUrl || `https://ui-avatars.com/api/?name=${member.firstName}+${member.lastName}`}
                                    alt={`${member.firstName} ${member.lastName}`}
                                    className="w-8 h-8 rounded-full"
                                  />
                                  <div className="flex-1">
                                    <p className="font-medium text-foreground">
                                      {member.firstName} {member.lastName}
                                    </p>
                                    <p className="text-sm text-muted-foreground">{member.email}</p>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  <div className="flex items-center gap-2">
                                    <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                                      {member.role === 'admin' ? 'Admin' : 'Member'}
                                    </Badge>
                                    {user && member.id === user.id && (
                                      <Badge variant="outline">You</Badge>
                                    )}
                                    {/* Role Management - For group admins/creators and not for themselves */}
                                    {isCurrentUserGroupAdmin && user?.id && member.id !== user.id && (
                                      <Select
                                        value={member.role || 'member'}
                                        onValueChange={(newRole) => handleRoleChange(member.id, newRole)}
                                      >
                                        <SelectTrigger className="w-24 h-8 text-xs">
                                          <Cog className="h-3 w-3" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="member">Member</SelectItem>
                                          <SelectItem value="admin">Admin</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    )}
                                    {/* Remove Member Button - Only for group admins/creator and not for themselves */}
                                    {user?.id && ((user.id === group?.creatorId) || (members?.find(m => m.id === user.id)?.role === 'admin')) && member.id !== user.id && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleRemoveMember(member.id, `${member.firstName} ${member.lastName}`)}
                                        disabled={removeMemberMutation.isPending}
                                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                        data-testid={`button-remove-member-${member.id}`}
                                      >
                                        {removeMemberMutation.isPending && removeMemberMutation.variables === member.id ? (
                                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                        ) : (
                                          <UserX className="h-3 w-3" />
                                        )}
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {/* Ungrouped Members Section */}
                  {memberGroups.ungroupedMembers.length > 0 && (
                    <div key="ungrouped-members" className="border rounded-lg">
                      <div className="p-3 bg-muted/30 rounded-t-lg">
                        <div className="flex items-center gap-3">
                          <Users className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-foreground">Individual Members</p>
                            <p className="text-sm text-muted-foreground">
                              {memberGroups.ungroupedMembers.length} member{memberGroups.ungroupedMembers.length !== 1 ? 's' : ''} not in households
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="p-3 space-y-3 bg-background rounded-b-lg">
                        {memberGroups.ungroupedMembers.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between p-3 bg-muted rounded-lg"
                            data-testid={`ungrouped-member-${member.id}`}
                          >
                            <div className="flex items-center space-x-3">
                              <img
                                src={member.profileImageUrl || `https://ui-avatars.com/api/?name=${member.firstName}+${member.lastName}`}
                                alt={`${member.firstName} ${member.lastName}`}
                                className="w-8 h-8 rounded-full"
                              />
                              <div className="flex-1">
                                <p className="font-medium text-foreground">
                                  {member.firstName} {member.lastName}
                                </p>
                                <p className="text-sm text-muted-foreground">{member.email}</p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <div className="flex items-center gap-2">
                                <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                                  {member.role === 'admin' ? 'Admin' : 'Member'}
                                </Badge>
                                {user && member.id === user.id && (
                                  <Badge variant="outline">You</Badge>
                                )}
                                {/* Role Management - For group admins/creators and not for themselves */}
                                {isCurrentUserGroupAdmin && user?.id && member.id !== user.id && (
                                  <Select
                                    value={member.role || 'member'}
                                    onValueChange={(newRole) => handleRoleChange(member.id, newRole)}
                                  >
                                    <SelectTrigger className="w-24 h-8 text-xs">
                                      <Cog className="h-3 w-3" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="member">Member</SelectItem>
                                      <SelectItem value="admin">Admin</SelectItem>
                                    </SelectContent>
                                  </Select>
                                )}
                                {/* Remove Member Button - Only for group admins/creator and not for themselves */}
                                {user?.id && ((user.id === group?.creatorId) || (members?.find(m => m.id === user.id)?.role === 'admin')) && member.id !== user.id && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRemoveMember(member.id, `${member.firstName} ${member.lastName}`)}
                                    disabled={removeMemberMutation.isPending}
                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                    data-testid={`button-remove-member-${member.id}`}
                                  >
                                    {removeMemberMutation.isPending && removeMemberMutation.variables === member.id ? (
                                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                    ) : (
                                      <UserX className="h-3 w-3" />
                                    )}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No members found</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invite Household Dialog */}
          <Dialog open={showInviteHousehold} onOpenChange={setShowInviteHousehold}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Invite Household to Group
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label htmlFor="household-search" className="block text-sm font-medium text-foreground mb-2">
                    Search for households
                  </label>
                  <Input
                    id="household-search"
                    value={householdSearchQuery}
                    onChange={(e) => handleSearchHouseholds(e.target.value)}
                    placeholder="Type household name to search..."
                    className="w-full"
                    data-testid="input-household-search"
                  />
                </div>

                {/* Search Results */}
                {isSearching && (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                )}

                {searchResults.length > 0 && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    <p className="text-sm text-muted-foreground">Found {searchResults.length} household(s):</p>
                    {searchResults.map((household) => (
                      <div
                        key={household.id}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                        data-testid={`household-result-${household.id}`}
                      >
                        <div>
                          <p className="font-medium text-foreground">{household.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {household.memberCount} member(s)
                          </p>
                        </div>
                        <Button
                          onClick={() => handleInviteHousehold(household.id)}
                          disabled={inviteHouseholdMutation.isPending}
                          size="sm"
                          data-testid={`button-invite-${household.id}`}
                        >
                          {inviteHouseholdMutation.isPending ? "Inviting..." : "Invite"}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {householdSearchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">No households found matching "{householdSearchQuery}"</p>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowInviteHousehold(false);
                      setHouseholdSearchQuery("");
                      setSearchResults([]);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Leave Group Actions */}
        {user && user.id !== group?.creatorId ? (
          <div className="space-y-6">
            {/* Household Leave Group - For household owners */}
            {household && user.id === household.ownerId ? (
              <Card className="border-orange-500">
                <CardHeader>
                  <CardTitle className="text-orange-600 flex items-center gap-2" data-testid="text-household-leave-group-title">
                    <Home className="h-5 w-5" />
                    Remove Household from Group
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Remove your entire household ({household.name}) from this group. All household members will be removed.
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleHouseholdLeaveGroup}
                    disabled={householdLeaveGroupMutation.isPending}
                    className="w-full border-orange-500 text-orange-600 hover:bg-orange-50"
                    data-testid="button-household-leave-group"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    {householdLeaveGroupMutation.isPending ? "Removing Household..." : "Remove Household from Group"}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-blue-500">
                <CardHeader>
                  <CardTitle className="text-blue-600 flex items-center gap-2" data-testid="text-non-owner-info-title">
                    <Info className="h-5 w-5" />
                    Group Membership
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Only your household owner can remove the household from this group. Contact your household owner to request removal.
                  </p>
                  <Button
                    variant="outline"
                    disabled
                    className="w-full border-blue-500 text-blue-600"
                    data-testid="button-non-owner-disabled"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Ask Household Owner to Remove
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        ) : user && group && (
          <Card className="border-blue-500">
            <CardHeader>
              <CardTitle className="text-blue-600 flex items-center gap-2" data-testid="text-creator-info-title">
                <Crown className="h-5 w-5" />
                Group Creator
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                As the group creator, you cannot leave the group. To leave, you must first transfer ownership to another member or delete the group.
              </p>
              <Button
                variant="outline"
                disabled
                className="w-full border-blue-500 text-blue-600"
                data-testid="button-creator-cannot-leave"
              >
                <Crown className="h-4 w-4 mr-2" />
                Transfer Ownership to Leave
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Danger Zone */}
        <div className="space-y-6">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2" data-testid="text-danger-zone-title">
                <Trash2 className="h-5 w-5" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Permanently delete this group and all its messages. This action cannot be undone.
              </p>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteGroupMutation.isPending}
                className="w-full"
                data-testid="button-delete-group"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleteGroupMutation.isPending ? "Deleting..." : "Delete Group"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}