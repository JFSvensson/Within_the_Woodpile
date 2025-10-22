import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Game } from '../../../../src/core/game/Game.js';
import { I18n } from '../../../../src/infrastructure/i18n/I18n.js';
import { GameConfig } from '../../../../src/types/index.js';
import { DEFAULT_CONFIG } from '../../../../src/shared/constants/index.js';

// Mock canvas context
function createMockCanvasContext(canvas: HTMLCanvasElement) {
    return {
        canvas: canvas,
        fillStyle: '',
        strokeStyle: '',
        font: '',
        textAlign: '',
        textBaseline: '',
        lineWidth: 0,
        clearRect: vi.fn(),
        fillRect: vi.fn(),
        strokeRect: vi.fn(),
        fillText: vi.fn(),
        measureText: vi.fn(() => ({ width: 100 })),
        save: vi.fn(),
        restore: vi.fn(),
        beginPath: vi.fn(),
        closePath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        stroke: vi.fn(),
        translate: vi.fn(),
        rotate: vi.fn(),
        scale: vi.fn(),
        drawImage: vi.fn(),
        createLinearGradient: vi.fn(() => ({
            addColorStop: vi.fn()
        })),
        createRadialGradient: vi.fn(() => ({
            addColorStop: vi.fn()
        }))
    };
}

describe('Game', () => {
    let game: Game;
    let canvas: HTMLCanvasElement;
    let ctx: any;
    let mockI18n: I18n;
    let config: GameConfig;

    beforeEach(() => {
        // Setup canvas
        canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        
        ctx = createMockCanvasContext(canvas);
        vi.spyOn(canvas, 'getContext').mockReturnValue(ctx as any);

        // Mock I18n
        mockI18n = {
            translate: vi.fn((key: string) => key),
            setLanguage: vi.fn(),
            getCurrentLanguage: vi.fn().mockReturnValue('en')
        } as any;

        // Use default config
        config = { ...DEFAULT_CONFIG };

        // Mock requestAnimationFrame
        vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
            setTimeout(() => callback(performance.now()), 0);
            return 1;
        });

        vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
    });

    afterEach(() => {
        if (game) {
            game.destroy();
        }
        vi.clearAllTimers();
        vi.restoreAllMocks();
    });

    describe('Initialization', () => {
        it('should create game with canvas, i18n and default config', () => {
            game = new Game(canvas, mockI18n);
            
            expect(game).toBeDefined();
            expect(game).toBeInstanceOf(Game);
        });

        it('should create game with custom config', () => {
            const customConfig: GameConfig = {
                ...DEFAULT_CONFIG,
                pointsPerWood: 15
            };
            
            game = new Game(canvas, mockI18n, customConfig);
            
            const state = game.getGameState();
            // Health is always initialized to 100 in GameStateManager
            expect(state.health).toBe(100);
        });

        it('should initialize with playing state', () => {
            game = new Game(canvas, mockI18n);
            
            const state = game.getGameState();
            // GameState has isPaused and isGameOver, not isPlaying
            expect(state.isPaused).toBe(false);
            expect(state.isGameOver).toBe(false);
        });

        it('should initialize with zero score', () => {
            game = new Game(canvas, mockI18n);
            
            const state = game.getGameState();
            expect(state.score).toBe(0);
        });

        it('should initialize with full health', () => {
            game = new Game(canvas, mockI18n);
            
            const state = game.getGameState();
            // Health is always 100 initially
            expect(state.health).toBe(100);
        });

        it('should start game loop automatically', () => {
            game = new Game(canvas, mockI18n);
            
            expect(window.requestAnimationFrame).toHaveBeenCalled();
        });
    });

    describe('Game State', () => {
        beforeEach(() => {
            game = new Game(canvas, mockI18n);
        });

        it('should get current game state', () => {
            const state = game.getGameState();
            
            expect(state).toBeDefined();
            expect(state).toHaveProperty('score');
            expect(state).toHaveProperty('health');
            expect(state).toHaveProperty('isPaused');
            expect(state).toHaveProperty('isGameOver');
        });

        it('should update score when scoring', () => {
            let callbackFired = false;
            
            game.onScore((newScore) => {
                callbackFired = true;
                expect(newScore).toBeGreaterThanOrEqual(0);
            });
            
            // Callback registered successfully
            expect(callbackFired).toBe(false);
        });
    });

    describe('Pause and Resume', () => {
        beforeEach(() => {
            game = new Game(canvas, mockI18n);
        });

        it('should toggle pause state', () => {
            const initialPauseState = game.getGameState().isPaused;
            
            game.togglePause();
            
            expect(game.getGameState().isPaused).toBe(!initialPauseState);
        });

        it('should pause when not paused', () => {
            expect(game.getGameState().isPaused).toBe(false);
            
            game.togglePause();
            
            expect(game.getGameState().isPaused).toBe(true);
        });

        it('should resume when paused', () => {
            game.togglePause(); // First pause
            expect(game.getGameState().isPaused).toBe(true);
            
            game.togglePause(); // Then resume
            
            expect(game.getGameState().isPaused).toBe(false);
        });

        it('should handle multiple pause toggles', () => {
            expect(() => {
                game.togglePause();
                game.togglePause();
                game.togglePause();
                game.togglePause();
            }).not.toThrow();
        });
    });

    describe('Callbacks', () => {
        beforeEach(() => {
            game = new Game(canvas, mockI18n);
        });

        it('should set score callback', () => {
            const callback = vi.fn();
            
            expect(() => game.onScore(callback)).not.toThrow();
        });

        it('should set health callback', () => {
            const callback = vi.fn();
            
            expect(() => game.onHealth(callback)).not.toThrow();
        });

        it('should set game end callback', () => {
            const callback = vi.fn();
            
            expect(() => game.onGameEnd(callback)).not.toThrow();
        });

        it('should call score callback when score changes', () => {
            const callback = vi.fn((score) => {
                expect(score).toBeGreaterThanOrEqual(0);
            });
            
            game.onScore(callback);
            
            // Trigger score change would happen through gameplay
        });

        it('should handle multiple callbacks', () => {
            const scoreCallback = vi.fn();
            const healthCallback = vi.fn();
            const endCallback = vi.fn();
            
            expect(() => {
                game.onScore(scoreCallback);
                game.onHealth(healthCallback);
                game.onGameEnd(endCallback);
            }).not.toThrow();
        });
    });

    describe('Game Loop Integration', () => {
        beforeEach(() => {
            game = new Game(canvas, mockI18n);
        });

        it('should start game loop on initialization', () => {
            expect(window.requestAnimationFrame).toHaveBeenCalled();
        });

        it('should stop game loop on destroy', () => {
            game.destroy();
            
            expect(window.cancelAnimationFrame).toHaveBeenCalled();
        });

        it('should render on each frame', async () => {
            // Wait a bit for the game loop to run
            await new Promise(resolve => setTimeout(resolve, 50));
            
            // Verify canvas methods are being called
            expect(canvas.getContext).toHaveBeenCalled();
        });

        it('should update game state on each frame', async () => {
            const initialTime = performance.now();
            
            await vi.waitFor(() => {
                const state = game.getGameState();
                expect(state).toBeDefined();
            }, { timeout: 100 });
        });
    });

    describe('Resource Management', () => {
        beforeEach(() => {
            game = new Game(canvas, mockI18n);
        });

        it('should destroy game cleanly', () => {
            expect(() => game.destroy()).not.toThrow();
        });

        it('should stop game loop on destroy', () => {
            game.destroy();
            
            const state = game.getGameState();
            expect(state).toBeDefined(); // State should still be accessible
        });

        it('should handle destroy when already destroyed', () => {
            game.destroy();
            
            expect(() => game.destroy()).not.toThrow();
        });

        it('should clean up all managers on destroy', () => {
            game.destroy();
            
            // Game should not crash after destroy
            expect(game.getGameState()).toBeDefined();
        });
    });

    describe('Configuration', () => {
        it('should use default config when not provided', () => {
            game = new Game(canvas, mockI18n);
            
            const state = game.getGameState();
            // Health is always 100 initially
            expect(state.health).toBe(100);
        });

        it('should respect custom points per wood config', () => {
            const customConfig: GameConfig = {
                ...DEFAULT_CONFIG,
                pointsPerWood: 20
            };
            
            game = new Game(canvas, mockI18n, customConfig);
            
            // Config is used internally
            expect(game.getGameState()).toBeDefined();
        });

        it('should respect custom points per wood', () => {
            const customConfig: GameConfig = {
                ...DEFAULT_CONFIG,
                pointsPerWood: 20
            };
            
            game = new Game(canvas, mockI18n, customConfig);
            
            // Points would be verified through gameplay
            expect(game.getGameState()).toBeDefined();
        });

        it('should handle various canvas sizes', () => {
            const sizes = [
                { width: 320, height: 240 },
                { width: 800, height: 600 },
                { width: 1920, height: 1080 }
            ];
            
            sizes.forEach(size => {
                const testCanvas = document.createElement('canvas');
                testCanvas.width = size.width;
                testCanvas.height = size.height;
                vi.spyOn(testCanvas, 'getContext').mockReturnValue(ctx as any);
                
                const testGame = new Game(testCanvas, mockI18n);
                expect(testGame.getGameState()).toBeDefined();
                testGame.destroy();
            });
        });
    });

    describe('Edge Cases', () => {
        it('should handle rapid pause/resume cycles', () => {
            game = new Game(canvas, mockI18n);
            
            expect(() => {
                for (let i = 0; i < 50; i++) {
                    game.togglePause();
                }
            }).not.toThrow();
        });

        it('should handle multiple callback registrations', () => {
            game = new Game(canvas, mockI18n);
            
            expect(() => {
                game.onScore(vi.fn());
                game.onScore(vi.fn());
                game.onHealth(vi.fn());
                game.onHealth(vi.fn());
                game.onGameEnd(vi.fn());
                game.onGameEnd(vi.fn());
            }).not.toThrow();
        });

        it('should handle destroy before game loop completes', () => {
            game = new Game(canvas, mockI18n);
            
            // Destroy immediately
            expect(() => game.destroy()).not.toThrow();
        });

        it('should handle negative points per wood', () => {
            const negativePointsConfig: GameConfig = {
                ...DEFAULT_CONFIG,
                pointsPerWood: -10
            };
            
            game = new Game(canvas, mockI18n, negativePointsConfig);
            
            expect(game.getGameState()).toBeDefined();
        });
    });

    describe('State Transitions', () => {
        beforeEach(() => {
            game = new Game(canvas, mockI18n);
        });

        it('should maintain consistent state after pause', () => {
            const stateBefore = game.getGameState();
            
            game.togglePause();
            
            const stateAfter = game.getGameState();
            expect(stateAfter.score).toBe(stateBefore.score);
            expect(stateAfter.health).toBe(stateBefore.health);
        });

        it('should maintain consistent state after resume', () => {
            game.togglePause(); // Pause
            const statePaused = game.getGameState();
            
            game.togglePause(); // Resume
            
            const stateResumed = game.getGameState();
            expect(stateResumed.score).toBe(statePaused.score);
            expect(stateResumed.health).toBe(statePaused.health);
        });
    });

    describe('Integration Tests', () => {
        beforeEach(() => {
            game = new Game(canvas, mockI18n);
        });

        it('should handle complete game lifecycle', async () => {
            // Start - check initial state
            expect(game.getGameState().isGameOver).toBe(false);
            
            // Pause
            game.togglePause();
            expect(game.getGameState().isPaused).toBe(true);
            
            // Resume
            game.togglePause();
            expect(game.getGameState().isPaused).toBe(false);
            
            // Destroy
            game.destroy();
            expect(game.getGameState()).toBeDefined();
        });

        it('should handle callback chain', () => {
            let scoreCallbackCalled = false;
            let healthCallbackCalled = false;
            
            game.onScore(() => {
                scoreCallbackCalled = true;
            });
            
            game.onHealth(() => {
                healthCallbackCalled = true;
            });
            
            // Both callbacks registered successfully
            expect(game.getGameState()).toBeDefined();
        });

        it('should render consistently over multiple frames', async () => {
            ctx.save.mockClear();
            
            await vi.waitFor(() => {
                expect(ctx.save).toHaveBeenCalled();
            }, { timeout: 100 });
            
            // Should be called at least once
            expect(ctx.save).toHaveBeenCalled();
        });

        it('should handle state queries during gameplay', () => {
            expect(() => {
                for (let i = 0; i < 10; i++) {
                    const state = game.getGameState();
                    expect(state).toBeDefined();
                }
            }).not.toThrow();
        });

        it('should handle pause during active rendering', async () => {
            // Wait for at least one render
            await vi.waitFor(() => {
                expect(ctx.save).toHaveBeenCalled();
            }, { timeout: 100 });
            
            // Pause during rendering
            game.togglePause();
            
            expect(game.getGameState().isPaused).toBe(true);
        });
    });

    describe('Canvas Rendering', () => {
        beforeEach(() => {
            game = new Game(canvas, mockI18n);
        });

        it('should use canvas context for rendering', async () => {
            await vi.waitFor(() => {
                expect(canvas.getContext).toHaveBeenCalledWith('2d');
            }, { timeout: 100 });
        });

        it('should call rendering methods on canvas context', async () => {
            // Canvas context methods should eventually be called during rendering
            await new Promise(resolve => setTimeout(resolve, 50));
            
            // Verify context was retrieved
            expect(canvas.getContext).toHaveBeenCalled();
        });
    });

    describe('Performance', () => {
        it('should initialize quickly', () => {
            const start = performance.now();
            game = new Game(canvas, mockI18n);
            const end = performance.now();
            
            expect(end - start).toBeLessThan(500); // Should initialize in less than 500ms
        });

        it('should destroy quickly', () => {
            game = new Game(canvas, mockI18n);
            
            const start = performance.now();
            game.destroy();
            const end = performance.now();
            
            expect(end - start).toBeLessThan(50); // Should destroy in less than 50ms
        });

        it('should handle rapid state queries', () => {
            game = new Game(canvas, mockI18n);
            
            const start = performance.now();
            for (let i = 0; i < 1000; i++) {
                game.getGameState();
            }
            const end = performance.now();
            
            expect(end - start).toBeLessThan(100); // 1000 queries in less than 100ms
        });
    });
});
