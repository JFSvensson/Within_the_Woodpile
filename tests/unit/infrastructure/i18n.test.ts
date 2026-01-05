import { describe, it, expect, vi, beforeEach } from 'vitest'
import { I18n } from '../../../src/infrastructure/i18n/I18n.js'

describe('I18n', () => {
  let i18n: I18n

  beforeEach(() => {
    // Mock fetch för olika språkfiler
    globalThis.fetch = vi.fn()
    
    // Mock localStorage
    globalThis.localStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    } as any

    i18n = new I18n()
  })

  describe('initialization', () => {
    it('should initialize with Swedish as default language', () => {
      expect(i18n.getCurrentLanguage()).toBe('sv')
    })

    it('should load saved language from localStorage', () => {
      const mockGetItem = vi.mocked(globalThis.localStorage.getItem)
      mockGetItem.mockReturnValue('en')
      
      const savedLanguage = i18n.getSavedLanguage()
      expect(savedLanguage).toBe('en')
    })

    it('should fallback to Swedish if no saved language', () => {
      const mockGetItem = vi.mocked(globalThis.localStorage.getItem)
      mockGetItem.mockReturnValue(null)
      
      const savedLanguage = i18n.getSavedLanguage()
      expect(savedLanguage).toBe('sv')
    })
  })

  describe('loadLanguage', () => {
    it('should load Swedish translations successfully', async () => {
      const mockTranslations = {
        'menu.play': '🎮 Spela',
        'menu.instructions': '📚 Instruktioner'
      }

      const mockFetch = vi.mocked(globalThis.fetch)
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockTranslations)
      } as Response)

      await i18n.loadLanguage('sv')

      expect(mockFetch).toHaveBeenCalledWith('i18n/sv.json')
      expect(i18n.getCurrentLanguage()).toBe('sv')
      expect(globalThis.localStorage.setItem).toHaveBeenCalledWith('language', 'sv')
    })

    it('should load English translations successfully', async () => {
      const mockTranslations = {
        'menu.play': '🎮 Play',
        'menu.instructions': '📚 Instructions'
      }

      const mockFetch = vi.mocked(globalThis.fetch)
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockTranslations)
      } as Response)

      await i18n.loadLanguage('en')

      expect(mockFetch).toHaveBeenCalledWith('i18n/en.json')
      expect(i18n.getCurrentLanguage()).toBe('en')
    })

    it('should fallback to Swedish on failed language load', async () => {
      const mockFetch = vi.mocked(globalThis.fetch)
      
      // Första anropet (för 'de') misslyckas
      mockFetch.mockResolvedValueOnce({
        ok: false
      } as Response)
      
      // Andra anropet (fallback till 'sv') lyckas
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 'menu.play': '🎮 Spela' })
      } as Response)

      await i18n.loadLanguage('de') // Icke-existerande språk

      // Ska ha försökt ladda 'de' först, sedan fallback till 'sv'
      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(mockFetch).toHaveBeenNthCalledWith(1, 'i18n/de.json')
      expect(mockFetch).toHaveBeenNthCalledWith(2, 'i18n/sv.json')
    })
  })

  describe('translate', () => {
    beforeEach(async () => {
      const mockTranslations = {
        menu: {
          play: '🎮 Spela',
          instructions: '📚 Instruktioner'
        },
        nested: {
          key: 'Nested value'
        }
      }

      vi.mocked(globalThis.fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockTranslations)
      } as Response)

      await i18n.loadLanguage('sv')
    })

    it('should translate existing keys correctly', () => {
      expect(i18n.translate('menu.play')).toBe('🎮 Spela')
      expect(i18n.translate('menu.instructions')).toBe('📚 Instruktioner')
    })

    it('should return key as fallback for missing translations', () => {
      expect(i18n.translate('missing.key')).toBe('missing.key')
    })

    it('should handle nested keys', () => {
      expect(i18n.translate('nested.key')).toBe('Nested value')
    })
  })

  describe('updateUI', () => {
    it('should update DOM elements with data-i18n attributes', async () => {
      // Setup DOM med test element
      document.body.innerHTML = `
        <button data-i18n="menu.play">Old Text</button>
        <span data-i18n="menu.instructions">Old Instructions</span>
      `

      const mockTranslations = {
        menu: {
          play: '🎮 Spela',
          instructions: '📚 Instruktioner'
        }
      }

      vi.mocked(globalThis.fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockTranslations)
      } as Response)

      await i18n.loadLanguage('sv')
      i18n.updateUI()

      const playButton = document.querySelector('[data-i18n="menu.play"]')
      const instructionsSpan = document.querySelector('[data-i18n="menu.instructions"]')

      expect(playButton?.textContent).toBe('🎮 Spela')
      expect(instructionsSpan?.textContent).toBe('📚 Instruktioner')
    })
  })

  describe('Edge Cases and Fallback Logic', () => {
    it('should fallback to Swedish when loading non-existent language', async () => {
      const mockFetch = vi.mocked(globalThis.fetch)
      
      // First call fails (non-existent language), second succeeds (Swedish fallback)
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 404
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ menu: { start: 'Starta spel' } })
        } as Response)

      await i18n.loadLanguage('xx')

      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(mockFetch).toHaveBeenCalledWith('i18n/xx.json')
      expect(mockFetch).toHaveBeenCalledWith('i18n/sv.json')
      expect(i18n.getCurrentLanguage()).toBe('sv')
    })

    it('should return original key when translation not found in nested path', () => {
      // Manually set translations for this test
      ;(i18n as any).translations = {
        menu: {
          start: 'Starta'
        }
      }

      const result = i18n.translate('menu.nonexistent.deeply.nested')
      expect(result).toBe('menu.nonexistent.deeply.nested')
    })

    it('should return key when translation value is not a string', () => {
      ;(i18n as any).translations = {
        menu: {
          items: ['item1', 'item2'] // Array instead of string
        }
      }

      const result = i18n.translate('menu.items')
      expect(result).toBe('menu.items')
    })

    it('should handle empty translation key gracefully', () => {
      ;(i18n as any).translations = { menu: { start: 'Start' } }

      const result = i18n.translate('')
      expect(result).toBe('')
    })

    it('should handle single-level keys correctly', () => {
      ;(i18n as any).translations = {
        title: 'Within the Woodpile'
      }

      const result = i18n.translate('title')
      expect(result).toBe('Within the Woodpile')
    })

    it('should handle deeply nested keys with multiple levels', () => {
      ;(i18n as any).translations = {
        game: {
          ui: {
            messages: {
              level: {
                complete: 'Nivå klar!'
              }
            }
          }
        }
      }

      const result = i18n.translate('game.ui.messages.level.complete')
      expect(result).toBe('Nivå klar!')
    })

    it('should set language to sv when fallback to Swedish succeeds even if initial fails', async () => {
      const mockFetch = vi.mocked(globalThis.fetch)
      
      // First call fails (fr), second succeeds (sv)
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 404
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ menu: { start: 'Starta spel' } })
        } as Response)

      await i18n.loadLanguage('fr')

      // Should fallback to Swedish successfully
      expect(i18n.getCurrentLanguage()).toBe('sv')
    })

    it('should return default sv when nothing saved in localStorage', () => {
      const mockGetItem = vi.mocked(globalThis.localStorage.getItem)
      mockGetItem.mockReturnValue(null)
      
      expect(i18n.getSavedLanguage()).toBe('sv')
    })
  })
})