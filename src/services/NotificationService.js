import { LocalNotifications } from '@capacitor/local-notifications';

export class NotificationService {
  /**
   * Request permissions for local notifications.
   */
  static async requestPermissions() {
    try {
      const { display } = await LocalNotifications.requestPermissions();
      return display === 'granted';
    } catch (e) {
      console.error('Error requesting notification permissions', e);
      return false;
    }
  }

  /**
   * Schedule a daily portfolio summary notification.
   * @param {string} title 
   * @param {string} body 
   */
  static async scheduleDailySummary(title, body) {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return;

      // Cancel any previously scheduled summary (with id 1)
      await LocalNotifications.cancel({ notifications: [{ id: 1 }] });

      // Schedule at 10:00 AM every day
      await LocalNotifications.schedule({
        notifications: [
          {
            title: title,
            body: body,
            id: 1,
            schedule: { 
              on: { hour: 10, minute: 0 }, 
              allowWhileIdle: true 
            },
            sound: null, // default sound
            attachments: null,
            actionTypeId: '',
            extra: null
          }
        ]
      });
      console.log('Daily summary notification scheduled');
    } catch (e) {
      console.error('Error scheduling daily summary notification', e);
    }
  }

  /**
   * Send an immediate local notification (e.g., price alert reached).
   * @param {string} title 
   * @param {string} body 
   * @param {number} id 
   */
  static async triggerImmediateNotification(title, body, id = Math.floor(Math.random() * 100000)) {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return;

      await LocalNotifications.schedule({
        notifications: [
          {
            title: title,
            body: body,
            id: id,
            schedule: { at: new Date(Date.now() + 1000) }, // 1 second from now
          }
        ]
      });
    } catch (e) {
      console.error('Error triggering immediate notification', e);
    }
  }
}
