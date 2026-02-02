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

    private async fetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
        const queryParams = new URLSearchParams({
            key: this.apiKey,
            token: this.token,
            ...params,
        });

        const response = await fetch(`${BASE_URL}${path}?${queryParams}`);

        if (!response.ok) {
            throw new Error(`Trello API Error: ${response.statusText}`);
        }

        return response.json();
    }

    async getBoards(): Promise<TrelloBoard[]> {
        return this.fetch<TrelloBoard[]>('/members/me/boards');
    }

    async getLists(boardId: string): Promise<TrelloList[]> {
        return this.fetch<TrelloList[]>(`/boards/${boardId}/lists`);
    }

    async getCards(boardId: string): Promise<TrelloCard[]> {
        return this.fetch<TrelloCard[]>(`/boards/${boardId}/cards`);
    }
}

export const createTrelloClient = () => {
    const { apiKey, token } = getTrelloSettings();

    if (!apiKey || !token) {
        console.warn('Trello API key or token missing in configuration');
    }

    return new TrelloClient(apiKey || '', token || '');
};
