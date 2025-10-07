/**
 * Storage service interfaces
 */
export interface StorageService {
  getItem<T>(key: string): T | null;
  setItem<T>(key: string, value: T): void;
  removeItem(key: string): void;
  clear(): void;
}

export interface GameData {
  highScore: number;
  totalGamesPlayed: number;
  bestReactionTime: number;
  settings: {
    volume: number;
    difficulty: string;
    showHints: boolean;
  };
}