import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MessageCircle, Settings, Users, Home } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface GroupMember {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  profileImageUrl?: string;
  household?: {
    id: string;
    name: string;
  };
}

interface GroupCardProps {
  group: {
    id: string;
    name: string;
    description: string;
    memberCount: number;
    messageCount: number;
    createdAt: string;
  };
  'data-testid'?: string;
}

export default function GroupCard({ group, 'data-testid': testId }: GroupCardProps) {
  const [showMembersModal, setShowMembersModal] = useState(false);
  
  const { data: members } = useQuery<GroupMember[]>({
    queryKey: [`/api/groups/${group.id}/members`],
    enabled: showMembersModal,
  });
  const getGroupColor = (index: number) => {
    const colors = [
      "border-l-blue-500 bg-blue-50",
      "border-l-green-500 bg-green-50", 
      "border-l-purple-500 bg-purple-50",
      "border-l-orange-500 bg-orange-50",
    ];
    return colors[Math.abs(group.id.charCodeAt(0)) % colors.length];
  };

  return (
    <Card className={`hover:shadow-lg transition-shadow border-l-4 ${getGroupColor(0)}`} data-testid={testId}>
      <CardContent className="p-6">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-foreground text-xl" data-testid="text-group-name">
              {group.name}
            </h3>
            <Badge variant="secondary" data-testid="badge-member-count">
              {group.memberCount} members
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm" data-testid="text-group-description">
            {group.description || "No description available"}
          </p>
        </div>

        {/* Member Avatars Preview */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Recent Members:</p>
            <Dialog open={showMembersModal} onOpenChange={setShowMembersModal}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-xs">
                  <Users className="h-3 w-3 mr-1" />
                  View All
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Group Members - {group.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {members && members.length > 0 ? (
                    members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                        <div className="flex items-center space-x-3">
                          <img
                            src={member.profileImageUrl || `https://ui-avatars.com/api/?name=${member.firstName}+${member.lastName}`}
                            alt={`${member.firstName} ${member.lastName}`}
                            className="w-8 h-8 rounded-full"
                          />
                          <div>
                            <p className="text-sm font-medium">
                              {member.firstName} {member.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          {member.household && (
                            <Link href={`/household/${member.household.id}`}>
                              <button className="text-xs text-primary hover:text-primary/80 underline flex items-center gap-1">
                                <Home className="h-3 w-3" />
                                {member.household.name}
                              </button>
                            </Link>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-4">No members found</p>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex -space-x-2">
            {/* Generate placeholder avatars */}
            {Array.from({ length: Math.min(4, group.memberCount) }).map((_, index) => (
              <div
                key={index}
                className="w-8 h-8 rounded-full border-2 border-white bg-muted flex items-center justify-center text-xs text-muted-foreground cursor-pointer hover:scale-110 transition-transform"
                data-testid={`avatar-${index}`}
                onClick={() => setShowMembersModal(true)}
              >
                {String.fromCharCode(65 + index)}
              </div>
            ))}
            {group.memberCount > 4 && (
              <div 
                className="w-8 h-8 rounded-full border-2 border-white bg-muted flex items-center justify-center text-xs text-muted-foreground cursor-pointer hover:scale-110 transition-transform"
                onClick={() => setShowMembersModal(true)}
              >
                +{group.memberCount - 4}
              </div>
            )}
          </div>
        </div>

        {/* Group Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center">
            <p className="font-semibold text-foreground" data-testid="text-message-count">
              {group.messageCount}
            </p>
            <p className="text-xs text-muted-foreground">Messages</p>
          </div>
          <div className="text-center">
            <p className="font-semibold text-foreground" data-testid="text-event-count">
              0
            </p>
            <p className="text-xs text-muted-foreground">Events</p>
          </div>
          <div className="text-center">
            <p className="font-semibold text-foreground" data-testid="text-group-status">
              Active
            </p>
            <p className="text-xs text-muted-foreground">Status</p>
          </div>
        </div>

        {/* Group Actions */}
        <div className="flex space-x-2">
          <Link href={`/chat/${group.id}`}>
            <Button className="flex-1" data-testid="button-open-chat">
              <MessageCircle className="h-4 w-4 mr-2" />
              Chat
            </Button>
          </Link>
          <Link href={`/groups/${group.id}/settings`}>
            <Button variant="outline" size="sm" data-testid="button-group-settings">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
