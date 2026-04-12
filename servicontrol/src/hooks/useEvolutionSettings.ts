import { useState } from 'react';

const STORAGE_KEY = 'servicontrol_evolution_settings';

export interface EvolutionSettings {
  apiUrl: string;
  apiKey: string;
  instanceName: string;
  connected: boolean;
}

const defaultSettings: EvolutionSettings = {
  apiUrl: '',
  apiKey: '',
  instanceName: '',
  connected: false,
};

export const useEvolutionSettings = () => {
  const [settings, setSettings] = useState<EvolutionSettings>(() => getEvolutionSettings());

  const saveSettings = (newSettings: EvolutionSettings) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    setSettings(newSettings);
  };

  const clearSettings = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSettings(defaultSettings);
  };

  return { settings, saveSettings, clearSettings };
};

export const getEvolutionSettings = (): EvolutionSettings => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return { ...defaultSettings, ...JSON.parse(stored) };
    } catch {
      return defaultSettings;
    }
  }
  return defaultSettings;
};
