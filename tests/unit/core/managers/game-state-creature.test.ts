import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameStateManager } from '../../../../src/core/managers/GameStateManager.js';
import { CreatureManager } from '../../../../src/core/managers/CreatureManager.js';
import { GameState, GameConfig, WoodPiece, CreatureType, CollapseRisk } from '../../../../src/types/index.js';
import { DEFAULT_CONFIG } from '../../../../src/shared/constants/index.js';

describe('Game Managers Tests', () => {
    describe('GameStateManager', () => {
        let stateManager: GameStateManager;
        const testConfig: GameConfig = { ...DEFAULT_CONFIG };

        beforeEach(() => {
            stateManager = new GameStateManager(testConfig);
        });

        describe('Initialization', () => {
            it('should initialize with default game state', () => {
                const state = stateManager.getGameState();
                
                expect(state.score).toBe(0);
                expect(state.health).toBe(100);
                expect(state.isGameOver).toBe(false);
                expect(state.isPaused).toBe(false);
                expect(state.activeCreature).toBeUndefined();
            });

            it('should initialize with custom initial state', () => {
                const customState: GameState = {
                    score: 50,
                    health: 75,
                    isGameOver: false,
                    isPaused: false,
                    activeCreature: undefined
                };
                
                const customManager = new GameStateManager(testConfig, customState);
                const state = customManager.getGameState();
                
                expect(state.score).toBe(50);
                expect(state.health).toBe(75);
            });

            it('should return a copy of game state, not the original reference', () => {
                const state1 = stateManager.getGameState();
                const state2 = stateManager.getGameState();
                
                expect(state1).not.toBe(state2); // Different references
                expect(state1).toEqual(state2); // Same content
            });
        });

        describe('Score management', () => {
            it('should add score correctly', () => {
                stateManager.addScore(10);
                expect(stateManager.getScore()).toBe(10);
                
                stateManager.addScore(15);
                expect(stateManager.getScore()).toBe(25);
            });

            it('should trigger score update callback', () => {
                const scoreCallback = vi.fn();
                stateManager.setOnScoreUpdate(scoreCallback);
                
                stateManager.addScore(10);
                
                expect(scoreCallback).toHaveBeenCalledWith(10);
            });

            it('should handle multiple score additions', () => {
                for (let i = 1; i <= 5; i++) {
                    stateManager.addScore(10);
                }
                
                expect(stateManager.getScore()).toBe(50);
            });
        });

        describe('Health management', () => {
            it('should reduce health correctly', () => {
                stateManager.reduceHealth(20);
                expect(stateManager.getHealth()).toBe(80);
                
                stateManager.reduceHealth(30);
                expect(stateManager.getHealth()).toBe(50);
            });

            it('should not reduce health below zero', () => {
                stateManager.reduceHealth(150);
                expect(stateManager.getHealth()).toBe(0);
            });

            it('should trigger health update callback', () => {
                const healthCallback = vi.fn();
                stateManager.setOnHealthUpdate(healthCallback);
                
                stateManager.reduceHealth(20);
                
                expect(healthCallback).toHaveBeenCalledWith(80);
            });

            it('should trigger game over when health reaches zero', () => {
                const gameOverCallback = vi.fn();
                stateManager.setOnGameOver(gameOverCallback);
                
                stateManager.reduceHealth(100);
                
                expect(stateManager.isGameOver()).toBe(true);
                expect(gameOverCallback).toHaveBeenCalled();
            });

            it('should trigger game over when health goes below zero', () => {
                const gameOverCallback = vi.fn();
                stateManager.setOnGameOver(gameOverCallback);
                
                stateManager.reduceHealth(150);
                
                expect(stateManager.isGameOver()).toBe(true);
                expect(gameOverCallback).toHaveBeenCalled();
            });
        });

        describe('Game over management', () => {
            it('should set game over state', () => {
                expect(stateManager.isGameOver()).toBe(false);
                
                stateManager.endGame();
                
                expect(stateManager.isGameOver()).toBe(true);
            });

            it('should trigger game over callback', () => {
                const gameOverCallback = vi.fn();
                stateManager.setOnGameOver(gameOverCallback);
                
                stateManager.endGame();
                
                expect(gameOverCallback).toHaveBeenCalled();
            });
        });

        describe('Game restart', () => {
            it('should reset game state on restart', () => {
                // Modifiera state
                stateManager.addScore(50);
                stateManager.reduceHealth(40);
                stateManager.endGame();
                
                // Starta om
                stateManager.restartGame();
                
                const state = stateManager.getGameState();
                expect(state.score).toBe(0);
                expect(state.health).toBe(100);
                expect(state.isGameOver).toBe(false);
            });

            it('should trigger all relevant callbacks on restart', () => {
                const scoreCallback = vi.fn();
                const healthCallback = vi.fn();
                const restartCallback = vi.fn();
                
                stateManager.setOnScoreUpdate(scoreCallback);
                stateManager.setOnHealthUpdate(healthCallback);
                stateManager.setOnGameRestart(restartCallback);
                
                stateManager.restartGame();
                
                expect(scoreCallback).toHaveBeenCalledWith(0);
                expect(healthCallback).toHaveBeenCalledWith(100);
                expect(restartCallback).toHaveBeenCalled();
            });
        });

        describe('Pause management', () => {
            it('should toggle pause state', () => {
                expect(stateManager.isPaused()).toBe(false);
                
                stateManager.togglePause();
                expect(stateManager.isPaused()).toBe(true);
                
                stateManager.togglePause();
                expect(stateManager.isPaused()).toBe(false);
            });

            it('should set pause state directly', () => {
                stateManager.setPaused(true);
                expect(stateManager.isPaused()).toBe(true);
                
                stateManager.setPaused(false);
                expect(stateManager.isPaused()).toBe(false);
            });
        });

        describe('Game state updates', () => {
            it('should update partial game state', () => {
                stateManager.updateGameState({ score: 100, health: 50 });
                
                expect(stateManager.getScore()).toBe(100);
                expect(stateManager.getHealth()).toBe(50);
            });

            it('should trigger callbacks when updating state', () => {
                const scoreCallback = vi.fn();
                const healthCallback = vi.fn();
                
                stateManager.setOnScoreUpdate(scoreCallback);
                stateManager.setOnHealthUpdate(healthCallback);
                
                stateManager.updateGameState({ score: 50, health: 75 });
                
                expect(scoreCallback).toHaveBeenCalledWith(50);
                expect(healthCallback).toHaveBeenCalledWith(75);
            });

            it('should trigger game over callback when setting isGameOver', () => {
                const gameOverCallback = vi.fn();
                stateManager.setOnGameOver(gameOverCallback);
                
                stateManager.updateGameState({ isGameOver: true });
                
                expect(gameOverCallback).toHaveBeenCalled();
            });
        });

        describe('Game state queries', () => {
            it('should return correct canContinueGame state', () => {
                expect(stateManager.canContinueGame()).toBe(true);
                
                stateManager.setPaused(true);
                expect(stateManager.canContinueGame()).toBe(false);
                
                stateManager.setPaused(false);
                stateManager.endGame();
                expect(stateManager.canContinueGame()).toBe(false);
            });

            it('should return accurate game stats', () => {
                stateManager.addScore(50);
                stateManager.reduceHealth(30);
                
                const stats = stateManager.getGameStats();
                
                expect(stats.score).toBe(50);
                expect(stats.health).toBe(70);
                expect(stats.healthPercentage).toBe(70);
                expect(stats.isActive).toBe(true);
                expect(stats.hasActiveCreature).toBe(false);
            });
        });

        describe('Reference management', () => {
            it('should provide reference to game state', () => {
                const reference = stateManager.getGameStateReference();
                
                // Reference bör vara samma objekt
                expect(reference).toBe(stateManager.getGameStateReference());
            });

            it('should allow direct modification through reference', () => {
                const reference = stateManager.getGameStateReference();
                reference.score = 999;
                
                expect(stateManager.getScore()).toBe(999);
            });
        });

        describe('Cleanup', () => {
            it('should clear callbacks on destroy', () => {
                const scoreCallback = vi.fn();
                stateManager.setOnScoreUpdate(scoreCallback);
                
                stateManager.destroy();
                stateManager.addScore(10);
                
                // Callback ska inte anropas efter destroy
                expect(scoreCallback).not.toHaveBeenCalled();
            });
        });
    });

    describe('CreatureManager', () => {
        let creatureManager: CreatureManager;
        let gameState: GameState;
        const testConfig: GameConfig = { ...DEFAULT_CONFIG };

        beforeEach(() => {
            gameState = {
                score: 0,
                health: 100,
                isGameOver: false,
                isPaused: false,
                activeCreature: undefined
            };
            creatureManager = new CreatureManager(testConfig, gameState);
        });

        describe('Initialization', () => {
            it('should initialize with config and game state', () => {
                expect(creatureManager).toBeDefined();
                expect(creatureManager.hasActiveCreature()).toBe(false);
            });
        });

        describe('Creature encounters', () => {
            it('should handle creature encounter on wood piece', () => {
                const piece = createMockWoodPiece('1', 100, 100, CreatureType.SPIDER);
                
                creatureManager.encounterCreature(piece);
                
                expect(creatureManager.hasActiveCreature()).toBe(true);
                expect(piece.isRemoved).toBe(true);
            });

            it('should set correct creature properties on encounter', () => {
                const piece = createMockWoodPiece('2', 150, 200, CreatureType.WASP);
                
                creatureManager.encounterCreature(piece);
                
                const activeCreature = creatureManager.getActiveCreature();
                expect(activeCreature).toBeDefined();
                expect(activeCreature?.type).toBe(CreatureType.WASP);
                expect(activeCreature?.timeLeft).toBe(testConfig.reactionTime);
                expect(activeCreature?.maxTime).toBe(testConfig.reactionTime);
                expect(activeCreature?.position.x).toBe(150);
                expect(activeCreature?.position.y).toBe(200);
            });

            it('should ignore encounter if piece has no creature', () => {
                const piece = createMockWoodPiece('3', 100, 100);
                
                creatureManager.encounterCreature(piece);
                
                expect(creatureManager.hasActiveCreature()).toBe(false);
                expect(piece.isRemoved).toBe(false);
            });

            it('should check if piece has creature correctly', () => {
                const pieceWithCreature = createMockWoodPiece('4', 100, 100, CreatureType.SPIDER);
                const pieceWithoutCreature = createMockWoodPiece('5', 100, 100);
                
                expect(creatureManager.hasCreature(pieceWithCreature)).toBe(true);
                expect(creatureManager.hasCreature(pieceWithoutCreature)).toBe(false);
            });
        });

        describe('Successful reactions', () => {
            it('should handle successful reaction', () => {
                const piece = createMockWoodPiece('10', 100, 100, CreatureType.SPIDER);
                creatureManager.encounterCreature(piece);
                
                const scoreCallback = vi.fn();
                creatureManager.setOnScoreUpdate(scoreCallback);
                
                creatureManager.handleSuccessfulReaction();
                
                expect(creatureManager.hasActiveCreature()).toBe(false);
                expect(scoreCallback).toHaveBeenCalledWith(testConfig.pointsPerWood * 2);
            });

            it('should give double points for successful reaction', () => {
                const piece = createMockWoodPiece('11', 100, 100, CreatureType.WASP);
                creatureManager.encounterCreature(piece);
                
                const scoreCallback = vi.fn();
                creatureManager.setOnScoreUpdate(scoreCallback);
                
                creatureManager.handleSuccessfulReaction();
                
                const expectedPoints = testConfig.pointsPerWood * 2;
                expect(scoreCallback).toHaveBeenCalledWith(expectedPoints);
            });

            it('should do nothing if no active creature', () => {
                const scoreCallback = vi.fn();
                creatureManager.setOnScoreUpdate(scoreCallback);
                
                creatureManager.handleSuccessfulReaction();
                
                expect(scoreCallback).not.toHaveBeenCalled();
            });
        });

        describe('Failed reactions', () => {
            it('should handle failed reaction', () => {
                const piece = createMockWoodPiece('20', 100, 100, CreatureType.SPIDER);
                creatureManager.encounterCreature(piece);
                
                const healthCallback = vi.fn();
                creatureManager.setOnHealthUpdate(healthCallback);
                
                creatureManager.handleFailedReaction();
                
                expect(creatureManager.hasActiveCreature()).toBe(false);
                expect(healthCallback).toHaveBeenCalledWith(testConfig.healthPenalty);
            });

            it('should apply health penalty for failed reaction', () => {
                const piece = createMockWoodPiece('21', 100, 100, CreatureType.WASP);
                creatureManager.encounterCreature(piece);
                
                const healthCallback = vi.fn();
                creatureManager.setOnHealthUpdate(healthCallback);
                
                creatureManager.handleFailedReaction();
                
                expect(healthCallback).toHaveBeenCalledWith(testConfig.healthPenalty);
            });

            it('should do nothing if no active creature', () => {
                const healthCallback = vi.fn();
                creatureManager.setOnHealthUpdate(healthCallback);
                
                creatureManager.handleFailedReaction();
                
                expect(healthCallback).not.toHaveBeenCalled();
            });
        });

        describe('Creature timer updates', () => {
            it('should update creature timer', () => {
                const piece = createMockWoodPiece('30', 100, 100, CreatureType.SPIDER);
                creatureManager.encounterCreature(piece);
                
                const initialTime = creatureManager.getActiveCreature()?.timeLeft || 0;
                
                creatureManager.updateActiveCreature(100);
                
                const newTime = creatureManager.getActiveCreature()?.timeLeft || 0;
                expect(newTime).toBe(initialTime - 100);
            });

            it('should handle timeout correctly', () => {
                const piece = createMockWoodPiece('31', 100, 100, CreatureType.WASP);
                creatureManager.encounterCreature(piece);
                
                const healthCallback = vi.fn();
                creatureManager.setOnHealthUpdate(healthCallback);
                
                // Uppdatera med mer tid än reaction time
                const timeout = creatureManager.updateActiveCreature(testConfig.reactionTime + 100);
                
                expect(timeout).toBe(true);
                expect(creatureManager.hasActiveCreature()).toBe(false);
                expect(healthCallback).toHaveBeenCalled();
            });

            it('should return false if creature timer has not expired', () => {
                const piece = createMockWoodPiece('32', 100, 100, CreatureType.SPIDER);
                creatureManager.encounterCreature(piece);
                
                const timeout = creatureManager.updateActiveCreature(100);
                
                expect(timeout).toBe(false);
                expect(creatureManager.hasActiveCreature()).toBe(true);
            });

            it('should return false when no active creature', () => {
                const timeout = creatureManager.updateActiveCreature(100);
                expect(timeout).toBe(false);
            });

            it('should handle multiple timer updates', () => {
                const piece = createMockWoodPiece('33', 100, 100, CreatureType.SPIDER);
                creatureManager.encounterCreature(piece);
                
                const initialTime = testConfig.reactionTime;
                
                creatureManager.updateActiveCreature(500);
                expect(creatureManager.getActiveCreature()?.timeLeft).toBe(initialTime - 500);
                
                creatureManager.updateActiveCreature(500);
                expect(creatureManager.getActiveCreature()?.timeLeft).toBe(initialTime - 1000);
            });
        });

        describe('Creature state queries', () => {
            it('should correctly report if creature is active', () => {
                expect(creatureManager.hasActiveCreature()).toBe(false);
                
                const piece = createMockWoodPiece('40', 100, 100, CreatureType.SPIDER);
                creatureManager.encounterCreature(piece);
                
                expect(creatureManager.hasActiveCreature()).toBe(true);
            });

            it('should return active creature details', () => {
                const piece = createMockWoodPiece('41', 150, 200, CreatureType.WASP);
                creatureManager.encounterCreature(piece);
                
                const creature = creatureManager.getActiveCreature();
                
                expect(creature).toBeDefined();
                expect(creature?.type).toBe(CreatureType.WASP);
            });

            it('should return undefined when no active creature', () => {
                const creature = creatureManager.getActiveCreature();
                expect(creature).toBeUndefined();
            });
        });

        describe('Clear and reset', () => {
            it('should clear active creature', () => {
                const piece = createMockWoodPiece('50', 100, 100, CreatureType.SPIDER);
                creatureManager.encounterCreature(piece);
                
                expect(creatureManager.hasActiveCreature()).toBe(true);
                
                creatureManager.clearActiveCreature();
                
                expect(creatureManager.hasActiveCreature()).toBe(false);
            });

            it('should handle clearing when no active creature', () => {
                expect(() => {
                    creatureManager.clearActiveCreature();
                }).not.toThrow();
            });
        });

        describe('Game state updates', () => {
            it('should update game state reference', () => {
                const newGameState: GameState = {
                    score: 100,
                    health: 50,
                    isGameOver: false,
                    isPaused: false,
                    activeCreature: undefined
                };
                
                creatureManager.updateGameState(newGameState);
                
                // Verifiera att den nya staten används
                expect(() => {
                    creatureManager.hasActiveCreature();
                }).not.toThrow();
            });
        });
    });
});

// Helper function to create mock wood pieces
function createMockWoodPiece(
    id: string,
    x: number,
    y: number,
    creature?: CreatureType
): WoodPiece {
    return {
        id,
        position: { x, y },
        size: { width: 20, height: 20 },
        isRemoved: false,
        collapseRisk: CollapseRisk.NONE,
        creature
    };
}
