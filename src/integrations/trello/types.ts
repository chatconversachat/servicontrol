export interface TrelloCard {
    id: string;
    name: string;
    desc: string;
    idList: string;
    due: string | null;
    dateLastActivity: string;
    labels: TrelloLabel[];
}

export interface TrelloLabel {
    id: string;
    idBoard: string;
    name: string;
    color: string;
}

export interface TrelloList {
    id: string;
    name: string;
    idBoard: string;
}

export interface TrelloBoard {
    id: string;
    name: string;
    url: string;
}
