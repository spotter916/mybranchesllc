import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Camera, Trash2, Save, X, UserPlus, Home, Copy, Mail, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import PhotoUploader from "@/components/PhotoUploader";
import NotificationPreferences from "@/components/NotificationPreferences";

export default function Profile() {
  const { user } = useAuth() as {
    user?: {
      id: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      birthday?: string;
      showBirthday?: boolean;
      showPhone?: boolean;
      emailNotifications?: boolean;
      profileImageUrl?: string;
    };
  };
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showCreateHouseholdDialog, setShowCreateHouseholdDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [householdName, setHouseholdName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    birthday: "",
    showBirthday: true,
    showPhone: true,
    emailNotifications: true,
  });

  const { data: household } = useQuery<{
    id: string;
    name: string;
    ownerId: string;
    createdAt: string;
  }>({
    queryKey: ['/api/households/mine'],
  });

  const { data: householdMembers } = useQuery<Array<{
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    profileImageUrl?: string;
    phone?: string;
    birthday?: string;
    showBirthday?: boolean;
    showPhone?: boolean;
    role: string;
  }>>({
    queryKey: ['/api/households', household?.id, 'members'],
    queryFn: async () => {
      if (!household?.id) return [];
      const response = await fetch(`/api/households/${household.id}/members`);
      if (!response.ok) {
        throw new Error('Failed to fetch household members');
      }
      return response.json();
    },
    enabled: !!household?.id,
  });

  // Initialize form data when user data loads
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
        birthday: user.birthday ? user.birthday.split('T')[0] : "",
        showBirthday: user.showBirthday ?? true,
        showPhone: user.showPhone ?? true,
        emailNotifications: user.emailNotifications ?? true,
      });
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('PATCH', '/api/profile', data);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const createHouseholdMutation = useMutation({
    mutationFn: async (householdData: { name: string }) => {
      const response = await apiRequest('POST', '/api/households', householdData);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Household created successfully",
      });
      setShowCreateHouseholdDialog(false);
      setHouseholdName("");
      queryClient.invalidateQueries({ queryKey: ['/api/households/mine'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create household",
        variant: "destructive",
      });
    },
  });

  const handleCreateHousehold = () => {
    if (!householdName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a household name",
        variant: "destructive",
      });
      return;
    }
    createHouseholdMutation.mutate({ name: householdName.trim() });
  };

  const inviteUserMutation = useMutation({
    mutationFn: async (email: string) => {
      // For now, we'll generate an invitation code that the user can share
      // In a real app, this would send an email with the invitation link
      const inviteCode = `${household?.id}-${Date.now()}`;
      return { inviteCode, email };
    },
    onSuccess: (data) => {
      toast({
        title: "Invitation Created",
        description: `Share this code with ${data.email}: ${data.inviteCode}`,
      });
      setShowInviteDialog(false);
      setInviteEmail("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create invitation",
        variant: "destructive",
      });
    },
  });

  const handleSendInvite = () => {
    if (!inviteEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail.trim())) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    inviteUserMutation.mutate(inviteEmail.trim());
  };

  const deleteAccountMutation = useMutation({
    mutationFn: async (confirmationPhrase: string) => {
      const response = await apiRequest('DELETE', '/api/profile/delete-account', {
        confirmationPhrase
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted. You will be redirected to the home page.",
      });
      // Force page reload to log out user
      window.location.href = '/';
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete account",
        variant: "destructive",
      });
    },
  });

  const handleDeleteAccount = () => {
    deleteAccountMutation.mutate(deleteConfirmation);
  };

  const handleSave = () => {
    // Prepare the data for submission
    const submitData = {
      ...formData,
      // Convert birthday string to Date object or null
      birthday: formData.birthday ? new Date(formData.birthday) : null,
    };
    updateProfileMutation.mutate(submitData);
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
        birthday: user.birthday ? user.birthday.split('T')[0] : "",
        showBirthday: user.showBirthday ?? true,
        showPhone: user.showPhone ?? true,
        emailNotifications: user.emailNotifications ?? true,
      });
    }
    setIsEditing(false);
  };

  const handlePhotoUploaded = async (photoUrl: string, updatedUser?: any) => {
    try {
      toast({
        title: "Profile photo updated",
        description: "Your profile photo has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile photo",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-foreground" data-testid="text-profile-title">
        My Profile
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle data-testid="text-personal-info-title">Personal Information</CardTitle>
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)} data-testid="button-edit-profile">
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      data-testid="button-cancel-profile"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={updateProfileMutation.isPending}
                      data-testid="button-save-profile"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    disabled={!isEditing}
                    data-testid="input-first-name"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    disabled={!isEditing}
                    data-testid="input-last-name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!isEditing}
                    data-testid="input-email"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={!isEditing}
                    data-testid="input-phone"
                  />
                </div>
                <div>
                  <Label htmlFor="birthday">Birthday</Label>
                  <Input
                    id="birthday"
                    type="date"
                    value={formData.birthday}
                    onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                    disabled={!isEditing}
                    data-testid="input-birthday"
                  />
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Household Management */}
          <Card>
            <CardHeader>
              <CardTitle data-testid="text-household-title">Household Management</CardTitle>
            </CardHeader>
            <CardContent>
              {household ? (
                <div>
                  <div className="mb-6">
                    <Label>Household Name</Label>
                    <p className="text-lg font-medium text-foreground" data-testid="text-household-name">
                      {household.name}
                    </p>
                  </div>

                  <div className="mb-6">
                    <h4 className="font-medium text-foreground mb-3">Household Members</h4>
                    <div className="space-y-3">
                      {householdMembers && householdMembers.length > 0 ? (
                        householdMembers.map((member) => (
                          <div key={member.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <div className="flex items-center space-x-3">
                              <img
                                src={member.profileImageUrl ? `${member.profileImageUrl}?t=${Date.now()}` : `https://ui-avatars.com/api/?name=${member.firstName}+${member.lastName}`}
                                alt={`${member.firstName} ${member.lastName}`}
                                className="w-8 h-8 rounded-full"
                              />
                              <div>
                                <p className="font-medium text-foreground" data-testid={`text-household-member-name-${member.id}`}>
                                  {member.firstName} {member.lastName}
                                </p>
                                <p className="text-sm text-muted-foreground">{member.role === 'owner' ? 'Head of Household' : 'Member'}</p>
                                {member.email && (
                                  <p className="text-xs text-muted-foreground">{member.email}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {member.id === user?.id && (
                                <span className="px-2 py-1 bg-primary text-primary-foreground text-xs rounded-full">
                                  You
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-muted-foreground">No household members found</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                    <DialogTrigger asChild>
                      <Button className="w-full" variant="secondary" data-testid="button-invite-member">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Invite Household Member
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Invite Household Member</DialogTitle>
                        <DialogDescription>
                          Invite a family member to join your household. They'll be able to participate in events and group activities.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="invite-email" className="col-span-1">
                            Email
                          </Label>
                          <Input
                            id="invite-email"
                            type="email"
                            placeholder="family@example.com"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            className="col-span-3"
                            data-testid="input-invite-email"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleSendInvite();
                              }
                            }}
                          />
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <Mail className="h-4 w-4 inline mr-2" />
                          An invitation code will be generated that you can share with this person. They can use it at /join-household to join your household.
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowInviteDialog(false);
                            setInviteEmail("");
                          }}
                          data-testid="button-cancel-invite"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSendInvite}
                          disabled={inviteUserMutation.isPending || !inviteEmail.trim()}
                          data-testid="button-send-invite"
                        >
                          {inviteUserMutation.isPending ? "Creating..." : "Create Invitation"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-4" data-testid="text-no-household">
                    You're not part of a household yet
                  </p>
                  <Dialog open={showCreateHouseholdDialog} onOpenChange={setShowCreateHouseholdDialog}>
                    <DialogTrigger asChild>
                      <Button data-testid="button-create-household">
                        <Home className="h-4 w-4 mr-2" />
                        Create Household
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Create New Household</DialogTitle>
                        <DialogDescription>
                          Create a household to start organizing your family activities and events.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="household-name" className="col-span-1">
                            Name
                          </Label>
                          <Input
                            id="household-name"
                            placeholder="e.g., Smith Family"
                            value={householdName}
                            onChange={(e) => setHouseholdName(e.target.value)}
                            className="col-span-3"
                            data-testid="input-household-name"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleCreateHousehold();
                              }
                            }}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowCreateHouseholdDialog(false);
                            setHouseholdName("");
                          }}
                          data-testid="button-cancel-household"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleCreateHousehold}
                          disabled={createHouseholdMutation.isPending || !householdName.trim()}
                          data-testid="button-confirm-create-household"
                        >
                          {createHouseholdMutation.isPending ? "Creating..." : "Create Household"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Profile Picture & Privacy Settings */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Picture */}
          <Card>
            <CardHeader>
              <CardTitle data-testid="text-profile-picture-title">Profile Picture</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="flex justify-center mb-4">
                <PhotoUploader
                  currentPhotoUrl={user?.profileImageUrl ? `${user.profileImageUrl}?t=${Date.now()}` : `https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&size=200`}
                  onPhotoUploaded={handlePhotoUploaded}
                  title="Change Profile Photo"
                  description="Upload a new profile picture"
                  shape="circle"
                  size="lg"
                />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Click your photo to change it. Recommended: Square image, at least 200x200px
              </p>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <CardTitle data-testid="text-privacy-settings-title">Privacy Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Show Birthday</p>
                  <p className="text-sm text-muted-foreground">Let family members see your birthday</p>
                </div>
                <Switch
                  checked={formData.showBirthday}
                  onCheckedChange={(checked) => setFormData({ ...formData, showBirthday: checked })}
                  disabled={!isEditing}
                  data-testid="switch-show-birthday"
                />
              </div>


              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Phone Visibility</p>
                  <p className="text-sm text-muted-foreground">Show phone number to family</p>
                </div>
                <Switch
                  checked={formData.showPhone}
                  onCheckedChange={(checked) => setFormData({ ...formData, showPhone: checked })}
                  disabled={!isEditing}
                  data-testid="switch-show-phone"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive updates via email</p>
                </div>
                <Switch
                  checked={formData.emailNotifications}
                  onCheckedChange={(checked) => setFormData({ ...formData, emailNotifications: checked })}
                  disabled={!isEditing}
                  data-testid="switch-email-notifications"
                />
              </div>
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <NotificationPreferences />

          {/* Account Deletion */}
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2" data-testid="text-danger-zone-title">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="font-medium text-foreground">Delete Account</p>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                </div>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      data-testid="button-delete-account"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        Delete Account Permanently
                      </AlertDialogTitle>
                      <AlertDialogDescription className="space-y-3">
                        <p>
                          This action will permanently delete your account and all associated data, including:
                        </p>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Your profile information and photos</li>
                          <li>All messages and conversations</li>
                          <li>Events and tasks you've created</li>
                          <li>Your contacts and saved locations</li>
                          <li>Household and group memberships</li>
                        </ul>
                        <p className="font-semibold text-destructive">
                          This action cannot be undone.
                        </p>
                        <div className="mt-4">
                          <Label htmlFor="delete-confirmation">
                            Type "DELETE MY ACCOUNT" to confirm:
                          </Label>
                          <Input
                            id="delete-confirmation"
                            value={deleteConfirmation}
                            onChange={(e) => setDeleteConfirmation(e.target.value)}
                            placeholder="DELETE MY ACCOUNT"
                            className="mt-2"
                            data-testid="input-delete-confirmation"
                          />
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel 
                        onClick={() => setDeleteConfirmation("")}
                        data-testid="button-cancel-delete"
                      >
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        disabled={deleteConfirmation !== 'DELETE MY ACCOUNT' || deleteAccountMutation.isPending}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        data-testid="button-confirm-delete"
                      >
                        {deleteAccountMutation.isPending ? "Deleting..." : "Delete Account"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
