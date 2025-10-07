import type { StorageService, GameData } from './interfaces.js';
import { LocalStorageService } from './LocalStorageService.js';

/**
 * Repository för speldata med default-värden
 */
export class GameDataRepository {
  private storage: StorageService;
  private readonly GAME_DATA_KEY = 'within-woodpile-game-data';

  constructor(storage?: StorageService) {
    this.storage = storage || new LocalStorageService();
  }

  /**
   * Hämtar speldata med fallback till defaults
   */
  getGameData(): GameData {
    const stored = this.storage.getItem<GameData>(this.GAME_DATA_KEY);
    
    return {
      highScore: stored?.highScore || 0,
      totalGamesPlayed: stored?.totalGamesPlayed || 0,
      bestReactionTime: stored?.bestReactionTime || Infinity,
      settings: {
        volume: stored?.settings?.volume || 0.7,
        difficulty: stored?.settings?.difficulty || 'normal',
        showHints: stored?.settings?.showHints ?? true
      }
    };
  }

  /**
   * Sparar speldata
   */
  saveGameData(data: GameData): void {
    this.storage.setItem(this.GAME_DATA_KEY, data);
  }

  /**
   * Uppdaterar high score om det är bättre
   */
  updateHighScore(score: number): boolean {
    const data = this.getGameData();
    if (score > data.highScore) {
      data.highScore = score;
      this.saveGameData(data);
      return true; // Nytt rekord!
    }
    return false;
  }

  /**
   * Ökar antal spelade spel
   */
  incrementGamesPlayed(): void {
    const data = this.getGameData();
    data.totalGamesPlayed++;
    this.saveGameData(data);
  }

  /**
   * Uppdaterar bästa reaktionstid
   */
  updateBestReactionTime(reactionTime: number): boolean {
    const data = this.getGameData();
    if (reactionTime < data.bestReactionTime) {
      data.bestReactionTime = reactionTime;
      this.saveGameData(data);
      return true; // Ny rekord-reaktionstid!
    }
    return false;
  }

  /**
   * Uppdaterar inställningar
   */
  updateSettings(settings: Partial<GameData['settings']>): void {
    const data = this.getGameData();
    data.settings = { ...data.settings, ...settings };
    this.saveGameData(data);
  }

  /**
   * Återställer all speldata
   */
  resetGameData(): void {
    this.storage.removeItem(this.GAME_DATA_KEY);
  }
}