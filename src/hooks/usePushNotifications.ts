import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications, PushNotificationSchema, ActionPerformed, PushNotificationToken } from '@capacitor/push-notifications';
import { getFirebaseToken, onForegroundMessage } from '@/services/firebase';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface NotificationPreferences {
  enabled: boolean;
  chat: boolean;
  events: boolean;
  tasks: boolean;
  reminders: boolean;
}

export function usePushNotifications() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    enabled: true,
    chat: true,
    events: true,
    tasks: true,
    reminders: true,
  });
  
  const { toast } = useToast();
  const { user } = useAuth() as { user?: { id: string } };

  // Register FCM token with backend
  const registerToken = async (token: string, platform: string = 'web', deviceId?: string) => {
    try {
      await apiRequest('POST', '/api/fcm/register-token', {
        token,
        platform,
        deviceId,
      });
      console.log('FCM token registered successfully');
    } catch (error) {
      console.error('Failed to register FCM token:', error);
    }
  };

  // Initialize push notifications
  const initializePushNotifications = async () => {
    if (!user?.id || isInitialized) return;
    
    setIsLoading(true);
    
    try {
      if (Capacitor.isNativePlatform()) {
        // Native mobile initialization
        console.log('Initializing native push notifications');

        // Check permissions
        const permStatus = await PushNotifications.checkPermissions();
        setPermissionStatus(permStatus.receive);

        if (permStatus.receive === 'prompt') {
          const permission = await PushNotifications.requestPermissions();
          setPermissionStatus(permission.receive);
        }

        if (permStatus.receive === 'granted') {
          await PushNotifications.register();

          // Listen for registration success
          PushNotifications.addListener('registration', async (token: PushNotificationToken) => {
            console.log('Native push registration success, token:', token.value.substring(0, 50) + '...');
            await registerToken(token.value, Capacitor.getPlatform(), Capacitor.getPlatform());
          });

          // Listen for registration error
          PushNotifications.addListener('registrationError', (error: any) => {
            console.error('Error on registration:', error);
          });

          // Listen for push notifications when app is open
          PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
            console.log('Push notification received:', notification);
            
            // Show local notification or toast
            toast({
              title: notification.title || 'New Notification',
              description: notification.body || 'You have a new notification',
            });
          });

          // Listen for push notification actions (when user taps notification)
          PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
            console.log('Push notification action performed:', notification);
            
            // Handle deep linking based on notification data
            const data = notification.notification.data;
            if (data) {
              handleNotificationTap(data);
            }
          });
        }
      } else {
        // Web initialization (Firebase Cloud Messaging)
        console.log('Initializing web push notifications');
        
        // Request notification permission for web
        if ('Notification' in window) {
          const permission = await Notification.requestPermission();
          setPermissionStatus(permission as any);
          
          if (permission === 'granted') {
            // Get FCM token for web
            const token = await getFirebaseToken();
            if (token) {
              await registerToken(token, 'web');
            }

            // Listen for foreground messages
            onForegroundMessage((payload) => {
              console.log('Foreground message received:', payload);
              
              // Show notification
              if (payload.notification) {
                toast({
                  title: payload.notification.title || 'New Notification',
                  description: payload.notification.body || 'You have a new notification',
                });
              }
            });
          }
        }
      }

      // Load user preferences
      await loadNotificationPreferences();
      
      setIsInitialized(true);
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle notification tap (deep linking)
  const handleNotificationTap = (data: any) => {
    try {
      // Route to appropriate page based on notification data
      if (data.type === 'chat_message' && data.groupId) {
        window.location.href = `/groups/${data.groupId}/chat`;
      } else if (data.type === 'new_event' && data.eventId) {
        window.location.href = `/events/${data.eventId}`;
      } else if (data.type === 'task_assigned' && data.taskId) {
        window.location.href = `/tasks/${data.taskId}`;
      } else if (data.clickAction) {
        window.location.href = data.clickAction;
      }
    } catch (error) {
      console.error('Error handling notification tap:', error);
    }
  };

  // Load notification preferences from backend
  const loadNotificationPreferences = async () => {
    try {
      const response = await apiRequest('GET', '/api/fcm/notification-preferences');
      const data = await response.json();
      setPreferences(data);
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }
  };

  // Update notification preferences
  const updateNotificationPreferences = async (newPreferences: Partial<NotificationPreferences>) => {
    try {
      const updatedPreferences = { ...preferences, ...newPreferences };
      
      await apiRequest('POST', '/api/fcm/notification-preferences', updatedPreferences);
      setPreferences(updatedPreferences);
      
      toast({
        title: 'Preferences Updated',
        description: 'Your notification preferences have been saved.',
      });
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to update notification preferences.',
        variant: 'destructive',
      });
    }
  };

  // Request permissions manually
  const requestPermissions = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        const permission = await PushNotifications.requestPermissions();
        setPermissionStatus(permission.receive);
        
        if (permission.receive === 'granted') {
          await PushNotifications.register();
        }
      } else if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        setPermissionStatus(permission as any);
        
        if (permission === 'granted') {
          const token = await getFirebaseToken();
          if (token) {
            await registerToken(token, 'web');
          }
        }
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      toast({
        title: 'Permission Error',
        description: 'Failed to request notification permissions.',
        variant: 'destructive',
      });
    }
  };

  // Initialize on mount and when user changes
  useEffect(() => {
    if (user?.id) {
      initializePushNotifications();
    }
  }, [user?.id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (Capacitor.isNativePlatform()) {
        PushNotifications.removeAllListeners();
      }
    };
  }, []);

  return {
    isInitialized,
    isLoading,
    permissionStatus,
    preferences,
    updateNotificationPreferences,
    requestPermissions,
    loadNotificationPreferences,
  };
}