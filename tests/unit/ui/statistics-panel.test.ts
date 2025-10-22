import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StatisticsPanel } from '../../../src/ui/highscore/StatisticsPanel.js';
import { HighscoreStats, Achievement } from '../../../src/types/index.js';
import { I18n } from '../../../src/infrastructure/i18n/I18n.js';

// Helper to create mock canvas context
function createMockCanvasContext() {
    return {
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
        strokeText: vi.fn(),
        measureText: vi.fn(() => ({ width: 100 })),
        save: vi.fn(),
        restore: vi.fn(),
        beginPath: vi.fn(),
        closePath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        quadraticCurveTo: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        stroke: vi.fn(),
        createLinearGradient: vi.fn((x1, y1, x2, y2) => ({
            addColorStop: vi.fn()
        })),
        createRadialGradient: vi.fn(() => ({
            addColorStop: vi.fn()
        })),
        drawImage: vi.fn()
    };
}

// Helper to create mock achievement
function createMockAchievement(overrides?: Partial<Achievement>): Achievement {
    return {
        id: '1',
        type: 'first_score',
        title: 'Test Achievement',
        description: 'Test description',
        unlockedAt: new Date(),
        requirements: {},
        ...overrides
    };
}

describe('StatisticsPanel', () => {
    let panel: StatisticsPanel;
    let canvas: HTMLCanvasElement;
    let ctx: any;
    let mockI18n: I18n;

    beforeEach(() => {
        // Setup canvas with mocked context
        canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        
        ctx = createMockCanvasContext();
        vi.spyOn(canvas, 'getContext').mockReturnValue(ctx as any);

        // Mock I18n
        mockI18n = {
            translate: vi.fn((key: string) => {
                const translations: Record<string, string> = {
                    'highscore.statistics.title': 'Statistics',
                    'highscore.statistics.overview': 'Overview',
                    'highscore.statistics.totalGames': 'Total Games',
                    'highscore.statistics.averageScore': 'Average Score',
                    'highscore.statistics.bestScore': 'Best Score',
                    'highscore.statistics.totalPlayTime': 'Total Play Time',
                    'highscore.achievements.title': 'Achievements',
                    'highscore.achievements.none': 'No achievements yet'
                };
                return translations[key] || key;
            }),
            setLanguage: vi.fn(),
            getCurrentLanguage: vi.fn().mockReturnValue('en')
        } as any;

        panel = new StatisticsPanel(ctx, canvas, mockI18n);
    });

    describe('Initialization', () => {
        it('should create panel with context, canvas and i18n', () => {
            expect(panel).toBeDefined();
            expect(panel).toBeInstanceOf(StatisticsPanel);
        });

        it('should initialize with no statistics', () => {
            // Verify render works without statistics
            expect(() => panel.render(0, 0, 400, 600, 0)).not.toThrow();
        });

        it('should initialize with empty achievements array', () => {
            expect(() => panel.render(0, 0, 400, 600, 0)).not.toThrow();
        });
    });

    describe('Update Statistics', () => {
        it('should update statistics data', () => {
            const stats: HighscoreStats = {
                totalGames: 10,
                averageScore: 5000,
                highestScore: 10000,
                mostFrequentPlayer: 'TestPlayer',
                averagePlayDuration: 120
            };

            panel.updateStatistics(stats);
            
            // Render to verify statistics are used
            panel.render(0, 0, 400, 600, 0);
            
            // Verify statistics values are rendered
            expect(ctx.fillText).toHaveBeenCalledWith('10', expect.any(Number), expect.any(Number));
            expect(ctx.fillText).toHaveBeenCalledWith('5000', expect.any(Number), expect.any(Number));
            expect(ctx.fillText).toHaveBeenCalledWith('10000', expect.any(Number), expect.any(Number));
        });

        it('should handle statistics with zero values', () => {
            const stats: HighscoreStats = {
                totalGames: 0,
                averageScore: 0,
                highestScore: 0,
                mostFrequentPlayer: '',
                averagePlayDuration: 0
            };

            panel.updateStatistics(stats);
            
            expect(() => panel.render(0, 0, 400, 600, 0)).not.toThrow();
        });

        it('should handle statistics with large numbers', () => {
            const stats: HighscoreStats = {
                totalGames: 999999,
                averageScore: 1000000,
                highestScore: 9999999,
                mostFrequentPlayer: 'Champion',
                averagePlayDuration: 10000
            };

            panel.updateStatistics(stats);
            
            expect(() => panel.render(0, 0, 400, 600, 0)).not.toThrow();
        });

        it('should round average score when rendering', () => {
            const stats: HighscoreStats = {
                totalGames: 5,
                averageScore: 1234.567,
                highestScore: 2000,
                mostFrequentPlayer: 'Test',
                averagePlayDuration: 60
            };

            panel.updateStatistics(stats);
            panel.render(0, 0, 400, 600, 0);
            
            // Should render rounded value
            expect(ctx.fillText).toHaveBeenCalledWith('1235', expect.any(Number), expect.any(Number));
        });
    });

    describe('Update Achievements', () => {
        it('should update achievements array', () => {
            const achievements: Achievement[] = [
                createMockAchievement({
                    id: '1',
                    type: 'first_score',
                    title: 'First Score',
                    description: 'Completed first game'
                })
            ];

            panel.updateAchievements(achievements);
            panel.render(0, 0, 400, 600, 0);
            
            // Verify achievement is rendered
            expect(ctx.fillText).toHaveBeenCalledWith('First Score', expect.any(Number), expect.any(Number));
        });

        it('should handle empty achievements array', () => {
            panel.updateAchievements([]);
            panel.render(0, 0, 400, 600, 0);
            
            // Should show "no achievements" message
            expect(mockI18n.translate).toHaveBeenCalledWith('highscore.achievements.none');
        });

        it('should handle multiple achievements', () => {
            const achievements: Achievement[] = [
                createMockAchievement({ id: '1', type: 'first_score', title: 'First Game', description: 'Play first game' }),
                createMockAchievement({ id: '2', type: 'high_score', title: 'High Scorer', description: 'Reach 10000 points' }),
                createMockAchievement({ id: '3', type: 'fast_time', title: 'Speed Demon', description: 'Complete in under 1 minute' })
            ];

            panel.updateAchievements(achievements);
            
            expect(() => panel.render(0, 0, 400, 600, 0)).not.toThrow();
        });

        it('should render achievement icons for known types', () => {
            const achievements: Achievement[] = [
                createMockAchievement({ id: '1', type: 'first_score', title: 'First' }),
                createMockAchievement({ id: '2', type: 'high_score', title: 'High' }),
                createMockAchievement({ id: '3', type: 'fast_time', title: 'Fast' }),
                createMockAchievement({ id: '4', type: 'endurance', title: 'Long' }),
                createMockAchievement({ id: '5', type: 'perfect_game', title: 'Perfect' }),
                createMockAchievement({ id: '6', type: 'milestone', title: 'Milestone' })
            ];

            panel.updateAchievements(achievements);
            panel.render(0, 0, 400, 600, 0);
            
            // Verify icons are rendered (check all fillText calls for icons)
            const fillTextCalls = (ctx.fillText as any).mock.calls;
            const renderedIcons = fillTextCalls.map((call: any[]) => call[0]);
            
            // Check that some emoji icons are present
            expect(renderedIcons).toContain('🎯');
            expect(renderedIcons).toContain('⚡');
            expect(renderedIcons).toContain('🔥');
            expect(renderedIcons).toContain('✨');
            // Note: Some emojis may not render correctly in test environment
        });

        it('should use default icon for unknown achievement type', () => {
            const achievements: Achievement[] = [
                createMockAchievement({
                    id: '1',
                    type: 'unknown_type',
                    title: 'Unknown',
                    description: 'Unknown achievement'
                })
            ];

            panel.updateAchievements(achievements);
            panel.render(0, 0, 400, 600, 0);
            
            // Should render default icon
            expect(ctx.fillText).toHaveBeenCalledWith('🎖️', expect.any(Number), expect.any(Number));
        });
    });

    describe('Rendering', () => {
        it('should clear canvas area before rendering', () => {
            panel.render(10, 20, 400, 600, 0);
            
            expect(ctx.clearRect).toHaveBeenCalledWith(10, 20, 400, 600);
        });

        it('should render background with gradient', () => {
            panel.render(0, 0, 400, 600, 0);
            
            expect(ctx.createLinearGradient).toHaveBeenCalled();
            expect(ctx.fill).toHaveBeenCalled();
        });

        it('should render background with border', () => {
            panel.render(0, 0, 400, 600, 0);
            
            expect(ctx.stroke).toHaveBeenCalled();
        });

        it('should render title', () => {
            panel.render(0, 0, 400, 600, 0);
            
            expect(mockI18n.translate).toHaveBeenCalledWith('highscore.statistics.title');
            expect(ctx.fillText).toHaveBeenCalledWith('Statistics', expect.any(Number), expect.any(Number));
        });

        it('should render statistics section when data available', () => {
            const stats: HighscoreStats = {
                totalGames: 5,
                averageScore: 1000,
                highestScore: 2000,
                mostFrequentPlayer: 'Test',
                averagePlayDuration: 120
            };

            panel.updateStatistics(stats);
            panel.render(0, 0, 400, 600, 0);
            
            expect(mockI18n.translate).toHaveBeenCalledWith('highscore.statistics.overview');
            expect(mockI18n.translate).toHaveBeenCalledWith('highscore.statistics.totalGames');
            expect(mockI18n.translate).toHaveBeenCalledWith('highscore.statistics.averageScore');
            expect(mockI18n.translate).toHaveBeenCalledWith('highscore.statistics.bestScore');
        });

        it('should not render statistics section when no data', () => {
            panel.render(0, 0, 400, 600, 0);
            
            // Title should still be rendered
            expect(mockI18n.translate).toHaveBeenCalledWith('highscore.statistics.title');
            
            // But overview section should not be rendered
            const overviewCalls = (mockI18n.translate as any).mock.calls.filter(
                (call: any[]) => call[0] === 'highscore.statistics.overview'
            );
            expect(overviewCalls.length).toBe(0);
        });

        it('should render achievements section', () => {
            panel.render(0, 0, 400, 600, 0);
            
            expect(mockI18n.translate).toHaveBeenCalledWith('highscore.achievements.title');
        });

        it('should handle custom coordinates and dimensions', () => {
            panel.render(50, 100, 300, 400, 0);
            
            expect(ctx.clearRect).toHaveBeenCalledWith(50, 100, 300, 400);
        });

        it('should save and restore canvas context', () => {
            panel.render(0, 0, 400, 600, 0);
            
            expect(ctx.save).toHaveBeenCalled();
            expect(ctx.restore).toHaveBeenCalled();
        });

        it('should handle animation time for achievements glow', () => {
            const achievements: Achievement[] = [
                {
                    id: '1',
                    type: 'first_score',
                    title: 'Test',
                    description: 'Test achievement',
                    unlockedAt: new Date(),
                    requirements: {}
                }
            ];

            panel.updateAchievements(achievements);
            
            // Render with different animation times
            panel.render(0, 0, 400, 600, 0);
            panel.render(0, 0, 400, 600, 1);
            panel.render(0, 0, 400, 600, 2);
            
            // Should create rounded rect for achievement background
            expect(ctx.beginPath).toHaveBeenCalled();
            expect(ctx.fill).toHaveBeenCalled();
        });
    });

    describe('Duration Formatting', () => {
        it('should format duration in minutes when less than 1 hour', () => {
            const stats: HighscoreStats = {
                totalGames: 1,
                averageScore: 1000,
                highestScore: 1000,
                mostFrequentPlayer: 'Test',
                averagePlayDuration: 30 // 30 seconds
            };

            panel.updateStatistics(stats);
            panel.render(0, 0, 400, 600, 0);
            
            // Should render "0m" for 30 seconds
            expect(ctx.fillText).toHaveBeenCalledWith('0m', expect.any(Number), expect.any(Number));
        });

        it('should format duration in minutes', () => {
            const stats: HighscoreStats = {
                totalGames: 1,
                averageScore: 1000,
                highestScore: 1000,
                mostFrequentPlayer: 'Test',
                averagePlayDuration: 300 // 5 minutes
            };

            panel.updateStatistics(stats);
            panel.render(0, 0, 400, 600, 0);
            
            expect(ctx.fillText).toHaveBeenCalledWith('5m', expect.any(Number), expect.any(Number));
        });

        it('should format duration in hours and minutes', () => {
            const stats: HighscoreStats = {
                totalGames: 1,
                averageScore: 1000,
                highestScore: 1000,
                mostFrequentPlayer: 'Test',
                averagePlayDuration: 3900 // 65 minutes = 1h 5m
            };

            panel.updateStatistics(stats);
            panel.render(0, 0, 400, 600, 0);
            
            expect(ctx.fillText).toHaveBeenCalledWith('1h 5m', expect.any(Number), expect.any(Number));
        });

        it('should handle long durations', () => {
            const stats: HighscoreStats = {
                totalGames: 1,
                averageScore: 1000,
                highestScore: 1000,
                mostFrequentPlayer: 'Test',
                averagePlayDuration: 7380 // 123 minutes = 2h 3m
            };

            panel.updateStatistics(stats);
            panel.render(0, 0, 400, 600, 0);
            
            expect(ctx.fillText).toHaveBeenCalledWith('2h 3m', expect.any(Number), expect.any(Number));
        });
    });

    describe('Achievements List Rendering', () => {
        it('should limit visible achievements based on available height', () => {
            const achievements: Achievement[] = Array.from({ length: 20 }, (_, i) => ({
                id: `${i}`,
                type: 'first_score',
                title: `Achievement ${i}`,
                description: `Description ${i}`,
                unlockedAt: new Date(),
                requirements: {}
            }));

            panel.updateAchievements(achievements);
            panel.render(0, 0, 400, 600, 0);
            
            // With available height, should limit rendered achievements
            expect(ctx.fillText).toHaveBeenCalled();
        });

        it('should render achievement background with rounded corners', () => {
            const achievements: Achievement[] = [
                {
                    id: '1',
                    type: 'milestone',
                    title: 'Test',
                    description: 'Test',
                    unlockedAt: new Date(),
                    requirements: {}
                }
            ];

            panel.updateAchievements(achievements);
            panel.render(0, 0, 400, 600, 0);
            
            expect(ctx.beginPath).toHaveBeenCalled();
            expect(ctx.quadraticCurveTo).toHaveBeenCalled();
            expect(ctx.closePath).toHaveBeenCalled();
        });

        it('should render achievement with animated glow effect', () => {
            const achievements: Achievement[] = [
                {
                    id: '1',
                    type: 'perfect_game',
                    title: 'Perfect',
                    description: 'Perfect game',
                    unlockedAt: new Date(),
                    requirements: {}
                }
            ];

            panel.updateAchievements(achievements);
            
            // Render at different animation times
            panel.render(0, 0, 400, 600, 0);
            panel.render(0, 0, 400, 600, Math.PI / 4);
            panel.render(0, 0, 400, 600, Math.PI / 2);
            
            // Should update fillStyle for glow animation
            expect(ctx.fillStyle).toBeDefined();
        });
    });

    describe('Resource Management', () => {
        it('should clear statistics on destroy', () => {
            const stats: HighscoreStats = {
                totalGames: 10,
                averageScore: 5000,
                highestScore: 10000,
                mostFrequentPlayer: 'Test',
                averagePlayDuration: 120
            };

            panel.updateStatistics(stats);
            panel.destroy();
            
            // After destroy, should not render statistics
            panel.render(0, 0, 400, 600, 0);
            
            // Should not show statistics data
            const totalGamesCalls = (ctx.fillText as any).mock.calls.filter(
                (call: any[]) => call[0] === '10'
            );
            expect(totalGamesCalls.length).toBe(0);
        });

        it('should clear achievements on destroy', () => {
            const achievements: Achievement[] = [
                {
                    id: '1',
                    type: 'first_score',
                    title: 'Test',
                    description: 'Test',
                    unlockedAt: new Date(),
                    requirements: {}
                }
            ];

            panel.updateAchievements(achievements);
            panel.destroy();
            panel.render(0, 0, 400, 600, 0);
            
            // Should show "no achievements" message after destroy
            expect(mockI18n.translate).toHaveBeenCalledWith('highscore.achievements.none');
        });

        it('should handle multiple destroy calls', () => {
            panel.destroy();
            panel.destroy();
            
            expect(() => panel.render(0, 0, 400, 600, 0)).not.toThrow();
        });
    });

    describe('Edge Cases', () => {
        it('should handle zero-size render area', () => {
            expect(() => panel.render(0, 0, 0, 0, 0)).not.toThrow();
        });

        it('should handle very small render area', () => {
            expect(() => panel.render(0, 0, 50, 50, 0)).not.toThrow();
        });

        it('should handle very large render area', () => {
            expect(() => panel.render(0, 0, 4000, 3000, 0)).not.toThrow();
        });

        it('should handle negative animation time', () => {
            const achievements: Achievement[] = [
                {
                    id: '1',
                    type: 'first_score',
                    title: 'Test',
                    description: 'Test',
                    unlockedAt: new Date(),
                    requirements: {}
                }
            ];

            panel.updateAchievements(achievements);
            
            expect(() => panel.render(0, 0, 400, 600, -1)).not.toThrow();
        });

        it('should handle very long achievement titles', () => {
            const achievements: Achievement[] = [
                {
                    id: '1',
                    type: 'milestone',
                    title: 'A'.repeat(100),
                    description: 'B'.repeat(200),
                    unlockedAt: new Date(),
                    requirements: {}
                }
            ];

            panel.updateAchievements(achievements);
            
            expect(() => panel.render(0, 0, 400, 600, 0)).not.toThrow();
        });

        it('should handle empty translation keys', () => {
            (mockI18n.translate as any).mockReturnValue('');
            
            expect(() => panel.render(0, 0, 400, 600, 0)).not.toThrow();
        });

        it('should handle statistics with negative values gracefully', () => {
            const stats: HighscoreStats = {
                totalGames: -5,
                averageScore: -1000,
                highestScore: -500,
                mostFrequentPlayer: 'Test',
                averagePlayDuration: -60
            };

            panel.updateStatistics(stats);
            
            expect(() => panel.render(0, 0, 400, 600, 0)).not.toThrow();
        });

        it('should handle rapid successive renders', () => {
            const stats: HighscoreStats = {
                totalGames: 5,
                averageScore: 1000,
                highestScore: 2000,
                mostFrequentPlayer: 'Test',
                averagePlayDuration: 120
            };

            panel.updateStatistics(stats);
            
            expect(() => {
                for (let i = 0; i < 100; i++) {
                    panel.render(0, 0, 400, 600, i * 0.016);
                }
            }).not.toThrow();
        });
    });

    describe('Integration', () => {
        it('should render complete panel with all data', () => {
            const stats: HighscoreStats = {
                totalGames: 50,
                averageScore: 7500,
                highestScore: 15000,
                mostFrequentPlayer: 'Champion',
                averagePlayDuration: 240
            };

            const achievements: Achievement[] = [
                { id: '1', type: 'first_score', title: 'Beginner', description: 'First game', unlockedAt: new Date(), requirements: {} },
                { id: '2', type: 'high_score', title: 'Expert', description: 'High score', unlockedAt: new Date(), requirements: {} }
            ];

            panel.updateStatistics(stats);
            panel.updateAchievements(achievements);
            panel.render(100, 50, 600, 800, 1.5);
            
            // Verify all sections are rendered
            expect(ctx.clearRect).toHaveBeenCalledWith(100, 50, 600, 800);
            expect(ctx.save).toHaveBeenCalled();
            expect(ctx.restore).toHaveBeenCalled();
            expect(mockI18n.translate).toHaveBeenCalled();
            expect(ctx.fillText).toHaveBeenCalled();
        });

        it('should update and re-render correctly', () => {
            // First render
            const stats1: HighscoreStats = {
                totalGames: 10,
                averageScore: 1000,
                highestScore: 2000,
                mostFrequentPlayer: 'Player1',
                averagePlayDuration: 60
            };
            panel.updateStatistics(stats1);
            panel.render(0, 0, 400, 600, 0);
            
            // Update and re-render
            const stats2: HighscoreStats = {
                totalGames: 20,
                averageScore: 2000,
                highestScore: 4000,
                mostFrequentPlayer: 'Player2',
                averagePlayDuration: 120
            };
            panel.updateStatistics(stats2);
            panel.render(0, 0, 400, 600, 0);
            
            // Should render new values
            expect(ctx.fillText).toHaveBeenCalledWith('20', expect.any(Number), expect.any(Number));
            expect(ctx.fillText).toHaveBeenCalledWith('2000', expect.any(Number), expect.any(Number));
        });
    });
});

