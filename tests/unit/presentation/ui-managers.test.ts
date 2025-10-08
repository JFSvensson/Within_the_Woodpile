import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Test av UI Managers
describe('UI Managers', () => {
  describe('ResponsiveManager', () => {
    // Mock av ResponsiveManager logik
    const createResponsiveManager = () => {
      let currentBreakpoint = 'desktop'
      let listeners: Array<(breakpoint: string) => void> = []
      
      const breakpoints = {
        mobile: 480,
        tablet: 768,
        desktop: 1024
      }
      
      const getBreakpoint = (width: number): string => {
        if (width < breakpoints.mobile) return 'mobile'
        if (width < breakpoints.tablet) return 'tablet'
        if (width < breakpoints.desktop) return 'desktop'
        return 'desktop'
      }
      
      const updateBreakpoint = (width: number) => {
        const newBreakpoint = getBreakpoint(width)
        if (newBreakpoint !== currentBreakpoint) {
          currentBreakpoint = newBreakpoint
          listeners.forEach(listener => listener(newBreakpoint))
        }
      }
      
      return {
        getCurrentBreakpoint: () => currentBreakpoint,
        addListener: (callback: (breakpoint: string) => void) => {
          listeners.push(callback)
        },
        removeListener: (callback: (breakpoint: string) => void) => {
          listeners = listeners.filter(l => l !== callback)
        },
        updateBreakpoint,
        getBreakpoint
      }
    }

    let responsiveManager: ReturnType<typeof createResponsiveManager>
    
    beforeEach(() => {
      responsiveManager = createResponsiveManager()
    })

    it('should detect correct breakpoints', () => {
      expect(responsiveManager.getBreakpoint(320)).toBe('mobile')
      expect(responsiveManager.getBreakpoint(600)).toBe('tablet')
      expect(responsiveManager.getBreakpoint(1200)).toBe('desktop')
    })

    it('should notify listeners on breakpoint changes', () => {
      const listener = vi.fn()
      responsiveManager.addListener(listener)
      
      responsiveManager.updateBreakpoint(320)
      expect(listener).toHaveBeenCalledWith('mobile')
      
      responsiveManager.updateBreakpoint(1200)
      expect(listener).toHaveBeenCalledWith('desktop')
    })

    it('should not notify if breakpoint unchanged', () => {
      const listener = vi.fn()
      responsiveManager.addListener(listener)
      
      responsiveManager.updateBreakpoint(1200) // Same as initial
      expect(listener).not.toHaveBeenCalled()
    })

    it('should remove listeners correctly', () => {
      const listener = vi.fn()
      responsiveManager.addListener(listener)
      responsiveManager.removeListener(listener)
      
      responsiveManager.updateBreakpoint(320)
      expect(listener).not.toHaveBeenCalled()
    })
  })

  describe('TransitionManager', () => {
    // Mock av TransitionManager logik
    const createTransitionManager = () => {
      let currentTransition: string | null = null
      let transitionCallbacks: Record<string, () => void> = {}
      
      const startTransition = async (type: string, duration: number = 300) => {
        currentTransition = type
        
        // Simulera CSS transition
        await new Promise(resolve => setTimeout(resolve, duration))
        
        // Trigga callback om det finns
        if (transitionCallbacks[type]) {
          transitionCallbacks[type]()
        }
        
        currentTransition = null
      }
      
      return {
        getCurrentTransition: () => currentTransition,
        startTransition,
        onTransitionComplete: (type: string, callback: () => void) => {
          transitionCallbacks[type] = callback
        },
        isTransitioning: () => currentTransition !== null
      }
    }

    let transitionManager: ReturnType<typeof createTransitionManager>
    
    beforeEach(() => {
      transitionManager = createTransitionManager()
    })

    it('should track transition state correctly', async () => {
      expect(transitionManager.isTransitioning()).toBe(false)
      
      const transitionPromise = transitionManager.startTransition('fadeOut', 100)
      expect(transitionManager.isTransitioning()).toBe(true)
      expect(transitionManager.getCurrentTransition()).toBe('fadeOut')
      
      await transitionPromise
      expect(transitionManager.isTransitioning()).toBe(false)
    })

    it('should trigger completion callbacks', async () => {
      const callback = vi.fn()
      transitionManager.onTransitionComplete('fadeIn', callback)
      
      await transitionManager.startTransition('fadeIn', 50)
      expect(callback).toHaveBeenCalled()
    })

    it('should handle multiple transition types', async () => {
      const fadeCallback = vi.fn()
      const slideCallback = vi.fn()
      
      transitionManager.onTransitionComplete('fade', fadeCallback)
      transitionManager.onTransitionComplete('slide', slideCallback)
      
      await transitionManager.startTransition('fade', 50)
      expect(fadeCallback).toHaveBeenCalled()
      expect(slideCallback).not.toHaveBeenCalled()
    })
  })

  describe('MenuButtonManager', () => {
    // Mock av MenuButtonManager logik
    const createMenuButtonManager = () => {
      const buttons = [
        { id: 'play', label: 'Spela', action: 'startGame' },
        { id: 'instructions', label: 'Instruktioner', action: 'showInstructions' },
        { id: 'settings', label: 'Inställningar', action: 'showSettings' }
      ]
      
      let currentIndex = 0
      let isActive = false
      let actionCallbacks: Record<string, () => void> = {}
      
      const navigate = (direction: 'up' | 'down') => {
        if (!isActive) return
        
        if (direction === 'up') {
          currentIndex = currentIndex > 0 ? currentIndex - 1 : buttons.length - 1
        } else {
          currentIndex = currentIndex < buttons.length - 1 ? currentIndex + 1 : 0
        }
      }
      
      const selectCurrent = () => {
        if (!isActive) return
        
        const currentButton = buttons[currentIndex]
        if (actionCallbacks[currentButton.action]) {
          actionCallbacks[currentButton.action]()
        }
      }
      
      return {
        activate: () => { isActive = true },
        deactivate: () => { isActive = false },
        navigate,
        selectCurrent,
        getCurrentIndex: () => currentIndex,
        getCurrentButton: () => buttons[currentIndex],
        onAction: (action: string, callback: () => void) => {
          actionCallbacks[action] = callback
        },
        setIndex: (index: number) => {
          if (index >= 0 && index < buttons.length) {
            currentIndex = index
          }
        }
      }
    }

    let menuManager: ReturnType<typeof createMenuButtonManager>
    
    beforeEach(() => {
      menuManager = createMenuButtonManager()
      menuManager.activate()
    })

    it('should navigate between buttons correctly', () => {
      expect(menuManager.getCurrentIndex()).toBe(0)
      
      menuManager.navigate('down')
      expect(menuManager.getCurrentIndex()).toBe(1)
      
      menuManager.navigate('down')
      expect(menuManager.getCurrentIndex()).toBe(2)
      
      // Wrap around
      menuManager.navigate('down')
      expect(menuManager.getCurrentIndex()).toBe(0)
    })

    it('should navigate upwards correctly', () => {
      menuManager.navigate('up')
      expect(menuManager.getCurrentIndex()).toBe(2) // Wrap to last
      
      menuManager.navigate('up')
      expect(menuManager.getCurrentIndex()).toBe(1)
    })

    it('should trigger actions on selection', () => {
      const startGameCallback = vi.fn()
      menuManager.onAction('startGame', startGameCallback)
      
      menuManager.setIndex(0) // Play button
      menuManager.selectCurrent()
      
      expect(startGameCallback).toHaveBeenCalled()
    })

    it('should not respond when inactive', () => {
      menuManager.deactivate()
      const initialIndex = menuManager.getCurrentIndex()
      
      menuManager.navigate('down')
      expect(menuManager.getCurrentIndex()).toBe(initialIndex)
    })

    it('should get correct button data', () => {
      menuManager.setIndex(1)
      const button = menuManager.getCurrentButton()
      
      expect(button.id).toBe('instructions')
      expect(button.label).toBe('Instruktioner')
      expect(button.action).toBe('showInstructions')
    })
  })
})