/**
 * Simple manager for Browser Notifications
 */
export class NotificationManager {
  static async requestPermission() {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  static async sendNotification(title: string, options?: NotificationOptions) {
    if (Notification.permission === 'granted') {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          registration.showNotification(title, {
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            ...options
          });
        } else {
          new Notification(title, options);
        }
      } catch (error) {
        console.error('Error sending notification:', error);
      }
    }
  }
}
