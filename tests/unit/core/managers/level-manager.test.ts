import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LevelManager } from '../../../../src/core/managers/LevelManager.js';
import { DifficultyLevel, LevelEvent } from '../../../../src/types/difficulty.js';
import { DEFAULT_CONFIG } from '../../../../src/shared/constants/index.js';

describe('LevelManager', () => {
    let levelManager: LevelManager;

    beforeEach(() => {
        vi.useFakeTimers();
        levelManager = new LevelManager();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Initialization', () => {
        it('should initialize with default values', () => {
            expect(levelManager.getCurrentLevel()).toBe(1);
            expect(levelManager.getDifficulty()).toBe(DifficultyLevel.NORMAL);
            expect(levelManager.getTotalScore()).toBe(0);
        });

        it('should initialize with custom difficulty', () => {
            const hardManager = new LevelManager(DifficultyLevel.HARD);
            expect(hardManager.getDifficulty()).toBe(DifficultyLevel.HARD);
        });

        it('should initialize with custom starting level', () => {
            const manager = new LevelManager(DifficultyLevel.NORMAL, 3);
            expect(manager.getCurrentLevel()).toBe(3);
        });

        it('should clamp starting level to valid range', () => {
            const tooLow = new LevelManager(DifficultyLevel.NORMAL, 0);
            expect(tooLow.getCurrentLevel()).toBe(1);

            const tooHigh = new LevelManager(DifficultyLevel.NORMAL, 999);
            expect(tooHigh.getCurrentLevel()).toBe(10); // MAX_LEVELS
        });
    });

    describe('Level Information', () => {
        it('should return correct level info for level 1', () => {
            const info = levelManager.getCurrentLevelInfo();
            
            expect(info.levelNumber).toBe(1);
            expect(info.woodPieceCount).toBe(15);
            expect(info.stackHeight).toBe(5);
            expect(info.difficulty).toBe(DifficultyLevel.NORMAL);
        });

        it('should return correct level info for level 5', () => {
            const manager = new LevelManager(DifficultyLevel.EXPERT, 5);
            const info = manager.getCurrentLevelInfo();
            
            expect(info.levelNumber).toBe(5);
            expect(info.woodPieceCount).toBe(27);
            expect(info.stackHeight).toBe(9);
            expect(info.difficulty).toBe(DifficultyLevel.EXPERT);
        });
    });

    describe('Difficulty Modifiers', () => {
        it('should return correct modifiers for EASY', () => {
            const easyManager = new LevelManager(DifficultyLevel.EASY);
            const modifiers = easyManager.getDifficultyModifiers();
            
            expect(modifiers.healthMultiplier).toBe(1.5);
            expect(modifiers.scoreMultiplier).toBe(0.8);
            expect(modifiers.reactionTime).toBe(3000);
            expect(modifiers.startingHealth).toBe(150);
        });

        it('should return correct modifiers for NIGHTMARE', () => {
            const nightmareManager = new LevelManager(DifficultyLevel.NIGHTMARE);
            const modifiers = nightmareManager.getDifficultyModifiers();
            
            expect(modifiers.healthMultiplier).toBe(0.5);
            expect(modifiers.scoreMultiplier).toBe(2.5);
            expect(modifiers.reactionTime).toBe(750);
            expect(modifiers.startingHealth).toBe(50);
        });

        it('should apply difficulty to game config', () => {
            const hardManager = new LevelManager(DifficultyLevel.HARD);
            const config = hardManager.applyDifficultyToConfig(DEFAULT_CONFIG);
            
            expect(config.reactionTime).toBe(1500); // Hard = 1.5s
            expect(config.creatureProbability).toBeGreaterThan(DEFAULT_CONFIG.creatureProbability);
        });
    });

    describe('Level Start', () => {
        it('should start level 1 by default', () => {
            levelManager.startLevel();
            
            const progress = levelManager.getProgress();
            expect(progress.currentLevel).toBe(1);
            expect(progress.levelStartTime).toBeGreaterThan(0);
        });

        it('should emit LEVEL_START event', () => {
            const callback = vi.fn();
            levelManager.on('LEVEL_START', callback);
            
            levelManager.startLevel();
            
            expect(callback).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'LEVEL_START',
                    level: 1,
                    difficulty: DifficultyLevel.NORMAL
                })
            );
        });

        it('should reset wood collected counter', () => {
            levelManager.startLevel();
            levelManager.onWoodCollected(10);
            
            expect(levelManager.getProgress().woodCollectedThisLevel).toBe(1);
            
            levelManager.startLevel(2);
            expect(levelManager.getProgress().woodCollectedThisLevel).toBe(0);
        });
    });

    describe('Wood Collection', () => {
        beforeEach(() => {
            levelManager.startLevel();
        });

        it('should track wood collected', () => {
            levelManager.onWoodCollected(10);
            levelManager.onWoodCollected(10);
            levelManager.onWoodCollected(10);
            
            const progress = levelManager.getProgress();
            expect(progress.woodCollectedThisLevel).toBe(3);
            expect(progress.totalScore).toBe(30);
        });

        it('should accumulate total score', () => {
            levelManager.onWoodCollected(15);
            levelManager.onWoodCollected(20);
            
            expect(levelManager.getTotalScore()).toBe(35);
        });
    });

    describe('Level Completion', () => {
        beforeEach(() => {
            levelManager.startLevel();
        });

        it('should detect when level is complete', () => {
            const info = levelManager.getCurrentLevelInfo();
            
            // Collect all wood on level
            for (let i = 0; i < info.woodPieceCount; i++) {
                levelManager.onWoodCollected(10);
            }
            
            expect(levelManager.isLevelComplete()).toBe(true);
        });

        it('should not be complete before all wood collected', () => {
            levelManager.onWoodCollected(10);
            expect(levelManager.isLevelComplete()).toBe(false);
        });

        it('should calculate speed bonus', () => {
            const now = Date.now();
            vi.setSystemTime(now);
            levelManager.startLevel();
            
            // Complete level in 30 seconds
            vi.setSystemTime(now + 30000);
            
            const result = levelManager.completeLevel();
            expect(result.speedBonus).toBeGreaterThan(0); // Should get bonus for being fast
        });

        it('should advance to next level on completion', () => {
            const result = levelManager.completeLevel();
            
            expect(result.levelNumber).toBe(1);
            expect(result.nextLevel).toBe(2);
            expect(levelManager.getCurrentLevel()).toBe(2);
        });

        it('should not advance beyond max level', () => {
            const finalLevelManager = new LevelManager(DifficultyLevel.NORMAL, 10);
            const result = finalLevelManager.completeLevel();
            
            expect(result.nextLevel).toBeNull();
            expect(finalLevelManager.getCurrentLevel()).toBe(10);
        });

        it('should emit LEVEL_COMPLETE event', () => {
            const callback = vi.fn();
            levelManager.on('LEVEL_COMPLETE', callback);
            
            levelManager.completeLevel();
            
            expect(callback).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'LEVEL_COMPLETE',
                    level: 1,
                    difficulty: DifficultyLevel.NORMAL
                })
            );
        });

        it('should include speed bonus in total score', () => {
            const now = Date.now();
            vi.setSystemTime(now);
            levelManager.startLevel();
            
            levelManager.onWoodCollected(100);
            
            // Complete quickly
            vi.setSystemTime(now + 20000);
            
            const result = levelManager.completeLevel();
            expect(result.totalScore).toBeGreaterThan(100); // Original score + bonus
        });
    });

    describe('Progress Tracking', () => {
        it('should track highest level reached', () => {
            levelManager.startLevel(1);
            levelManager.completeLevel();
            
            levelManager.startLevel(2);
            levelManager.completeLevel();
            
            expect(levelManager.getProgress().highestLevelReached).toBe(2);
        });

        it('should calculate level duration', () => {
            const now = Date.now();
            vi.setSystemTime(now);
            levelManager.startLevel();
            
            vi.setSystemTime(now + 45000); // 45 seconds
            
            expect(levelManager.getLevelDuration()).toBe(45);
        });

        it('should return complete progress info', () => {
            levelManager.startLevel();
            levelManager.onWoodCollected(10);
            
            const progress = levelManager.getProgress();
            
            expect(progress).toMatchObject({
                currentLevel: 1,
                totalScore: 10,
                woodCollectedThisLevel: 1,
                totalWoodOnLevel: 15,
                difficulty: DifficultyLevel.NORMAL,
                isComplete: false
            });
        });
    });

    describe('Difficulty Changes', () => {
        it('should change difficulty', () => {
            levelManager.setDifficulty(DifficultyLevel.HARD);
            expect(levelManager.getDifficulty()).toBe(DifficultyLevel.HARD);
        });

        it('should emit DIFFICULTY_CHANGE event', () => {
            const callback = vi.fn();
            levelManager.on('DIFFICULTY_CHANGE', callback);
            
            levelManager.setDifficulty(DifficultyLevel.EXPERT);
            
            expect(callback).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'DIFFICULTY_CHANGE',
                    difficulty: DifficultyLevel.EXPERT,
                    data: { previousDifficulty: DifficultyLevel.NORMAL }
                })
            );
        });

        it('should not emit event if difficulty unchanged', () => {
            const callback = vi.fn();
            levelManager.on('DIFFICULTY_CHANGE', callback);
            
            levelManager.setDifficulty(DifficultyLevel.NORMAL);
            
            expect(callback).not.toHaveBeenCalled();
        });
    });

    describe('Score Calculations', () => {
        it('should apply difficulty multiplier to score', () => {
            const easyManager = new LevelManager(DifficultyLevel.EASY);
            expect(easyManager.calculateScoreWithDifficulty(100)).toBe(80); // 0.8x
            
            const hardManager = new LevelManager(DifficultyLevel.HARD);
            expect(hardManager.calculateScoreWithDifficulty(100)).toBe(130); // 1.3x
            
            const nightmareManager = new LevelManager(DifficultyLevel.NIGHTMARE);
            expect(nightmareManager.calculateScoreWithDifficulty(100)).toBe(250); // 2.5x
        });

        it('should return starting health based on difficulty', () => {
            const easyManager = new LevelManager(DifficultyLevel.EASY);
            expect(easyManager.getStartingHealth()).toBe(150);
            
            const expertManager = new LevelManager(DifficultyLevel.EXPERT);
            expect(expertManager.getStartingHealth()).toBe(60);
        });
    });

    describe('Event System', () => {
        it('should register event callbacks', () => {
            const callback = vi.fn();
            levelManager.on('LEVEL_START', callback);
            
            levelManager.startLevel();
            
            expect(callback).toHaveBeenCalledTimes(1);
        });

        it('should unregister event callbacks', () => {
            const callback = vi.fn();
            levelManager.on('LEVEL_START', callback);
            levelManager.off('LEVEL_START', callback);
            
            levelManager.startLevel();
            
            expect(callback).not.toHaveBeenCalled();
        });

        it('should support multiple callbacks for same event', () => {
            const callback1 = vi.fn();
            const callback2 = vi.fn();
            
            levelManager.on('LEVEL_START', callback1);
            levelManager.on('LEVEL_START', callback2);
            
            levelManager.startLevel();
            
            expect(callback1).toHaveBeenCalled();
            expect(callback2).toHaveBeenCalled();
        });
    });

    describe('Reset', () => {
        it('should reset to initial state', () => {
            levelManager.startLevel();
            levelManager.onWoodCollected(100);
            levelManager.completeLevel();
            
            levelManager.reset();
            
            expect(levelManager.getCurrentLevel()).toBe(1);
            expect(levelManager.getTotalScore()).toBe(0);
            expect(levelManager.getProgress().woodCollectedThisLevel).toBe(0);
        });
    });

    describe('Helper Methods', () => {
        it('should check if next level exists', () => {
            expect(levelManager.hasNextLevel()).toBe(true);
            
            const finalManager = new LevelManager(DifficultyLevel.NORMAL, 10);
            expect(finalManager.hasNextLevel()).toBe(false);
        });

        it('should return difficulty color', () => {
            const easyManager = new LevelManager(DifficultyLevel.EASY);
            expect(easyManager.getDifficultyColor()).toBe('#4CAF50');
            
            const nightmareManager = new LevelManager(DifficultyLevel.NIGHTMARE);
            expect(nightmareManager.getDifficultyColor()).toBe('#9C27B0');
        });
    });

    describe('Edge Cases', () => {
        it('should handle duration calculation before level start', () => {
            expect(levelManager.getLevelDuration()).toBe(0);
        });

        it('should handle completion without wood collected', () => {
            levelManager.startLevel();
            
            expect(() => levelManager.completeLevel()).not.toThrow();
        });

        it('should handle multiple resets', () => {
            levelManager.reset();
            levelManager.reset();
            
            expect(levelManager.getCurrentLevel()).toBe(1);
        });
    });
});
