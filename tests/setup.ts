import 'jsdom'
import { vi, beforeEach } from 'vitest'

// Enkla Canvas API mocks - fokus på interface, inte implementation
const mockCanvas = {
  getContext: vi.fn(() => ({
    // Bara de metoder vi faktiskt använder
    fillStyle: '',
    strokeStyle: '',
    font: '',
    textAlign: '',
    lineWidth: 1,
    globalAlpha: 1,
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    fillText: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    scale: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    createLinearGradient: vi.fn(() => ({
      addColorStop: vi.fn()
    })),
    measureText: vi.fn(() => ({ width: 100 })),
    canvas: { width: 800, height: 600 }
  })),
  width: 800,
  height: 600,
  addEventListener: vi.fn(),
  getBoundingClientRect: vi.fn(() => ({
    left: 0,
    top: 0,
    width: 800,
    height: 600
  }))
}

// Mock HTMLCanvasElement för DOM-tests
Object.defineProperty(window, 'HTMLCanvasElement', {
  value: vi.fn(() => mockCanvas)
})

// Mock animationFrame för spelloop-tests
globalThis.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => setTimeout(cb, 16) as unknown as number)
globalThis.cancelAnimationFrame = vi.fn((id: number) => clearTimeout(id))

// Mock localStorage för inställningar
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
globalThis.localStorage = localStorageMock as any

// Mock fetch för I18n-tests
globalThis.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      "title": "Within the Woodpile 🌲",
      "menu.play": "🎮 Spela",
      "menu.instructions": "📚 Instruktioner"
    })
  })
) as any

// Mock window dimensions för responsive tests
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024
})

Object.defineProperty(window, 'innerHeight', {
  writable: true,
  configurable: true,
  value: 768
})

// Mock console för cleaner test output
const consoleMock = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
}
globalThis.console = consoleMock as any

// Reset all mocks före varje test
beforeEach(() => {
  vi.clearAllMocks()
})