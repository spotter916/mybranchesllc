import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, Calendar, CheckSquare, Gift, Clock, UserCheck, UserX, Home } from "lucide-react";
import { format, formatDistance, formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface JoinRequest {
  id: string;
  type: string;
  targetId: string;
  requesterId: string;
  message: string | null;
  createdAt: Date;
  targetName: string;
  requester: {
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  };
}

export default function Dashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stats } = useQuery<{
    memberCount: number;
    groupCount: number;
    eventCount: number;
    taskCount: number;
  }>({
    queryKey: ['/api/dashboard/stats'],
  });

  const { data: birthdays } = useQuery<Array<{ name: string; birthday: Date; daysAway: number }>>({
    queryKey: ['/api/dashboard/birthdays'],
  });

  const { data: activity } = useQuery<Array<{ message: string; time: Date; type: string }>>({
    queryKey: ['/api/dashboard/activity'],
  });

  const { data: joinRequests } = useQuery<JoinRequest[]>({
    queryKey: ['/api/dashboard/join-requests'],
  });

  const handleJoinRequestMutation = useMutation({
    mutationFn: async ({ requestId, action }: { requestId: string; action: 'approve' | 'deny' }) => {
      const response = await apiRequest('PATCH', `/api/dashboard/join-requests/${requestId}`, { action });
      return response.json();
    },
    onSuccess: (_, { action }) => {
      toast({
        title: "Success",
        description: `Join request ${action === 'approve' ? 'approved' : 'denied'} successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/join-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to handle join request",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-dashboard-title">
          Welcome back!
        </h1>
        <p className="text-muted-foreground" data-testid="text-dashboard-subtitle">
          Here's what's happening in your family network
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Link href="/household">
          <Card data-testid="card-stats-members" className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Family Members</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-member-count">
                    {stats?.memberCount || 0}
                  </p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/groups">
          <Card data-testid="card-stats-groups" className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Active Groups</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-group-count">
                    {stats?.groupCount || 0}
                  </p>
                </div>
                <UserPlus className="h-8 w-8 text-secondary" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/events">
          <Card data-testid="card-stats-events" className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Upcoming Events</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-event-count">
                    {stats?.eventCount || 0}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-accent" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/events">
          <Card data-testid="card-stats-tasks" className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Pending Tasks</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-task-count">
                    {stats?.taskCount || 0}
                  </p>
                </div>
                <CheckSquare className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Pending Join Requests */}
      {joinRequests && joinRequests.length > 0 && (
        <Card data-testid="card-join-requests">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              Pending Join Requests ({joinRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {joinRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`join-request-${request.id}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-1">
                        {request.type === 'household' ? (
                          <Home className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Users className="h-4 w-4 text-muted-foreground" />
                        )}
                        <p className="font-medium text-sm" data-testid="text-target-name">
                          {request.targetName}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium" data-testid="text-requester-name">
                        {request.requester.firstName} {request.requester.lastName}
                      </p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Birthdays */}
        <Link href="/contacts">
          <Card data-testid="card-birthdays" className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-accent" />
                Upcoming Birthdays
              </CardTitle>
            </CardHeader>
          <CardContent>
            {birthdays && birthdays.length > 0 ? (
              <div className="space-y-3">
                {birthdays.map((birthday, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    data-testid={`birthday-${index}`}
                  >
                    <div>
                      <p className="font-medium text-foreground" data-testid={`text-birthday-name-${index}`}>
                        {birthday.name}
                      </p>
                      <p className="text-sm text-muted-foreground" data-testid={`text-birthday-date-${index}`}>
                        {format(new Date(birthday.birthday), 'MMMM do')}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-accent" data-testid={`text-birthday-days-${index}`}>
                      {birthday.daysAway === 0 ? 'Today!' : `${birthday.daysAway} days`}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground" data-testid="text-no-birthdays">
                No upcoming birthdays in the next 30 days
              </p>
            )}
          </CardContent>
        </Card>
        </Link>

        {/* Recent Activity */}
        <Card data-testid="card-activity" className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activity && activity.length > 0 ? (
              <div className="space-y-3">
                {activity.map((item, index) => (
                  <div 
                    key={index}
                    className="flex items-start space-x-3 p-3 hover:bg-muted rounded-lg"
                    data-testid={`activity-${index}`}
                  >
                    <Calendar className="h-4 w-4 text-accent mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-foreground" data-testid={`text-activity-message-${index}`}>
                        {item.message}
                      </p>
                      <p className="text-xs text-muted-foreground" data-testid={`text-activity-time-${index}`}>
                        {formatDistance(new Date(item.time), new Date(), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground" data-testid="text-no-activity">
                No recent activity to display
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
