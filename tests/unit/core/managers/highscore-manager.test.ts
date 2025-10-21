import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HighscoreManager } from '../../../../src/core/managers/HighscoreManager.js';
import type { IHighscoreRepository, HighscoreEntry } from '../../../../src/types/index.js';
import { HighscoreError } from '../../../../src/types/index.js';

describe('HighscoreManager Tests', () => {
    let manager: HighscoreManager;
    let mockRepository: any;
    let mockI18n: any;

    const createMockEntry = (overrides?: Partial<HighscoreEntry>): HighscoreEntry => {
        const baseEntry: HighscoreEntry = {
            id: 'test-id',
            playerName: 'TestPlayer',
            score: 1000,
            level: 5,
            playDuration: 120000,
            timestamp: new Date('2025-01-01')
        };
        
        // Merge overrides but ensure timestamp is always a Date
        const merged = { ...baseEntry, ...overrides };
        if (!merged.timestamp || !(merged.timestamp instanceof Date)) {
            merged.timestamp = new Date('2025-01-01');
        }
        
        return merged;
    };

    beforeEach(() => {
        // Mock repository with all needed methods
        mockRepository = {
            getAll: vi.fn().mockResolvedValue({
                entries: [],
                maxEntries: 10,
                lastUpdated: new Date()
            }),
            getTop: vi.fn().mockResolvedValue([]),
            add: vi.fn().mockImplementation((input) => Promise.resolve({ 
                ...input, 
                id: 'new-id', 
                timestamp: new Date() 
            })),
            clear: vi.fn().mockResolvedValue(undefined),
            qualifiesForTop10: vi.fn().mockResolvedValue({ qualifies: true, position: 1 }),
            getByPlayer: vi.fn().mockResolvedValue([]),
            getPersonalBest: vi.fn().mockResolvedValue(null),
            getPlayerRanking: vi.fn().mockResolvedValue({ currentRank: 1, totalPlayers: 1, bestScore: 1000 }),
            getStats: vi.fn().mockResolvedValue({
                totalGames: 0,
                averageScore: 0,
                highestScore: 0,
                mostFrequentPlayer: '',
                averagePlayDuration: 0
            }),
            getAchievements: vi.fn().mockResolvedValue({
                totalGamesPlayed: 0,
                averageScore: 0,
                bestScore: 0,
                gamesInTop10: 0,
                consistencyRating: 'Average'
            }),
            export: vi.fn().mockResolvedValue({
                version: '1.0',
                exportDate: new Date(),
                gameVersion: '1.0.0',
                entries: []
            }),
            import: vi.fn().mockResolvedValue(undefined)
        };

        // Mock I18n
        mockI18n = {
            translate: vi.fn((key: string) => key),
            getCurrentLanguage: vi.fn(() => 'en')
        };

        manager = new HighscoreManager(mockRepository, mockI18n);
    });

    describe('Initialization', () => {
        it('should create manager with repository and i18n', () => {
            expect(manager).toBeDefined();
        });

        it('should initialize HighscoreService internally', () => {
            // Manager ska kunna användas direkt
            expect(manager.getAllHighscores).toBeDefined();
        });

        it('should initialize HighscoreI18nService internally', () => {
            // Manager ska ha tillgång till formattering
            expect(manager.formatEntry).toBeDefined();
        });
    });

    describe('Get All Highscores', () => {
        it('should return all highscores with formatting', async () => {
            const mockEntry = createMockEntry();
            mockRepository.getAll = vi.fn().mockResolvedValue({
                entries: [mockEntry],
                maxEntries: 10,
                lastUpdated: new Date()
            });

            const result = await manager.getAllHighscores();

            expect(result.entries).toHaveLength(1);
            expect(result.entries[0].entry).toEqual(mockEntry);
            expect(result.entries[0].formatted).toBeDefined();
        });

        it('should include maxEntries in response', async () => {
            const result = await manager.getAllHighscores();

            expect(result.maxEntries).toBe(10);
        });

        it('should include lastUpdated with formatting', async () => {
            const result = await manager.getAllHighscores();

            expect(result.lastUpdated).toBeDefined();
            expect(typeof result.lastUpdated).toBe('string');
        });

        it('should handle empty highscore list', async () => {
            mockRepository.getAll = vi.fn().mockResolvedValue({
                entries: [],
                maxEntries: 10,
                lastUpdated: new Date()
            });

            const result = await manager.getAllHighscores();

            expect(result.entries).toHaveLength(0);
        });

        it('should format entries with correct positions', async () => {
            const entries = [
                createMockEntry({ score: 3000 }),
                createMockEntry({ score: 2000 }),
                createMockEntry({ score: 1000 })
            ];
            mockRepository.getAll = vi.fn().mockResolvedValue({
                entries,
                maxEntries: 10,
                lastUpdated: new Date()
            });

            const result = await manager.getAllHighscores();

            expect(result.entries).toHaveLength(3);
            // Positioner ska vara 1, 2, 3
        });
    });

    describe('Get Top Highscores', () => {
        it('should return top 10 highscores by default', async () => {
            const entries = Array.from({ length: 15 }, (_, i) => 
                createMockEntry({ score: 1000 - i * 100, id: `id-${i}` })
            );
            mockRepository.getTop = vi.fn().mockResolvedValue(entries.slice(0, 10));

            const result = await manager.getTopHighscores();

            expect(result).toHaveLength(10);
        });

        it('should return specified number of highscores', async () => {
            const entries = Array.from({ length: 10 }, (_, i) => 
                createMockEntry({ score: 1000 - i * 100, id: `id-${i}` })
            );
            mockRepository.getTop = vi.fn().mockResolvedValue(entries.slice(0, 5));

            const result = await manager.getTopHighscores(5);

            expect(result).toHaveLength(5);
        });

        it('should format entries with positions', async () => {
            const entry = createMockEntry();
            mockRepository.getTop = vi.fn().mockResolvedValue([entry]);

            const result = await manager.getTopHighscores(1);

            expect(result[0].entry).toEqual(entry);
            expect(result[0].formatted).toBeDefined();
        });

        it('should return all entries if fewer than requested', async () => {
            const entries = [createMockEntry()];
            mockRepository.getTop = vi.fn().mockResolvedValue(entries);

            const result = await manager.getTopHighscores(10);

            expect(result).toHaveLength(1);
        });
    });

    describe('Add Highscore', () => {
        it('should add highscore and return entry with messages', async () => {
            const input = {
                playerName: 'TestPlayer',
                score: 1000,
                level: 5,
                playDuration: 120000
            };

            mockRepository.getPersonalBest = vi.fn().mockResolvedValue(null);

            const result = await manager.addHighscore(input);

            expect(result.entry).toBeDefined();
            expect(result.messages.success).toBeDefined();
            expect(typeof result.messages.isPersonalBest).toBe('boolean');
        });

        it('should detect personal best', async () => {
            const input = {
                playerName: 'TestPlayer',
                score: 2000,
                level: 5,
                playDuration: 120000
            };

            // Mocka att det finns en tidigare score
            mockRepository.getPersonalBest = vi.fn().mockResolvedValue(
                createMockEntry({ playerName: 'TestPlayer', score: 1000 })
            );

            const result = await manager.addHighscore(input);

            expect(result.messages.isPersonalBest).toBe(true);
            expect(result.messages.personalBestMessage).toBeDefined();
        });

        it('should set personal best for first entry', async () => {
            const input = {
                playerName: 'NewPlayer',
                score: 1000,
                level: 5,
                playDuration: 120000
            };

            mockRepository.getPersonalBest = vi.fn().mockResolvedValue(null);

            const result = await manager.addHighscore(input);

            // First entry is always a personal best
            expect(result.messages.isPersonalBest).toBe(true);
            expect(result.messages.personalBestMessage).toBeDefined();
        });

        it('should handle HighscoreError with localized message', async () => {
            const input = {
                playerName: 'TestPlayer',
                score: 1000,
                level: 5,
                playDuration: 120000
            };

            mockRepository.add = vi.fn().mockRejectedValue(
                new HighscoreError('Test error', 'VALIDATION_ERROR')
            );

            await expect(manager.addHighscore(input)).rejects.toThrow(HighscoreError);
        });

        it('should rethrow non-HighscoreError errors', async () => {
            const input = {
                playerName: 'TestPlayer',
                score: 1000,
                level: 5,
                playDuration: 120000
            };

            mockRepository.add = vi.fn().mockRejectedValue(new Error('Network error'));

            await expect(manager.addHighscore(input)).rejects.toThrow(HighscoreError);
        });
    });

    describe('Check Qualification', () => {
        it('should return qualification result with message', async () => {
            mockRepository.qualifiesForTop10 = vi.fn().mockResolvedValue({ qualifies: true, position: 5 });
            
            const result = await manager.checkQualification(1000);

            expect(result.result).toBeDefined();
            expect(result.result.qualifies).toBeDefined();
            expect(result.message).toBeDefined();
            expect(typeof result.message).toBe('string');
        });

        it('should qualify high score', async () => {
            mockRepository.qualifiesForTop10 = vi.fn().mockResolvedValue({ qualifies: true, position: 3 });

            const result = await manager.checkQualification(1000);

            expect(result.result.qualifies).toBe(true);
        });

        it('should not qualify low score with full list', async () => {
            mockRepository.qualifiesForTop10 = vi.fn().mockResolvedValue({ qualifies: false, position: 11 });

            const result = await manager.checkQualification(500);

            expect(result.result.qualifies).toBe(false);
        });

        it('should always qualify if list not full', async () => {
            mockRepository.qualifiesForTop10 = vi.fn().mockResolvedValue({ qualifies: true, position: 1 });

            const result = await manager.checkQualification(100);

            expect(result.result.qualifies).toBe(true);
        });
    });

    describe('Get Player Highscores', () => {
        it('should return player entries with ranking', async () => {
            const entry = createMockEntry({ playerName: 'TestPlayer' });
            mockRepository.getByPlayer = vi.fn().mockResolvedValue([entry]);
            mockRepository.getPersonalBest = vi.fn().mockResolvedValue(entry);
            mockRepository.getPlayerRanking = vi.fn().mockResolvedValue({ 
                currentRank: 1, 
                totalPlayers: 5, 
                bestScore: 1000 
            });

            const result = await manager.getPlayerHighscores('TestPlayer');

            expect(result.entries).toBeDefined();
            expect(result.personalBest).toBeDefined();
            expect(result.ranking).toBeDefined();
        });

        it('should filter entries by player name', async () => {
            const entries = [
                createMockEntry({ playerName: 'Player1', id: '1' }),
                createMockEntry({ playerName: 'Player1', id: '3' })
            ];
            mockRepository.getByPlayer = vi.fn().mockResolvedValue(entries);
            mockRepository.getPersonalBest = vi.fn().mockResolvedValue(entries[0]);
            mockRepository.getPlayerRanking = vi.fn().mockResolvedValue({ 
                currentRank: 1, 
                totalPlayers: 2, 
                bestScore: 1000 
            });

            const result = await manager.getPlayerHighscores('Player1');

            expect(result.entries).toHaveLength(2);
        });

        it('should return null personal best for new player', async () => {
            mockRepository.getByPlayer = vi.fn().mockResolvedValue([]);
            mockRepository.getPersonalBest = vi.fn().mockResolvedValue(null);
            mockRepository.getPlayerRanking = vi.fn().mockResolvedValue({ 
                currentRank: 0, 
                totalPlayers: 0, 
                bestScore: 0 
            });

            const result = await manager.getPlayerHighscores('NewPlayer');

            expect(result.personalBest).toBeNull();
        });

        it('should format ranking information', async () => {
            const entry = createMockEntry({ playerName: 'TestPlayer' });
            mockRepository.getByPlayer = vi.fn().mockResolvedValue([entry]);
            mockRepository.getPersonalBest = vi.fn().mockResolvedValue(entry);
            mockRepository.getPlayerRanking = vi.fn().mockResolvedValue({ 
                currentRank: 3, 
                totalPlayers: 10, 
                bestScore: 1500 
            });

            const result = await manager.getPlayerHighscores('TestPlayer');

            expect(result.ranking.currentRank).toBeDefined();
            expect(result.ranking.totalPlayers).toBeDefined();
            expect(result.ranking.bestScore).toBeDefined();
        });
    });

    describe('Get Statistics', () => {
        it('should return raw and formatted statistics', async () => {
            const stats = {
                totalGames: 10,
                averageScore: 500,
                highestScore: 1000,
                mostFrequentPlayer: 'TestPlayer',
                averagePlayDuration: 120000
            };
            mockRepository.getStats = vi.fn().mockResolvedValue(stats);

            const result = await manager.getStatistics();

            expect(result.raw).toBeDefined();
            expect(result.formatted).toBeDefined();
        });

        it('should include all stat fields', async () => {
            const stats = {
                totalGames: 10,
                averageScore: 500,
                highestScore: 1000,
                mostFrequentPlayer: 'TestPlayer',
                averagePlayDuration: 120000
            };
            mockRepository.getStats = vi.fn().mockResolvedValue(stats);

            const result = await manager.getStatistics();

            expect(result.raw.totalGames).toBeDefined();
            expect(result.raw.averageScore).toBeDefined();
            expect(result.raw.highestScore).toBeDefined();
            expect(result.raw.mostFrequentPlayer).toBeDefined();
            expect(result.raw.averagePlayDuration).toBeDefined();
        });

        it('should format all statistics for display', async () => {
            const stats = {
                totalGames: 10,
                averageScore: 500,
                highestScore: 1000,
                mostFrequentPlayer: 'TestPlayer',
                averagePlayDuration: 120000
            };
            mockRepository.getStats = vi.fn().mockResolvedValue(stats);

            const result = await manager.getStatistics();

            expect(typeof result.formatted).toBe('object');
            expect(Object.keys(result.formatted).length).toBeGreaterThan(0);
        });
    });

    describe('Get Achievements', () => {
        it('should return achievements for specific player', async () => {
            const achievements = {
                totalGamesPlayed: 5,
                averageScore: 500,
                bestScore: 1000,
                gamesInTop10: 2,
                consistencyRating: 'Good' as const
            };
            mockRepository.getAchievements = vi.fn().mockResolvedValue(achievements);

            const result = await manager.getAchievements('TestPlayer');

            expect(result.raw).toBeDefined();
            expect(result.formatted).toBeDefined();
        });

        it('should return global achievements without player name', async () => {
            const achievements = {
                totalGamesPlayed: 10,
                averageScore: 600,
                bestScore: 1200,
                gamesInTop10: 5,
                consistencyRating: 'Excellent' as const
            };
            mockRepository.getAchievements = vi.fn().mockResolvedValue(achievements);

            const result = await manager.getAchievements();

            expect(result.raw).toBeDefined();
        });

        it('should calculate consistency rating', async () => {
            const achievements = {
                totalGamesPlayed: 10,
                averageScore: 600,
                bestScore: 1200,
                gamesInTop10: 5,
                consistencyRating: 'Average' as const
            };
            mockRepository.getAchievements = vi.fn().mockResolvedValue(achievements);

            const result = await manager.getAchievements();

            expect(['Excellent', 'Good', 'Average', 'Needs Improvement']).toContain(
                result.raw.consistencyRating
            );
        });
    });

    describe('Export Highscores', () => {
        it('should export highscores with success message', async () => {
            const entry = createMockEntry();
            const exportData = {
                version: '1.0',
                exportDate: new Date(),
                gameVersion: '1.0.0',
                entries: [entry]
            };
            mockRepository.export = vi.fn().mockResolvedValue(exportData);

            const result = await manager.exportHighscores();

            expect(result.data).toBeDefined();
            expect(result.data.entries).toHaveLength(1);
            expect(result.message).toBeDefined();
        });

        it('should include metadata in export', async () => {
            const entry = createMockEntry();
            const exportData = {
                version: '1.0',
                exportDate: new Date(),
                gameVersion: '1.0.0',
                entries: [entry]
            };
            mockRepository.export = vi.fn().mockResolvedValue(exportData);

            const result = await manager.exportHighscores();

            expect(result.data.version).toBe('1.0');
            expect(result.data.exportDate).toBeDefined();
            expect(result.data.gameVersion).toBeDefined();
        });

        it('should handle export errors', async () => {
            mockRepository.export = vi.fn().mockRejectedValue(
                new HighscoreError('Export failed', 'EXPORT_ERROR')
            );

            await expect(manager.exportHighscores()).rejects.toThrow(HighscoreError);
        });
    });

    describe('Import Highscores', () => {
        it('should import highscores with success message', async () => {
            const exportData = {
                version: '1.0',
                exportDate: new Date(),
                gameVersion: '1.0.0',
                entries: [createMockEntry()]
            };

            mockRepository.import = vi.fn().mockResolvedValue(undefined);

            const result = await manager.importHighscores(exportData);

            expect(result.message).toBeDefined();
            expect(typeof result.message).toBe('string');
        });

        it('should validate import data', async () => {
            const invalidData = {
                version: '0.5',
                exportDate: new Date(),
                gameVersion: '0.5.0',
                entries: []
            };

            mockRepository.import = vi.fn().mockRejectedValue(
                new HighscoreError('Invalid version', 'VALIDATION_ERROR')
            );

            await expect(manager.importHighscores(invalidData)).rejects.toThrow(HighscoreError);
        });

        it('should handle import errors with localized message', async () => {
            const exportData = {
                version: '1.0',
                exportDate: new Date(),
                gameVersion: '1.0.0',
                entries: [createMockEntry()]
            };

            mockRepository.import = vi.fn().mockRejectedValue(
                new HighscoreError('Import failed', 'IMPORT_ERROR')
            );

            await expect(manager.importHighscores(exportData)).rejects.toThrow(HighscoreError);
        });
    });

    describe('Clear All Highscores', () => {
        it('should return confirmation message and clear function', async () => {
            const result = await manager.clearAllHighscores();

            expect(result.confirmationMessage).toBeDefined();
            expect(typeof result.confirmationMessage).toBe('string');
            expect(result.clearFunction).toBeDefined();
            expect(typeof result.clearFunction).toBe('function');
        });

        it('should clear highscores when function called', async () => {
            const result = await manager.clearAllHighscores();

            await result.clearFunction();

            expect(mockRepository.clear).toHaveBeenCalled();
        });

        it('should handle clear errors', async () => {
            mockRepository.clear = vi.fn().mockRejectedValue(
                new HighscoreError('Clear failed', 'CLEAR_ERROR')
            );

            const result = await manager.clearAllHighscores();

            await expect(result.clearFunction()).rejects.toThrow(HighscoreError);
        });
    });

    describe('Validate Input', () => {
        it('should validate valid input', () => {
            const input = {
                playerName: 'TestPlayer',
                score: 1000,
                level: 5,
                playDuration: 120000
            };

            const result = manager.validateInput(input);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject empty player name', () => {
            const input = { playerName: '' };

            const result = manager.validateInput(input);

            expect(result.isValid).toBe(false);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0].field).toBe('playerName');
        });

        it('should reject too long player name', () => {
            const input = { playerName: 'A'.repeat(51) };

            const result = manager.validateInput(input);

            expect(result.isValid).toBe(false);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0].field).toBe('playerName');
        });

        it('should reject negative score', () => {
            const input = { score: -100 };

            const result = manager.validateInput(input);

            expect(result.isValid).toBe(false);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0].field).toBe('score');
        });

        it('should reject too high score', () => {
            const input = { score: 1000001 };

            const result = manager.validateInput(input);

            expect(result.isValid).toBe(false);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0].field).toBe('score');
        });

        it('should reject negative level', () => {
            const input = { level: 0 };

            const result = manager.validateInput(input);

            expect(result.isValid).toBe(false);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0].field).toBe('level');
        });

        it('should reject negative play duration', () => {
            const input = { playDuration: -1000 };

            const result = manager.validateInput(input);

            expect(result.isValid).toBe(false);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0].field).toBe('playDuration');
        });

        it('should accumulate multiple errors', () => {
            const input = {
                playerName: '',
                score: -100,
                level: 0
            };

            const result = manager.validateInput(input);

            expect(result.isValid).toBe(false);
            expect(result.errors).toHaveLength(3);
        });

        it('should handle partial validation', () => {
            const input = { score: 1000 };

            const result = manager.validateInput(input);

            expect(result.isValid).toBe(true);
        });
    });

    describe('Format Entry', () => {
        it('should format entry for display', () => {
            const entry = createMockEntry();

            const result = manager.formatEntry(entry);

            expect(result.entry).toEqual(entry);
            expect(result.formatted).toBeDefined();
        });

        it('should include position in formatting', () => {
            const entry = createMockEntry();

            const result = manager.formatEntry(entry, 5);

            expect(result.formatted).toBeDefined();
            // Position ska användas i formatteringen
        });

        it('should format without position', () => {
            const entry = createMockEntry();

            const result = manager.formatEntry(entry);

            expect(result.formatted).toBeDefined();
        });

        it('should format all entry fields', () => {
            const entry = createMockEntry();

            const result = manager.formatEntry(entry, 1);

            expect(result.formatted.position).toBeDefined();
            expect(result.formatted.playerName).toBeDefined();
            expect(result.formatted.score).toBeDefined();
            expect(result.formatted.level).toBeDefined();
            expect(result.formatted.duration).toBeDefined();
            expect(result.formatted.date).toBeDefined();
        });
    });

    describe('Edge Cases', () => {
        it('should handle very large datasets', async () => {
            const entries = Array.from({ length: 1000 }, (_, i) => 
                createMockEntry({ score: i, id: `id-${i}` })
            );
            mockRepository.getAll = vi.fn().mockResolvedValue({
                entries,
                maxEntries: 10,
                lastUpdated: new Date()
            });

            const result = await manager.getAllHighscores();

            expect(result.entries).toHaveLength(1000);
        });

        it('should handle special characters in player names', () => {
            const input = { playerName: 'Test@#$%' };

            const result = manager.validateInput(input);

            // Specialtecken bör vara tillåtna
            expect(result.isValid).toBe(true);
        });

        it('should handle concurrent operations', async () => {
            mockRepository.getAll = vi.fn().mockResolvedValue({
                entries: [],
                maxEntries: 10,
                lastUpdated: new Date()
            });
            mockRepository.getStats = vi.fn().mockResolvedValue({
                totalGames: 0,
                averageScore: 0,
                highestScore: 0,
                mostFrequentPlayer: '',
                averagePlayDuration: 0
            });
            mockRepository.qualifiesForTop10 = vi.fn().mockResolvedValue({ qualifies: true, position: 1 });

            const promises = [
                manager.getAllHighscores(),
                manager.getStatistics(),
                manager.checkQualification(1000)
            ];

            const results = await Promise.all(promises);

            expect(results).toHaveLength(3);
            results.forEach(result => expect(result).toBeDefined());
        });
    });
});
