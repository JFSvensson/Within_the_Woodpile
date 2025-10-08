import { describe, it, expect, vi, beforeEach } from 'vitest'
import { HighscoreI18nService } from '../../../../src/core/services/HighscoreI18nService.js'
import type { I18n } from '../../../../src/infrastructure/i18n/I18n.js'
import type { 
  HighscoreEntry,
  HighscoreStats,
  QualificationResult
} from '../../../../src/types/index.js'
import { HighscoreError } from '../../../../src/types/index.js'

// Test av HighscoreI18nService
describe('HighscoreI18nService', () => {
  let service: HighscoreI18nService
  let mockI18n: I18n

  beforeEach(() => {
    // Mock I18n service
    mockI18n = {
      translate: vi.fn(),
      getCurrentLanguage: vi.fn().mockReturnValue('sv')
    } as any
    
    service = new HighscoreI18nService(mockI18n)
  })

  describe('formatPlayerName', () => {
    it('should return trimmed player name', () => {
      const result = service.formatPlayerName('  TestPlayer  ')
      expect(result).toBe('TestPlayer')
    })

    it('should return default text for empty name', () => {
      vi.mocked(mockI18n.translate).mockReturnValue('Spelarnamn')
      
      const result = service.formatPlayerName('')
      
      expect(result).toBe('Spelarnamn')
      expect(mockI18n.translate).toHaveBeenCalledWith('highscore.playerName')
    })
  })

  describe('formatScore', () => {
    it('should format score with Swedish locale', () => {
      const mockGetCurrentLanguage = vi.fn().mockReturnValue('sv')
      mockI18n.getCurrentLanguage = mockGetCurrentLanguage
      
      const result = service.formatScore(12345)
      
      // Kontrollera att det ser ut som svenska nummer (kan variera beroende på miljö)
      expect(result).toContain('12')
      expect(result).toContain('345')
    })

    it('should format score with English locale', () => {
      const mockGetCurrentLanguage = vi.fn().mockReturnValue('en')
      mockI18n.getCurrentLanguage = mockGetCurrentLanguage
      
      const result = service.formatScore(12345)
      
      // Kontrollera att nummer är formaterat
      expect(result).toContain('12')
      expect(result).toContain('345')
    })
  })

  describe('formatDuration', () => {
    it('should format seconds only', () => {
      const result = service.formatDuration(45)
      expect(result).toBe('45s')
    })

    it('should format minutes and seconds', () => {
      const result = service.formatDuration(125) // 2m 5s
      expect(result).toBe('2m 5s')
    })

    it('should handle zero seconds', () => {
      const result = service.formatDuration(0)
      expect(result).toBe('0s')
    })
  })

  describe('formatDate', () => {
    it('should format date with current locale', () => {
      const testDate = new Date('2024-10-08T15:30:00')
      
      const result = service.formatDate(testDate)
      
      // Kontrollera att datum är formaterat (exakt format kan variera)
      expect(result).toContain('2024')
      expect(result).toContain('15:30')
    })
  })

  describe('formatPosition', () => {
    it('should format Swedish ordinals', () => {
      // Skapa ny service med mock för svenska
      const svMockI18n = {
        translate: vi.fn(),
        getCurrentLanguage: vi.fn().mockReturnValue('sv')
      } as any
      
      const svService = new HighscoreI18nService(svMockI18n)
      
      expect(svService.formatPosition(1)).toBe('1:a')
      expect(svService.formatPosition(5)).toBe('5:a')
      expect(svService.formatPosition(10)).toBe('10:a')
    })

    it('should format English ordinals', () => {
      // Skapa ny service med mock för engelska
      const enMockI18n = {
        translate: vi.fn(),
        getCurrentLanguage: vi.fn().mockReturnValue('en')
      } as any
      
      const enService = new HighscoreI18nService(enMockI18n)
      
      expect(enService.formatPosition(1)).toBe('1st')
      expect(enService.formatPosition(2)).toBe('2nd')
      expect(enService.formatPosition(3)).toBe('3rd')
      expect(enService.formatPosition(4)).toBe('4th')
      expect(enService.formatPosition(11)).toBe('11th')
      expect(enService.formatPosition(21)).toBe('21st')
    })
  })

  describe('getNewRecordMessage', () => {
    const testEntry: HighscoreEntry = {
      id: 'test1',
      playerName: 'TestPlayer',
      score: 1500,
      timestamp: new Date(),
      level: 1,
      playDuration: 60
    }

    it('should return personal best message', () => {
      vi.mocked(mockI18n.translate).mockReturnValue('Personligt rekord!')
      
      const result = service.getNewRecordMessage(testEntry, true)
      
      expect(result).toContain('Personligt rekord!')
      expect(result).toContain('1')
      expect(result).toContain('500')
    })

    it('should return new record message', () => {
      vi.mocked(mockI18n.translate).mockReturnValue('Nytt rekord!')
      
      const result = service.getNewRecordMessage(testEntry, false)
      
      expect(result).toContain('Nytt rekord!')
      expect(result).toContain('1')
      expect(result).toContain('500')
    })
  })

  describe('getQualificationMessage', () => {
    it('should return qualified message with position', () => {
      // Skapa ny service med svenska mock
      const svMockI18n = {
        translate: vi.fn().mockReturnValue('Du har kvalificerat dig!'),
        getCurrentLanguage: vi.fn().mockReturnValue('sv')
      } as any
      
      const svService = new HighscoreI18nService(svMockI18n)
      
      const result: QualificationResult = { qualifies: true, position: 3 }
      const message = svService.getQualificationMessage(result, 2000)
      
      expect(message).toContain('Du har kvalificerat dig!')
      expect(message).toContain('3:a')
      expect(message).toContain('2')
      expect(message).toContain('000')
    })

    it('should return qualified message without position', () => {
      vi.mocked(mockI18n.translate).mockReturnValue('Du har kvalificerat dig!')
      
      const result: QualificationResult = { qualifies: true }
      const message = service.getQualificationMessage(result, 1500)
      
      expect(message).toContain('Du har kvalificerat dig!')
      expect(message).toContain('1')
      expect(message).toContain('500')
    })

    it('should return not qualified message', () => {
      vi.mocked(mockI18n.translate).mockReturnValue('Du kvalificerade dig inte')
      
      const result: QualificationResult = { qualifies: false }
      const message = service.getQualificationMessage(result, 800)
      
      expect(message).toContain('Du kvalificerade dig inte')
      expect(message).toContain('800')
    })
  })

  describe('formatStatistics', () => {
    it('should format all statistics correctly', () => {
      const stats: HighscoreStats = {
        totalGames: 25,
        averageScore: 1500,
        highestScore: 5000,
        mostFrequentPlayer: 'TopPlayer',
        averagePlayDuration: 180
      }
      
      const result = service.formatStatistics(stats)
      
      expect(result.totalGames).toBe('25')
      expect(result.averageScore).toContain('1')
      expect(result.averageScore).toContain('500')
      expect(result.highestScore).toContain('5')
      expect(result.highestScore).toContain('000')
      expect(result.mostFrequentPlayer).toBe('TopPlayer')
      expect(result.averagePlayDuration).toBe('3m 0s')
    })

    it('should handle empty most frequent player', () => {
      vi.mocked(mockI18n.translate).mockReturnValue('Inga resultat än')
      
      const stats: HighscoreStats = {
        totalGames: 0,
        averageScore: 0,
        highestScore: 0,
        mostFrequentPlayer: '',
        averagePlayDuration: 0
      }
      
      const result = service.formatStatistics(stats)
      
      expect(result.mostFrequentPlayer).toBe('Inga resultat än')
    })
  })

  describe('formatAchievements', () => {
    it('should format achievements correctly', () => {
      vi.mocked(mockI18n.translate).mockReturnValue('Utmärkt')
      
      const achievements = {
        totalGamesPlayed: 15,
        averageScore: 1200,
        bestScore: 2500,
        gamesInTop10: 8,
        consistencyRating: 'Excellent' as const
      }
      
      const result = service.formatAchievements(achievements)
      
      expect(result.totalGamesPlayed).toBe('15')
      expect(result.averageScore).toContain('1')
      expect(result.averageScore).toContain('200')
      expect(result.bestScore).toContain('2')
      expect(result.bestScore).toContain('500')
      expect(result.gamesInTop10).toBe('8')
      expect(result.consistencyRating).toBe('Utmärkt')
    })
  })

  describe('getConsistencyRatingText', () => {
    it('should translate consistency ratings', () => {
      vi.mocked(mockI18n.translate).mockReturnValue('Utmärkt')
      
      const result = service.getConsistencyRatingText('Excellent')
      
      expect(result).toBe('Utmärkt')
      expect(mockI18n.translate).toHaveBeenCalledWith('highscore.achievements.excellent')
    })

    it('should handle needs improvement rating', () => {
      vi.mocked(mockI18n.translate).mockReturnValue('Kan förbättras')
      
      const result = service.getConsistencyRatingText('Needs Improvement')
      
      expect(result).toBe('Kan förbättras')
      expect(mockI18n.translate).toHaveBeenCalledWith('highscore.achievements.needsimprovement')
    })
  })

  describe('getErrorMessage', () => {
    it('should map error codes to i18n keys', () => {
      vi.mocked(mockI18n.translate).mockReturnValue('Kunde inte spara resultat')
      
      const error = new HighscoreError('Storage failed', 'STORAGE_ERROR')
      const result = service.getErrorMessage(error)
      
      expect(result).toBe('Kunde inte spara resultat')
      expect(mockI18n.translate).toHaveBeenCalledWith('highscore.errors.saveFailed')
    })

    it('should use unknown error for unmapped codes', () => {
      vi.mocked(mockI18n.translate).mockReturnValue('Okänt fel uppstod')
      
      const error = new HighscoreError('Unknown error', 'WEIRD_ERROR')
      const result = service.getErrorMessage(error)
      
      expect(result).toBe('Okänt fel uppstod')
      expect(mockI18n.translate).toHaveBeenCalledWith('highscore.errors.unknownError')
    })
  })

  describe('getValidationMessage', () => {
    it('should validate empty player name', () => {
      vi.mocked(mockI18n.translate).mockReturnValue('Spelarnamn krävs')
      
      const result = service.getValidationMessage('playerName', '')
      
      expect(result).toBe('Spelarnamn krävs')
    })

    it('should validate long player name', () => {
      vi.mocked(mockI18n.translate).mockReturnValue('Spelarnamnet är för långt')
      
      const result = service.getValidationMessage('playerName', 'A'.repeat(51))
      
      expect(result).toBe('Spelarnamnet är för långt')
    })

    it('should validate negative score', () => {
      vi.mocked(mockI18n.translate).mockReturnValue('Poängen kan inte vara negativ')
      
      const result = service.getValidationMessage('score', -100)
      
      expect(result).toBe('Poängen kan inte vara negativ')
    })

    it('should validate unrealistic score', () => {
      vi.mocked(mockI18n.translate).mockReturnValue('Poängen verkar orealistisk')
      
      const result = service.getValidationMessage('score', 2000000)
      
      expect(result).toBe('Poängen verkar orealistisk')
    })
  })

  describe('formatEntryForDisplay', () => {
    it('should format highscore entry for table display', () => {
      const entry: HighscoreEntry = {
        id: 'test1',
        playerName: 'TestPlayer',
        score: 1500,
        timestamp: new Date('2024-10-08T15:30:00'),
        level: 3,
        playDuration: 125
      }
      
      const result = service.formatEntryForDisplay(entry, 5)
      
      expect(result.position).toContain('5')
      expect(result.playerName).toBe('TestPlayer')
      expect(result.score).toContain('1')
      expect(result.score).toContain('500')
      expect(result.level).toBe('3')
      expect(result.duration).toBe('2m 5s')
      expect(result.date).toContain('2024')
      expect(result.date).toContain('15:30')
    })

    it('should handle entry without position', () => {
      const entry: HighscoreEntry = {
        id: 'test1',
        playerName: 'TestPlayer',
        score: 1000,
        timestamp: new Date(),
        level: 1,
        playDuration: 60
      }
      
      const result = service.formatEntryForDisplay(entry)
      
      expect(result.position).toBe('-')
    })
  })

  describe('getClearConfirmationMessage', () => {
    it('should return clear confirmation message', () => {
      vi.mocked(mockI18n.translate).mockReturnValue('Är du säker?')
      
      const result = service.getClearConfirmationMessage()
      
      expect(result).toBe('Är du säker?')
      expect(mockI18n.translate).toHaveBeenCalledWith('highscore.actions.clearConfirm')
    })
  })

  describe('import/export success messages', () => {
    it('should format import success message', () => {
      vi.mocked(mockI18n.translate).mockReturnValue('Resultat importerade framgångsrikt')
      
      const result = service.getImportSuccessMessage(5)
      
      expect(result).toBe('Resultat importerade framgångsrikt (5)')
    })

    it('should format export success message', () => {
      vi.mocked(mockI18n.translate).mockReturnValue('Resultat exporterade framgångsrikt')
      
      const result = service.getExportSuccessMessage(10)
      
      expect(result).toBe('Resultat exporterade framgångsrikt (10)')
    })
  })
})