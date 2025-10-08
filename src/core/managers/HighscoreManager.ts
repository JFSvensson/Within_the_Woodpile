import type { I18n } from '../../infrastructure/i18n/I18n.js'
import { HighscoreService } from '../services/HighscoreService.js'
import { HighscoreI18nService } from '../services/HighscoreI18nService.js'
import type { 
  IHighscoreRepository,
  HighscoreEntry,
  NewHighscoreInput,
  HighscoreList,
  HighscoreStats,
  HighscoreExport,
  QualificationResult
} from '../../types/index.js'
import { HighscoreError } from '../../types/index.js'

/**
 * Högsta nivå manager för highscore-systemet
 * Kombinerar business logic med internationalisering
 * Är huvudsaklig interface för UI-komponenter
 */
export class HighscoreManager {
  private readonly highscoreService: HighscoreService
  private readonly i18nService: HighscoreI18nService

  constructor(
    repository: IHighscoreRepository,
    i18n: I18n
  ) {
    this.highscoreService = new HighscoreService(repository)
    this.i18nService = new HighscoreI18nService(i18n)
  }

  /**
   * Hämtar alla highscores med formattering
   */
  async getAllHighscores(): Promise<{
    entries: Array<{
      entry: HighscoreEntry;
      formatted: {
        position: string;
        playerName: string;
        score: string;
        level: string;
        duration: string;
        date: string;
      };
    }>;
    maxEntries: number;
    lastUpdated: string;
  }> {
    const highscores = await this.highscoreService.getAllHighscores()
    
    return {
      entries: highscores.entries.map((entry: HighscoreEntry, index: number) => ({
        entry,
        formatted: this.i18nService.formatEntryForDisplay(entry, index + 1)
      })),
      maxEntries: highscores.maxEntries,
      lastUpdated: this.i18nService.formatDate(highscores.lastUpdated)
    }
  }

  /**
   * Hämtar top N highscores med formattering
   */
  async getTopHighscores(count: number = 10): Promise<Array<{
    entry: HighscoreEntry;
    formatted: {
      position: string;
      playerName: string;
      score: string;
      level: string;
      duration: string;
      date: string;
    };
  }>> {
    const entries = await this.highscoreService.getTopHighscores(count)
    
    return entries.map((entry: HighscoreEntry, index: number) => ({
      entry,
      formatted: this.i18nService.formatEntryForDisplay(entry, index + 1)
    }))
  }

  /**
   * Lägger till ny highscore med validering och meddelanden
   */
  async addHighscore(input: NewHighscoreInput): Promise<{
    entry: HighscoreEntry;
    messages: {
      success: string;
      isPersonalBest: boolean;
      personalBestMessage?: string;
    };
  }> {
    try {
      // Kontrollera om det blir personligt rekord
      const isPersonalBest = await this.highscoreService.isPersonalRecord(
        input.playerName, 
        input.score
      )
      
      // Lägg till highscore
      const entry = await this.highscoreService.addHighscore(input)
      
      // Generera meddelanden
      const successMessage = this.i18nService.getNewRecordMessage(entry, isPersonalBest)
      
      return {
        entry,
        messages: {
          success: successMessage,
          isPersonalBest,
          personalBestMessage: isPersonalBest ? this.i18nService.getNewRecordMessage(entry, true) : undefined
        }
      }
    } catch (error) {
      if (error instanceof HighscoreError) {
        const message = this.i18nService.getErrorMessage(error)
        throw new HighscoreError(message, error.code, error.context)
      }
      throw error
    }
  }

  /**
   * Kontrollerar kvalifikation med meddelande
   */
  async checkQualification(score: number): Promise<{
    result: QualificationResult;
    message: string;
  }> {
    const result = await this.highscoreService.checkQualification(score)
    const message = this.i18nService.getQualificationMessage(result, score)
    
    return { result, message }
  }

  /**
   * Hämtar spelares highscores med formattering
   */
  async getPlayerHighscores(playerName: string): Promise<{
    entries: Array<{
      entry: HighscoreEntry;
      formatted: {
        position: string;
        playerName: string;
        score: string;
        level: string;
        duration: string;
        date: string;
      };
    }>;
    personalBest: HighscoreEntry | null;
    ranking: {
      currentRank: string;
      totalPlayers: string;
      bestScore: string;
    };
  }> {
    const [entries, personalBest, ranking] = await Promise.all([
      this.highscoreService.getPlayerHighscores(playerName),
      this.highscoreService.getPersonalBest(playerName),
      this.highscoreService.getPlayerRanking(playerName)
    ])
    
    const rankingFormatted = this.i18nService.formatRanking(ranking)
    
    return {
      entries: entries.map((entry: HighscoreEntry, index: number) => ({
        entry,
        formatted: this.i18nService.formatEntryForDisplay(entry, index + 1)
      })),
      personalBest,
      ranking: {
        currentRank: rankingFormatted.currentRank,
        totalPlayers: rankingFormatted.totalPlayers,
        bestScore: rankingFormatted.bestScore
      }
    }
  }

  /**
   * Hämtar statistik med formattering
   */
  async getStatistics(): Promise<{
    raw: HighscoreStats;
    formatted: Record<string, string>;
  }> {
    const stats = await this.highscoreService.getStatistics()
    
    return {
      raw: stats,
      formatted: this.i18nService.formatStatistics(stats)
    }
  }

  /**
   * Hämtar achievements med formattering
   */
  async getAchievements(playerName?: string): Promise<{
    raw: {
      totalGamesPlayed: number;
      averageScore: number;
      bestScore: number;
      gamesInTop10: number;
      consistencyRating: 'Excellent' | 'Good' | 'Average' | 'Needs Improvement';
    };
    formatted: Record<string, string>;
  }> {
    const achievements = await this.highscoreService.getAchievements(playerName)
    
    return {
      raw: achievements,
      formatted: this.i18nService.formatAchievements(achievements)
    }
  }

  /**
   * Exporterar highscores med meddelande
   */
  async exportHighscores(): Promise<{
    data: HighscoreExport;
    message: string;
  }> {
    try {
      const data = await this.highscoreService.exportHighscores()
      const message = this.i18nService.getExportSuccessMessage(data.entries.length)
      
      return { data, message }
    } catch (error) {
      if (error instanceof HighscoreError) {
        const message = this.i18nService.getErrorMessage(error)
        throw new HighscoreError(message, error.code, error.context)
      }
      throw error
    }
  }

  /**
   * Importerar highscores med meddelande
   */
  async importHighscores(exportData: HighscoreExport): Promise<{
    message: string;
  }> {
    try {
      await this.highscoreService.importHighscores(exportData)
      const message = this.i18nService.getImportSuccessMessage(exportData.entries.length)
      
      return { message }
    } catch (error) {
      if (error instanceof HighscoreError) {
        const message = this.i18nService.getErrorMessage(error)
        throw new HighscoreError(message, error.code, error.context)
      }
      throw error
    }
  }

  /**
   * Rensar alla highscores med bekräftelse
   */
  async clearAllHighscores(): Promise<{
    confirmationMessage: string;
    clearFunction: () => Promise<void>;
  }> {
    const confirmationMessage = this.i18nService.getClearConfirmationMessage()
    
    const clearFunction = async () => {
      try {
        await this.highscoreService.clearAllHighscores()
      } catch (error) {
        if (error instanceof HighscoreError) {
          const message = this.i18nService.getErrorMessage(error)
          throw new HighscoreError(message, error.code, error.context)
        }
        throw error
      }
    }
    
    return { confirmationMessage, clearFunction }
  }

  /**
   * Validerar input med lokaliserade meddelanden
   */
  validateInput(input: Partial<NewHighscoreInput>): {
    isValid: boolean;
    errors: Array<{ field: string; message: string }>;
  } {
    const errors: Array<{ field: string; message: string }> = []
    
    // Validera spelarnamn
    if (input.playerName !== undefined) {
      if (!input.playerName || input.playerName.trim().length === 0) {
        errors.push({
          field: 'playerName',
          message: this.i18nService.getValidationMessage('playerName', input.playerName)
        })
      } else if (input.playerName.length > 50) {
        errors.push({
          field: 'playerName',
          message: this.i18nService.getValidationMessage('playerName', input.playerName)
        })
      }
    }
    
    // Validera poäng
    if (input.score !== undefined) {
      if (input.score < 0) {
        errors.push({
          field: 'score',
          message: this.i18nService.getValidationMessage('score', input.score)
        })
      } else if (input.score > 1000000) {
        errors.push({
          field: 'score',
          message: this.i18nService.getValidationMessage('score', input.score)
        })
      }
    }
    
    // Validera nivå
    if (input.level !== undefined && input.level < 1) {
      errors.push({
        field: 'level',
        message: this.i18nService.getValidationMessage('level', input.level)
      })
    }
    
    // Validera speltid
    if (input.playDuration !== undefined && input.playDuration < 0) {
      errors.push({
        field: 'playDuration',
        message: this.i18nService.getValidationMessage('playDuration', input.playDuration)
      })
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Formaterar enskild highscore för visning
   */
  formatEntry(entry: HighscoreEntry, position?: number): {
    entry: HighscoreEntry;
    formatted: {
      position: string;
      playerName: string;
      score: string;
      level: string;
      duration: string;
      date: string;
    };
  } {
    return {
      entry,
      formatted: this.i18nService.formatEntryForDisplay(entry, position)
    }
  }
}