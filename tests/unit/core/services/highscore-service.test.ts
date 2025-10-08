import { describe, it, expect, vi, beforeEach } from 'vitest'
import { HighscoreService } from '../../../../src/core/services/HighscoreService.js'
import type { 
  IHighscoreRepository,
  HighscoreEntry,
  NewHighscoreInput,
  HighscoreList,
  HighscoreStats,
  HighscoreExport,
  QualificationResult
} from '../../../../src/types/index.js'
import { HighscoreError } from '../../../../src/types/index.js'

// Test av HighscoreService business logic
describe('HighscoreService', () => {
  let service: HighscoreService
  let mockRepository: IHighscoreRepository

  beforeEach(() => {
    // Mock repository med alla metoder
    mockRepository = {
      getAll: vi.fn(),
      getTop: vi.fn(),
      add: vi.fn(),
      clear: vi.fn(),
      export: vi.fn(),
      import: vi.fn(),
      getStats: vi.fn(),
      qualifiesForTop10: vi.fn(),
      getByPlayer: vi.fn()
    }
    
    service = new HighscoreService(mockRepository)
  })

  describe('getAllHighscores', () => {
    it('should return all highscores from repository', async () => {
      const mockData: HighscoreList = {
        entries: [createTestEntry('Player1', 1000)],
        maxEntries: 10,
        lastUpdated: new Date()
      }
      
      vi.mocked(mockRepository.getAll).mockResolvedValue(mockData)
      
      const result = await service.getAllHighscores()
      
      expect(result).toEqual(mockData)
      expect(mockRepository.getAll).toHaveBeenCalledOnce()
    })

    it('should throw HighscoreError when repository fails', async () => {
      vi.mocked(mockRepository.getAll).mockRejectedValue(new Error('Storage error'))
      
      await expect(service.getAllHighscores()).rejects.toThrow(HighscoreError)
      await expect(service.getAllHighscores()).rejects.toThrow('Failed to retrieve highscores')
    })
  })

  describe('getTopHighscores', () => {
    it('should return top N highscores', async () => {
      const mockEntries = [
        createTestEntry('Player1', 3000),
        createTestEntry('Player2', 2000),
        createTestEntry('Player3', 1000)
      ]
      
      vi.mocked(mockRepository.getTop).mockResolvedValue(mockEntries)
      
      const result = await service.getTopHighscores(3)
      
      expect(result).toEqual(mockEntries)
      expect(mockRepository.getTop).toHaveBeenCalledWith(3)
    })

    it('should default to top 10 when no count specified', async () => {
      const mockEntries = [createTestEntry('Player1', 1000)]
      vi.mocked(mockRepository.getTop).mockResolvedValue(mockEntries)
      
      await service.getTopHighscores()
      
      expect(mockRepository.getTop).toHaveBeenCalledWith(10)
    })

    it('should throw error for invalid count', async () => {
      await expect(service.getTopHighscores(0)).rejects.toThrow(HighscoreError)
      await expect(service.getTopHighscores(-1)).rejects.toThrow('Count must be greater than zero')
    })
  })

  describe('addHighscore', () => {
    const validInput: NewHighscoreInput = {
      playerName: 'TestPlayer',
      score: 1500,
      level: 5,
      playDuration: 300
    }

    it('should add valid highscore', async () => {
      const mockEntry = createTestEntry('TestPlayer', 1500)
      vi.mocked(mockRepository.add).mockResolvedValue(mockEntry)
      vi.mocked(mockRepository.getByPlayer).mockResolvedValue([])
      
      const result = await service.addHighscore(validInput)
      
      expect(result).toEqual(mockEntry)
      expect(mockRepository.add).toHaveBeenCalledWith(validInput)
    })

    it('should validate player name is required', async () => {
      const invalidInput = { ...validInput, playerName: '' }
      
      await expect(service.addHighscore(invalidInput)).rejects.toThrow(HighscoreError)
      await expect(service.addHighscore(invalidInput)).rejects.toThrow('Player name is required')
    })

    it('should validate player name length', async () => {
      const invalidInput = { ...validInput, playerName: 'A'.repeat(51) }
      
      await expect(service.addHighscore(invalidInput)).rejects.toThrow(HighscoreError)
      await expect(service.addHighscore(invalidInput)).rejects.toThrow('Player name cannot exceed 50 characters')
    })

    it('should validate score is not negative', async () => {
      const invalidInput = { ...validInput, score: -100 }
      
      await expect(service.addHighscore(invalidInput)).rejects.toThrow(HighscoreError)
      await expect(service.addHighscore(invalidInput)).rejects.toThrow('Score cannot be negative')
    })

    it('should validate score is realistic', async () => {
      const invalidInput = { ...validInput, score: 2000000 }
      
      await expect(service.addHighscore(invalidInput)).rejects.toThrow(HighscoreError)
      await expect(service.addHighscore(invalidInput)).rejects.toThrow('Score seems unrealistic')
    })

    it('should validate level is at least 1', async () => {
      const invalidInput = { ...validInput, level: 0 }
      
      await expect(service.addHighscore(invalidInput)).rejects.toThrow(HighscoreError)
      await expect(service.addHighscore(invalidInput)).rejects.toThrow('Level must be at least 1')
    })

    it('should validate play duration is not negative', async () => {
      const invalidInput = { ...validInput, playDuration: -60 }
      
      await expect(service.addHighscore(invalidInput)).rejects.toThrow(HighscoreError)
      await expect(service.addHighscore(invalidInput)).rejects.toThrow('Play duration cannot be negative')
    })
  })

  describe('checkQualification', () => {
    it('should check if score qualifies for top 10', async () => {
      const mockResult: QualificationResult = { qualifies: true, position: 5 }
      vi.mocked(mockRepository.qualifiesForTop10).mockResolvedValue(mockResult)
      
      const result = await service.checkQualification(2000)
      
      expect(result).toEqual(mockResult)
      expect(mockRepository.qualifiesForTop10).toHaveBeenCalledWith(2000)
    })

    it('should throw error for negative score', async () => {
      await expect(service.checkQualification(-100)).rejects.toThrow(HighscoreError)
      await expect(service.checkQualification(-100)).rejects.toThrow('Score cannot be negative')
    })
  })

  describe('getPlayerHighscores', () => {
    it('should return player highscores sorted by score', async () => {
      const mockEntries = [
        createTestEntry('Alice', 1000),
        createTestEntry('Alice', 2000),
        createTestEntry('Alice', 1500)
      ]
      vi.mocked(mockRepository.getByPlayer).mockResolvedValue(mockEntries)
      
      const result = await service.getPlayerHighscores('Alice')
      
      expect(result).toHaveLength(3)
      expect(result[0].score).toBe(2000) // Högsta först
      expect(result[1].score).toBe(1500)
      expect(result[2].score).toBe(1000)
      expect(mockRepository.getByPlayer).toHaveBeenCalledWith('Alice')
    })

    it('should trim player name', async () => {
      vi.mocked(mockRepository.getByPlayer).mockResolvedValue([])
      
      await service.getPlayerHighscores('  TestPlayer  ')
      
      expect(mockRepository.getByPlayer).toHaveBeenCalledWith('TestPlayer')
    })

    it('should throw error for empty player name', async () => {
      await expect(service.getPlayerHighscores('')).rejects.toThrow(HighscoreError)
      await expect(service.getPlayerHighscores('   ')).rejects.toThrow('Player name cannot be empty')
    })
  })

  describe('getStatistics', () => {
    it('should return statistics from repository', async () => {
      const mockStats: HighscoreStats = {
        totalGames: 25,
        averageScore: 1500,
        highestScore: 5000,
        mostFrequentPlayer: 'TopPlayer',
        averagePlayDuration: 250
      }
      
      vi.mocked(mockRepository.getStats).mockResolvedValue(mockStats)
      
      const result = await service.getStatistics()
      
      expect(result).toEqual(mockStats)
    })
  })

  describe('getPersonalBest', () => {
    it('should return highest score for player', async () => {
      const playerEntries = [
        createTestEntry('Alice', 1000),
        createTestEntry('Alice', 2500),
        createTestEntry('Alice', 1500)
      ]
      vi.mocked(mockRepository.getByPlayer).mockResolvedValue(playerEntries)
      
      const result = await service.getPersonalBest('Alice')
      
      expect(result?.score).toBe(2500)
    })

    it('should return null for player with no scores', async () => {
      vi.mocked(mockRepository.getByPlayer).mockResolvedValue([])
      
      const result = await service.getPersonalBest('NewPlayer')
      
      expect(result).toBeNull()
    })
  })

  describe('isPersonalRecord', () => {
    it('should return true for new player', async () => {
      vi.mocked(mockRepository.getByPlayer).mockResolvedValue([])
      
      const result = await service.isPersonalRecord('NewPlayer', 1000)
      
      expect(result).toBe(true)
    })

    it('should return true when score beats personal best', async () => {
      const existingEntry = createTestEntry('Player', 1000)
      vi.mocked(mockRepository.getByPlayer).mockResolvedValue([existingEntry])
      
      const result = await service.isPersonalRecord('Player', 1500)
      
      expect(result).toBe(true)
    })

    it('should return false when score does not beat personal best', async () => {
      const existingEntry = createTestEntry('Player', 2000)
      vi.mocked(mockRepository.getByPlayer).mockResolvedValue([existingEntry])
      
      const result = await service.isPersonalRecord('Player', 1500)
      
      expect(result).toBe(false)
    })
  })

  describe('getPlayerRanking', () => {
    it('should return correct ranking for player', async () => {
      const playerEntry = createTestEntry('TestPlayer', 1500)
      const topEntries = [
        createTestEntry('Player1', 3000),
        createTestEntry('TestPlayer', 1500),
        createTestEntry('Player2', 1000)
      ]
      
      vi.mocked(mockRepository.getByPlayer).mockResolvedValue([playerEntry])
      vi.mocked(mockRepository.getTop).mockResolvedValue(topEntries)
      vi.mocked(mockRepository.getStats).mockResolvedValue({
        totalGames: 10,
        averageScore: 1500,
        highestScore: 3000,
        mostFrequentPlayer: 'Player1',
        averagePlayDuration: 200
      })
      
      const result = await service.getPlayerRanking('TestPlayer')
      
      expect(result.currentRank).toBe(2)
      expect(result.bestScore).toBe(1500)
      expect(result.totalPlayers).toBeGreaterThan(0)
    })

    it('should handle player with no scores', async () => {
      vi.mocked(mockRepository.getByPlayer).mockResolvedValue([])
      vi.mocked(mockRepository.getStats).mockResolvedValue({
        totalGames: 5,
        averageScore: 1000,
        highestScore: 2000,
        mostFrequentPlayer: 'Player1',
        averagePlayDuration: 150
      })
      
      const result = await service.getPlayerRanking('NewPlayer')
      
      expect(result.currentRank).toBeNull()
      expect(result.bestScore).toBeNull()
      expect(result.totalPlayers).toBeGreaterThan(0)
    })
  })

  describe('exportHighscores', () => {
    it('should export highscores from repository', async () => {
      const mockExport: HighscoreExport = {
        version: '1.0',
        exportDate: new Date(),
        gameVersion: '0.1.0',
        entries: [createTestEntry('Player1', 1000)]
      }
      
      vi.mocked(mockRepository.export).mockResolvedValue(mockExport)
      
      const result = await service.exportHighscores()
      
      expect(result).toEqual(mockExport)
    })
  })

  describe('importHighscores', () => {
    const validExportData: HighscoreExport = {
      version: '1.0',
      exportDate: new Date('2024-01-01'),
      gameVersion: '0.1.0',
      entries: [createTestEntry('ImportedPlayer', 1000)]
    }

    it('should import valid highscores', async () => {
      vi.mocked(mockRepository.import).mockResolvedValue()
      
      await service.importHighscores(validExportData)
      
      expect(mockRepository.import).toHaveBeenCalledWith(validExportData)
    })

    it('should validate export data has version', async () => {
      const invalidData = { ...validExportData, version: '' }
      
      await expect(service.importHighscores(invalidData)).rejects.toThrow(HighscoreError)
      await expect(service.importHighscores(invalidData)).rejects.toThrow('Import data must have version information')
    })

    it('should validate export date is valid', async () => {
      const invalidData = { ...validExportData, exportDate: 'invalid' as any }
      
      await expect(service.importHighscores(invalidData)).rejects.toThrow(HighscoreError)
      await expect(service.importHighscores(invalidData)).rejects.toThrow('Import data must have valid export date')
    })

    it('should reject future export dates', async () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)
      const invalidData = { ...validExportData, exportDate: futureDate }
      
      await expect(service.importHighscores(invalidData)).rejects.toThrow(HighscoreError)
      await expect(service.importHighscores(invalidData)).rejects.toThrow('Export date cannot be in the future')
    })
  })

  describe('clearAllHighscores', () => {
    it('should clear all highscores', async () => {
      vi.mocked(mockRepository.clear).mockResolvedValue()
      
      await service.clearAllHighscores()
      
      expect(mockRepository.clear).toHaveBeenCalledOnce()
    })
  })

  describe('getAchievements', () => {
    it('should calculate achievements for specific player', async () => {
      const playerEntries = [
        createTestEntry('Alice', 1000, 1, 100),
        createTestEntry('Alice', 1200, 2, 120),
        createTestEntry('Alice', 1100, 1, 110)
      ]
      
      const top10Entries = [
        createTestEntry('Alice', 1200),
        createTestEntry('Bob', 1150),
        createTestEntry('Alice', 1100),
        createTestEntry('Alice', 1000)
      ]
      
      vi.mocked(mockRepository.getByPlayer).mockResolvedValue(playerEntries)
      vi.mocked(mockRepository.getTop).mockResolvedValue(top10Entries)
      
      const result = await service.getAchievements('Alice')
      
      expect(result.totalGamesPlayed).toBe(3)
      expect(result.averageScore).toBe(1100) // (1000+1200+1100)/3 = 1100
      expect(result.bestScore).toBe(1200)
      expect(result.gamesInTop10).toBe(3) // Alice har 3 entries i top 10
      expect(result.consistencyRating).toMatch(/Excellent|Good|Average|Needs Improvement/)
    })

    it('should calculate overall achievements when no player specified', async () => {
      const allEntries = [
        createTestEntry('Alice', 1000),
        createTestEntry('Bob', 1500),
        createTestEntry('Charlie', 800)
      ]
      
      const mockHighscores: HighscoreList = {
        entries: allEntries,
        maxEntries: 10,
        lastUpdated: new Date()
      }
      
      vi.mocked(mockRepository.getAll).mockResolvedValue(mockHighscores)
      vi.mocked(mockRepository.getTop).mockResolvedValue(allEntries)
      
      const result = await service.getAchievements()
      
      expect(result.totalGamesPlayed).toBe(3)
      expect(result.averageScore).toBe(1100) // (1000+1500+800)/3 ≈ 1100
      expect(result.bestScore).toBe(1500)
      expect(result.gamesInTop10).toBe(3)
    })

    it('should handle empty achievements', async () => {
      vi.mocked(mockRepository.getByPlayer).mockResolvedValue([])
      
      const result = await service.getAchievements('NewPlayer')
      
      expect(result.totalGamesPlayed).toBe(0)
      expect(result.averageScore).toBe(0)
      expect(result.bestScore).toBe(0)
      expect(result.gamesInTop10).toBe(0)
      expect(result.consistencyRating).toBe('Needs Improvement')
    })
  })

  // Hjälpfunktioner för tester
  function createTestEntry(
    playerName: string, 
    score: number, 
    level: number = 1, 
    playDuration: number = 60
  ): HighscoreEntry {
    return {
      id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      playerName,
      score,
      timestamp: new Date(),
      level,
      playDuration
    }
  }
})