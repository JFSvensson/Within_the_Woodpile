import type { I18n } from '../../infrastructure/i18n/I18n.js'
import type { 
  HighscoreEntry,
  HighscoreStats, 
  HighscoreError,
  QualificationResult
} from '../../types/index.js'

/**
 * Service för internationaliserade highscore-meddelanden
 * Hanterar formattering och översättning av highscore-relaterad text
 */
export class HighscoreI18nService {
  constructor(private readonly i18n: I18n) {}

  /**
   * Formaterar spelarnamn för visning
   */
  formatPlayerName(playerName: string): string {
    return playerName.trim() || this.i18n.translate('highscore.playerName')
  }

  /**
   * Formaterar poäng med lokalisering
   */
  formatScore(score: number): string {
    return score.toLocaleString(this.getCurrentLocale())
  }

  /**
   * Formaterar speltid i läsbar form
   */
  formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`
    }
    return `${remainingSeconds}s`
  }

  /**
   * Formaterar datum för visning
   */
  formatDate(date: Date): string {
    return date.toLocaleDateString(this.getCurrentLocale(), {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  /**
   * Formaterar position med ordinal (1:a, 2:a, etc.)
   */
  formatPosition(position: number): string {
    const locale = this.getCurrentLocale()
    
    if (locale.startsWith('sv')) {
      return `${position}:a`
    } else {
      // Engelska ordinals
      const suffix = this.getEnglishOrdinalSuffix(position)
      return `${position}${suffix}`
    }
  }

  /**
   * Genererar meddelande för nytt rekord
   */
  getNewRecordMessage(entry: HighscoreEntry, isPersonalBest: boolean): string {
    const scoreText = this.formatScore(entry.score)
    
    if (isPersonalBest) {
      return this.i18n.translate('highscore.personalBest') + ` ${scoreText}`
    } else {
      return this.i18n.translate('highscore.newRecord') + ` ${scoreText}`
    }
  }

  /**
   * Genererar meddelande för kvalifikation till top 10
   */
  getQualificationMessage(result: QualificationResult, score: number): string {
    const scoreText = this.formatScore(score)
    
    if (result.qualifies) {
      const positionText = result.position ? this.formatPosition(result.position) : ''
      return this.i18n.translate('highscore.qualifiesForTop10') + 
             (positionText ? ` (${positionText})` : '') + 
             ` - ${scoreText}`
    } else {
      return this.i18n.translate('highscore.notQualified') + ` (${scoreText})`
    }
  }

  /**
   * Formaterar statistik för visning
   */
  formatStatistics(stats: HighscoreStats): Record<string, string> {
    return {
      totalGames: stats.totalGames.toString(),
      averageScore: this.formatScore(stats.averageScore),
      highestScore: this.formatScore(stats.highestScore),
      mostFrequentPlayer: stats.mostFrequentPlayer || this.i18n.translate('highscore.noScores'),
      averagePlayDuration: this.formatDuration(stats.averagePlayDuration)
    }
  }

  /**
   * Formaterar achievements för visning
   */
  formatAchievements(achievements: {
    totalGamesPlayed: number;
    averageScore: number;
    bestScore: number;
    gamesInTop10: number;
    consistencyRating: 'Excellent' | 'Good' | 'Average' | 'Needs Improvement';
  }): Record<string, string> {
    return {
      totalGamesPlayed: achievements.totalGamesPlayed.toString(),
      averageScore: this.formatScore(achievements.averageScore),
      bestScore: this.formatScore(achievements.bestScore),
      gamesInTop10: achievements.gamesInTop10.toString(),
      consistencyRating: this.getConsistencyRatingText(achievements.consistencyRating)
    }
  }

  /**
   * Översätter consistency rating
   */
  getConsistencyRatingText(rating: 'Excellent' | 'Good' | 'Average' | 'Needs Improvement'): string {
    const ratingKey = rating.toLowerCase().replace(' ', '')
    return this.i18n.translate(`highscore.achievements.${ratingKey}`)
  }

  /**
   * Formaterar ranking-information
   */
  formatRanking(ranking: {
    currentRank: number | null;
    totalPlayers: number;
    bestScore: number | null;
  }): Record<string, string> {
    return {
      currentRank: ranking.currentRank ? this.formatPosition(ranking.currentRank) : this.i18n.translate('highscore.ranking.noRanking'),
      totalPlayers: ranking.totalPlayers.toString(),
      bestScore: ranking.bestScore ? this.formatScore(ranking.bestScore) : '-'
    }
  }

  /**
   * Genererar felmeddelande från HighscoreError
   */
  getErrorMessage(error: HighscoreError): string {
    // Mappning från error codes till i18n-nycklar
    const errorMappings: Record<string, string> = {
      'INVALID_INPUT': 'highscore.validation.invalidScore',
      'STORAGE_ERROR': 'highscore.errors.saveFailed',
      'LOAD_ERROR': 'highscore.errors.loadFailed',
      'EXPORT_ERROR': 'highscore.errors.exportFailed',
      'IMPORT_ERROR': 'highscore.errors.importFailed',
      'CLEAR_ERROR': 'highscore.errors.clearFailed',
      'NETWORK_ERROR': 'highscore.errors.networkError',
      'SERVICE_ERROR': 'highscore.errors.unknownError'
    }

    const i18nKey = errorMappings[error.code] || 'highscore.errors.unknownError'
    return this.i18n.translate(i18nKey)
  }

  /**
   * Genererar valideringsmeddelanden
   */
  getValidationMessage(field: string, value: any): string {
    switch (field) {
      case 'playerName':
        if (!value || value.trim().length === 0) {
          return this.i18n.translate('highscore.validation.nameRequired')
        }
        if (value.length > 50) {
          return this.i18n.translate('highscore.validation.nameTooLong')
        }
        break
      case 'score':
        if (value < 0) {
          return this.i18n.translate('highscore.validation.scoreNegative')
        }
        if (value > 1000000) {
          return this.i18n.translate('highscore.validation.scoreUnrealistic')
        }
        break
      case 'level':
        if (value < 1) {
          return this.i18n.translate('highscore.validation.levelInvalid')
        }
        break
      case 'playDuration':
        if (value < 0) {
          return this.i18n.translate('highscore.validation.durationNegative')
        }
        break
    }
    return this.i18n.translate('highscore.validation.invalidScore')
  }

  /**
   * Formaterar highscore-entry för tabellvisning
   */
  formatEntryForDisplay(entry: HighscoreEntry, position?: number): {
    position: string;
    playerName: string;
    score: string;
    level: string;
    duration: string;
    date: string;
  } {
    return {
      position: position ? this.formatPosition(position) : '-',
      playerName: this.formatPlayerName(entry.playerName),
      score: this.formatScore(entry.score),
      level: entry.level.toString(),
      duration: this.formatDuration(entry.playDuration),
      date: this.formatDate(entry.timestamp)
    }
  }

  /**
   * Genererar bekräftelsemeddelande för clear all
   */
  getClearConfirmationMessage(): string {
    return this.i18n.translate('highscore.actions.clearConfirm')
  }

  /**
   * Genererar meddelande för import/export resultat
   */
  getImportSuccessMessage(entriesCount: number): string {
    return this.i18n.translate('highscore.import.success') + ` (${entriesCount})`
  }

  getExportSuccessMessage(entriesCount: number): string {
    return this.i18n.translate('highscore.export.success') + ` (${entriesCount})`
  }

  /**
   * Privata hjälpmetoder
   */

  private getCurrentLocale(): string {
    return this.i18n.getCurrentLanguage() === 'sv' ? 'sv-SE' : 'en-US'
  }

  private getEnglishOrdinalSuffix(num: number): string {
    const j = num % 10
    const k = num % 100
    
    if (j === 1 && k !== 11) return 'st'
    if (j === 2 && k !== 12) return 'nd'
    if (j === 3 && k !== 13) return 'rd'
    return 'th'
  }
}