import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search as SearchIcon, Users, Home, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface SearchResult {
  id: string;
  name: string;
  details?: string | null;
  memberCount: number;
  description?: string;
  ownerId?: string;
  createdBy?: string;
}

export default function Search() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<"households" | "groups">("households");
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SearchResult | null>(null);
  const [requestMessage, setRequestMessage] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: searchResults, isLoading } = useQuery<SearchResult[]>({
    queryKey: [`/api/search/${selectedType}`, searchQuery],
    enabled: searchQuery.length >= 2,
    queryFn: async () => {
      const response = await fetch(`/api/search/${selectedType}?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error('Search failed');
      return response.json();
    },
  });

  const requestToJoinMutation = useMutation({
    mutationFn: async ({ type, targetId, message }: { type: string; targetId: string; message: string }) => {
      const response = await apiRequest('POST', '/api/join-requests', {
        type,
        targetId,
        message,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Request Sent",
        description: `Your request to join the ${selectedType.slice(0, -1)} has been sent to the administrators.`,
      });
      setShowRequestDialog(false);
      setRequestMessage("");
      setSelectedItem(null);
      queryClient.invalidateQueries({ queryKey: ['/api/join-requests'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send join request",
        variant: "destructive",
      });
    },
  });

  const handleRequestToJoin = (item: SearchResult) => {
    setSelectedItem(item);
    setShowRequestDialog(true);
  };

  const submitRequest = () => {
    if (!selectedItem) return;
    requestToJoinMutation.mutate({
      type: selectedType.slice(0, -1), // Remove 's' from households/groups
      targetId: selectedItem.id,
      message: requestMessage,
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-search-title">
          Search & Join
        </h1>
        <p className="text-muted-foreground" data-testid="text-search-description">
          Find and request to join households or groups
        </p>
      </div>

      {/* Search Type Toggle */}
      <div className="flex justify-center mb-6">
        <div className="bg-muted p-1 rounded-lg">
          <Button
            variant={selectedType === "households" ? "default" : "ghost"}
            onClick={() => setSelectedType("households")}
            className="mr-1"
            data-testid="button-search-households"
          >
            <Home className="h-4 w-4 mr-2" />
            Households
          </Button>
          <Button
            variant={selectedType === "groups" ? "default" : "ghost"}
            onClick={() => setSelectedType("groups")}
            data-testid="button-search-groups"
          >
            <Users className="h-4 w-4 mr-2" />
            Groups
          </Button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={`Search for ${selectedType}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          data-testid="input-search-query"
        />
      </div>

      {/* Search Results */}
      {searchQuery.length >= 2 && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
              <p className="mt-2 text-muted-foreground">Searching...</p>
            </div>
          ) : searchResults && searchResults.length > 0 ? (
            <div className="grid gap-4">
              {searchResults.map((item) => (
                <Card key={item.id} className="hover:shadow-md transition-shadow" data-testid={`search-result-${item.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        {selectedType === "households" ? (
                          <Home className="h-5 w-5" />
                        ) : (
                          <Users className="h-5 w-5" />
                        )}
                        {item.name}
                      </CardTitle>
                      <Badge variant="secondary" data-testid="badge-member-count">
                        {item.memberCount} members
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {selectedType === "groups" && item.description && (
                      <p className="text-muted-foreground mb-3" data-testid="text-item-description">
                        {item.description}
                      </p>
                    )}
                    {selectedType === "households" && item.details && (
                      <p className="text-muted-foreground mb-3" data-testid="text-household-details">
                        {item.details}
                      </p>
                    )}
                    {selectedType === "groups" && item.details && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-foreground mb-1">Additional Details:</p>
                        <p className="text-muted-foreground text-sm" data-testid="text-item-details">
                          {item.details}
                        </p>
                      </div>
                    )}
                    <Button
                      onClick={() => handleRequestToJoin(item)}
                      className="w-full"
                      data-testid="button-request-join"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Request to Join
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground" data-testid="text-no-results">
                No {selectedType} found matching "{searchQuery}"
              </p>
            </div>
          )}
        </div>
      )}

      {searchQuery.length < 2 && (
        <div className="text-center py-12">
          <SearchIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground" data-testid="text-search-hint">
            Enter at least 2 characters to start searching
          </p>
        </div>
      )}

      {/* Join Request Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Request to Join {selectedItem?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Message to Administrators (Optional)
              </label>
              <Textarea
                placeholder="Tell them why you'd like to join..."
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                rows={4}
                data-testid="textarea-request-message"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowRequestDialog(false)}
                data-testid="button-cancel-request"
              >
                Cancel
              </Button>
              <Button
                onClick={submitRequest}
                disabled={requestToJoinMutation.isPending}
                data-testid="button-submit-request"
              >
                {requestToJoinMutation.isPending ? "Sending..." : "Send Request"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}