import { describe, it, expect, vi } from 'vitest'

// Test av GameStateManager logik
describe('GameStateManager Logic', () => {
  describe('State transitions', () => {
    const validStates = ['LOADING', 'MENU', 'PLAYING', 'PAUSED', 'GAME_OVER'] as const
    type GameState = typeof validStates[number]
    
    const createStateManager = () => {
      let currentState: GameState = 'LOADING'
      
      return {
        getCurrentState: () => currentState,
        
        setState: (newState: GameState) => {
          const validTransitions: Record<GameState, GameState[]> = {
            'LOADING': ['MENU'],
            'MENU': ['PLAYING'],
            'PLAYING': ['PAUSED', 'GAME_OVER', 'MENU'],
            'PAUSED': ['PLAYING', 'MENU'],
            'GAME_OVER': ['MENU']
          }
          
          if (validTransitions[currentState].includes(newState)) {
            currentState = newState
            return true
          }
          return false
        }
      }
    }
    
    it('should start in LOADING state', () => {
      const stateManager = createStateManager()
      expect(stateManager.getCurrentState()).toBe('LOADING')
    })
    
    it('should allow valid state transitions', () => {
      const stateManager = createStateManager()
      
      expect(stateManager.setState('MENU')).toBe(true)
      expect(stateManager.getCurrentState()).toBe('MENU')
      
      expect(stateManager.setState('PLAYING')).toBe(true)
      expect(stateManager.getCurrentState()).toBe('PLAYING')
      
      expect(stateManager.setState('PAUSED')).toBe(true)
      expect(stateManager.getCurrentState()).toBe('PAUSED')
    })
    
    it('should reject invalid state transitions', () => {
      const stateManager = createStateManager()
      
      // Kan inte gå direkt från LOADING till PLAYING
      expect(stateManager.setState('PLAYING')).toBe(false)
      expect(stateManager.getCurrentState()).toBe('LOADING')
      
      // Måste gå via MENU först
      stateManager.setState('MENU')
      stateManager.setState('PLAYING')
      
      // Kan inte gå från PLAYING till LOADING
      expect(stateManager.setState('LOADING')).toBe(false)
      expect(stateManager.getCurrentState()).toBe('PLAYING')
    })
  })
  
  describe('Game statistics tracking', () => {
    const createStatsTracker = () => {
      let stats = {
        score: 0,
        health: 100,
        woodPiecesRemoved: 0,
        creaturesEncountered: 0,
        timeElapsed: 0,
        combo: 0,
        highestCombo: 0
      }
      
      return {
        getStats: () => ({ ...stats }),
        
        addScore: (points: number) => {
          stats.score += points
          stats.combo += 1
          stats.highestCombo = Math.max(stats.highestCombo, stats.combo)
        },
        
        takeDamage: (damage: number) => {
          stats.health = Math.max(0, stats.health - damage)
          stats.combo = 0 // Reset combo på skada
          return stats.health <= 0
        },
        
        removeWoodPiece: () => {
          stats.woodPiecesRemoved += 1
        },
        
        encounterCreature: () => {
          stats.creaturesEncountered += 1
        },
        
        updateTime: (deltaTime: number) => {
          stats.timeElapsed += deltaTime
        }
      }
    }
    
    it('should track score and combo correctly', () => {
      const tracker = createStatsTracker()
      
      tracker.addScore(10)
      tracker.addScore(20)
      tracker.addScore(30)
      
      const stats = tracker.getStats()
      expect(stats.score).toBe(60)
      expect(stats.combo).toBe(3)
      expect(stats.highestCombo).toBe(3)
    })
    
    it('should reset combo on damage but keep highest combo', () => {
      const tracker = createStatsTracker()
      
      tracker.addScore(10)
      tracker.addScore(10)
      tracker.addScore(10) // Combo: 3
      
      tracker.takeDamage(20)
      tracker.addScore(10) // Ny combo börjar
      
      const stats = tracker.getStats()
      expect(stats.combo).toBe(1)
      expect(stats.highestCombo).toBe(3)
      expect(stats.health).toBe(80)
    })
    
    it('should detect game over when health reaches zero', () => {
      const tracker = createStatsTracker()
      
      const isGameOver1 = tracker.takeDamage(50)
      expect(isGameOver1).toBe(false)
      expect(tracker.getStats().health).toBe(50)
      
      const isGameOver2 = tracker.takeDamage(60)
      expect(isGameOver2).toBe(true)
      expect(tracker.getStats().health).toBe(0)
    })
  })
})

describe('CollisionManager Logic', () => {
  describe('Collision detection algorithms', () => {
    type Rectangle = { x: number; y: number; width: number; height: number }
    
    const checkAABBCollision = (rect1: Rectangle, rect2: Rectangle): boolean => {
      return rect1.x < rect2.x + rect2.width &&
             rect1.x + rect1.width > rect2.x &&
             rect1.y < rect2.y + rect2.height &&
             rect1.y + rect1.height > rect2.y
    }
    
    const checkPointInRect = (point: { x: number; y: number }, rect: Rectangle): boolean => {
      return point.x >= rect.x && 
             point.x <= rect.x + rect.width &&
             point.y >= rect.y && 
             point.y <= rect.y + rect.height
    }
    
    it('should detect overlapping rectangles', () => {
      const rect1 = { x: 10, y: 10, width: 20, height: 20 }
      const rect2 = { x: 15, y: 15, width: 20, height: 20 } // Överlappning
      const rect3 = { x: 50, y: 50, width: 20, height: 20 } // Ingen överlappning
      
      expect(checkAABBCollision(rect1, rect2)).toBe(true)
      expect(checkAABBCollision(rect1, rect3)).toBe(false)
    })
    
    it('should detect edge cases correctly', () => {
      const rect1 = { x: 0, y: 0, width: 10, height: 10 }
      const rect2 = { x: 10, y: 0, width: 10, height: 10 } // Precis intill
      const rect3 = { x: 15, y: 15, width: 0, height: 0 }   // Noll-storlek utanför
      
      expect(checkAABBCollision(rect1, rect2)).toBe(false) // Inga överlappningar vid kanter
      expect(checkAABBCollision(rect1, rect3)).toBe(false) // Noll-storlek ger ingen kollision
    })
    
    it('should detect point-in-rectangle correctly', () => {
      const rect = { x: 100, y: 100, width: 50, height: 30 }
      
      expect(checkPointInRect({ x: 125, y: 115 }, rect)).toBe(true)  // Inne i rektangel
      expect(checkPointInRect({ x: 100, y: 100 }, rect)).toBe(true)  // Övre vänster hörn
      expect(checkPointInRect({ x: 150, y: 130 }, rect)).toBe(true)  // Nedre höger hörn
      expect(checkPointInRect({ x: 99, y: 115 }, rect)).toBe(false)  // Utanför vänster
      expect(checkPointInRect({ x: 125, y: 131 }, rect)).toBe(false) // Utanför nedtill
    })
  })
  
  describe('Creature collision handling', () => {
    type Creature = {
      type: 'spider' | 'wasp' | 'hedgehog' | 'ghost' | 'pumpkin'
      x: number
      y: number
      radius: number
      isActive: boolean
    }
    
    const checkCreaturePlayerCollision = (
      creature: Creature, 
      clickPoint: { x: number; y: number }
    ): boolean => {
      if (!creature.isActive) return false
      
      const distance = Math.sqrt(
        Math.pow(clickPoint.x - creature.x, 2) + 
        Math.pow(clickPoint.y - creature.y, 2)
      )
      
      return distance <= creature.radius
    }
    
    it('should detect creature-click collisions', () => {
      const spider: Creature = {
        type: 'spider',
        x: 100,
        y: 100,
        radius: 15,
        isActive: true
      }
      
      expect(checkCreaturePlayerCollision(spider, { x: 100, y: 100 })).toBe(true)  // Exakt centrum
      expect(checkCreaturePlayerCollision(spider, { x: 110, y: 105 })).toBe(true)  // Inom radie
      expect(checkCreaturePlayerCollision(spider, { x: 120, y: 120 })).toBe(false) // Utanför radie
      
      spider.isActive = false
      expect(checkCreaturePlayerCollision(spider, { x: 100, y: 100 })).toBe(false) // Inaktiv creature
    })
  })
})

describe('CreatureManager Logic', () => {
  describe('Creature spawning algorithms', () => {
    type SpawnConfig = {
      maxCreatures: number
      spawnRate: number
      difficultyMultiplier: number
    }
    
    const shouldSpawnCreature = (
      currentCreatureCount: number, 
      config: SpawnConfig,
      timeElapsed: number
    ): boolean => {
      if (currentCreatureCount >= config.maxCreatures) return false
      
      const adjustedSpawnRate = config.spawnRate * config.difficultyMultiplier
      const spawnChance = adjustedSpawnRate * (timeElapsed / 1000) // Per sekund
      
      return Math.random() < spawnChance / 60 // Per frame (60 FPS)
    }
    
    const selectCreatureType = (difficultyLevel: number): string => {
      const creatures = [
        { type: 'spider', minDifficulty: 0, weight: 0.4 },
        { type: 'wasp', minDifficulty: 1, weight: 0.3 },
        { type: 'hedgehog', minDifficulty: 0, weight: 0.2 },
        { type: 'ghost', minDifficulty: 2, weight: 0.1 },
        { type: 'pumpkin', minDifficulty: 3, weight: 0.05 }
      ]
      
      const availableCreatures = creatures.filter(c => difficultyLevel >= c.minDifficulty)
      const totalWeight = availableCreatures.reduce((sum, c) => sum + c.weight, 0)
      
      let random = Math.random() * totalWeight
      for (const creature of availableCreatures) {
        random -= creature.weight
        if (random <= 0) return creature.type
      }
      
      return availableCreatures[0].type // Fallback
    }
    
    it('should respect maximum creature limit', () => {
      const config: SpawnConfig = { maxCreatures: 3, spawnRate: 0.5, difficultyMultiplier: 1 }
      
      // Mock Math.random för deterministiska tester
      const originalRandom = Math.random
      Math.random = vi.fn(() => 0.01) // Mycket lågt värde för att säkerställa spawn
      
      expect(shouldSpawnCreature(0, config, 5000)).toBe(true)  // Kan spawna när inga creatures
      expect(shouldSpawnCreature(3, config, 5000)).toBe(false) // Kan inte spawna vid max
      expect(shouldSpawnCreature(5, config, 5000)).toBe(false) // Kan inte spawna över max
      
      // Återställ Math.random
      Math.random = originalRandom
    })
    
    it('should select appropriate creatures based on difficulty', () => {
      // Testa 100 gånger för att se fördelning
      const results = { spider: 0, wasp: 0, hedgehog: 0, ghost: 0, pumpkin: 0 }
      
      for (let i = 0; i < 100; i++) {
        const creatureType = selectCreatureType(0) as keyof typeof results
        results[creatureType]++
      }
      
      // På difficulty 0 ska bara spider och hedgehog spawna
      expect(results.spider + results.hedgehog).toBe(100)
      expect(results.wasp).toBe(0)
      expect(results.ghost).toBe(0)
      expect(results.pumpkin).toBe(0)
    })
  })
})