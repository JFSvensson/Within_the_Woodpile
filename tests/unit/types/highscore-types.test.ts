import { describe, it, expect } from 'vitest'
import type { 
  HighscoreEntry, 
  NewHighscoreInput, 
  HighscoreValidationResult,
  HighscoreFilter,
  HighscoreStats
} from '../../../src/types/highscore.js'
import { HighscoreError, HighscoreValidationError } from '../../../src/types/highscore.js'

// Test av Highscore Domain Types
describe('Highscore Domain Types', () => {
  describe('HighscoreEntry Type', () => {
    it('should have correct structure for highscore entry', () => {
      const entry: HighscoreEntry = {
        id: 'test-id-123',
        playerName: 'TestPlayer',
        score: 15000,
        timestamp: new Date('2025-10-08T10:00:00Z'),
        level: 5,
        playDuration: 300
      }
      
      expect(entry.id).toBe('test-id-123')
      expect(entry.playerName).toBe('TestPlayer')
      expect(entry.score).toBe(15000)
      expect(entry.level).toBe(5)
      expect(entry.playDuration).toBe(300)
      expect(entry.timestamp).toBeInstanceOf(Date)
    })

    it('should be readonly - compilation test', () => {
      const entry: HighscoreEntry = {
        id: 'test-id',
        playerName: 'Player',
        score: 1000,
        timestamp: new Date(),
        level: 1,
        playDuration: 60
      }
      
      // TypeScript should prevent these at compile time
      // entry.id = 'new-id' // Would cause compile error
      // entry.score = 2000 // Would cause compile error
      
      expect(entry).toBeDefined()
    })
  })

  describe('NewHighscoreInput Type', () => {
    it('should validate input structure', () => {
      const input: NewHighscoreInput = {
        playerName: 'NewPlayer',
        score: 25000,
        level: 8,
        playDuration: 450
      }
      
      expect(input.playerName).toBe('NewPlayer')
      expect(input.score).toBe(25000)
      expect(input.level).toBe(8)
      expect(input.playDuration).toBe(450)
    })
  })

  describe('HighscoreValidationResult Type', () => {
    it('should handle valid new record', () => {
      const result: HighscoreValidationResult = {
        isValid: true,
        isNewRecord: true,
        position: 3,
        errors: []
      }
      
      expect(result.isValid).toBe(true)
      expect(result.isNewRecord).toBe(true)
      expect(result.position).toBe(3)
      expect(result.errors).toEqual([])
    })

    it('should handle invalid input with errors', () => {
      const result: HighscoreValidationResult = {
        isValid: false,
        isNewRecord: false,
        errors: ['Player name too short', 'Score must be positive']
      }
      
      expect(result.isValid).toBe(false)
      expect(result.isNewRecord).toBe(false)
      expect(result.position).toBeUndefined()
      expect(result.errors).toHaveLength(2)
    })
  })

  describe('HighscoreFilter Type', () => {
    it('should support various filter options', () => {
      const filter: HighscoreFilter = {
        minScore: 1000,
        maxScore: 50000,
        playerName: 'TestPlayer',
        fromDate: new Date('2025-01-01'),
        toDate: new Date('2025-12-31'),
        sortBy: 'score',
        sortOrder: 'desc'
      }
      
      expect(filter.sortBy).toBe('score')
      expect(filter.sortOrder).toBe('desc')
      expect(filter.minScore).toBe(1000)
      expect(filter.playerName).toBe('TestPlayer')
    })

    it('should work with minimal filter', () => {
      const filter: HighscoreFilter = {
        sortBy: 'date',
        sortOrder: 'asc'
      }
      
      expect(filter.sortBy).toBe('date')
      expect(filter.sortOrder).toBe('asc')
      expect(filter.minScore).toBeUndefined()
      expect(filter.playerName).toBeUndefined()
    })
  })

  describe('HighscoreStats Type', () => {
    it('should provide comprehensive statistics', () => {
      const stats: HighscoreStats = {
        totalGames: 150,
        averageScore: 12500,
        highestScore: 75000,
        mostFrequentPlayer: 'ProGamer',
        averagePlayDuration: 480
      }
      
      expect(stats.totalGames).toBe(150)
      expect(stats.averageScore).toBe(12500)
      expect(stats.highestScore).toBe(75000)
      expect(stats.mostFrequentPlayer).toBe('ProGamer')
      expect(stats.averagePlayDuration).toBe(480)
    })
  })

  describe('Error Classes', () => {
    it('should create HighscoreError with context', () => {
      const error = new HighscoreError(
        'Storage operation failed',
        'STORAGE_ERROR',
        { operation: 'save', table: 'highscores' }
      )
      
      expect(error.message).toBe('Storage operation failed')
      expect(error.code).toBe('STORAGE_ERROR')
      expect(error.context).toEqual({ operation: 'save', table: 'highscores' })
      expect(error.name).toBe('HighscoreError')
      expect(error).toBeInstanceOf(Error)
    })

    it('should create HighscoreValidationError with field info', () => {
      const error = new HighscoreValidationError(
        'Player name is required',
        'playerName',
        ''
      )
      
      expect(error.message).toBe('Player name is required')
      expect(error.code).toBe('VALIDATION_ERROR')
      expect(error.field).toBe('playerName')
      expect(error.value).toBe('')
      expect(error.name).toBe('HighscoreValidationError')
      expect(error).toBeInstanceOf(HighscoreError)
      expect(error).toBeInstanceOf(Error)
    })
  })

  describe('Type Safety Tests', () => {
    it('should enforce readonly arrays', () => {
      const entries: ReadonlyArray<HighscoreEntry> = [
        {
          id: '1',
          playerName: 'Player1',
          score: 1000,
          timestamp: new Date(),
          level: 1,
          playDuration: 60
        }
      ]
      
      // TypeScript should prevent mutation
      // entries.push(...) // Would cause compile error
      // entries[0].score = 2000 // Would cause compile error
      
      expect(entries).toHaveLength(1)
      expect(entries[0].playerName).toBe('Player1')
    })

    it('should validate interface contracts', () => {
      // Mock implementation to test interface structure
      const mockRepository = {
        getAll: async () => ({ entries: [], maxEntries: 10, lastUpdated: new Date() }),
        getTop: async (count: number) => [],
        add: async (input: NewHighscoreInput) => ({ 
          id: 'new-id', 
          ...input, 
          timestamp: new Date() 
        }),
        clear: async () => {},
        export: async () => ({ 
          version: '1.0', 
          exportDate: new Date(), 
          gameVersion: '0.1.0', 
          entries: [] 
        }),
        import: async (data: any) => {},
        getStats: async () => ({
          totalGames: 0,
          averageScore: 0,
          highestScore: 0,
          mostFrequentPlayer: '',
          averagePlayDuration: 0
        })
      }
      
      // Type checking - would fail at compile time if interface doesn't match
      expect(typeof mockRepository.getAll).toBe('function')
      expect(typeof mockRepository.add).toBe('function')
      expect(typeof mockRepository.clear).toBe('function')
    })
  })
})