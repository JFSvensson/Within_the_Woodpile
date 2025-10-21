import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ResponsiveManager } from '../../src/ResponsiveManager.js';

// Mock window.innerWidth and innerHeight
function setWindowSize(width: number, height: number) {
    Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: width
    });
    Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: height
    });
}

describe('ResponsiveManager Tests', () => {
    let manager: ResponsiveManager;
    let canvas: HTMLCanvasElement;
    let resizeHandler: () => void;
    let orientationHandler: () => void;

    beforeEach(() => {
        // Create mock canvas
        canvas = {
            width: 0,
            height: 0,
            getContext: vi.fn()
        } as unknown as HTMLCanvasElement;

        // Capture event listeners
        const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
        
        // Set default window size (desktop)
        setWindowSize(1024, 768);
        
        manager = new ResponsiveManager(canvas);

        // Extract registered event handlers
        const calls = addEventListenerSpy.mock.calls;
        resizeHandler = calls.find(call => call[0] === 'resize')?.[1] as () => void;
        orientationHandler = calls.find(call => call[0] === 'orientationchange')?.[1] as () => void;
    });

    afterEach(() => {
        if (manager) {
            manager.destroy();
        }
        vi.restoreAllMocks();
    });

    describe('Initialization', () => {
        it('should create manager with canvas', () => {
            expect(manager).toBeDefined();
        });

        it('should register resize event listener', () => {
            expect(resizeHandler).toBeDefined();
        });

        it('should register orientationchange event listener', () => {
            expect(orientationHandler).toBeDefined();
        });

        it('should set initial canvas size', () => {
            expect(canvas.width).toBeGreaterThan(0);
            expect(canvas.height).toBeGreaterThan(0);
        });
    });

    describe('Breakpoint Detection', () => {
        it('should detect desktop breakpoint', () => {
            setWindowSize(1024, 768);
            manager = new ResponsiveManager(canvas);
            
            expect(manager.isDesktop()).toBe(true);
            expect(manager.isMobile()).toBe(false);
            expect(manager.isTablet()).toBe(false);
        });

        it('should detect tablet breakpoint', () => {
            setWindowSize(768, 1024);
            manager = new ResponsiveManager(canvas);
            
            expect(manager.isTablet()).toBe(true);
            expect(manager.isDesktop()).toBe(false);
            expect(manager.isMobile()).toBe(false);
        });

        it('should detect mobile portrait breakpoint', () => {
            setWindowSize(375, 667);
            manager = new ResponsiveManager(canvas);
            
            expect(manager.isMobile()).toBe(true);
            expect(manager.isTablet()).toBe(false);
            expect(manager.isDesktop()).toBe(false);
        });

        it('should detect mobile landscape breakpoint', () => {
            setWindowSize(480, 300); // Width <= 480, landscape
            manager = new ResponsiveManager(canvas);
            
            expect(manager.isMobile()).toBe(true);
            expect(manager.getBreakpoint()).toBe('mobile-landscape');
            expect(manager.isDesktop()).toBe(false);
        });

        it('should detect large desktop breakpoint', () => {
            setWindowSize(1920, 1080);
            manager = new ResponsiveManager(canvas);
            
            expect(manager.isDesktop()).toBe(true);
            expect(manager.getBreakpoint()).toBe('large-desktop');
        });

        it('should return current breakpoint', () => {
            setWindowSize(1024, 768);
            manager = new ResponsiveManager(canvas);
            
            const breakpoint = manager.getBreakpoint();
            expect(breakpoint).toBeTruthy();
            expect(typeof breakpoint).toBe('string');
        });
    });

    describe('Canvas Dimensions', () => {
        it('should set desktop canvas size', () => {
            setWindowSize(1024, 768);
            manager = new ResponsiveManager(canvas);
            
            expect(canvas.width).toBe(800);
            expect(canvas.height).toBe(600);
        });

        it('should set large desktop canvas size', () => {
            setWindowSize(1920, 1080);
            manager = new ResponsiveManager(canvas);
            
            expect(canvas.width).toBe(900);
            expect(canvas.height).toBe(675);
        });

        it('should set tablet canvas size', () => {
            setWindowSize(768, 1024);
            manager = new ResponsiveManager(canvas);
            
            expect(canvas.width).toBeGreaterThan(0);
            expect(canvas.height).toBe(450);
        });

        it('should set mobile portrait canvas size', () => {
            setWindowSize(375, 667);
            manager = new ResponsiveManager(canvas);
            
            expect(canvas.width).toBeLessThanOrEqual(400);
            expect(canvas.height).toBe(300);
        });

        it('should set mobile landscape canvas size', () => {
            setWindowSize(480, 300); // Width <= 480, landscape
            manager = new ResponsiveManager(canvas);
            
            // Mobile landscape: min(600, 480-16) = 464, min(400, 300-200) = 100
            expect(canvas.width).toBeLessThanOrEqual(480);
            expect(canvas.height).toBeLessThanOrEqual(300);
        });

        it('should respect viewport margins on mobile', () => {
            setWindowSize(320, 568);
            manager = new ResponsiveManager(canvas);
            
            // Canvas ska vara mindre än viewport för margins
            expect(canvas.width).toBeLessThan(320);
        });
    });

    describe('Resize Handling', () => {
        it('should handle resize event', async () => {
            vi.useFakeTimers();
            
            const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');
            
            setWindowSize(768, 1024);
            if (resizeHandler) {
                resizeHandler();
            }
            
            // Vänta på debounce timeout (250ms)
            vi.advanceTimersByTime(250);
            
            expect(dispatchEventSpy).toHaveBeenCalled();
            
            vi.useRealTimers();
        });

        it('should debounce rapid resize events', () => {
            vi.useFakeTimers();
            
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
            
            // Simulera 5 snabba resize events
            for (let i = 0; i < 5; i++) {
                if (resizeHandler) {
                    resizeHandler();
                }
                vi.advanceTimersByTime(50);
            }
            
            // Bara ett resize ska ha genomförts efter debounce
            vi.advanceTimersByTime(250);
            
            // Log ska bara anropas en gång efter debounce
            const resizeLogs = consoleSpy.mock.calls.filter(call => 
                String(call[0]).includes('Canvas resized')
            );
            expect(resizeLogs.length).toBeLessThanOrEqual(2); // Initial + efter debounce
            
            vi.useRealTimers();
        });

        it('should update canvas size on resize', () => {
            vi.useFakeTimers();
            
            const initialWidth = canvas.width;
            
            setWindowSize(1920, 1080);
            if (resizeHandler) {
                resizeHandler();
            }
            vi.advanceTimersByTime(250);
            
            expect(canvas.width).not.toBe(initialWidth);
            
            vi.useRealTimers();
        });

        it('should dispatch custom canvasResize event', () => {
            vi.useFakeTimers();
            
            const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');
            
            setWindowSize(1920, 1080);
            if (resizeHandler) {
                resizeHandler();
            }
            vi.advanceTimersByTime(250);
            
            const customEventCall = dispatchEventSpy.mock.calls.find(call => {
                const event = call[0] as CustomEvent;
                return event.type === 'canvasResize';
            });
            
            expect(customEventCall).toBeDefined();
            
            vi.useRealTimers();
        });

        it('should include dimensions in canvasResize event', () => {
            vi.useFakeTimers();
            
            const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');
            
            setWindowSize(1920, 1080);
            if (resizeHandler) {
                resizeHandler();
            }
            vi.advanceTimersByTime(250);
            
            const customEventCall = dispatchEventSpy.mock.calls.find(call => {
                const event = call[0] as CustomEvent;
                return event.type === 'canvasResize';
            });
            
            if (customEventCall) {
                const event = customEventCall[0] as CustomEvent;
                expect(event.detail.width).toBeDefined();
                expect(event.detail.height).toBeDefined();
                expect(event.detail.breakpoint).toBeDefined();
            }
            
            vi.useRealTimers();
        });
    });

    describe('Orientation Change', () => {
        it('should handle orientation change event', async () => {
            vi.useFakeTimers();
            
            setWindowSize(667, 375); // Landscape
            
            if (orientationHandler) {
                orientationHandler();
            }
            
            // Orientation change väntar 100ms innan resize
            vi.advanceTimersByTime(100);
            
            // Sedan debounce 250ms
            vi.advanceTimersByTime(250);
            
            expect(canvas.width).toBeGreaterThan(0);
            
            vi.useRealTimers();
        });

        it('should delay resize after orientation change', () => {
            vi.useFakeTimers();
            
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
            
            if (orientationHandler) {
                orientationHandler();
            }
            
            // Direkt efter orientation change ska inget ha hänt
            expect(consoleSpy).not.toHaveBeenCalledWith(
                expect.stringContaining('Canvas resized')
            );
            
            // Efter 100ms delay + 250ms debounce
            vi.advanceTimersByTime(350);
            
            vi.useRealTimers();
        });
    });

    describe('Edge Cases', () => {
        it('should not update if breakpoint unchanged', () => {
            vi.useFakeTimers();
            
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
            
            // Första resize
            setWindowSize(1024, 768);
            if (resizeHandler) {
                resizeHandler();
            }
            vi.advanceTimersByTime(250);
            
            const firstCallCount = consoleSpy.mock.calls.filter(call =>
                String(call[0]).includes('Canvas resized')
            ).length;
            
            // Samma storlek igen (samma breakpoint)
            setWindowSize(1100, 800); // Fortfarande desktop
            if (resizeHandler) {
                resizeHandler();
            }
            vi.advanceTimersByTime(250);
            
            const secondCallCount = consoleSpy.mock.calls.filter(call =>
                String(call[0]).includes('Canvas resized')
            ).length;
            
            // Ingen ny log eftersom breakpoint inte ändrades
            expect(secondCallCount).toBe(firstCallCount);
            
            vi.useRealTimers();
        });

        it('should handle very small window sizes', () => {
            setWindowSize(320, 480);
            manager = new ResponsiveManager(canvas);
            
            expect(canvas.width).toBeGreaterThan(0);
            expect(canvas.height).toBeGreaterThan(0);
        });

        it('should handle very large window sizes', () => {
            setWindowSize(3840, 2160); // 4K
            manager = new ResponsiveManager(canvas);
            
            expect(canvas.width).toBeGreaterThan(0);
            expect(canvas.height).toBeGreaterThan(0);
        });

        it('should handle extreme aspect ratios', () => {
            setWindowSize(2560, 1080); // Ultra-wide
            manager = new ResponsiveManager(canvas);
            
            expect(canvas.width).toBeGreaterThan(0);
            expect(canvas.height).toBeGreaterThan(0);
        });
    });

    describe('Resource Management', () => {
        it('should remove resize listener on destroy', () => {
            const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
            
            manager.destroy();
            
            expect(removeEventListenerSpy).toHaveBeenCalled();
        });

        it('should clear timeout on destroy', () => {
            vi.useFakeTimers();
            
            if (resizeHandler) {
                resizeHandler();
            }
            
            manager.destroy();
            
            // Timeout ska vara cleared
            vi.advanceTimersByTime(250);
            
            vi.useRealTimers();
        });

        it('should handle destroy without active timeout', () => {
            expect(() => {
                manager.destroy();
            }).not.toThrow();
        });

        it('should handle multiple destroy calls', () => {
            expect(() => {
                manager.destroy();
                manager.destroy();
                manager.destroy();
            }).not.toThrow();
        });
    });
});
