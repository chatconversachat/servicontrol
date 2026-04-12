import { useState, useCallback } from 'react';
import { getNotificationSettings } from './useNotificationSettings';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'status_change' | 'new_service' | 'payment' | 'overdue' | 'value_change' | 'info';
  timestamp: Date;
  read: boolean;
  serviceId?: string;
}

const STORAGE_KEY = 'servicontrol_notifications';

function loadNotifications(): AppNotification[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored).map((n: any) => ({ ...n, timestamp: new Date(n.timestamp) }));
    }
  } catch {
    return [];
  }
  return [];
}

function persistNotifications(notifications: AppNotification[]) {
  // Keep last 50
  const trimmed = notifications.slice(0, 50);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>(loadNotifications);

  const addNotification = useCallback((
    title: string,
    message: string,
    type: AppNotification['type'],
    serviceId?: string
  ) => {
    const prefs = getNotificationSettings();

    // Check if this event type is enabled
    const eventMap: Record<string, keyof typeof prefs> = {
      status_change: 'onStatusChange',
      new_service: 'onNewService',
      payment: 'onPaymentReceived',
      overdue: 'onServiceOverdue',
      value_change: 'onValueChange',
    };

    const prefKey = eventMap[type];
    if (prefKey && !prefs[prefKey]) return; // Event type disabled

    const notification: AppNotification = {
      id: crypto.randomUUID(),
      title,
      message,
      type,
      timestamp: new Date(),
      read: false,
      serviceId,
    };

    setNotifications(prev => {
      const updated = [notification, ...prev];
      persistNotifications(updated);
      return updated;
    });

    // Browser push notification
    if (prefs.pushEnabled && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: message,
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-192.png',
        });
      } catch {
        // Ignore notification errors
      }
    }
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      persistNotifications(updated);
      return updated;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      persistNotifications(updated);
      return updated;
    });
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications, unreadCount, addNotification, markAsRead, markAllAsRead, clearAll };
}
