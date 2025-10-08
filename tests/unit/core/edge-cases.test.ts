import { describe, it, expect, vi, beforeEach } from 'vitest'

// Test av Edge Cases och Error Handling
describe('Edge Cases & Error Handling', () => {
  describe('Boundary Value Testing', () => {
    it('should handle empty wood pile correctly', () => {
      const processEmptyPile = (woodPieces: any[]) => {
        if (woodPieces.length === 0) {
          return { 
            stability: 100, 
            riskLevel: 'NONE',
            canRemove: false,
            message: 'No wood pieces to process'
          }
        }
        
        return {
          stability: 50,
          riskLevel: 'MEDIUM',
          canRemove: true,
          message: 'Processing wood pile'
        }
      }
      
      const result = processEmptyPile([])
      expect(result.stability).toBe(100)
      expect(result.riskLevel).toBe('NONE')
      expect(result.canRemove).toBe(false)
      expect(result.message).toBe('No wood pieces to process')
    })

    it('should handle maximum wood pile size', () => {
      const MAX_PIECES = 50
      
      const validatePileSize = (pieces: any[]) => {
        if (pieces.length > MAX_PIECES) {
          return { valid: false, error: `Maximum ${MAX_PIECES} pieces allowed` }
        }
        return { valid: true, error: null }
      }
      
      const normalPile = new Array(30).fill({ id: 1 })
      const oversizedPile = new Array(60).fill({ id: 1 })
      
      expect(validatePileSize(normalPile)).toEqual({ valid: true, error: null })
      expect(validatePileSize(oversizedPile)).toEqual({ 
        valid: false, 
        error: 'Maximum 50 pieces allowed' 
      })
    })

    it('should handle negative coordinates gracefully', () => {
      const validatePosition = (x: number, y: number) => {
        const errors: string[] = []
        
        if (x < 0) errors.push('X coordinate cannot be negative')
        if (y < 0) errors.push('Y coordinate cannot be negative')
        if (x > 1000) errors.push('X coordinate exceeds game bounds')
        if (y > 800) errors.push('Y coordinate exceeds game bounds')
        
        return {
          valid: errors.length === 0,
          errors
        }
      }
      
      expect(validatePosition(-10, 100)).toEqual({
        valid: false,
        errors: ['X coordinate cannot be negative']
      })
      
      expect(validatePosition(500, -5)).toEqual({
        valid: false,
        errors: ['Y coordinate cannot be negative']
      })
      
      expect(validatePosition(1500, 900)).toEqual({
        valid: false,
        errors: ['X coordinate exceeds game bounds', 'Y coordinate exceeds game bounds']
      })
      
      expect(validatePosition(500, 400)).toEqual({
        valid: true,
        errors: []
      })
    })

    it('should handle extreme score values', () => {
      const processScore = (score: number) => {
        const MAX_SCORE = 999999
        const MIN_SCORE = 0
        
        if (score < MIN_SCORE) return MIN_SCORE
        if (score > MAX_SCORE) return MAX_SCORE
        if (isNaN(score)) return 0
        if (!isFinite(score)) return 0
        
        return score
      }
      
      expect(processScore(-1000)).toBe(0) // Negative clamped to 0
      expect(processScore(1500000)).toBe(999999) // Too high clamped to max
      expect(processScore(NaN)).toBe(0) // NaN becomes 0
      expect(processScore(Infinity)).toBe(999999) // Infinity becomes max (since Infinity > MAX_SCORE)
      expect(processScore(42000)).toBe(42000) // Normal value preserved
    })
  })

  describe('Error Recovery', () => {
    it('should recover from corrupted game state', () => {
      const validateAndRepairGameState = (state: any) => {
        const defaultState = {
          score: 0,
          health: 100,
          level: 1,
          woodPieces: [],
          creatures: []
        }
        
        const repairs: string[] = []
        const repairedState = { ...state }
        
        // Check score
        if (typeof state.score !== 'number' || state.score < 0 || !isFinite(state.score)) {
          repairedState.score = defaultState.score
          repairs.push('score')
        }
        
        // Check health
        if (typeof state.health !== 'number' || state.health < 0 || state.health > 100) {
          repairedState.health = defaultState.health
          repairs.push('health')
        }
        
        // Check level
        if (typeof state.level !== 'number' || state.level < 1) {
          repairedState.level = defaultState.level
          repairs.push('level')
        }
        
        // Check arrays
        if (!Array.isArray(state.woodPieces)) {
          repairedState.woodPieces = defaultState.woodPieces
          repairs.push('woodPieces')
        }
        
        if (!Array.isArray(state.creatures)) {
          repairedState.creatures = defaultState.creatures
          repairs.push('creatures')
        }
        
        return { 
          state: repairedState, 
          repairs,
          wasCorrupted: repairs.length > 0 
        }
      }
      
      const corruptedState = {
        score: 'invalid',
        health: -50,
        level: 0,
        woodPieces: null,
        creatures: 'not an array'
      }
      
      const result = validateAndRepairGameState(corruptedState)
      
      expect(result.wasCorrupted).toBe(true)
      expect(result.repairs).toEqual(['score', 'health', 'level', 'woodPieces', 'creatures'])
      expect(result.state.score).toBe(0)
      expect(result.state.health).toBe(100)
      expect(result.state.level).toBe(1)
      expect(result.state.woodPieces).toEqual([])
      expect(result.state.creatures).toEqual([])
    })

    it('should handle network timeouts gracefully', async () => {
      const fetchWithTimeout = async (url: string, timeout: number = 5000) => {
        return new Promise((resolve, reject) => {
          const controller = new AbortController()
          
          const timeoutId = setTimeout(() => {
            controller.abort()
            reject(new Error('Request timeout'))
          }, timeout)
          
          // Simulate fetch
          setTimeout(() => {
            clearTimeout(timeoutId)
            resolve({ ok: true, data: 'success' })
          }, timeout + 1000) // Will timeout
        })
      }
      
      await expect(fetchWithTimeout('test-url', 100)).rejects.toThrow('Request timeout')
    })

    it('should handle malformed save data', () => {
      const parseSaveData = (data: string) => {
        try {
          const parsed = JSON.parse(data)
          
          // Validate required fields
          if (!parsed.hasOwnProperty('version')) {
            throw new Error('Missing version field')
          }
          
          if (!parsed.hasOwnProperty('gameState')) {
            throw new Error('Missing gameState field')
          }
          
          return { success: true, data: parsed, error: null }
        } catch (error) {
          return { 
            success: false, 
            data: null, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          }
        }
      }
      
      // Test invalid JSON
      expect(parseSaveData('invalid json')).toEqual({
        success: false,
        data: null,
        error: expect.stringContaining('Unexpected token')
      })
      
      // Test missing fields
      expect(parseSaveData('{"someField": "value"}')).toEqual({
        success: false,
        data: null,
        error: 'Missing version field'
      })
      
      // Test valid data
      expect(parseSaveData('{"version": "1.0", "gameState": {}}')).toEqual({
        success: true,
        data: { version: "1.0", gameState: {} },
        error: null
      })
    })
  })

  describe('Performance Edge Cases', () => {
    it('should handle large numbers of simultaneous operations', () => {
      const performBulkOperations = (operations: Array<() => any>) => {
        const results: any[] = []
        const errors: any[] = []
        let processed = 0
        
        const startTime = Date.now()
        
        for (const operation of operations) {
          try {
            const result = operation()
            results.push(result)
            processed++
          } catch (error) {
            errors.push(error)
          }
        }
        
        const endTime = Date.now()
        const duration = endTime - startTime
        
        return {
          processed,
          results: results.length,
          errors: errors.length,
          duration,
          averageTime: duration / operations.length
        }
      }
      
      // Create 1000 mock operations
      const operations = Array(1000).fill(0).map((_, i) => () => i * 2)
      
      const result = performBulkOperations(operations)
      
      expect(result.processed).toBe(1000)
      expect(result.results).toBe(1000)
      expect(result.errors).toBe(0)
      expect(result.duration).toBeGreaterThanOrEqual(0)
      expect(result.averageTime).toBeGreaterThanOrEqual(0)
    })

    it('should throttle high-frequency events', () => {
      const createThrottledFunction = (fn: Function, delay: number) => {
        let lastCall = 0
        let callCount = 0
        
        return (...args: any[]) => {
          const now = Date.now()
          callCount++
          
          if (now - lastCall >= delay) {
            lastCall = now
            return fn(...args)
          }
          
          return null
        }
      }
      
      const mockFunction = vi.fn()
      const throttled = createThrottledFunction(mockFunction, 100)
      
      // Call rapidly
      for (let i = 0; i < 10; i++) {
        throttled(i)
      }
      
      // Should only be called once initially
      expect(mockFunction).toHaveBeenCalledTimes(1)
    })

    it('should cleanup resources properly', () => {
      const createResourceManager = () => {
        const resources: Array<{ id: string; cleanup: () => void }> = []
        
        const addResource = (id: string, cleanup: () => void) => {
          resources.push({ id, cleanup })
        }
        
        const removeResource = (id: string) => {
          const index = resources.findIndex(r => r.id === id)
          if (index !== -1) {
            resources[index].cleanup()
            resources.splice(index, 1)
            return true
          }
          return false
        }
        
        const cleanupAll = () => {
          resources.forEach(resource => {
            try {
              resource.cleanup()
            } catch (error) {
              console.warn(`Failed to cleanup resource ${resource.id}:`, error)
            }
          })
          resources.length = 0
        }
        
        return {
          addResource,
          removeResource,
          cleanupAll,
          getResourceCount: () => resources.length
        }
      }
      
      const manager = createResourceManager()
      const cleanup1 = vi.fn()
      const cleanup2 = vi.fn()
      const cleanup3 = vi.fn(() => { throw new Error('Cleanup error') })
      
      manager.addResource('res1', cleanup1)
      manager.addResource('res2', cleanup2)
      manager.addResource('res3', cleanup3)
      
      expect(manager.getResourceCount()).toBe(3)
      
      // Remove one resource
      expect(manager.removeResource('res1')).toBe(true)
      expect(cleanup1).toHaveBeenCalled()
      expect(manager.getResourceCount()).toBe(2)
      
      // Cleanup all (including one that throws)
      manager.cleanupAll()
      expect(cleanup2).toHaveBeenCalled()
      expect(cleanup3).toHaveBeenCalled()
      expect(manager.getResourceCount()).toBe(0)
    })
  })

  describe('Input Validation', () => {
    it('should validate user input thoroughly', () => {
      const validateUserInput = (input: { 
        username?: string, 
        score?: number, 
        settings?: any 
      }) => {
        const errors: string[] = []
        
        // Username validation
        if (input.username !== undefined) {
          if (typeof input.username !== 'string') {
            errors.push('Username must be a string')
          } else if (input.username.length === 0) {
            errors.push('Username cannot be empty')
          } else if (input.username.length > 50) {
            errors.push('Username too long (max 50 characters)')
          } else if (!/^[a-zA-Z0-9_]+$/.test(input.username)) {
            errors.push('Username contains invalid characters')
          }
        }
        
        // Score validation
        if (input.score !== undefined) {
          if (typeof input.score !== 'number') {
            errors.push('Score must be a number')
          } else if (input.score < 0) {
            errors.push('Score cannot be negative')
          } else if (!isFinite(input.score)) {
            errors.push('Score must be a finite number')
          }
        }
        
        // Settings validation
        if (input.settings !== undefined) {
          if (typeof input.settings !== 'object' || input.settings === null) {
            errors.push('Settings must be an object')
          }
        }
        
        return {
          valid: errors.length === 0,
          errors
        }
      }
      
      // Test valid input
      expect(validateUserInput({ 
        username: 'player123', 
        score: 5000, 
        settings: { sound: true } 
      })).toEqual({
        valid: true,
        errors: []
      })
      
      // Test invalid username
      expect(validateUserInput({ username: 'player@123!' })).toEqual({
        valid: false,
        errors: ['Username contains invalid characters']
      })
      
      // Test invalid score
      expect(validateUserInput({ score: -100 })).toEqual({
        valid: false,
        errors: ['Score cannot be negative']
      })
      
      // Test multiple errors
      expect(validateUserInput({ 
        username: '', 
        score: NaN, 
        settings: 'invalid' 
      })).toEqual({
        valid: false,
        errors: [
          'Username cannot be empty',
          'Score must be a finite number',
          'Settings must be an object'
        ]
      })
    })

    it('should sanitize dangerous input', () => {
      const sanitizeInput = (input: string) => {
        return input
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
          .replace(/javascript:/gi, '') // Remove javascript: protocol
          .replace(/on\w+\s*=\s*"[^"]*"/gi, '') // Remove event handlers with quotes
          .replace(/on\w+\s*=\s*'[^']*'/gi, '') // Remove event handlers with single quotes
          .replace(/on\w+\s*=[^\s>]*/gi, '') // Remove event handlers without quotes
          .trim()
      }
      
      const dangerousInput = '<script>alert("xss")</script><img src="x" onerror="alert(1)">'
      const sanitized = sanitizeInput(dangerousInput)
      
      expect(sanitized).not.toContain('<script>')
      expect(sanitized).not.toContain('onerror')
      expect(sanitized).toBe('<img src="x" >')
    })
  })
})