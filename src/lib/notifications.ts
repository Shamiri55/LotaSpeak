import { toast } from 'react-hot-toast';

export const NotificationService = {
  async requestPermission() {
    if (!('Notification' in window)) {
      console.log('This browser does not support desktop notification');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  },

  sendNotification(title: string, options?: NotificationOptions) {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/favicon.ico',
        ...options,
      });
    } else {
      // Fallback to toast if notification permission is not granted
      toast(title, {
        icon: '🔔',
        duration: 5000,
      });
    }
  },

  scheduleReminder(minutes: number) {
    const reminderTime = Date.now() + minutes * 60 * 1000;
    localStorage.setItem('practice-reminder', reminderTime.toString());
    
    // For demo purposes, we'll also set a timeout if the app is open
    setTimeout(() => {
      this.sendNotification('Temps de pratiquer !', {
        body: 'Revenez sur LinguoSpeed pour votre session quotidienne.',
        tag: 'practice-reminder'
      });
    }, minutes * 60 * 1000);
    
    toast.success(`Rappel programmé dans ${minutes} minutes !`);
  },

  checkReminders() {
    const savedReminder = localStorage.getItem('practice-reminder');
    if (savedReminder) {
      const reminderTime = parseInt(savedReminder, 10);
      if (Date.now() >= reminderTime) {
        this.sendNotification('Rappel de pratique', {
          body: 'C\'est le moment idéal pour une petite leçon !',
          tag: 'practice-reminder'
        });
        localStorage.removeItem('practice-reminder');
      }
    }
  }
};
