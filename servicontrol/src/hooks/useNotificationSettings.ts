import { useState, useCallback } from 'react';

const STORAGE_KEY = 'servicontrol_notification_settings';

export interface NotificationPreferences {
  pushEnabled: boolean;
  whatsappEnabled: boolean;
  whatsappNumber: string;
  // Event toggles
  onStatusChange: boolean;
  onNewService: boolean;
  onPaymentReceived: boolean;
  onServiceOverdue: boolean;
  onValueChange: boolean;
}

const defaultPreferences: NotificationPreferences = {
  pushEnabled: false,
  whatsappEnabled: false,
  whatsappNumber: '',
  onStatusChange: true,
  onNewService: true,
  onPaymentReceived: true,
  onServiceOverdue: true,
  onValueChange: false,
};

export function getNotificationSettings(): NotificationPreferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...defaultPreferences, ...JSON.parse(stored) };
  } catch {}
  return defaultPreferences;
}

export function useNotificationSettings() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(getNotificationSettings);

  const savePreferences = useCallback((updated: Partial<NotificationPreferences>) => {
    setPreferences(prev => {
      const next = { ...prev, ...updated };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const requestPushPermission = useCallback(async () => {
    if (!('Notification' in window)) return false;
    const result = await Notification.requestPermission();
    if (result === 'granted') {
      savePreferences({ pushEnabled: true });
      return true;
    }
    return false;
  }, [savePreferences]);

  return { preferences, savePreferences, requestPushPermission };
}
