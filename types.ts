
export interface MoveRecord {
  from: string;
  to: string;
  san: string;
  color: 'w' | 'b';
  timestamp: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  thinking?: string;
}

export interface LichessPuzzle {
  puzzle: {
    id: string;
    rating: number;
    plays: number;
    initialPly: number;
    solution: string[];
    themes: string[];
  };
  game: {
    id: string;
    perf: { name: string };
    rated: boolean;
    players: Array<{ name: string; title?: string }>;
    pgn: string;
  };
}
