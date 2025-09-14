import { useState, useEffect, useRef } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Paperclip, Smile, Settings, Info } from "lucide-react";
import MessageBubble from "@/components/MessageBubble";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useAuth } from "@/hooks/useAuth";
import { canUserAccessFeature } from "@shared/subscription-utils";
import UpgradePrompt from "@/components/UpgradePrompt";

export default function Chat() {
  const params = useParams();
  const { user } = useAuth() as {
    user?: {
      id: string;
      subscriptionPlan?: string;
    };
  };
  const [selectedGroupId, setSelectedGroupId] = useState(params.groupId || "");
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const { data: messages } = useQuery<Array<{
    id: string;
    content: string;
    senderId: string;
    senderName: string;
    senderImage?: string;
    createdAt: string;
  }>>({
    queryKey: ['/api/groups', selectedGroupId, 'messages'],
    enabled: !!selectedGroupId,
  });

  const { data: groupMembers } = useQuery<Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    birthday: string;
    profileImageUrl?: string;
    showBirthday: boolean;
    showAddress: boolean;
    showPhone: boolean;
  }>>({
    queryKey: ['/api/groups', selectedGroupId, 'members'],
    enabled: !!selectedGroupId,
  });

  const { sendMessage, messages: liveMessages } = useWebSocket(selectedGroupId, user?.id);

  // Combine stored messages with live messages
  const allMessages = [...(messages || []), ...liveMessages];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages]);

  const handleSendMessage = () => {
    if (messageText.trim() && selectedGroupId) {
      sendMessage(messageText.trim());
      setMessageText("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const selectedGroup = groups?.find(g => g.id === selectedGroupId);

  if (!groups || groups.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2" data-testid="text-no-groups-chat-title">
            No groups available
          </h3>
          <p className="text-muted-foreground" data-testid="text-no-groups-chat-description">
            You need to join or create a group before you can start chatting
          </p>
        </div>
      </div>
    );
  }

  // Check if user has access to chat feature
  const currentPlan = user?.subscriptionPlan || 'basic';
  const hasChat = canUserAccessFeature(currentPlan as any, 'hasRealTimeChat');

  if (!hasChat) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
        <UpgradePrompt
          feature="Real-Time Chat"
          description="Connect with your family members instantly through real-time group messaging with unlimited chat history."
        />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Group Selection for Mobile/No Group Selected */}
      {!selectedGroupId && (
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-4" data-testid="text-chat-title">
            Group Chat
          </h1>
          <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
            <SelectTrigger className="w-full" data-testid="select-chat-group">
              <SelectValue placeholder="Select a group to chat" />
            </SelectTrigger>
            <SelectContent>
              {groups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {selectedGroupId ? (
        <Card className="flex-1 flex flex-col overflow-hidden">
          {/* Chat Header */}
          <div className="border-b border-border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                  {selectedGroup?.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground" data-testid="text-group-name">
                    {selectedGroup?.name}
                  </h3>
                  <p className="text-sm text-muted-foreground" data-testid="text-member-count">
                    {groupMembers?.length || 0} members
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" data-testid="button-group-info">
                  <Info className="h-4 w-4 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="sm" data-testid="button-chat-settings">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4" data-testid="messages-container">
            {allMessages.map((message, index) => (
              <MessageBubble
                key={`${message.id}-${index}`}
                message={message}
                isOwn={message.senderId === user?.id}
                data-testid={`message-${index}`}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="border-t border-border p-4">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" data-testid="button-attach-file">
                <Paperclip className="h-4 w-4 text-muted-foreground" />
              </Button>
              <div className="flex-1 relative">
                <Input
                  placeholder="Type your message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pr-12"
                  data-testid="input-message"
                />
                <Button variant="ghost" size="sm" className="absolute right-2 top-1/2 transform -translate-y-1/2" data-testid="button-emoji">
                  <Smile className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
              <Button 
                onClick={handleSendMessage}
                disabled={!messageText.trim()}
                data-testid="button-send-message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Send className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2" data-testid="text-select-group-title">
              Select a group to start chatting
            </h3>
            <p className="text-muted-foreground" data-testid="text-select-group-description">
              Choose a family group from the dropdown above to join the conversation
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
