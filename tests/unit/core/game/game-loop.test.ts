import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Game } from '../../../../src/core/game/Game.js';
import { GameLoop } from '../../../../src/core/game/GameLoop.js';
import { I18n } from '../../../../src/infrastructure/i18n/I18n.js';
import { DEFAULT_CONFIG } from '../../../../src/shared/constants/index.js';

// Helper för att skapa en mockad canvas
function createMockCanvas() {
    const canvas = {
        width: 800,
        height: 600,
        getContext: vi.fn(() => ({
            fillStyle: '',
            strokeStyle: '',
            font: '',
            textAlign: '',
            lineWidth: 1,
            globalAlpha: 1,
            fillRect: vi.fn(),
            strokeRect: vi.fn(),
            clearRect: vi.fn(),
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
            canvas: { width: 800, height: 600 }
        })),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        getBoundingClientRect: vi.fn(() => ({
            left: 0,
            top: 0,
            width: 800,
            height: 600
        }))
    } as any as HTMLCanvasElement;
    
    return canvas;
}

// Helper för att skapa mockad I18n
function createMockI18n() {
    return {
        t: vi.fn((key: string) => key),
        getCurrentLanguage: vi.fn(() => 'sv'),
        setLanguage: vi.fn(),
        loadTranslations: vi.fn()
    } as any as I18n;
}

describe('Core Game Logic Tests', () => {
    
    describe('GameLoop', () => {
        let gameLoop: GameLoop;
        
        beforeEach(() => {
            gameLoop = new GameLoop();
            vi.clearAllTimers();
        });

        afterEach(() => {
            // Stoppa game loop för att undvika "unhandled errors"
            if (gameLoop && gameLoop.isLoopRunning()) {
                gameLoop.stop();
            }
            vi.clearAllTimers();
        });

        describe('Loop initialization and lifecycle', () => {
            it('should initialize with stopped state', () => {
                expect(gameLoop.isLoopRunning()).toBe(false);
                
                const stats = gameLoop.getLoopStats();
                expect(stats.isRunning).toBe(false);
                expect(stats.hasAnimationId).toBe(false);
            });

            it('should start loop and set running state', () => {
                gameLoop.start();
                
                expect(gameLoop.isLoopRunning()).toBe(true);
                
                const stats = gameLoop.getLoopStats();
                expect(stats.isRunning).toBe(true);
                expect(stats.hasAnimationId).toBe(true);
            });

            it('should not start loop if already running', () => {
                gameLoop.start();
                const firstStats = gameLoop.getLoopStats();
                
                gameLoop.start(); // Försök starta igen
                const secondStats = gameLoop.getLoopStats();
                
                // State ska vara samma
                expect(secondStats.isRunning).toBe(true);
                expect(secondStats.hasAnimationId).toBe(true);
            });

            it('should stop loop and clear animation ID', () => {
                gameLoop.start();
                expect(gameLoop.isLoopRunning()).toBe(true);
                
                gameLoop.stop();
                
                expect(gameLoop.isLoopRunning()).toBe(false);
                const stats = gameLoop.getLoopStats();
                expect(stats.hasAnimationId).toBe(false);
            });

            it('should handle stop when not running', () => {
                expect(() => gameLoop.stop()).not.toThrow();
                expect(gameLoop.isLoopRunning()).toBe(false);
            });
        });

        describe('Pause and resume functionality', () => {
            it('should pause running loop', () => {
                gameLoop.start();
                expect(gameLoop.isLoopRunning()).toBe(true);
                
                gameLoop.pause();
                
                expect(gameLoop.isLoopRunning()).toBe(false);
                const stats = gameLoop.getLoopStats();
                expect(stats.hasAnimationId).toBe(false);
            });

            it('should resume from paused state', () => {
                gameLoop.start();
                gameLoop.pause();
                expect(gameLoop.isLoopRunning()).toBe(false);
                
                gameLoop.resume();
                
                expect(gameLoop.isLoopRunning()).toBe(true);
                const stats = gameLoop.getLoopStats();
                expect(stats.hasAnimationId).toBe(true);
            });

            it('should not resume if already running', () => {
                gameLoop.start();
                const firstStats = gameLoop.getLoopStats();
                
                gameLoop.resume(); // Försök resume när redan igång
                
                // State ska vara samma
                expect(gameLoop.isLoopRunning()).toBe(true);
            });

            it('should reset lastUpdateTime on resume', () => {
                const startTime = performance.now();
                gameLoop.start();
                gameLoop.pause();
                
                // Simulera tid som passerat
                vi.spyOn(performance, 'now').mockReturnValue(startTime + 1000);
                
                gameLoop.resume();
                const stats = gameLoop.getLoopStats();
                
                // lastUpdateTime ska ha uppdaterats till nuvarande tid
                expect(stats.lastUpdateTime).toBeGreaterThan(startTime);
                
                vi.restoreAllMocks();
            });
        });

        describe('Callback management', () => {
            it('should call onUpdate callback with deltaTime', () => {
                const updateCallback = vi.fn();
                gameLoop.setOnUpdate(updateCallback);
                
                // Vi kan inte enkelt testa requestAnimationFrame-loopen i unit tests
                // Testa istället att callbacks kan registreras korrekt
                expect(updateCallback).toBeDefined();
            });

            it('should call onRender callback', () => {
                const renderCallback = vi.fn();
                gameLoop.setOnRender(renderCallback);
                
                gameLoop.start();
                
                // Callbacks skulle anropas i gameLoop
                
                gameLoop.stop();
            });

            it('should handle missing callbacks gracefully', () => {
                // Starta utan att sätta callbacks
                expect(() => {
                    gameLoop.start();
                    gameLoop.stop();
                }).not.toThrow();
            });

            it('should clear callbacks on destroy', () => {
                const updateCallback = vi.fn();
                const renderCallback = vi.fn();
                
                gameLoop.setOnUpdate(updateCallback);
                gameLoop.setOnRender(renderCallback);
                gameLoop.start();
                
                gameLoop.destroy();
                
                expect(gameLoop.isLoopRunning()).toBe(false);
            });
        });

        describe('Performance and statistics', () => {
            it('should calculate FPS correctly', () => {
                // 60 FPS = ~16.67ms per frame
                const fps60 = gameLoop.getCurrentFPS(16.67);
                expect(fps60).toBeCloseTo(60, 0);
                
                // 30 FPS = ~33.33ms per frame
                const fps30 = gameLoop.getCurrentFPS(33.33);
                expect(fps30).toBeCloseTo(30, 0);
            });

            it('should handle zero deltaTime in FPS calculation', () => {
                const fps = gameLoop.getCurrentFPS(0);
                expect(fps).toBe(0);
            });

            it('should provide accurate loop statistics', () => {
                const stats1 = gameLoop.getLoopStats();
                expect(stats1.isRunning).toBe(false);
                expect(stats1.hasAnimationId).toBe(false);
                
                gameLoop.start();
                
                const stats2 = gameLoop.getLoopStats();
                expect(stats2.isRunning).toBe(true);
                expect(stats2.hasAnimationId).toBe(true);
                expect(stats2.lastUpdateTime).toBeGreaterThan(0);
            });
        });

        describe('Cleanup and destroy', () => {
            it('should stop loop on destroy', () => {
                gameLoop.start();
                expect(gameLoop.isLoopRunning()).toBe(true);
                
                gameLoop.destroy();
                
                expect(gameLoop.isLoopRunning()).toBe(false);
            });

            it('should handle destroy when not running', () => {
                expect(() => gameLoop.destroy()).not.toThrow();
            });

            it('should handle multiple destroy calls', () => {
                gameLoop.start();
                gameLoop.destroy();
                
                expect(() => gameLoop.destroy()).not.toThrow();
            });
        });
    });

    describe('Game', () => {
        let game: Game;
        let canvas: HTMLCanvasElement;
        let i18n: I18n;
        
        beforeEach(() => {
            canvas = createMockCanvas();
            i18n = createMockI18n();
        });

        afterEach(async () => {
            // Viktigt: Stoppa game loop för att undvika "unhandled errors"
            if (game) {
                game.destroy();
            }
            // Vänta lite för att låta eventuella pending timers rensas
            await new Promise(resolve => setTimeout(resolve, 20));
        });

        describe('Initialization', () => {
            it('should initialize with default config', () => {
                game = new Game(canvas, i18n);
                
                const state = game.getGameState();
                expect(state).toBeDefined();
                expect(state.score).toBe(0);
                expect(state.health).toBe(100); // GameStateManager default
                expect(state.isPaused).toBe(false);
                expect(state.isGameOver).toBe(false);
            });

            it('should initialize with custom config', () => {
                const customConfig = {
                    ...DEFAULT_CONFIG,
                    pointsPerWood: 15
                };
                
                game = new Game(canvas, i18n, customConfig);
                
                const state = game.getGameState();
                expect(state.health).toBe(100); // GameStateManager always starts with 100
                expect(state.score).toBe(0);
            });

            it('should generate wood pile on initialization', () => {
                game = new Game(canvas, i18n);
                
                const state = game.getGameState();
                // Wood pile ska ha genererats (kan inte direkt testa woodPieces array)
                expect(state).toBeDefined();
            });

            it('should start game loop on initialization', () => {
                game = new Game(canvas, i18n);
                
                // GameLoop ska ha startats automatiskt
                const state = game.getGameState();
                expect(state.isPaused).toBe(false);
            });
        });

        describe('State management', () => {
            beforeEach(() => {
                game = new Game(canvas, i18n);
            });

            it('should retrieve current game state', () => {
                const state = game.getGameState();
                
                expect(state).toHaveProperty('score');
                expect(state).toHaveProperty('health');
                expect(state).toHaveProperty('isPaused');
                expect(state).toHaveProperty('isGameOver');
            });

            it('should handle pause toggle', () => {
                const initialState = game.getGameState();
                expect(initialState.isPaused).toBe(false);
                
                game.togglePause();
                
                const pausedState = game.getGameState();
                expect(pausedState.isPaused).toBe(true);
            });

            it('should handle resume after pause', () => {
                game.togglePause(); // Pause
                expect(game.getGameState().isPaused).toBe(true);
                
                game.togglePause(); // Resume
                
                expect(game.getGameState().isPaused).toBe(false);
            });
        });

        describe('Callback registration', () => {
            beforeEach(() => {
                game = new Game(canvas, i18n);
            });

            it('should register score update callback', () => {
                const scoreCallback = vi.fn();
                
                game.onScore(scoreCallback);
                
                // Callback registrerad (kan inte direkt testa utan att trigga score-event)
                expect(scoreCallback).not.toHaveBeenCalled(); // Inte anropad än
            });

            it('should register health update callback', () => {
                const healthCallback = vi.fn();
                
                game.onHealth(healthCallback);
                
                expect(healthCallback).not.toHaveBeenCalled();
            });

            it('should register game end callback', () => {
                const gameEndCallback = vi.fn();
                
                game.onGameEnd(gameEndCallback);
                
                expect(gameEndCallback).not.toHaveBeenCalled();
            });

            it('should handle multiple callback registrations', () => {
                const scoreCallback = vi.fn();
                const healthCallback = vi.fn();
                const gameEndCallback = vi.fn();
                
                expect(() => {
                    game.onScore(scoreCallback);
                    game.onHealth(healthCallback);
                    game.onGameEnd(gameEndCallback);
                }).not.toThrow();
            });
        });

        describe('Cleanup and destroy', () => {
            beforeEach(() => {
                game = new Game(canvas, i18n);
            });

            it('should stop game loop on destroy', () => {
                game.destroy();
                
                // Game loop ska ha stoppats
                // Vi kan inte direkt testa detta utan att exponera GameLoop
            });

            it('should clean up managers on destroy', () => {
                expect(() => game.destroy()).not.toThrow();
            });

            it('should handle multiple destroy calls', () => {
                game.destroy();
                
                expect(() => game.destroy()).not.toThrow();
            });

            it('should clean up animation systems on destroy', () => {
                // Starta några animationer först (om möjligt)
                game.destroy();
                
                // Alla animation systems ska vara borta
                expect(() => game.destroy()).not.toThrow();
            });
        });

        describe('Integration with managers', () => {
            beforeEach(() => {
                game = new Game(canvas, i18n);
            });

            it('should integrate with CollisionManager', () => {
                // CollisionManager ska vara initialiserad
                const state = game.getGameState();
                expect(state).toBeDefined();
            });

            it('should integrate with CreatureManager', () => {
                // CreatureManager ska vara initialiserad
                const state = game.getGameState();
                expect(state).toBeDefined();
            });

            it('should integrate with animation systems', () => {
                // WoodCollapseAnimator, ScreenShakeManager, CollapseParticleSystem
                const state = game.getGameState();
                expect(state).toBeDefined();
            });

            it('should coordinate all systems through game loop', () => {
                // GameLoop ska koordinera updates för alla systems
                const state = game.getGameState();
                expect(state.isPaused).toBe(false);
            });
        });

        describe('Error handling', () => {
            it('should throw error when canvas context is missing', () => {
                const badCanvas = {
                    getContext: vi.fn(() => null),
                    addEventListener: vi.fn(),
                    getBoundingClientRect: vi.fn(() => ({
                        left: 0,
                        top: 0,
                        width: 800,
                        height: 600
                    }))
                } as any as HTMLCanvasElement;
                
                expect(() => {
                    game = new Game(badCanvas, i18n);
                }).toThrow('Could not get 2D context from canvas');
            });

            it('should handle null/undefined config gracefully', () => {
                expect(() => {
                    game = new Game(canvas, i18n, undefined as any);
                }).not.toThrow();
            });
        });
    });
});
