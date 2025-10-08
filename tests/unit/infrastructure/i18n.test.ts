import { describe, it, expect, vi, beforeEach } from 'vitest'
import { I18n } from '../../../src/infrastructure/i18n/I18n.js'

describe('I18n', () => {
  let i18n: I18n

  beforeEach(() => {
    // Mock fetch för olika språkfiler
    global.fetch = vi.fn()
    
    // Mock localStorage
    global.localStorage = {
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
      const mockGetItem = vi.mocked(localStorage.getItem)
      mockGetItem.mockReturnValue('en')
      
      const savedLanguage = i18n.getSavedLanguage()
      expect(savedLanguage).toBe('en')
    })

    it('should fallback to Swedish if no saved language', () => {
      const mockGetItem = vi.mocked(localStorage.getItem)
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

      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockTranslations)
      } as Response)

      await i18n.loadLanguage('sv')

      expect(mockFetch).toHaveBeenCalledWith('i18n/sv.json')
      expect(i18n.getCurrentLanguage()).toBe('sv')
      expect(localStorage.setItem).toHaveBeenCalledWith('language', 'sv')
    })

    it('should load English translations successfully', async () => {
      const mockTranslations = {
        'menu.play': '🎮 Play',
        'menu.instructions': '📚 Instructions'
      }

      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockTranslations)
      } as Response)

      await i18n.loadLanguage('en')

      expect(mockFetch).toHaveBeenCalledWith('i18n/en.json')
      expect(i18n.getCurrentLanguage()).toBe('en')
    })

    it('should fallback to Swedish on failed language load', async () => {
      const mockFetch = vi.mocked(fetch)
      
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

      vi.mocked(fetch).mockResolvedValue({
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

      vi.mocked(fetch).mockResolvedValue({
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
})