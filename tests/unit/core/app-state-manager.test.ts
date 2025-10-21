import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AppStateManager } from '../../../src/appStateManager.js';
import { MenuState } from '../../../src/types/index.js';

describe('AppStateManager Tests', () => {
    let stateManager: AppStateManager;

    beforeEach(() => {
        stateManager = new AppStateManager();
        // Mocka console.log för att undvika log spam
        vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    describe('Initialization', () => {
        it('should initialize with MAIN_MENU state', () => {
            expect(stateManager.getCurrentState()).toBe(MenuState.MAIN_MENU);
        });

        it('should initialize callback maps for all states', () => {
            // Verifiera att vi kan registrera callbacks för alla states
            const callback = vi.fn();
            
            stateManager.onStateEnter(MenuState.MAIN_MENU, callback);
            stateManager.onStateEnter(MenuState.GAME, callback);
            stateManager.onStateEnter(MenuState.SETTINGS, callback);
            stateManager.onStateEnter(MenuState.INSTRUCTIONS, callback);
            stateManager.onStateEnter(MenuState.GAME_OVER, callback);
            
            // Ingen error ska kastas
            expect(stateManager).toBeDefined();
        });
    });

    describe('State Getters', () => {
        it('should return current state', () => {
            const state = stateManager.getCurrentState();
            expect(state).toBe(MenuState.MAIN_MENU);
        });

        it('should update current state when changed', () => {
            stateManager.setState(MenuState.GAME);
            expect(stateManager.getCurrentState()).toBe(MenuState.GAME);
        });
    });

    describe('State Transitions', () => {
        it('should change state from MAIN_MENU to GAME', () => {
            stateManager.setState(MenuState.GAME);
            expect(stateManager.getCurrentState()).toBe(MenuState.GAME);
        });

        it('should change state from GAME to GAME_OVER', () => {
            stateManager.setState(MenuState.GAME);
            stateManager.setState(MenuState.GAME_OVER);
            expect(stateManager.getCurrentState()).toBe(MenuState.GAME_OVER);
        });

        it('should not change state if already in target state', () => {
            const callback = vi.fn();
            stateManager.onStateEnter(MenuState.MAIN_MENU, callback);
            
            stateManager.setState(MenuState.MAIN_MENU); // Redan i MAIN_MENU
            
            // Callback ska inte kallas eftersom state inte ändrades
            expect(callback).not.toHaveBeenCalled();
        });

        it('should log state changes', () => {
            const logSpy = vi.spyOn(console, 'log');
            
            stateManager.setState(MenuState.GAME);
            
            expect(logSpy).toHaveBeenCalledWith(
                expect.stringContaining('State changed:')
            );
        });

        it('should transition through multiple states', () => {
            stateManager.setState(MenuState.GAME);
            expect(stateManager.getCurrentState()).toBe(MenuState.GAME);
            
            stateManager.setState(MenuState.GAME_OVER);
            expect(stateManager.getCurrentState()).toBe(MenuState.GAME_OVER);
            
            stateManager.setState(MenuState.MAIN_MENU);
            expect(stateManager.getCurrentState()).toBe(MenuState.MAIN_MENU);
        });
    });

    describe('State Callbacks', () => {
        it('should trigger callback when entering state', () => {
            const callback = vi.fn();
            stateManager.onStateEnter(MenuState.GAME, callback);
            
            stateManager.setState(MenuState.GAME);
            
            expect(callback).toHaveBeenCalledTimes(1);
        });

        it('should trigger multiple callbacks for same state', () => {
            const callback1 = vi.fn();
            const callback2 = vi.fn();
            
            stateManager.onStateEnter(MenuState.GAME, callback1);
            stateManager.onStateEnter(MenuState.GAME, callback2);
            
            stateManager.setState(MenuState.GAME);
            
            expect(callback1).toHaveBeenCalledTimes(1);
            expect(callback2).toHaveBeenCalledTimes(1);
        });

        it('should not trigger callback for different state', () => {
            const gameCallback = vi.fn();
            stateManager.onStateEnter(MenuState.GAME, gameCallback);
            
            stateManager.setState(MenuState.SETTINGS);
            
            expect(gameCallback).not.toHaveBeenCalled();
        });

        it('should trigger callback each time state is entered', () => {
            const callback = vi.fn();
            stateManager.onStateEnter(MenuState.GAME, callback);
            
            stateManager.setState(MenuState.GAME);
            stateManager.setState(MenuState.MAIN_MENU);
            stateManager.setState(MenuState.GAME); // Andra gången
            
            expect(callback).toHaveBeenCalledTimes(2);
        });

        it('should clear callbacks for specific state', () => {
            const callback = vi.fn();
            stateManager.onStateEnter(MenuState.GAME, callback);
            
            stateManager.clearStateCallbacks(MenuState.GAME);
            stateManager.setState(MenuState.GAME);
            
            expect(callback).not.toHaveBeenCalled();
        });

        it('should preserve callbacks for other states when clearing', () => {
            const gameCallback = vi.fn();
            const settingsCallback = vi.fn();
            
            stateManager.onStateEnter(MenuState.GAME, gameCallback);
            stateManager.onStateEnter(MenuState.SETTINGS, settingsCallback);
            
            stateManager.clearStateCallbacks(MenuState.GAME);
            
            stateManager.setState(MenuState.SETTINGS);
            expect(settingsCallback).toHaveBeenCalled();
        });
    });

    describe('State Check Helpers', () => {
        it('should detect when in game', () => {
            stateManager.setState(MenuState.GAME);
            expect(stateManager.isInGame()).toBe(true);
        });

        it('should detect when not in game', () => {
            stateManager.setState(MenuState.MAIN_MENU);
            expect(stateManager.isInGame()).toBe(false);
        });

        it('should detect when in menu', () => {
            stateManager.setState(MenuState.MAIN_MENU);
            expect(stateManager.isInMenu()).toBe(true);
            
            stateManager.setState(MenuState.SETTINGS);
            expect(stateManager.isInMenu()).toBe(true);
        });

        it('should detect when not in menu (in game)', () => {
            stateManager.setState(MenuState.GAME);
            expect(stateManager.isInMenu()).toBe(false);
        });
    });

    describe('Convenience Methods', () => {
        it('should return to main menu', () => {
            stateManager.setState(MenuState.GAME);
            stateManager.returnToMainMenu();
            
            expect(stateManager.getCurrentState()).toBe(MenuState.MAIN_MENU);
        });

        it('should start game', () => {
            stateManager.startGame();
            
            expect(stateManager.getCurrentState()).toBe(MenuState.GAME);
            expect(stateManager.isInGame()).toBe(true);
        });

        it('should go to settings', () => {
            stateManager.goToSettings();
            
            expect(stateManager.getCurrentState()).toBe(MenuState.SETTINGS);
        });

        it('should go to instructions', () => {
            stateManager.goToInstructions();
            
            expect(stateManager.getCurrentState()).toBe(MenuState.INSTRUCTIONS);
        });

        it('should handle game over', () => {
            stateManager.setState(MenuState.GAME);
            stateManager.gameOver();
            
            expect(stateManager.getCurrentState()).toBe(MenuState.GAME_OVER);
        });
    });

    describe('Complex State Workflows', () => {
        it('should handle complete game flow', () => {
            // Start på huvudmeny
            expect(stateManager.getCurrentState()).toBe(MenuState.MAIN_MENU);
            
            // Gå till instruktioner
            stateManager.goToInstructions();
            expect(stateManager.getCurrentState()).toBe(MenuState.INSTRUCTIONS);
            
            // Tillbaka till meny
            stateManager.returnToMainMenu();
            expect(stateManager.getCurrentState()).toBe(MenuState.MAIN_MENU);
            
            // Starta spel
            stateManager.startGame();
            expect(stateManager.isInGame()).toBe(true);
            
            // Game over
            stateManager.gameOver();
            expect(stateManager.getCurrentState()).toBe(MenuState.GAME_OVER);
            
            // Tillbaka till meny
            stateManager.returnToMainMenu();
            expect(stateManager.getCurrentState()).toBe(MenuState.MAIN_MENU);
        });

        it('should handle settings flow', () => {
            stateManager.goToSettings();
            expect(stateManager.getCurrentState()).toBe(MenuState.SETTINGS);
            expect(stateManager.isInMenu()).toBe(true);
            
            stateManager.returnToMainMenu();
            expect(stateManager.getCurrentState()).toBe(MenuState.MAIN_MENU);
        });

        it('should track callbacks throughout workflow', () => {
            const gameStartCallback = vi.fn();
            const gameOverCallback = vi.fn();
            const menuCallback = vi.fn();
            
            stateManager.onStateEnter(MenuState.GAME, gameStartCallback);
            stateManager.onStateEnter(MenuState.GAME_OVER, gameOverCallback);
            stateManager.onStateEnter(MenuState.MAIN_MENU, menuCallback);
            
            // Flow
            stateManager.startGame();
            stateManager.gameOver();
            stateManager.returnToMainMenu();
            
            expect(gameStartCallback).toHaveBeenCalledTimes(1);
            expect(gameOverCallback).toHaveBeenCalledTimes(1);
            expect(menuCallback).toHaveBeenCalledTimes(1);
        });
    });

    describe('Edge Cases', () => {
        it('should handle rapid state changes', () => {
            stateManager.setState(MenuState.GAME);
            stateManager.setState(MenuState.MAIN_MENU);
            stateManager.setState(MenuState.SETTINGS);
            stateManager.setState(MenuState.INSTRUCTIONS);
            stateManager.setState(MenuState.GAME_OVER);
            
            expect(stateManager.getCurrentState()).toBe(MenuState.GAME_OVER);
        });

        it('should handle callback that throws error', () => {
            const throwingCallback = vi.fn(() => {
                throw new Error('Callback error');
            });
            const normalCallback = vi.fn();
            
            stateManager.onStateEnter(MenuState.GAME, throwingCallback);
            stateManager.onStateEnter(MenuState.GAME, normalCallback);
            
            // State change ska fortfarande fungera även om callback kastar
            expect(() => {
                stateManager.setState(MenuState.GAME);
            }).toThrow();
            
            // State ska ändå ha ändrats
            expect(stateManager.getCurrentState()).toBe(MenuState.GAME);
        });

        it('should handle clearing already empty callback list', () => {
            stateManager.clearStateCallbacks(MenuState.GAME);
            stateManager.clearStateCallbacks(MenuState.GAME); // Dubbel clear
            
            expect(() => {
                stateManager.setState(MenuState.GAME);
            }).not.toThrow();
        });
    });
});
