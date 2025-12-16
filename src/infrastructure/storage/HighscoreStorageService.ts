import type { 
  IHighscoreRepository,
  HighscoreList,
  HighscoreEntry,
  NewHighscoreInput,
  HighscoreExport,
  HighscoreStats
} from '../../types/index.js'
import { HighscoreError } from '../../types/index.js'
import type { StorageService } from './interfaces.js'
import { APP_VERSION } from '../../shared/constants/index.js'

/**
 * Storage service för highscore-systemet
 * Implementerar IHighscoreRepository med LocalStorage som backend
 */
export class HighscoreStorageService implements IHighscoreRepository {
  private readonly storageKey = 'woodpile_highscores'
  private readonly maxEntries = 10
  
  constructor(private readonly storage: StorageService) {}

  /**
   * Hämtar alla highscores från storage
   */
  async getAll(): Promise<HighscoreList> {
    try {
      const data = this.storage.getItem<HighscoreEntry[]>(this.storageKey)
      const entries = data ? this.deserializeEntries(data) : []
      
      return {
        entries: entries as ReadonlyArray<HighscoreEntry>,
        maxEntries: this.maxEntries,
        lastUpdated: new Date()
      }
    } catch (error) {
      throw new HighscoreError(
        'Failed to load highscores from storage',
        'STORAGE_READ_ERROR',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      )
    }
  }

  /**
   * Hämtar top N highscores sorterade efter poäng
   */
  async getTop(count: number): Promise<ReadonlyArray<HighscoreEntry>> {
    const highscores = await this.getAll()
    
    return [...highscores.entries]
      .sort((a: HighscoreEntry, b: HighscoreEntry) => b.score - a.score)
      .slice(0, Math.min(count, this.maxEntries))
  }

  /**
   * Lägger till ny highscore
   */
  async add(input: NewHighscoreInput): Promise<HighscoreEntry> {
    try {
      const currentHighscores = await this.getAll()
      
      // Skapa ny entry med unique ID och timestamp
      const newEntry: HighscoreEntry = {
        id: this.generateId(),
        playerName: input.playerName.trim(),
        score: input.score,
        timestamp: new Date(),
        level: input.level,
        playDuration: input.playDuration
      }

      // Lägg till och sortera
      const updatedEntries = [...currentHighscores.entries, newEntry]
        .sort((a, b) => b.score - a.score)
        .slice(0, this.maxEntries)

      // Spara tillbaka till storage
      await this.saveEntries(updatedEntries)
      
      return newEntry
    } catch (error) {
      throw new HighscoreError(
        'Failed to add highscore entry',
        'STORAGE_WRITE_ERROR',
        { 
          input,
          error: error instanceof Error ? error.message : 'Unknown error' 
        }
      )
    }
  }

  /**
   * Tar bort alla highscores
   */
  async clear(): Promise<void> {
    try {
      this.storage.removeItem(this.storageKey)
    } catch (error) {
      throw new HighscoreError(
        'Failed to clear highscores',
        'STORAGE_CLEAR_ERROR',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      )
    }
  }

  /**
   * Exporterar highscores i JSON-format
   */
  async export(): Promise<HighscoreExport> {
    try {
      const highscores = await this.getAll()
      
      return {
        version: '1.0',
        exportDate: new Date(),
        gameVersion: APP_VERSION,
        entries: highscores.entries
      }
    } catch (error) {
      throw new HighscoreError(
        'Failed to export highscores',
        'EXPORT_ERROR',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      )
    }
  }

  /**
   * Importerar highscores från export-data
   */
  async import(data: HighscoreExport): Promise<void> {
    try {
      // Validera export-data först innan vi använder den
      this.validateExportData(data)
      
      const currentHighscores = await this.getAll()
      
      // Merge importerad data med befintlig data
      const allEntries = [
        ...currentHighscores.entries,
        ...data.entries
      ]
      
      // Deduplicera baserat på ID och sortera
      const uniqueEntries = this.deduplicateEntries(allEntries)
        .sort((a, b) => b.score - a.score)
        .slice(0, this.maxEntries)
      
      await this.saveEntries(uniqueEntries)
    } catch (error) {
      // Om det redan är en HighscoreError, kasta den som den är
      if (error instanceof HighscoreError) {
        throw error
      }
      
      // Annars wrap i HighscoreError
      throw new HighscoreError(
        'Failed to import highscores',
        'IMPORT_ERROR',
        { 
          data: data ? { version: data.version, entryCount: data.entries?.length } : null,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      )
    }
  }

  /**
   * Beräknar statistik från highscores
   */
  async getStats(): Promise<HighscoreStats> {
    try {
      const highscores = await this.getAll()
      const entries = highscores.entries
      
      if (entries.length === 0) {
        return {
          totalGames: 0,
          averageScore: 0,
          highestScore: 0,
          mostFrequentPlayer: '',
          averagePlayDuration: 0
        }
      }

      const totalGames = entries.length
      const averageScore = entries.reduce((sum, entry) => sum + entry.score, 0) / totalGames
      const highestScore = Math.max(...entries.map(entry => entry.score))
      const averagePlayDuration = entries.reduce((sum, entry) => sum + entry.playDuration, 0) / totalGames
      
      // Hitta mest frekventa spelare
      const playerCounts = entries.reduce((counts, entry) => {
        counts[entry.playerName] = (counts[entry.playerName] || 0) + 1
        return counts
      }, {} as Record<string, number>)
      
      const mostFrequentPlayer = Object.entries(playerCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || ''

      return {
        totalGames,
        averageScore: Math.round(averageScore),
        highestScore,
        mostFrequentPlayer,
        averagePlayDuration: Math.round(averagePlayDuration)
      }
    } catch (error) {
      throw new HighscoreError(
        'Failed to calculate highscore statistics',
        'STATS_ERROR',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      )
    }
  }

  /**
   * Privata hjälpmetoder
   */
  
  private generateId(): string {
    return `hs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private deserializeEntries(data: any[]): HighscoreEntry[] {
    return data.map(entry => ({
      ...entry,
      timestamp: new Date(entry.timestamp)
    }))
  }

  private async saveEntries(entries: HighscoreEntry[]): Promise<void> {
    const serializedEntries = entries.map(entry => ({
      ...entry,
      timestamp: entry.timestamp.toISOString()
    }))
    
    this.storage.setItem(this.storageKey, serializedEntries)
  }

  private validateExportData(data: HighscoreExport): void {
    if (!data || !data.version || !data.exportDate || !data.entries || !Array.isArray(data.entries)) {
      throw new HighscoreError(
        'Invalid export data format',
        'INVALID_EXPORT_FORMAT',
        { providedKeys: data ? Object.keys(data) : [] }
      )
    }

    // Validera varje entry
    for (const entry of data.entries) {
      if (!entry.id || !entry.playerName || typeof entry.score !== 'number') {
        throw new HighscoreError(
          'Invalid highscore entry in import data',
          'INVALID_ENTRY_FORMAT',
          { entry }
        )
      }
    }
  }

  private deduplicateEntries(entries: HighscoreEntry[]): HighscoreEntry[] {
    const seen = new Set<string>()
    return entries.filter(entry => {
      if (seen.has(entry.id)) {
        return false
      }
      seen.add(entry.id)
      return true
    })
  }

  /**
   * Kontrollerar om en poäng kvalificerar för top 10
   */
  async qualifiesForTop10(score: number): Promise<{ qualifies: boolean; position?: number }> {
    const topScores = await this.getTop(this.maxEntries)
    
    if (topScores.length < this.maxEntries) {
      return { qualifies: true, position: topScores.length + 1 }
    }
    
    const lowestScore = topScores[topScores.length - 1].score
    if (score > lowestScore) {
      // Hitta position
      const position = topScores.findIndex(entry => score > entry.score) + 1
      return { qualifies: true, position: position || topScores.length + 1 }
    }
    
    return { qualifies: false }
  }

  /**
   * Hämtar highscores för en specifik spelare
   */
  async getByPlayer(playerName: string): Promise<ReadonlyArray<HighscoreEntry>> {
    const allHighscores = await this.getAll()
    return allHighscores.entries.filter(entry => 
      entry.playerName.toLowerCase() === playerName.toLowerCase()
    )
  }
}