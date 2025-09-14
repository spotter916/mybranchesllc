import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, Phone, MapPin, Calendar, Eye, Edit, UserPlus, Trash2, Home } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface ContactCardProps {
  contact: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address?: string;
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    notes?: string;
    role?: string;
    birthday: string;
    profileImageUrl?: string;
    showBirthday: boolean;
    showAddress: boolean;
    showPhone: boolean;
  };
  onEdit?: (contact: any) => void;
  onInvite?: (contact: any) => void;
  onDelete?: (contact: any) => void;
  type?: 'contact' | 'household';
  'data-testid'?: string;
}

export default function ContactCard({ contact, onEdit, onInvite, onDelete, type = 'contact', 'data-testid': testId }: ContactCardProps) {
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteMessage, setInviteMessage] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [isPromoteDialogOpen, setIsPromoteDialogOpen] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);
  const { toast } = useToast();

  const getGroupColor = (index: number) => {
    const colors = [
      "border-l-blue-500 bg-blue-50",
      "border-l-green-500 bg-green-50", 
      "border-l-purple-500 bg-purple-50",
      "border-l-orange-500 bg-orange-50",
    ];
    return colors[index % colors.length];
  };

  const handleInvite = async () => {
    if (!contact.email) {
      toast({
        title: "Cannot send invitation",
        description: "This contact doesn't have an email address.",
        variant: "destructive",
      });
      return;
    }

    setIsInviting(true);
    try {
      const response = await apiRequest("POST", "/api/contacts/invitations", {
        email: contact.email,
        firstName: contact.firstName,
        lastName: contact.lastName,
        message: inviteMessage,
        contactId: contact.id,
      });

      const data = await response.json();
      
      toast({
        title: "Invitation sent!",
        description: `Invitation sent to ${contact.firstName} ${contact.lastName}`,
      });

      setIsInviteDialogOpen(false);
      setInviteMessage('');
      onInvite?.(contact);
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast({
        title: "Failed to send invitation",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsInviting(false);
    }
  };

  const handlePromoteToHousehold = async () => {
    setIsPromoting(true);
    try {
      const response = await apiRequest("POST", "/api/contacts/promote-to-household", {
        contactId: contact.id,
      });

      const data = await response.json();
      
      toast({
        title: "Contact promoted!",
        description: data.message || `${contact.firstName} ${contact.lastName} has been added to your household`,
      });

      setIsPromoteDialogOpen(false);
      
      // Invalidate relevant queries instead of reloading the page
      await queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/households/current'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/households/mine'] });
      
      // Call onInvite callback if provided to trigger parent refresh
      onInvite?.(contact);
      
    } catch (error) {
      console.error('Error promoting contact:', error);
      const errorMessage = error instanceof Error ? error.message : "Please try again later.";
      toast({
        title: "Failed to promote contact",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsPromoting(false);
    }
  };

  return (
    <Card className={`hover:shadow-lg transition-shadow border-l-4 ${getGroupColor(0)}`} data-testid={testId}>
      <CardContent className="p-6">
        <div className="flex items-center space-x-4 mb-4">
          <img
            src={contact.profileImageUrl || `https://ui-avatars.com/api/?name=${contact.firstName}+${contact.lastName}&size=64`}
            alt={`${contact.firstName} ${contact.lastName}`}
            className="w-16 h-16 rounded-full object-cover"
            data-testid="img-contact-avatar"
          />
          <div className="flex-1">
            <h3 className="font-semibold text-foreground text-lg" data-testid="text-contact-name">
              {contact.firstName} {contact.lastName}
            </h3>
            <p className="text-muted-foreground text-sm">
              {type === 'household' ? 'Household Member' : 'Contact'}
              {contact.role && ` (${contact.role})`}
            </p>
            <Badge variant="secondary" className="mt-1" data-testid="badge-contact-group">
              {type === 'household' ? 'Household' : 'Personal Contact'}
            </Badge>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          {contact.email && (
            <div className="flex items-center text-muted-foreground" data-testid="contact-email">
              <Mail className="w-4 h-4 mr-3 flex-shrink-0" />
              <span className="truncate">{contact.email}</span>
            </div>
          )}
          
          {contact.phone && contact.showPhone && (
            <div className="flex items-center text-muted-foreground" data-testid="contact-phone">
              <Phone className="w-4 h-4 mr-3 flex-shrink-0" />
              <span>{contact.phone}</span>
            </div>
          )}
          
          {contact.birthday && contact.showBirthday && (
            <div className="flex items-center text-muted-foreground" data-testid="contact-birthday">
              <Calendar className="w-4 h-4 mr-3 flex-shrink-0" />
              <span>{format(new Date(contact.birthday), 'MMMM do, yyyy')}</span>
            </div>
          )}
          
          {contact.showAddress && (
            <div className="flex items-center text-muted-foreground" data-testid="contact-address">
              <MapPin className="w-4 h-4 mr-3 flex-shrink-0" />
              <span className="truncate">
                {contact.address || 
                 [contact.street, contact.city, contact.state, contact.zipCode]
                   .filter(Boolean)
                   .join(', ') || 'No address provided'}
              </span>
            </div>
          )}
        </div>

        {onEdit && (
          <div className="mt-4 flex space-x-2">
            <Button className="flex-1" variant="default" data-testid="button-view-contact">
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
            
            {type === 'contact' && contact.email && (
              <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    data-testid="button-invite-contact"
                  >
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite {contact.firstName} to My Branches</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Send an invitation to {contact.firstName} {contact.lastName} ({contact.email}) to join My Branches.
                    </p>
                    <div>
                      <Label htmlFor="message">Personal Message (Optional)</Label>
                      <Textarea
                        id="message"
                        placeholder="Add a personal message to your invitation..."
                        value={inviteMessage}
                        onChange={(e) => setInviteMessage(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => setIsInviteDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        className="flex-1"
                        onClick={handleInvite}
                        disabled={isInviting}
                        data-testid="button-send-invitation"
                      >
                        {isInviting ? "Sending..." : "Send Invitation"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {/* Promote to Household Dialog */}
            {type === 'contact' && (
              <Dialog open={isPromoteDialogOpen} onOpenChange={setIsPromoteDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    data-testid="button-promote-contact"
                  >
                    <Home className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add {contact.firstName} to Household</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Promote {contact.firstName} {contact.lastName} from a personal contact to a household member. 
                      This will move them from your personal contacts to your household management.
                    </p>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Note:</strong> Once promoted to household member, this contact will:
                      </p>
                      <ul className="text-sm text-blue-700 mt-2 list-disc list-inside">
                        <li>Appear in your household member list</li>
                        <li>Be removed from your personal contacts</li>
                        <li>Have member-level permissions in the household</li>
                      </ul>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => setIsPromoteDialogOpen(false)}
                        data-testid="button-cancel-promote"
                      >
                        Cancel
                      </Button>
                      <Button 
                        className="flex-1"
                        onClick={handlePromoteToHousehold}
                        disabled={isPromoting}
                        data-testid="button-confirm-promote"
                      >
                        {isPromoting ? "Adding..." : "Add to Household"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onEdit(contact)}
              data-testid="button-edit-contact"
            >
              <Edit className="h-4 w-4" />
            </Button>
            
            {type === 'contact' && onDelete && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onDelete(contact)}
                className="border-red-500 text-red-600 hover:bg-red-50"
                data-testid="button-delete-contact"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
