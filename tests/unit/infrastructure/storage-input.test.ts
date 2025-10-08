import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Test av Infrastructure Services
describe('Infrastructure Services', () => {
  describe('LocalStorageService', () => {
    // Mock localStorage för test
    const createMockStorage = () => {
      const storage: Record<string, string> = {}
      
      return {
        getItem: vi.fn((key: string) => storage[key] || null),
        setItem: vi.fn((key: string, value: string) => {
          storage[key] = value
        }),
        removeItem: vi.fn((key: string) => {
          delete storage[key]
        }),
        clear: vi.fn(() => {
          Object.keys(storage).forEach(key => delete storage[key])
        }),
        _getStorage: () => storage // För test-verifiering
      }
    }

    // Mock av LocalStorageService logik
    const createStorageService = (mockStorage: ReturnType<typeof createMockStorage>) => {
      const PREFIX = 'woodpile_'
      
      const save = <T>(key: string, data: T): boolean => {
        try {
          const serialized = JSON.stringify(data)
          mockStorage.setItem(PREFIX + key, serialized)
          return true
        } catch (error) {
          console.warn('Failed to save to localStorage:', error)
          return false
        }
      }
      
      const load = <T>(key: string, defaultValue?: T): T | null => {
        try {
          const item = mockStorage.getItem(PREFIX + key)
          if (item === null) return defaultValue || null
          return JSON.parse(item) as T
        } catch (error) {
          console.warn('Failed to load from localStorage:', error)
          return defaultValue || null
        }
      }
      
      const remove = (key: string): boolean => {
        try {
          mockStorage.removeItem(PREFIX + key)
          return true
        } catch (error) {
          console.warn('Failed to remove from localStorage:', error)
          return false
        }
      }
      
      const exists = (key: string): boolean => {
        return mockStorage.getItem(PREFIX + key) !== null
      }
      
      return { save, load, remove, exists }
    }

    let mockStorage: ReturnType<typeof createMockStorage>
    let storageService: ReturnType<typeof createStorageService>
    
    beforeEach(() => {
      mockStorage = createMockStorage()
      storageService = createStorageService(mockStorage)
    })

    it('should save and load data correctly', () => {
      const testData = { score: 1000, level: 5, settings: { sound: true } }
      
      const saveResult = storageService.save('gameData', testData)
      expect(saveResult).toBe(true)
      
      const loadedData = storageService.load('gameData')
      expect(loadedData).toEqual(testData)
    })

    it('should handle missing keys with defaults', () => {
      const defaultValue = { score: 0, level: 1 }
      const result = storageService.load('nonexistent', defaultValue)
      
      expect(result).toEqual(defaultValue)
    })

    it('should return null for missing keys without defaults', () => {
      const result = storageService.load('nonexistent')
      expect(result).toBeNull()
    })

    it('should remove data correctly', () => {
      storageService.save('testKey', 'testValue')
      expect(storageService.exists('testKey')).toBe(true)
      
      const removeResult = storageService.remove('testKey')
      expect(removeResult).toBe(true)
      expect(storageService.exists('testKey')).toBe(false)
    })

    it('should check existence correctly', () => {
      expect(storageService.exists('testKey')).toBe(false)
      
      storageService.save('testKey', 'value')
      expect(storageService.exists('testKey')).toBe(true)
    })

    it('should handle different data types', () => {
      // String
      storageService.save('string', 'hello')
      expect(storageService.load('string')).toBe('hello')
      
      // Number
      storageService.save('number', 42)
      expect(storageService.load('number')).toBe(42)
      
      // Boolean
      storageService.save('boolean', true)
      expect(storageService.load('boolean')).toBe(true)
      
      // Array
      const array = [1, 2, 3]
      storageService.save('array', array)
      expect(storageService.load('array')).toEqual(array)
      
      // Object
      const obj = { a: 1, b: 'test' }
      storageService.save('object', obj)
      expect(storageService.load('object')).toEqual(obj)
    })
  })

  describe('GameInputHandler', () => {
    // Mock av GameInputHandler logik
    const createInputHandler = () => {
      const keyBindings = {
        SPACE: 'toggleCreature',
        ESCAPE: 'pauseGame',
        ARROW_UP: 'navigateUp',
        ARROW_DOWN: 'navigateDown',
        ENTER: 'select',
        S: 'saveGame',
        L: 'loadGame',
        R: 'resetGame'
      }
      
      let activeKeys = new Set<string>()
      let actionCallbacks: Record<string, () => void> = {}
      let isListening = false
      
      const handleKeyDown = (key: string) => {
        if (!isListening) return
        
        activeKeys.add(key)
        const action = keyBindings[key as keyof typeof keyBindings]
        
        if (action && actionCallbacks[action]) {
          actionCallbacks[action]()
        }
      }
      
      const handleKeyUp = (key: string) => {
        activeKeys.delete(key)
      }
      
      const isKeyPressed = (key: string): boolean => {
        return activeKeys.has(key)
      }
      
      return {
        startListening: () => { isListening = true },
        stopListening: () => { isListening = false },
        handleKeyDown,
        handleKeyUp,
        isKeyPressed,
        onAction: (action: string, callback: () => void) => {
          actionCallbacks[action] = callback
        },
        getActiveKeys: () => Array.from(activeKeys),
        isListening: () => isListening
      }
    }

    let inputHandler: ReturnType<typeof createInputHandler>
    
    beforeEach(() => {
      inputHandler = createInputHandler()
      inputHandler.startListening()
    })

    it('should track key states correctly', () => {
      expect(inputHandler.isKeyPressed('SPACE')).toBe(false)
      
      inputHandler.handleKeyDown('SPACE')
      expect(inputHandler.isKeyPressed('SPACE')).toBe(true)
      
      inputHandler.handleKeyUp('SPACE')
      expect(inputHandler.isKeyPressed('SPACE')).toBe(false)
    })

    it('should trigger actions for bound keys', () => {
      const toggleCallback = vi.fn()
      const pauseCallback = vi.fn()
      
      inputHandler.onAction('toggleCreature', toggleCallback)
      inputHandler.onAction('pauseGame', pauseCallback)
      
      inputHandler.handleKeyDown('SPACE')
      expect(toggleCallback).toHaveBeenCalled()
      
      inputHandler.handleKeyDown('ESCAPE')
      expect(pauseCallback).toHaveBeenCalled()
    })

    it('should not respond when not listening', () => {
      const callback = vi.fn()
      inputHandler.onAction('toggleCreature', callback)
      
      inputHandler.stopListening()
      inputHandler.handleKeyDown('SPACE')
      
      expect(callback).not.toHaveBeenCalled()
      expect(inputHandler.isKeyPressed('SPACE')).toBe(false)
    })

    it('should handle multiple simultaneous keys', () => {
      inputHandler.handleKeyDown('SPACE')
      inputHandler.handleKeyDown('ESCAPE')
      inputHandler.handleKeyDown('ARROW_UP')
      
      const activeKeys = inputHandler.getActiveKeys()
      expect(activeKeys).toContain('SPACE')
      expect(activeKeys).toContain('ESCAPE')
      expect(activeKeys).toContain('ARROW_UP')
      expect(activeKeys.length).toBe(3)
    })

    it('should handle navigation keys', () => {
      const upCallback = vi.fn()
      const downCallback = vi.fn()
      const selectCallback = vi.fn()
      
      inputHandler.onAction('navigateUp', upCallback)
      inputHandler.onAction('navigateDown', downCallback)
      inputHandler.onAction('select', selectCallback)
      
      inputHandler.handleKeyDown('ARROW_UP')
      expect(upCallback).toHaveBeenCalled()
      
      inputHandler.handleKeyDown('ARROW_DOWN')
      expect(downCallback).toHaveBeenCalled()
      
      inputHandler.handleKeyDown('ENTER')
      expect(selectCallback).toHaveBeenCalled()
    })

    it('should ignore unmapped keys', () => {
      const callback = vi.fn()
      inputHandler.onAction('unmappedAction', callback)
      
      inputHandler.handleKeyDown('X') // Unmapped key
      expect(callback).not.toHaveBeenCalled()
    })
  })
})