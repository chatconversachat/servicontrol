import { TrelloBoard, TrelloCard, TrelloList } from './types';
import { getTrelloSettings } from '@/hooks/useSettings';

const BASE_URL = 'https://api.trello.com/1';

export class TrelloClient {
    private apiKey: string;
    private token: string;

    constructor(apiKey: string, token: string) {
        this.apiKey = apiKey;
        this.token = token;
    }

    private async fetch<T>(path: string, params: Record<string, string> = {}, signal?: AbortSignal): Promise<T> {
        const queryParams = new URLSearchParams({
            key: this.apiKey,
            token: this.token,
            ...params,
        });

        try {
            const response = await fetch(`${BASE_URL}${path}?${queryParams}`, { signal });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Trello API Error: ${response.statusText} (${response.status})`);
            }

            return response.json();
        } catch (error: any) {
            if (error.name === 'AbortError') {
                console.log('Fetch aborted');
                throw error;
            }
            console.error(`Trello API Fetch Error [${path}]:`, error);
            throw error;
        }
    }

    async getBoards(signal?: AbortSignal): Promise<TrelloBoard[]> {
        return this.fetch<TrelloBoard[]>('/members/me/boards', {}, signal);
    }

    async getLists(boardId: string, signal?: AbortSignal): Promise<TrelloList[]> {
        return this.fetch<TrelloList[]>(`/boards/${boardId}/lists`, {}, signal);
    }

    async getCards(boardId: string, signal?: AbortSignal): Promise<TrelloCard[]> {
        return this.fetch<TrelloCard[]>(`/boards/${boardId}/cards`, {}, signal);
    }
}

export const createTrelloClient = () => {
    const { apiKey, token } = getTrelloSettings();

    if (!apiKey || !token) {
        console.warn('Trello API key or token missing in configuration');
    }

    return new TrelloClient(apiKey || '', token || '');
};
