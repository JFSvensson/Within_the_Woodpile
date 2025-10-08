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
 * Business logic service för highscore-hantering
 * Separerar affärslogik från storage-implementation
 * Följer Clean Architecture-principerna
 */
export class HighscoreService {
  constructor(
    private readonly repository: IHighscoreRepository
  ) {}

  /**
   * Hämtar alla highscores med metadata
   */
  async getAllHighscores(): Promise<HighscoreList> {
    try {
      return await this.repository.getAll()
    } catch (error) {
      throw new HighscoreError(
        'Failed to retrieve highscores',
        'SERVICE_ERROR',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      )
    }
  }

  /**
   * Hämtar top N highscores (default top 10)
   */
  async getTopHighscores(count: number = 10): Promise<ReadonlyArray<HighscoreEntry>> {
    if (count <= 0) {
      throw new HighscoreError(
        'Count must be greater than zero',
        'INVALID_INPUT',
        { count }
      )
    }

    try {
      return await this.repository.getTop(count)
    } catch (error) {
      throw new HighscoreError(
        'Failed to retrieve top highscores',
        'SERVICE_ERROR',
        { count, error: error instanceof Error ? error.message : 'Unknown error' }
      )
    }
  }

  /**
   * Lägger till ny highscore med business validation
   */
  async addHighscore(input: NewHighscoreInput): Promise<HighscoreEntry> {
    // Business validation
    this.validateNewHighscoreInput(input)
    
    try {
      const entry = await this.repository.add(input)
      
      // Business logic: Logga om detta är en ny personlig rekord
      await this.logPersonalRecord(entry)
      
      return entry
    } catch (error) {
      throw new HighscoreError(
        'Failed to add highscore',
        'SERVICE_ERROR',
        { input, error: error instanceof Error ? error.message : 'Unknown error' }
      )
    }
  }

  /**
   * Kontrollerar om en poäng kvalificerar för top 10
   */
  async checkQualification(score: number): Promise<QualificationResult> {
    if (score < 0) {
      throw new HighscoreError(
        'Score cannot be negative',
        'INVALID_INPUT',
        { score }
      )
    }

    try {
      return await this.repository.qualifiesForTop10(score)
    } catch (error) {
      throw new HighscoreError(
        'Failed to check qualification',
        'SERVICE_ERROR',
        { score, error: error instanceof Error ? error.message : 'Unknown error' }
      )
    }
  }

  /**
   * Hämtar highscores för en specifik spelare
   */
  async getPlayerHighscores(playerName: string): Promise<ReadonlyArray<HighscoreEntry>> {
    if (!playerName || playerName.trim().length === 0) {
      throw new HighscoreError(
        'Player name cannot be empty',
        'INVALID_INPUT',
        { playerName }
      )
    }

    try {
      const entries = await this.repository.getByPlayer(playerName.trim())
      return [...entries].sort((a: HighscoreEntry, b: HighscoreEntry) => b.score - a.score) // Sortera efter högsta poäng först
    } catch (error) {
      throw new HighscoreError(
        'Failed to retrieve player highscores',
        'SERVICE_ERROR',
        { playerName, error: error instanceof Error ? error.message : 'Unknown error' }
      )
    }
  }

  /**
   * Beräknar och returnerar statistik
   */
  async getStatistics(): Promise<HighscoreStats> {
    try {
      return await this.repository.getStats()
    } catch (error) {
      throw new HighscoreError(
        'Failed to calculate statistics',
        'SERVICE_ERROR',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      )
    }
  }

  /**
   * Hämtar personlig rekord för en spelare
   */
  async getPersonalBest(playerName: string): Promise<HighscoreEntry | null> {
    const playerScores = await this.getPlayerHighscores(playerName)
    return playerScores.length > 0 ? playerScores[0] : null
  }

  /**
   * Kontrollerar om poäng är nytt personligt rekord
   */
  async isPersonalRecord(playerName: string, score: number): Promise<boolean> {
    const personalBest = await this.getPersonalBest(playerName)
    return !personalBest || score > personalBest.score
  }

  /**
   * Hämtar ranking för en specifik spelare
   */
  async getPlayerRanking(playerName: string): Promise<{
    currentRank: number | null;
    totalPlayers: number;
    bestScore: number | null;
  }> {
    try {
      const personalBest = await this.getPersonalBest(playerName)
      if (!personalBest) {
        const stats = await this.getStatistics()
        return {
          currentRank: null,
          totalPlayers: this.countUniquePlayers(stats),
          bestScore: null
        }
      }

      const topScores = await this.repository.getTop(100) // Hämta mer för att hitta position
      const rank = topScores.findIndex(entry => 
        entry.playerName.toLowerCase() === playerName.toLowerCase() && 
        entry.score === personalBest.score
      ) + 1

      const stats = await this.getStatistics()
      
      return {
        currentRank: rank > 0 ? rank : null,
        totalPlayers: this.countUniquePlayers(stats),
        bestScore: personalBest.score
      }
    } catch (error) {
      throw new HighscoreError(
        'Failed to get player ranking',
        'SERVICE_ERROR',
        { playerName, error: error instanceof Error ? error.message : 'Unknown error' }
      )
    }
  }

  /**
   * Exporterar highscores för backup
   */
  async exportHighscores(): Promise<HighscoreExport> {
    try {
      return await this.repository.export()
    } catch (error) {
      throw new HighscoreError(
        'Failed to export highscores',
        'SERVICE_ERROR',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      )
    }
  }

  /**
   * Importerar highscores från backup
   */
  async importHighscores(exportData: HighscoreExport): Promise<void> {
    // Business validation av import-data
    this.validateImportData(exportData)
    
    try {
      await this.repository.import(exportData)
    } catch (error) {
      throw new HighscoreError(
        'Failed to import highscores',
        'SERVICE_ERROR',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      )
    }
  }

  /**
   * Rensar alla highscores (med bekräftelse)
   */
  async clearAllHighscores(): Promise<void> {
    try {
      await this.repository.clear()
    } catch (error) {
      throw new HighscoreError(
        'Failed to clear highscores',
        'SERVICE_ERROR',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      )
    }
  }

  /**
   * Hämtar achievements baserat på statistik
   */
  async getAchievements(playerName?: string): Promise<{
    totalGamesPlayed: number;
    averageScore: number;
    bestScore: number;
    gamesInTop10: number;
    consistencyRating: 'Excellent' | 'Good' | 'Average' | 'Needs Improvement';
  }> {
    try {
      let entries: ReadonlyArray<HighscoreEntry>
      
      if (playerName) {
        entries = await this.getPlayerHighscores(playerName)
      } else {
        const allHighscores = await this.getAllHighscores()
        entries = allHighscores.entries
      }

      if (entries.length === 0) {
        return {
          totalGamesPlayed: 0,
          averageScore: 0,
          bestScore: 0,
          gamesInTop10: 0,
          consistencyRating: 'Needs Improvement'
        }
      }

      const totalGames = entries.length
      const averageScore = entries.reduce((sum, entry) => sum + entry.score, 0) / totalGames
      const bestScore = Math.max(...entries.map(entry => entry.score))
      
      // Räkna spel i top 10
      const top10 = await this.getTopHighscores(10)
      const gamesInTop10 = playerName 
        ? top10.filter(entry => entry.playerName.toLowerCase() === playerName.toLowerCase()).length
        : Math.min(totalGames, 10)

      // Beräkna consistency rating baserat på standardavvikelse
      const variance = entries.reduce((sum, entry) => sum + Math.pow(entry.score - averageScore, 2), 0) / totalGames
      const standardDeviation = Math.sqrt(variance)
      const coefficientOfVariation = standardDeviation / averageScore

      let consistencyRating: 'Excellent' | 'Good' | 'Average' | 'Needs Improvement'
      if (coefficientOfVariation < 0.2) consistencyRating = 'Excellent'
      else if (coefficientOfVariation < 0.4) consistencyRating = 'Good'
      else if (coefficientOfVariation < 0.6) consistencyRating = 'Average'
      else consistencyRating = 'Needs Improvement'

      return {
        totalGamesPlayed: totalGames,
        averageScore: Math.round(averageScore),
        bestScore,
        gamesInTop10,
        consistencyRating
      }
    } catch (error) {
      throw new HighscoreError(
        'Failed to calculate achievements',
        'SERVICE_ERROR',
        { playerName, error: error instanceof Error ? error.message : 'Unknown error' }
      )
    }
  }

  /**
   * Privata hjälpmetoder för business logic
   */

  private validateNewHighscoreInput(input: NewHighscoreInput): void {
    if (!input.playerName || input.playerName.trim().length === 0) {
      throw new HighscoreError(
        'Player name is required',
        'INVALID_INPUT',
        { input }
      )
    }

    if (input.playerName.trim().length > 50) {
      throw new HighscoreError(
        'Player name cannot exceed 50 characters',
        'INVALID_INPUT',
        { input }
      )
    }

    if (input.score < 0) {
      throw new HighscoreError(
        'Score cannot be negative',
        'INVALID_INPUT',
        { input }
      )
    }

    if (input.score > 1000000) {
      throw new HighscoreError(
        'Score seems unrealistic',
        'INVALID_INPUT',
        { input }
      )
    }

    if (input.level < 1) {
      throw new HighscoreError(
        'Level must be at least 1',
        'INVALID_INPUT',
        { input }
      )
    }

    if (input.playDuration < 0) {
      throw new HighscoreError(
        'Play duration cannot be negative',
        'INVALID_INPUT',
        { input }
      )
    }
  }

  private validateImportData(data: HighscoreExport): void {
    if (!data.version) {
      throw new HighscoreError(
        'Import data must have version information',
        'INVALID_IMPORT_DATA',
        { data }
      )
    }

    if (!data.exportDate || !(data.exportDate instanceof Date)) {
      throw new HighscoreError(
        'Import data must have valid export date',
        'INVALID_IMPORT_DATA',
        { data }
      )
    }

    // Kontrollera att export-datum inte är i framtiden
    if (data.exportDate > new Date()) {
      throw new HighscoreError(
        'Export date cannot be in the future',
        'INVALID_IMPORT_DATA',
        { data }
      )
    }
  }

  private async logPersonalRecord(entry: HighscoreEntry): Promise<void> {
    try {
      const isRecord = await this.isPersonalRecord(entry.playerName, entry.score)
      if (isRecord) {
        // Här skulle vi kunna logga eller skicka notifikation om personligt rekord
        console.log(`🎉 New personal record for ${entry.playerName}: ${entry.score} points!`)
      }
    } catch (error) {
      // Vi vill inte att logging ska påverka huvudfunktionaliteten
      console.warn('Failed to check personal record:', error)
    }
  }

  private countUniquePlayers(stats: HighscoreStats): number {
    // Denna metod skulle kunna utökas för att räkna unika spelare
    // För nu returnerar vi en approximation baserat på befintlig statistik
    return stats.totalGames > 0 ? Math.ceil(stats.totalGames / 3) : 0
  }
}