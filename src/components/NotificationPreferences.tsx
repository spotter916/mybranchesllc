import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bell, BellOff, MessageCircle, Calendar, CheckSquare, Clock } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useAuth } from "@/hooks/useAuth";

export default function NotificationPreferences() {
  const { user } = useAuth() as { user?: { id: string; firstName?: string; lastName?: string } };
  const {
    isInitialized,
    isLoading,
    permissionStatus,
    preferences,
    updateNotificationPreferences,
    requestPermissions,
  } = usePushNotifications();

  const handleToggleNotifications = async (enabled: boolean) => {
    await updateNotificationPreferences({ enabled });
  };

  const handleTogglePreference = async (key: keyof typeof preferences, enabled: boolean) => {
    await updateNotificationPreferences({ [key]: enabled });
  };

  if (!user?.id) {
    return (
      <Alert>
        <AlertDescription>
          Please sign in to manage your notification preferences.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Bell className="h-5 w-5" />
          <span>Push Notifications</span>
        </CardTitle>
        <CardDescription>
          Manage how you receive notifications about chat messages, events, and tasks.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Permission Status */}
        {permissionStatus !== 'granted' && (
          <Alert>
            <BellOff className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                {permissionStatus === 'denied' 
                  ? 'Notification permissions are denied. Please enable them in your browser or device settings.'
                  : 'Notification permissions not granted. Click to enable notifications.'
                }
              </span>
              {permissionStatus === 'prompt' && (
                <Button 
                  size="sm" 
                  onClick={requestPermissions}
                  disabled={isLoading}
                  data-testid="button-request-permissions"
                >
                  Enable Notifications
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Main Toggle */}
        <div className="flex items-center justify-between space-x-2">
          <div className="space-y-0.5">
            <Label htmlFor="notifications-enabled" className="text-base font-medium">
              Push Notifications
            </Label>
            <p className="text-sm text-muted-foreground">
              Receive notifications on this device
            </p>
          </div>
          <Switch
            id="notifications-enabled"
            checked={preferences.enabled}
            onCheckedChange={handleToggleNotifications}
            disabled={isLoading || permissionStatus !== 'granted'}
            data-testid="switch-notifications-enabled"
          />
        </div>

        {/* Individual Preferences */}
        {preferences.enabled && permissionStatus === 'granted' && (
          <div className="space-y-4 pl-4 border-l-2 border-muted">
            <h4 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">
              Notification Types
            </h4>
            
            {/* Chat Messages */}
            <div className="flex items-center justify-between space-x-2">
              <div className="flex items-center space-x-3">
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
                <div className="space-y-0.5">
                  <Label htmlFor="chat-notifications" className="text-sm font-medium">
                    Chat Messages
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    New messages in your group chats
                  </p>
                </div>
              </div>
              <Switch
                id="chat-notifications"
                checked={preferences.chat}
                onCheckedChange={(checked) => handleTogglePreference('chat', checked)}
                disabled={isLoading}
                data-testid="switch-chat-notifications"
              />
            </div>

            {/* Events */}
            <div className="flex items-center justify-between space-x-2">
              <div className="flex items-center space-x-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div className="space-y-0.5">
                  <Label htmlFor="event-notifications" className="text-sm font-medium">
                    New Events
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Events created in your groups
                  </p>
                </div>
              </div>
              <Switch
                id="event-notifications"
                checked={preferences.events}
                onCheckedChange={(checked) => handleTogglePreference('events', checked)}
                disabled={isLoading}
                data-testid="switch-event-notifications"
              />
            </div>

            {/* Tasks */}
            <div className="flex items-center justify-between space-x-2">
              <div className="flex items-center space-x-3">
                <CheckSquare className="h-4 w-4 text-muted-foreground" />
                <div className="space-y-0.5">
                  <Label htmlFor="task-notifications" className="text-sm font-medium">
                    Task Updates
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Task assignments and completions
                  </p>
                </div>
              </div>
              <Switch
                id="task-notifications"
                checked={preferences.tasks}
                onCheckedChange={(checked) => handleTogglePreference('tasks', checked)}
                disabled={isLoading}
                data-testid="switch-task-notifications"
              />
            </div>

            {/* Reminders */}
            <div className="flex items-center justify-between space-x-2">
              <div className="flex items-center space-x-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div className="space-y-0.5">
                  <Label htmlFor="reminder-notifications" className="text-sm font-medium">
                    Event Reminders
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Reminders before your events
                  </p>
                </div>
              </div>
              <Switch
                id="reminder-notifications"
                checked={preferences.reminders}
                onCheckedChange={(checked) => handleTogglePreference('reminders', checked)}
                disabled={isLoading}
                data-testid="switch-reminder-notifications"
              />
            </div>
          </div>
        )}

        {/* Status Info */}
        <div className="text-xs text-muted-foreground border-t pt-4">
          <div className="flex justify-between">
            <span>Status:</span>
            <span className={`font-medium ${
              isInitialized ? 'text-green-600' : 'text-orange-600'
            }`}>
              {isLoading 
                ? 'Initializing...' 
                : isInitialized 
                  ? 'Ready' 
                  : 'Not initialized'
              }
            </span>
          </div>
          <div className="flex justify-between">
            <span>Permissions:</span>
            <span className={`font-medium ${
              permissionStatus === 'granted' ? 'text-green-600' : 
              permissionStatus === 'denied' ? 'text-red-600' : 'text-orange-600'
            }`}>
              {permissionStatus === 'granted' ? 'Allowed' : 
               permissionStatus === 'denied' ? 'Denied' : 'Not requested'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}