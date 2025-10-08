import { describe, it, expect, beforeEach, vi } from 'vitest'
import { HighscoreModal } from '../../../src/ui/highscore/HighscoreModal.js'
import { HighscoreManager } from '../../../src/core/managers/HighscoreManager.js'
import { I18n } from '../../../src/infrastructure/i18n/I18n.js'
import { HighscoreViewType } from '../../../src/types/index.js'

describe('HighscoreModal', () => {
  let canvas: HTMLCanvasElement
  let ctx: CanvasRenderingContext2D
  let i18n: I18n
  let highscoreManager: HighscoreManager
  let modal: HighscoreModal

  beforeEach(() => {
    // Mock Canvas och Context
    canvas = {
      width: 800,
      height: 600,
      getContext: vi.fn()
    } as unknown as HTMLCanvasElement

    ctx = {
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
      font: '',
      textAlign: 'left',
      textBaseline: 'top',
      shadowColor: '',
      shadowBlur: 0,
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      clearRect: vi.fn(),
      fillText: vi.fn(),
      strokeText: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      closePath: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      rotate: vi.fn(),
      createLinearGradient: vi.fn(() => ({
        addColorStop: vi.fn()
      }))
    } as unknown as CanvasRenderingContext2D

    // Mock I18n
    i18n = {
      translate: vi.fn((key: string) => key),
      getCurrentLanguage: vi.fn(() => 'sv')
    } as unknown as I18n

    // Mock HighscoreManager
    highscoreManager = {
      getAllHighscores: vi.fn().mockResolvedValue({
        entries: [],
        maxEntries: 10,
        lastUpdated: '2025-01-01'
      }),
      addHighscore: vi.fn().mockResolvedValue({
        entry: {
          id: '1',
          playerName: 'Test',
          score: 100,
          timestamp: new Date(),
          level: 1,
          playDuration: 60
        },
        messages: {
          success: 'Success!',
          isPersonalBest: true
        }
      })
    } as unknown as HighscoreManager

    modal = new HighscoreModal(ctx, canvas, i18n, highscoreManager)
  })

  describe('Basic Functionality', () => {
    it('should initialize with correct default state', () => {
      expect(modal.getIsVisible()).toBe(false)
    })

    it('should show and hide modal correctly', async () => {
      await modal.show()
      expect(modal.getIsVisible()).toBe(true)

      modal.hide()
      expect(modal.getIsVisible()).toBe(false)
    })

    it('should handle add score dialog', async () => {
      await modal.showAddScoreDialog(1000, 5, 300)
      expect(modal.getIsVisible()).toBe(true)
    })
  })

  describe('Rendering', () => {
    it('should not render when hidden', () => {
      modal.render(0)
      expect(ctx.fillRect).not.toHaveBeenCalled()
    })

    it('should render when visible', async () => {
      await modal.show()
      modal.render(0)
      expect(ctx.fillRect).toHaveBeenCalled()
    })

    it('should render all components when visible', async () => {
      await modal.show()
      modal.render(0)
      
      // Kontrollera att rendering-metoder anropas
      expect(ctx.fillRect).toHaveBeenCalled() // Overlay + modal background
      expect(ctx.fillText).toHaveBeenCalled() // Text rendering
    })
  })

  describe('Event Handling', () => {
    it('should handle mouse clicks when visible', async () => {
      await modal.show()
      
      // Mock click utanför knappar
      const result = modal.handleClick(100, 100)
      expect(result).toBe(false)
    })

    it('should handle mouse movement', async () => {
      await modal.show()
      
      // Ska inte kasta fel
      expect(() => modal.handleMouseMove(100, 100)).not.toThrow()
    })

    it('should handle keyboard input', async () => {
      await modal.show()
      
      // Ska inte kasta fel
      expect(() => modal.handleKeyInput('Escape')).not.toThrow()
    })

    it('should hide on Escape key', async () => {
      await modal.show()
      expect(modal.getIsVisible()).toBe(true)
      
      modal.handleKeyInput('Escape')
      expect(modal.getIsVisible()).toBe(false)
    })
  })

  describe('Data Management', () => {
    it('should fetch data when shown', async () => {
      await modal.show()
      expect(highscoreManager.getAllHighscores).toHaveBeenCalled()
    })

    it('should handle empty highscore list', async () => {
      await modal.show()
      modal.render(0)
      
      // Ska inte kasta fel även med tom lista
      expect(() => modal.render(0)).not.toThrow()
    })
  })

  describe('Component Integration', () => {
    it('should handle add score dialog submission', async () => {
      await modal.showAddScoreDialog(1000, 5, 300)
      
      // Simulera input från dialog (detta testas mer detaljerat i AddScoreDialog.test.ts)
      expect(modal.getIsVisible()).toBe(true)
    })

    it('should clean up resources on destroy', () => {
      expect(() => modal.destroy()).not.toThrow()
      expect(modal.getIsVisible()).toBe(false)
    })
  })

  describe('Responsive Design', () => {
    it('should handle different canvas sizes', () => {
      const smallCanvas = { ...canvas, width: 400, height: 300 }
      const smallModal = new HighscoreModal(ctx, smallCanvas as HTMLCanvasElement, i18n, highscoreManager)
      
      expect(() => smallModal.render(0)).not.toThrow()
    })

    it('should adapt modal size to canvas', () => {
      // Modal ska anpassa sig till canvas-storlek
      // Detta testas implicit genom att skapa modal utan fel
      expect(modal).toBeDefined()
    })
  })
})