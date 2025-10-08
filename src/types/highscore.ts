/**
 * Highscore-relaterade typer och interfaces
 * Domain types för highscore-systemet enligt Clean Architecture
 */

/**
 * Enskild highscore-post
 */
export interface HighscoreEntry {
  readonly id: string
  readonly playerName: string
  readonly score: number
  readonly timestamp: Date
  readonly level: number
  readonly playDuration: number // i sekunder
}

/**
 * Highscore-lista metadata
 */
export interface HighscoreList {
  readonly entries: ReadonlyArray<HighscoreEntry>
  readonly maxEntries: number
  readonly lastUpdated: Date
}

/**
 * Resultat av highscore-validering
 */
export interface HighscoreValidationResult {
  readonly isValid: boolean
  readonly isNewRecord: boolean
  readonly position?: number // Position i top 10 (1-10)
  readonly errors: ReadonlyArray<string>
}

/**
 * Input för ny highscore-post
 */
export interface NewHighscoreInput {
  readonly playerName: string
  readonly score: number
  readonly level: number
  readonly playDuration: number
}

/**
 * Export-format för highscores
 */
export interface HighscoreExport {
  readonly version: string
  readonly exportDate: Date
  readonly gameVersion: string
  readonly entries: ReadonlyArray<HighscoreEntry>
}

/**
 * Highscore-filter och sortering
 */
export interface HighscoreFilter {
  readonly minScore?: number
  readonly maxScore?: number
  readonly playerName?: string
  readonly fromDate?: Date
  readonly toDate?: Date
  readonly sortBy: 'score' | 'date' | 'name' | 'level'
  readonly sortOrder: 'asc' | 'desc'
}

/**
 * Highscore-statistik
 */
export interface HighscoreStats {
  readonly totalGames: number
  readonly averageScore: number
  readonly highestScore: number
  readonly mostFrequentPlayer: string
  readonly averagePlayDuration: number
}

/**
 * Repository interface för highscore-storage
 * Abstraction layer för olika storage implementationer
 */
export interface IHighscoreRepository {
  /**
   * Hämtar alla highscores
   */
  getAll(): Promise<HighscoreList>
  
  /**
   * Hämtar top N highscores
   */
  getTop(count: number): Promise<ReadonlyArray<HighscoreEntry>>
  
  /**
   * Lägger till ny highscore
   */
  add(entry: NewHighscoreInput): Promise<HighscoreEntry>
  
  /**
   * Tar bort alla highscores
   */
  clear(): Promise<void>
  
  /**
   * Exporterar highscores
   */
  export(): Promise<HighscoreExport>
  
  /**
   * Importerar highscores
   */
  import(data: HighscoreExport): Promise<void>
  
  /**
   * Hämtar statistik
   */
  getStats(): Promise<HighscoreStats>
}

/**
 * Service interface för highscore business logic
 */
export interface IHighscoreService {
  /**
   * Kontrollerar om poäng kvalificerar för highscore
   */
  validateScore(input: NewHighscoreInput): Promise<HighscoreValidationResult>
  
  /**
   * Lägger till ny highscore efter validering
   */
  addHighscore(input: NewHighscoreInput): Promise<HighscoreEntry>
  
  /**
   * Hämtar formaterad top 10-lista
   */
  getTop10(): Promise<ReadonlyArray<HighscoreEntry>>
  
  /**
   * Rensar alla highscores med bekräftelse
   */
  clearHighscores(): Promise<boolean>
  
  /**
   * Exporterar highscores i valbart format
   */
  exportHighscores(format: 'json' | 'csv'): Promise<string>
}

/**
 * Event types för highscore-systemet
 */
export interface HighscoreEvents {
  'highscore:new-record': { entry: HighscoreEntry; position: number }
  'highscore:added': { entry: HighscoreEntry }
  'highscore:cleared': { count: number }
  'highscore:exported': { format: string; entryCount: number }
  'highscore:imported': { entryCount: number }
}

/**
 * Highscore UI state
 */
export interface HighscoreUIState {
  readonly isVisible: boolean
  readonly isLoading: boolean
  readonly showExportOptions: boolean
  readonly showClearConfirmation: boolean
  readonly newRecordAnimation: boolean
  readonly filter: HighscoreFilter
}

/**
 * Error types för highscore-systemet
 */
export class HighscoreError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'HighscoreError'
  }
}

/**
 * Validation error för highscore input
 */
export class HighscoreValidationError extends HighscoreError {
  constructor(message: string, public readonly field: string, public readonly value: unknown) {
    super(message, 'VALIDATION_ERROR', { field, value })
    this.name = 'HighscoreValidationError'
  }
}