// Firebase service worker for handling background push notifications
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize Firebase in service worker
// Note: Service workers can't access import.meta.env, so we'll fetch the config dynamically
let firebaseConfig = null;

// Fetch Firebase config from the main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    firebaseConfig = event.data.config;
    initializeFirebaseMessaging();
  }
});

function initializeFirebaseMessaging() {
  if (!firebaseConfig) {
    console.warn('Firebase config not available in service worker');
    return;
  }

  try {
    firebase.initializeApp(firebaseConfig);
    console.log('Firebase initialized in service worker with config:', { 
      projectId: firebaseConfig.projectId, 
      messagingSenderId: firebaseConfig.messagingSenderId 
    });

    // Initialize messaging after Firebase is configured
    const messaging = firebase.messaging();

    // Handle background messages
    messaging.onBackgroundMessage((payload) => {
      console.log('Background message received:', payload);

      const notificationTitle = payload.notification?.title || 'My Branches';
      const notificationOptions = {
        body: payload.notification?.body || 'You have a new notification',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-96x96.png',
        data: payload.data || {},
        actions: [
          {
            action: 'open',
            title: 'Open App',
          },
        ],
      };

      self.registration.showNotification(notificationTitle, notificationOptions);
    });

  } catch (error) {
    console.error('Error initializing Firebase in service worker:', error);
    return;
  }
}


// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  // Handle deep linking based on notification data
  const data = event.notification.data;
  let url = '/';

  if (data) {
    if (data.type === 'chat_message' && data.groupId) {
      url = `/groups/${data.groupId}/chat`;
    } else if (data.type === 'new_event' && data.eventId) {
      url = `/events/${data.eventId}`;
    } else if (data.type === 'task_assigned' && data.taskId) {
      url = `/tasks/${data.taskId}`;
    } else if (data.clickAction) {
      url = data.clickAction;
    }
  }

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Check if a client window is already open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(location.origin) && 'focus' in client) {
          // Navigate to the target URL and focus the window
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            url: url,
          });
          return client.focus();
        }
      }
      
      // If no client window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(location.origin + url);
      }
    })
  );
});