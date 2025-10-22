import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameDataRepository } from '../../../../src/infrastructure/storage/GameDataRepository.js';
import type { StorageService, GameData } from '../../../../src/infrastructure/storage/interfaces.js';

describe('GameDataRepository', () => {
    let repository: GameDataRepository;
    let mockStorage: StorageService;
    let storedData: { [key: string]: any };

    beforeEach(() => {
        storedData = {};

        // Create mock storage
        mockStorage = {
            getItem: vi.fn((key: string) => storedData[key] || null),
            setItem: vi.fn((key: string, value: any) => {
                storedData[key] = value;
            }),
            removeItem: vi.fn((key: string) => {
                delete storedData[key];
            }),
            clear: vi.fn(() => {
                storedData = {};
            })
        };

        repository = new GameDataRepository(mockStorage);
    });

    describe('Constructor', () => {
        it('should create repository with provided storage', () => {
            const repo = new GameDataRepository(mockStorage);
            expect(repo).toBeDefined();
        });

        it('should create repository with default storage', () => {
            // Test with default LocalStorageService
            const repo = new GameDataRepository();
            expect(repo).toBeDefined();
            
            // Should work with default storage
            const data = repo.getGameData();
            expect(data).toBeDefined();
        });
    });

    describe('getGameData', () => {
        it('should return default data when storage is empty', () => {
            const data = repository.getGameData();

            expect(data).toEqual({
                highScore: 0,
                totalGamesPlayed: 0,
                bestReactionTime: Infinity,
                settings: {
                    volume: 0.7,
                    difficulty: 'normal',
                    showHints: true
                }
            });
        });

        it('should return stored data when available', () => {
            const storedGameData: GameData = {
                highScore: 1000,
                totalGamesPlayed: 5,
                bestReactionTime: 500,
                settings: {
                    volume: 0.8,
                    difficulty: 'hard',
                    showHints: false
                }
            };

            storedData['within-woodpile-game-data'] = storedGameData;

            const data = repository.getGameData();
            expect(data).toEqual(storedGameData);
        });

        it('should use default values for missing properties', () => {
            storedData['within-woodpile-game-data'] = {
                highScore: 500
                // Other properties missing
            };

            const data = repository.getGameData();

            expect(data.highScore).toBe(500);
            expect(data.totalGamesPlayed).toBe(0);
            expect(data.bestReactionTime).toBe(Infinity);
            expect(data.settings.volume).toBe(0.7);
        });

        it('should use default settings for missing settings properties', () => {
            storedData['within-woodpile-game-data'] = {
                highScore: 100,
                totalGamesPlayed: 1,
                bestReactionTime: 1000,
                settings: {
                    volume: 0.5
                    // Other settings missing
                }
            };

            const data = repository.getGameData();

            expect(data.settings.volume).toBe(0.5);
            expect(data.settings.difficulty).toBe('normal');
            expect(data.settings.showHints).toBe(true);
        });

        it('should handle showHints being explicitly false', () => {
            storedData['within-woodpile-game-data'] = {
                highScore: 0,
                totalGamesPlayed: 0,
                bestReactionTime: Infinity,
                settings: {
                    volume: 0.7,
                    difficulty: 'normal',
                    showHints: false
                }
            };

            const data = repository.getGameData();
            expect(data.settings.showHints).toBe(false);
        });

        it('should call storage getItem with correct key', () => {
            repository.getGameData();

            expect(mockStorage.getItem).toHaveBeenCalledWith('within-woodpile-game-data');
        });
    });

    describe('saveGameData', () => {
        it('should save complete game data', () => {
            const gameData: GameData = {
                highScore: 2000,
                totalGamesPlayed: 10,
                bestReactionTime: 300,
                settings: {
                    volume: 0.9,
                    difficulty: 'expert',
                    showHints: false
                }
            };

            repository.saveGameData(gameData);

            expect(mockStorage.setItem).toHaveBeenCalledWith(
                'within-woodpile-game-data',
                gameData
            );
            expect(storedData['within-woodpile-game-data']).toEqual(gameData);
        });

        it('should overwrite existing data', () => {
            const initialData: GameData = {
                highScore: 100,
                totalGamesPlayed: 1,
                bestReactionTime: 1000,
                settings: { volume: 0.5, difficulty: 'easy', showHints: true }
            };

            const newData: GameData = {
                highScore: 200,
                totalGamesPlayed: 2,
                bestReactionTime: 500,
                settings: { volume: 0.8, difficulty: 'hard', showHints: false }
            };

            repository.saveGameData(initialData);
            repository.saveGameData(newData);

            expect(storedData['within-woodpile-game-data']).toEqual(newData);
        });
    });

    describe('updateHighScore', () => {
        it('should update high score when new score is higher', () => {
            storedData['within-woodpile-game-data'] = {
                highScore: 100,
                totalGamesPlayed: 1,
                bestReactionTime: Infinity,
                settings: { volume: 0.7, difficulty: 'normal', showHints: true }
            };

            const result = repository.updateHighScore(200);

            expect(result).toBe(true);
            expect(storedData['within-woodpile-game-data'].highScore).toBe(200);
        });

        it('should not update when new score is lower', () => {
            storedData['within-woodpile-game-data'] = {
                highScore: 200,
                totalGamesPlayed: 1,
                bestReactionTime: Infinity,
                settings: { volume: 0.7, difficulty: 'normal', showHints: true }
            };

            const result = repository.updateHighScore(100);

            expect(result).toBe(false);
            expect(storedData['within-woodpile-game-data'].highScore).toBe(200);
        });

        it('should not update when new score equals current', () => {
            storedData['within-woodpile-game-data'] = {
                highScore: 150,
                totalGamesPlayed: 1,
                bestReactionTime: Infinity,
                settings: { volume: 0.7, difficulty: 'normal', showHints: true }
            };

            const result = repository.updateHighScore(150);

            expect(result).toBe(false);
            expect(storedData['within-woodpile-game-data'].highScore).toBe(150);
        });

        it('should update from zero default score', () => {
            const result = repository.updateHighScore(100);

            expect(result).toBe(true);
            expect(storedData['within-woodpile-game-data'].highScore).toBe(100);
        });

        it('should preserve other data when updating high score', () => {
            storedData['within-woodpile-game-data'] = {
                highScore: 100,
                totalGamesPlayed: 5,
                bestReactionTime: 500,
                settings: { volume: 0.8, difficulty: 'hard', showHints: false }
            };

            repository.updateHighScore(200);

            const data = storedData['within-woodpile-game-data'];
            expect(data.totalGamesPlayed).toBe(5);
            expect(data.bestReactionTime).toBe(500);
            expect(data.settings.volume).toBe(0.8);
        });

        it('should handle negative scores', () => {
            const result = repository.updateHighScore(-50);

            expect(result).toBe(false);
            // Negative score doesn't beat default 0, so no save occurs
            const data = repository.getGameData();
            expect(data.highScore).toBe(0);
        });

        it('should handle very large scores', () => {
            const result = repository.updateHighScore(999999999);

            expect(result).toBe(true);
            expect(storedData['within-woodpile-game-data'].highScore).toBe(999999999);
        });
    });

    describe('incrementGamesPlayed', () => {
        it('should increment games played from zero', () => {
            repository.incrementGamesPlayed();

            expect(storedData['within-woodpile-game-data'].totalGamesPlayed).toBe(1);
        });

        it('should increment existing count', () => {
            storedData['within-woodpile-game-data'] = {
                highScore: 100,
                totalGamesPlayed: 5,
                bestReactionTime: Infinity,
                settings: { volume: 0.7, difficulty: 'normal', showHints: true }
            };

            repository.incrementGamesPlayed();

            expect(storedData['within-woodpile-game-data'].totalGamesPlayed).toBe(6);
        });

        it('should increment multiple times', () => {
            repository.incrementGamesPlayed();
            repository.incrementGamesPlayed();
            repository.incrementGamesPlayed();

            expect(storedData['within-woodpile-game-data'].totalGamesPlayed).toBe(3);
        });

        it('should preserve other data when incrementing', () => {
            storedData['within-woodpile-game-data'] = {
                highScore: 500,
                totalGamesPlayed: 10,
                bestReactionTime: 300,
                settings: { volume: 0.8, difficulty: 'hard', showHints: false }
            };

            repository.incrementGamesPlayed();

            const data = storedData['within-woodpile-game-data'];
            expect(data.highScore).toBe(500);
            expect(data.bestReactionTime).toBe(300);
            expect(data.settings.difficulty).toBe('hard');
        });

        it('should handle large counts', () => {
            storedData['within-woodpile-game-data'] = {
                highScore: 0,
                totalGamesPlayed: 9999,
                bestReactionTime: Infinity,
                settings: { volume: 0.7, difficulty: 'normal', showHints: true }
            };

            repository.incrementGamesPlayed();

            expect(storedData['within-woodpile-game-data'].totalGamesPlayed).toBe(10000);
        });
    });

    describe('updateBestReactionTime', () => {
        it('should update when new time is better (lower)', () => {
            storedData['within-woodpile-game-data'] = {
                highScore: 100,
                totalGamesPlayed: 1,
                bestReactionTime: 1000,
                settings: { volume: 0.7, difficulty: 'normal', showHints: true }
            };

            const result = repository.updateBestReactionTime(500);

            expect(result).toBe(true);
            expect(storedData['within-woodpile-game-data'].bestReactionTime).toBe(500);
        });

        it('should not update when new time is worse (higher)', () => {
            storedData['within-woodpile-game-data'] = {
                highScore: 100,
                totalGamesPlayed: 1,
                bestReactionTime: 500,
                settings: { volume: 0.7, difficulty: 'normal', showHints: true }
            };

            const result = repository.updateBestReactionTime(1000);

            expect(result).toBe(false);
            expect(storedData['within-woodpile-game-data'].bestReactionTime).toBe(500);
        });

        it('should not update when new time equals current', () => {
            storedData['within-woodpile-game-data'] = {
                highScore: 100,
                totalGamesPlayed: 1,
                bestReactionTime: 500,
                settings: { volume: 0.7, difficulty: 'normal', showHints: true }
            };

            const result = repository.updateBestReactionTime(500);

            expect(result).toBe(false);
            expect(storedData['within-woodpile-game-data'].bestReactionTime).toBe(500);
        });

        it('should update from Infinity default', () => {
            const result = repository.updateBestReactionTime(500);

            expect(result).toBe(true);
            expect(storedData['within-woodpile-game-data'].bestReactionTime).toBe(500);
        });

        it('should preserve other data when updating', () => {
            storedData['within-woodpile-game-data'] = {
                highScore: 1000,
                totalGamesPlayed: 20,
                bestReactionTime: 800,
                settings: { volume: 0.9, difficulty: 'expert', showHints: false }
            };

            repository.updateBestReactionTime(600);

            const data = storedData['within-woodpile-game-data'];
            expect(data.highScore).toBe(1000);
            expect(data.totalGamesPlayed).toBe(20);
            expect(data.settings.difficulty).toBe('expert');
        });

        it('should handle very fast reaction times', () => {
            const result = repository.updateBestReactionTime(50);

            expect(result).toBe(true);
            expect(storedData['within-woodpile-game-data'].bestReactionTime).toBe(50);
        });

        it('should handle zero reaction time', () => {
            const result = repository.updateBestReactionTime(0);

            expect(result).toBe(true);
            expect(storedData['within-woodpile-game-data'].bestReactionTime).toBe(0);
        });
    });

    describe('updateSettings', () => {
        it('should update volume setting', () => {
            repository.updateSettings({ volume: 0.5 });

            expect(storedData['within-woodpile-game-data'].settings.volume).toBe(0.5);
        });

        it('should update difficulty setting', () => {
            repository.updateSettings({ difficulty: 'hard' });

            expect(storedData['within-woodpile-game-data'].settings.difficulty).toBe('hard');
        });

        it('should update showHints setting', () => {
            repository.updateSettings({ showHints: false });

            expect(storedData['within-woodpile-game-data'].settings.showHints).toBe(false);
        });

        it('should update multiple settings at once', () => {
            repository.updateSettings({
                volume: 0.9,
                difficulty: 'expert',
                showHints: false
            });

            const settings = storedData['within-woodpile-game-data'].settings;
            expect(settings.volume).toBe(0.9);
            expect(settings.difficulty).toBe('expert');
            expect(settings.showHints).toBe(false);
        });

        it('should preserve unchanged settings', () => {
            storedData['within-woodpile-game-data'] = {
                highScore: 100,
                totalGamesPlayed: 1,
                bestReactionTime: Infinity,
                settings: {
                    volume: 0.8,
                    difficulty: 'hard',
                    showHints: false
                }
            };

            repository.updateSettings({ volume: 0.5 });

            const settings = storedData['within-woodpile-game-data'].settings;
            expect(settings.volume).toBe(0.5);
            expect(settings.difficulty).toBe('hard');
            expect(settings.showHints).toBe(false);
        });

        it('should preserve game data when updating settings', () => {
            storedData['within-woodpile-game-data'] = {
                highScore: 500,
                totalGamesPlayed: 10,
                bestReactionTime: 400,
                settings: { volume: 0.7, difficulty: 'normal', showHints: true }
            };

            repository.updateSettings({ difficulty: 'hard' });

            const data = storedData['within-woodpile-game-data'];
            expect(data.highScore).toBe(500);
            expect(data.totalGamesPlayed).toBe(10);
            expect(data.bestReactionTime).toBe(400);
        });

        it('should handle empty settings update', () => {
            storedData['within-woodpile-game-data'] = {
                highScore: 100,
                totalGamesPlayed: 1,
                bestReactionTime: Infinity,
                settings: { volume: 0.7, difficulty: 'normal', showHints: true }
            };

            repository.updateSettings({});

            const settings = storedData['within-woodpile-game-data'].settings;
            expect(settings.volume).toBe(0.7);
            expect(settings.difficulty).toBe('normal');
            expect(settings.showHints).toBe(true);
        });

        it('should handle volume at boundaries', () => {
            repository.updateSettings({ volume: 0 });
            expect(storedData['within-woodpile-game-data'].settings.volume).toBe(0);

            repository.updateSettings({ volume: 1 });
            expect(storedData['within-woodpile-game-data'].settings.volume).toBe(1);
        });
    });

    describe('resetGameData', () => {
        it('should remove game data from storage', () => {
            storedData['within-woodpile-game-data'] = {
                highScore: 1000,
                totalGamesPlayed: 50,
                bestReactionTime: 200,
                settings: { volume: 0.8, difficulty: 'hard', showHints: false }
            };

            repository.resetGameData();

            expect(mockStorage.removeItem).toHaveBeenCalledWith('within-woodpile-game-data');
            expect(storedData['within-woodpile-game-data']).toBeUndefined();
        });

        it('should not throw when resetting empty data', () => {
            expect(() => repository.resetGameData()).not.toThrow();
        });

        it('should return default data after reset', () => {
            storedData['within-woodpile-game-data'] = {
                highScore: 1000,
                totalGamesPlayed: 50,
                bestReactionTime: 200,
                settings: { volume: 0.8, difficulty: 'hard', showHints: false }
            };

            repository.resetGameData();

            const data = repository.getGameData();
            expect(data.highScore).toBe(0);
            expect(data.totalGamesPlayed).toBe(0);
            expect(data.bestReactionTime).toBe(Infinity);
            expect(data.settings.volume).toBe(0.7);
        });
    });

    describe('Integration Tests', () => {
        it('should handle complete game session workflow', () => {
            // Start game
            repository.incrementGamesPlayed();
            expect(repository.getGameData().totalGamesPlayed).toBe(1);

            // Record score
            const isNewRecord = repository.updateHighScore(500);
            expect(isNewRecord).toBe(true);
            expect(repository.getGameData().highScore).toBe(500);

            // Record reaction time
            const isBestTime = repository.updateBestReactionTime(300);
            expect(isBestTime).toBe(true);

            // Play again with better score
            repository.incrementGamesPlayed();
            repository.updateHighScore(800);
            expect(repository.getGameData().totalGamesPlayed).toBe(2);
            expect(repository.getGameData().highScore).toBe(800);
        });

        it('should handle settings changes during gameplay', () => {
            // Initial settings
            repository.updateSettings({ volume: 0.5, difficulty: 'easy' });

            // Play game
            repository.incrementGamesPlayed();
            repository.updateHighScore(100);

            // Change settings
            repository.updateSettings({ difficulty: 'hard', showHints: false });

            const data = repository.getGameData();
            expect(data.highScore).toBe(100);
            expect(data.settings.difficulty).toBe('hard');
            expect(data.settings.showHints).toBe(false);
        });

        it('should handle multiple score updates correctly', () => {
            repository.updateHighScore(100);
            expect(repository.updateHighScore(50)).toBe(false);
            expect(repository.updateHighScore(200)).toBe(true);
            expect(repository.updateHighScore(150)).toBe(false);
            expect(repository.updateHighScore(300)).toBe(true);

            expect(repository.getGameData().highScore).toBe(300);
        });

        it('should handle rapid successive operations', () => {
            for (let i = 0; i < 10; i++) {
                repository.incrementGamesPlayed();
                repository.updateHighScore(i * 100);
                repository.updateBestReactionTime(1000 - i * 50);
            }

            const data = repository.getGameData();
            expect(data.totalGamesPlayed).toBe(10);
            expect(data.highScore).toBe(900);
            expect(data.bestReactionTime).toBe(550);
        });

        it('should handle reset and restart', () => {
            // Build up data
            repository.incrementGamesPlayed();
            repository.updateHighScore(1000);
            repository.updateBestReactionTime(200);
            repository.updateSettings({ difficulty: 'expert' });

            // Reset
            repository.resetGameData();

            // Start fresh
            repository.incrementGamesPlayed();
            const data = repository.getGameData();
            expect(data.totalGamesPlayed).toBe(1);
            expect(data.highScore).toBe(0);
        });
    });

    describe('Edge Cases', () => {
        it('should handle concurrent updates', () => {
            repository.updateHighScore(100);
            repository.incrementGamesPlayed();
            repository.updateBestReactionTime(500);
            repository.updateSettings({ volume: 0.5 });

            const data = repository.getGameData();
            expect(data.highScore).toBe(100);
            expect(data.totalGamesPlayed).toBe(1);
            expect(data.bestReactionTime).toBe(500);
            expect(data.settings.volume).toBe(0.5);
        });

        it('should handle very large game counts', () => {
            storedData['within-woodpile-game-data'] = {
                highScore: 0,
                totalGamesPlayed: 999999,
                bestReactionTime: Infinity,
                settings: { volume: 0.7, difficulty: 'normal', showHints: true }
            };

            repository.incrementGamesPlayed();
            expect(repository.getGameData().totalGamesPlayed).toBe(1000000);
        });

        it('should handle decimal reaction times', () => {
            const result = repository.updateBestReactionTime(123.456);
            expect(result).toBe(true);
            expect(repository.getGameData().bestReactionTime).toBe(123.456);
        });

        it('should handle custom difficulty strings', () => {
            repository.updateSettings({ difficulty: 'nightmare' });
            expect(repository.getGameData().settings.difficulty).toBe('nightmare');
        });

        it('should preserve data integrity across multiple operations', () => {
            const initialData: GameData = {
                highScore: 500,
                totalGamesPlayed: 5,
                bestReactionTime: 400,
                settings: { volume: 0.8, difficulty: 'hard', showHints: false }
            };

            repository.saveGameData(initialData);

            // Multiple operations
            repository.incrementGamesPlayed();
            repository.updateSettings({ volume: 0.9 });

            const finalData = repository.getGameData();
            expect(finalData.highScore).toBe(500);
            expect(finalData.totalGamesPlayed).toBe(6);
            expect(finalData.bestReactionTime).toBe(400);
            expect(finalData.settings.volume).toBe(0.9);
            expect(finalData.settings.difficulty).toBe('hard');
        });
    });
});
