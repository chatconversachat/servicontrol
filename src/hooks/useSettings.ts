import { useState, useEffect } from 'react';
import { TrelloBoard } from '@/integrations/trello/types';

const STORAGE_KEY = 'servicontrol_trello_settings';

export interface TrelloSettings {
    apiKey: string;
    token: string;
    boardIds: string[];
    savedBoards: TrelloBoard[]; // Persist the full board objects for UI display
}

// Fallback to Env vars if localStorage is empty
const defaultSettings: TrelloSettings = {
    apiKey: import.meta.env.VITE_TRELLO_API_KEY || '',
    token: import.meta.env.VITE_TRELLO_TOKEN || '',
    boardIds: import.meta.env.VITE_TRELLO_BOARD_ID ? [import.meta.env.VITE_TRELLO_BOARD_ID] : [],
    savedBoards: [],
};

export const useSettings = () => {
    const [settings, setSettings] = useState<TrelloSettings>(defaultSettings);

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            // Migration for old single boardId
            if (parsed.boardId && !parsed.boardIds) {
                parsed.boardIds = [parsed.boardId];
                delete parsed.boardId;
            }
            // Ensure savedBoards exists
            if (!parsed.savedBoards) {
                parsed.savedBoards = [];
            }
            setSettings(parsed);
        }
    }, []);

    const saveSettings = (newSettings: TrelloSettings) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
        setSettings(newSettings);
    };

    return {
        settings,
        saveSettings
    };
};

export const getTrelloSettings = (): TrelloSettings => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.boardId && !parsed.boardIds) {
            parsed.boardIds = [parsed.boardId];
        }
        if (!parsed.savedBoards) {
            parsed.savedBoards = [];
        }
        return parsed;
    }
    return defaultSettings;
}
