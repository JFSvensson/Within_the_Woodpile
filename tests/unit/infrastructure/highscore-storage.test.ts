import { describe, it, expect, vi, beforeEach } from 'vitest'
import { HighscoreStorageService } from '../../../src/infrastructure/storage/HighscoreStorageService.js'
import type { StorageService } from '../../../src/infrastructure/storage/interfaces.js'
import type { 
  HighscoreEntry, 
  NewHighscoreInput, 
  HighscoreExport 
} from '../../../src/types/index.js'
import { HighscoreError } from '../../../src/types/index.js'

// Test av HighscoreStorageService
describe('HighscoreStorageService', () => {
  let storageService: HighscoreStorageService
  let mockStorage: StorageService
  let mockStorageData: Record<string, any>

  beforeEach(() => {
    // Reset mock storage data
    mockStorageData = {}
    
    // Mock StorageService
    mockStorage = {
      getItem: vi.fn((key: string) => mockStorageData[key] || null),
      setItem: vi.fn((key: string, value: any) => {
        mockStorageData[key] = value
      }),
      removeItem: vi.fn((key: string) => {
        delete mockStorageData[key]
      }),
      clear: vi.fn(() => {
        mockStorageData = {}
      })
    }
    
    storageService = new HighscoreStorageService(mockStorage)
  })

  describe('getAll', () => {
    it('should return empty list when no highscores exist', async () => {
      const result = await storageService.getAll()
      
      expect(result.entries).toEqual([])
      expect(result.maxEntries).toBe(10)
      expect(result.lastUpdated).toBeInstanceOf(Date)
    })

    it('should return deserialized highscores from storage', async () => {
      const mockData = [
        {
          id: 'test1',
          playerName: 'Player1',
          score: 1000,
          timestamp: '2025-10-08T10:00:00.000Z',
          level: 1,
          playDuration: 120
        },
        {
          id: 'test2',
          playerName: 'Player2', 
          score: 2000,
          timestamp: '2025-10-08T11:00:00.000Z',
          level: 2,
          playDuration: 180
        }
      ]
      
      mockStorageData['woodpile_highscores'] = mockData
      
      const result = await storageService.getAll()
      
      expect(result.entries).toHaveLength(2)
      expect(result.entries[0].timestamp).toBeInstanceOf(Date)
      expect(result.entries[0].playerName).toBe('Player1')
      expect(result.entries[1].score).toBe(2000)
    })

    it('should throw HighscoreError on storage failure', async () => {
      vi.mocked(mockStorage.getItem).mockImplementation(() => {
        throw new Error('Storage error')
      })
      
      await expect(storageService.getAll()).rejects.toThrow(HighscoreError)
      await expect(storageService.getAll()).rejects.toThrow('Failed to load highscores from storage')
    })
  })

  describe('getTop', () => {
    beforeEach(async () => {
      // Setup test data - inte sorterad för att testa sortering
      const testEntries = [
        createTestEntry('player1', 1500, 'test1'),
        createTestEntry('player2', 3000, 'test2'), 
        createTestEntry('player3', 800, 'test3'),
        createTestEntry('player4', 2200, 'test4')
      ]
      
      mockStorageData['woodpile_highscores'] = testEntries.map(serializeEntry)
    })

    it('should return top entries sorted by score descending', async () => {
      const result = await storageService.getTop(3)
      
      expect(result).toHaveLength(3)
      expect(result[0].score).toBe(3000) // Högsta först
      expect(result[1].score).toBe(2200)
      expect(result[2].score).toBe(1500)
    })

    it('should respect count limit', async () => {
      const result = await storageService.getTop(2)
      expect(result).toHaveLength(2)
    })

    it('should return all entries if count exceeds available', async () => {
      const result = await storageService.getTop(10)
      expect(result).toHaveLength(4) // Endast 4 entries finns
    })

    it('should respect maxEntries limit', async () => {
      const result = await storageService.getTop(20)
      expect(result).toHaveLength(4) // Max 10, men vi har bara 4
    })
  })

  describe('add', () => {
    it('should add new highscore entry', async () => {
      const input: NewHighscoreInput = {
        playerName: 'NewPlayer',
        score: 5000,
        level: 5,
        playDuration: 300
      }
      
      const result = await storageService.add(input)
      
      expect(result.id).toMatch(/^hs_\d+_[a-z0-9]+$/)
      expect(result.playerName).toBe('NewPlayer')
      expect(result.score).toBe(5000)
      expect(result.timestamp).toBeInstanceOf(Date)
      expect(mockStorage.setItem).toHaveBeenCalled()
    })

    it('should trim player name', async () => {
      const input: NewHighscoreInput = {
        playerName: '  TestPlayer  ',
        score: 1000,
        level: 1,
        playDuration: 60
      }
      
      const result = await storageService.add(input)
      expect(result.playerName).toBe('TestPlayer')
    })

    it('should maintain top 10 limit when adding entry', async () => {
      // Lägg till 12 entries för att testa begränsning
      for (let i = 0; i < 12; i++) {
        const input: NewHighscoreInput = {
          playerName: `Player${i}`,
          score: 1000 + i * 100,
          level: 1,
          playDuration: 60
        }
        await storageService.add(input)
      }
      
      const all = await storageService.getAll()
      expect(all.entries).toHaveLength(10) // Max 10 entries
      
      // Kontrollera att det är de högsta poängen som behålls
      const top = await storageService.getTop(10)
      expect(top[0].score).toBe(2100) // Högsta poäng
      expect(top[9].score).toBe(1200) // Tionde högsta poäng
    })

    it('should throw HighscoreError on storage failure', async () => {
      vi.mocked(mockStorage.setItem).mockImplementation(() => {
        throw new Error('Storage full')
      })
      
      const input: NewHighscoreInput = {
        playerName: 'Player',
        score: 1000,
        level: 1,
        playDuration: 60
      }
      
      await expect(storageService.add(input)).rejects.toThrow(HighscoreError)
    })
  })

  describe('clear', () => {
    it('should remove all highscores from storage', async () => {
      mockStorageData['woodpile_highscores'] = [createTestEntry('test', 1000)]
      
      await storageService.clear()
      
      expect(mockStorage.removeItem).toHaveBeenCalledWith('woodpile_highscores')
      expect(mockStorageData['woodpile_highscores']).toBeUndefined()
    })

    it('should throw HighscoreError on storage failure', async () => {
      vi.mocked(mockStorage.removeItem).mockImplementation(() => {
        throw new Error('Cannot delete')
      })
      
      await expect(storageService.clear()).rejects.toThrow(HighscoreError)
    })
  })

  describe('export', () => {
    beforeEach(async () => {
      const testEntries = [
        createTestEntry('player1', 2000, 'test1'),
        createTestEntry('player2', 1500, 'test2')
      ]
      mockStorageData['woodpile_highscores'] = testEntries.map(serializeEntry)
    })

    it('should export highscores in correct format', async () => {
      const result = await storageService.export()
      
      expect(result.version).toBe('1.0')
      expect(result.exportDate).toBeInstanceOf(Date)
      expect(result.gameVersion).toBe('0.1.0')
      expect(result.entries).toHaveLength(2)
      expect(result.entries[0].playerName).toBe('player1')
    })

    it('should export empty list when no highscores', async () => {
      // Säkerställ att storage är tom
      mockStorageData = {}
      
      const result = await storageService.export()
      
      expect(result.entries).toHaveLength(0)
    })
  })

  describe('import', () => {
    it('should import and merge highscores', async () => {
      // Befintlig data
      const existingEntry = createTestEntry('existing', 1000, 'existing1')
      mockStorageData['woodpile_highscores'] = [serializeEntry(existingEntry)]
      
      // Import data
      const importData: HighscoreExport = {
        version: '1.0',
        exportDate: new Date(),
        gameVersion: '0.1.0',
        entries: [
          createTestEntry('imported1', 2000, 'imported1'),
          createTestEntry('imported2', 1500, 'imported2')
        ]
      }
      
      await storageService.import(importData)
      
      const result = await storageService.getAll()
      expect(result.entries).toHaveLength(3) // 1 existing + 2 imported
    })

    it('should deduplicate entries with same ID', async () => {
      const duplicateEntry = createTestEntry('duplicate', 1000, 'same-id')
      mockStorageData['woodpile_highscores'] = [serializeEntry(duplicateEntry)]
      
      const importData: HighscoreExport = {
        version: '1.0',
        exportDate: new Date(),
        gameVersion: '0.1.0',
        entries: [
          createTestEntry('duplicate-updated', 2000, 'same-id') // Same ID
        ]
      }
      
      await storageService.import(importData)
      
      const result = await storageService.getAll()
      expect(result.entries).toHaveLength(1) // Deduplicerad
      expect(result.entries[0].playerName).toBe('duplicate') // Behåller original
    })

    it('should maintain top 10 limit after import', async () => {
      // Skapa 15 entries för import
      const manyEntries = Array.from({ length: 15 }, (_, i) => 
        createTestEntry(`player${i}`, 1000 + i * 100, `id${i}`)
      )
      
      const importData: HighscoreExport = {
        version: '1.0',
        exportDate: new Date(),
        gameVersion: '0.1.0',
        entries: manyEntries
      }
      
      await storageService.import(importData)
      
      const result = await storageService.getAll()
      expect(result.entries).toHaveLength(10) // Max 10
    })

    it('should throw error for invalid export format', async () => {
      const invalidData = {
        // Saknar version och entries - båda krävs enligt validateExportData
        exportDate: new Date(),
        gameVersion: '0.1.0'
        // version: saknas
        // entries: saknas  
      } as any
      
      await expect(storageService.import(invalidData)).rejects.toThrow(HighscoreError)
      await expect(storageService.import(invalidData)).rejects.toThrow('Invalid export data format')
    })

    it('should throw error for invalid entry format', async () => {
      const invalidData: HighscoreExport = {
        version: '1.0',
        exportDate: new Date(),
        gameVersion: '0.1.0',
        entries: [
          {
            // Saknar id och playerName
            score: 1000,
            timestamp: new Date(),
            level: 1,
            playDuration: 60
          } as any
        ]
      }
      
      await expect(storageService.import(invalidData)).rejects.toThrow(HighscoreError)
    })
  })

  describe('getStats', () => {
    beforeEach(async () => {
      const testEntries = [
        createTestEntry('Alice', 2000, 'test1', 1, 120),
        createTestEntry('Bob', 1500, 'test2', 2, 180),
        createTestEntry('Alice', 1800, 'test3', 1, 150),
        createTestEntry('Charlie', 1000, 'test4', 3, 90)
      ]
      mockStorageData['woodpile_highscores'] = testEntries.map(serializeEntry)
    })

    it('should calculate correct statistics', async () => {
      const stats = await storageService.getStats()
      
      expect(stats.totalGames).toBe(4)
      expect(stats.averageScore).toBe(1575) // (2000+1500+1800+1000)/4 = 1575
      expect(stats.highestScore).toBe(2000)
      expect(stats.mostFrequentPlayer).toBe('Alice') // 2 games
      expect(stats.averagePlayDuration).toBe(135) // (120+180+150+90)/4 = 135
    })

    it('should return zero stats for empty highscores', async () => {
      // Säkerställ att storage är tom
      mockStorageData = {}
      
      const stats = await storageService.getStats()
      
      expect(stats.totalGames).toBe(0)
      expect(stats.averageScore).toBe(0)
      expect(stats.highestScore).toBe(0)
      expect(stats.mostFrequentPlayer).toBe('')
      expect(stats.averagePlayDuration).toBe(0)
    })
  })

  describe('qualifiesForTop10', () => {
    beforeEach(async () => {
      // Setup 5 entries för test
      const testEntries = [
        createTestEntry('p1', 1000, 'test1'),
        createTestEntry('p2', 900, 'test2'),
        createTestEntry('p3', 800, 'test3'),
        createTestEntry('p4', 700, 'test4'),
        createTestEntry('p5', 600, 'test5')
      ]
      mockStorageData['woodpile_highscores'] = testEntries.map(serializeEntry)
    })

    it('should qualify when less than 10 entries exist', async () => {
      const result = await storageService.qualifiesForTop10(500)
      
      expect(result.qualifies).toBe(true)
      expect(result.position).toBe(6) // Position 6 av 6
    })

    it('should qualify with correct position for high score', async () => {
      // Lägg till 5 entries till för att fylla top 10
      for (let i = 6; i <= 10; i++) {
        await storageService.add({
          playerName: `p${i}`,
          score: 500 - i * 10, // Sjunkande poäng: 440, 430, 420, 410, 400
          level: 1,
          playDuration: 60
        })
      }
      
      // Nu har vi 10 entries: 1000, 900, 800, 700, 600, 440, 430, 420, 410, 400
      // Poäng 950 ska hamna på position 2 (mellan 1000 och 900)
      const result = await storageService.qualifiesForTop10(950)
      
      expect(result.qualifies).toBe(true)
      expect(result.position).toBe(2) // Mellan 1000 och 900
    })

    it('should not qualify when score too low and top 10 full', async () => {
      // Lägg till 5 entries till för att fylla top 10
      for (let i = 6; i <= 10; i++) {
        await storageService.add({
          playerName: `p${i}`,
          score: 500 - i * 10, // Sjunkande poäng
          level: 1,
          playDuration: 60
        })
      }
      
      const result = await storageService.qualifiesForTop10(400) // Lägre än lägsta i top 10
      
      expect(result.qualifies).toBe(false)
      expect(result.position).toBeUndefined()
    })
  })

  describe('getByPlayer', () => {
    beforeEach(async () => {
      const testEntries = [
        createTestEntry('Alice', 2000, 'test1'),
        createTestEntry('Bob', 1500, 'test2'),
        createTestEntry('alice', 1800, 'test3'), // Samma spelare, olika case
        createTestEntry('Charlie', 1000, 'test4')
      ]
      mockStorageData['woodpile_highscores'] = testEntries.map(serializeEntry)
    })

    it('should return entries for specific player', async () => {
      const result = await storageService.getByPlayer('Alice')
      
      expect(result).toHaveLength(2) // Alice och alice (case-insensitive)
      expect(result[0].playerName).toBe('Alice')
      expect(result[1].playerName).toBe('alice')
    })

    it('should be case insensitive', async () => {
      const result = await storageService.getByPlayer('ALICE')
      expect(result).toHaveLength(2)
    })

    it('should return empty array for unknown player', async () => {
      const result = await storageService.getByPlayer('Unknown')
      expect(result).toHaveLength(0)
    })
  })

  // Hjälpfunktioner för tester
  function createTestEntry(
    playerName: string, 
    score: number, 
    id: string = `test_${Date.now()}`,
    level: number = 1,
    playDuration: number = 60
  ): HighscoreEntry {
    return {
      id,
      playerName,
      score,
      timestamp: new Date(),
      level,
      playDuration
    }
  }

  function serializeEntry(entry: HighscoreEntry) {
    return {
      ...entry,
      timestamp: entry.timestamp.toISOString()
    }
  }
})