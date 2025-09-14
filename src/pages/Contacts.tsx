import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search } from "lucide-react";
import ContactCard from "@/components/ContactCard";
import ContactForm from "@/components/forms/ContactForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Contacts() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [showContactForm, setShowContactForm] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleInvite = (contact: any) => {
    // Callback for after invitation is sent - could refresh data if needed
    console.log(`Invitation sent to ${contact.firstName} ${contact.lastName}`);
  };

  // Delete contact mutation
  const deleteContactMutation = useMutation({
    mutationFn: async (contactId: string) => {
      const response = await apiRequest('DELETE', `/api/contacts/${contactId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Contact deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete contact",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (contact: any) => {
    if (window.confirm(`Are you sure you want to delete ${contact.firstName} ${contact.lastName}? This action cannot be undone.`)) {
      deleteContactMutation.mutate(contact.id);
    }
  };

  const { data: groups } = useQuery<Array<{ 
    id: string; 
    name: string; 
    description: string;
    memberCount: number;
    messageCount: number;
    createdAt: string;
  }>>({
    queryKey: ['/api/groups'],
  });

  const { data: standaloneContacts } = useQuery<Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    birthday: string;
    profileImageUrl?: string;
    showBirthday: boolean;
    showAddress: boolean;
    showPhone: boolean;
    notes: string;
  }>>({
    queryKey: ['/api/contacts'],
  });

  // Only show standalone contacts (household members are managed in the Household page)
  const allContacts = (standaloneContacts || []).map(contact => ({ ...contact, type: 'contact' as const }));

  const filteredContacts = allContacts.filter((contact) => {
    const matchesSearch = 
      `${contact.firstName} ${contact.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Group filtering would be implemented here
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground" data-testid="text-contacts-title">
          Personal Contacts
        </h1>
        <Button 
          onClick={() => setShowContactForm(true)}
          data-testid="button-add-contact"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Contact
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-contacts"
          />
        </div>
        <Select value={selectedGroup} onValueChange={setSelectedGroup}>
          <SelectTrigger className="md:w-48" data-testid="select-group-filter">
            <SelectValue placeholder="All Groups" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Groups</SelectItem>
            {groups?.map((group) => (
              <SelectItem key={group.id} value={group.id}>
                {group.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Contacts Grid */}
      {(standaloneContacts || []).length === 0 ? (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2" data-testid="text-no-contacts-title">
              No contacts found
            </h3>
            <p className="text-muted-foreground mb-4" data-testid="text-no-contacts-description">
              {searchTerm ? "Try adjusting your search terms" : "Start by adding your first personal contact"}
            </p>
            <Button 
              onClick={() => setShowContactForm(true)}
              data-testid="button-add-first-contact"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {(standaloneContacts && standaloneContacts.length > 0) && (
            <div>
              <h3 className="text-lg font-semibold mb-4">My Contacts</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {standaloneContacts.filter((contact) => {
                  const matchesSearch = 
                    `${contact.firstName} ${contact.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    contact.phone?.includes(searchTerm);
                  return searchTerm === "" || matchesSearch;
                }).map((contact) => (
                  <ContactCard 
                    key={contact.id} 
                    contact={contact} 
                    type="contact"
                    onEdit={(contact) => {
                      setEditingContact(contact);
                      setShowContactForm(true);
                    }}
                    onInvite={handleInvite}
                    onDelete={handleDelete}
                    data-testid={`contact-card-${contact.id}`}
                  />
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Contact Form Dialog */}
      <Dialog open={showContactForm} onOpenChange={setShowContactForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="text-contact-form-title">
              {editingContact ? "Edit Contact" : "Add New Contact"}
            </DialogTitle>
          </DialogHeader>
          <ContactForm
            contact={editingContact}
            onSave={() => {
              setShowContactForm(false);
              setEditingContact(null);
            }}
            onCancel={() => {
              setShowContactForm(false);
              setEditingContact(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
