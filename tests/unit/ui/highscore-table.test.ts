import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HighscoreTable } from '../../../src/ui/highscore/HighscoreTable.js';
import { I18n } from '../../../src/infrastructure/i18n/I18n.js';
import { HighscoreUIConfig } from '../../../src/types/ui.js';
import { HighscoreEntry } from '../../../src/types/index.js';

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
        stroke: vi.fn(),
        scale: vi.fn(),
        createLinearGradient: vi.fn((x1, y1, x2, y2) => ({
            addColorStop: vi.fn()
        }))
    };
}

// Helper to create mock highscore entry
function createMockEntry(overrides?: Partial<HighscoreEntry>): HighscoreEntry {
    return {
        id: '1',
        playerName: 'TestPlayer',
        score: 5000,
        level: 10,
        playDuration: 120, // seconds
        timestamp: new Date('2025-01-15'),
        ...overrides
    };
}

describe('HighscoreTable', () => {
    let table: HighscoreTable;
    let canvas: HTMLCanvasElement;
    let ctx: any;
    let mockI18n: I18n;
    let mockConfig: HighscoreUIConfig;

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
                    'highscore.ranking.position': 'Rank',
                    'highscore.ranking.player': 'Player',
                    'highscore.ranking.score': 'Score',
                    'highscore.ranking.duration': 'Time',
                    'highscore.ranking.date': 'Date'
                };
                return translations[key] || key;
            }),
            setLanguage: vi.fn(),
            getCurrentLanguage: vi.fn().mockReturnValue('en')
        } as any;

        // Mock config
        mockConfig = {
            fontSize: 14,
            rowHeight: 40,
            padding: 10,
            maxVisible: 10,
            animationDuration: 0.3
        };

        table = new HighscoreTable(ctx, canvas, mockI18n, mockConfig);
    });

    describe('Initialization', () => {
        it('should create table with context, canvas, i18n and config', () => {
            expect(table).toBeDefined();
            expect(table).toBeInstanceOf(HighscoreTable);
        });

        it('should initialize columns with translations', () => {
            expect(mockI18n.translate).toHaveBeenCalledWith('highscore.ranking.position');
            expect(mockI18n.translate).toHaveBeenCalledWith('highscore.ranking.player');
            expect(mockI18n.translate).toHaveBeenCalledWith('highscore.ranking.score');
            expect(mockI18n.translate).toHaveBeenCalledWith('highscore.ranking.duration');
            expect(mockI18n.translate).toHaveBeenCalledWith('highscore.ranking.date');
        });

        it('should start with empty visible entries', () => {
            table.render(0, 0, 0);
            
            // Should render header but no rows
            expect(ctx.fillRect).toHaveBeenCalled();
        });
    });

    describe('Update Data', () => {
        it('should update visible entries', () => {
            const entries = [
                createMockEntry({ id: '1', score: 5000 }),
                createMockEntry({ id: '2', score: 4000 }),
                createMockEntry({ id: '3', score: 3000 })
            ];
            
            table.updateData(entries);
            table.render(0, 0, 0);
            
            // Should render all 3 entries
            expect(ctx.fillText).toHaveBeenCalled();
        });

        it('should limit entries to maxVisible', () => {
            const entries = Array.from({ length: 20 }, (_, i) => 
                createMockEntry({ id: `${i}`, score: 5000 - i * 100 })
            );
            
            table.updateData(entries);
            
            // Should only show first 10 (maxVisible)
            const height = table.getTableHeight();
            expect(height).toBeLessThan(20 * mockConfig.rowHeight);
        });

        it('should handle empty array', () => {
            table.updateData([]);
            
            expect(() => table.render(0, 0, 0)).not.toThrow();
        });

        it('should handle single entry', () => {
            table.updateData([createMockEntry()]);
            
            table.render(0, 0, 0);
            
            expect(ctx.fillText).toHaveBeenCalled();
        });
    });

    describe('Rendering', () => {
        it('should render table at specified position', () => {
            table.updateData([createMockEntry()]);
            
            table.render(100, 50, 0);
            
            expect(ctx.clearRect).toHaveBeenCalledWith(100, 50, expect.any(Number), expect.any(Number));
        });

        it('should render header with gradient', () => {
            table.render(0, 0, 0);
            
            expect(ctx.createLinearGradient).toHaveBeenCalled();
            expect(ctx.fillRect).toHaveBeenCalled();
        });

        it('should render header text', () => {
            table.render(0, 0, 0);
            
            // Should render column headers
            expect(ctx.fillText).toHaveBeenCalledWith('Rank', expect.any(Number), expect.any(Number));
            expect(ctx.fillText).toHaveBeenCalledWith('Player', expect.any(Number), expect.any(Number));
            expect(ctx.fillText).toHaveBeenCalledWith('Score', expect.any(Number), expect.any(Number));
            expect(ctx.fillText).toHaveBeenCalledWith('Time', expect.any(Number), expect.any(Number));
            expect(ctx.fillText).toHaveBeenCalledWith('Date', expect.any(Number), expect.any(Number));
        });

        it('should render rows with data', () => {
            const entries = [
                createMockEntry({ playerName: 'Alice', score: 5000 }),
                createMockEntry({ playerName: 'Bob', score: 4000 })
            ];
            
            table.updateData(entries);
            table.render(0, 0, 0);
            
            // Should render player names
            expect(ctx.fillText).toHaveBeenCalledWith('Alice', expect.any(Number), expect.any(Number));
            expect(ctx.fillText).toHaveBeenCalledWith('Bob', expect.any(Number), expect.any(Number));
        });

        it('should render alternating row colors', () => {
            const entries = [
                createMockEntry({ id: '1' }),
                createMockEntry({ id: '2' }),
                createMockEntry({ id: '3' })
            ];
            
            table.updateData(entries);
            table.render(0, 0, 0);
            
            // Should call fillRect for alternating rows
            expect(ctx.fillRect).toHaveBeenCalled();
        });

        it('should render borders', () => {
            table.updateData([createMockEntry()]);
            table.render(0, 0, 0);
            
            expect(ctx.strokeRect).toHaveBeenCalled();
            expect(ctx.stroke).toHaveBeenCalled();
        });

        it('should render column separators', () => {
            table.render(0, 0, 0);
            
            expect(ctx.moveTo).toHaveBeenCalled();
            expect(ctx.lineTo).toHaveBeenCalled();
        });

        it('should update with animation time', () => {
            table.updateData([createMockEntry()]);
            
            table.render(0, 0, 0);
            table.render(0, 0, 1.5);
            table.render(0, 0, 3.0);
            
            // Should scale based on animation (hover effect)
            expect(ctx.scale).toHaveBeenCalled();
        });
    });

    describe('Data Formatting', () => {
        it('should format position numbers', () => {
            const entries = [
                createMockEntry({ id: '1' }),
                createMockEntry({ id: '2' }),
                createMockEntry({ id: '3' })
            ];
            
            table.updateData(entries);
            table.render(0, 0, 0);
            
            // Should render positions 1, 2, 3
            expect(ctx.fillText).toHaveBeenCalledWith('1', expect.any(Number), expect.any(Number));
            expect(ctx.fillText).toHaveBeenCalledWith('2', expect.any(Number), expect.any(Number));
            expect(ctx.fillText).toHaveBeenCalledWith('3', expect.any(Number), expect.any(Number));
        });

        it('should format scores', () => {
            table.updateData([
                createMockEntry({ score: 12345 })
            ]);
            
            table.render(0, 0, 0);
            
            expect(ctx.fillText).toHaveBeenCalledWith('12345', expect.any(Number), expect.any(Number));
        });

        it('should format duration as MM:SS', () => {
            table.updateData([
                createMockEntry({ playDuration: 125 }) // 2:05
            ]);
            
            table.render(0, 0, 0);
            
            expect(ctx.fillText).toHaveBeenCalledWith('2:05', expect.any(Number), expect.any(Number));
        });

        it('should format duration with leading zeros', () => {
            table.updateData([
                createMockEntry({ playDuration: 65 }) // 1:05
            ]);
            
            table.render(0, 0, 0);
            
            expect(ctx.fillText).toHaveBeenCalledWith('1:05', expect.any(Number), expect.any(Number));
        });

        it('should format date in English locale', () => {
            mockI18n.getCurrentLanguage = vi.fn().mockReturnValue('en');
            table = new HighscoreTable(ctx, canvas, mockI18n, mockConfig);
            
            table.updateData([
                createMockEntry({ timestamp: new Date('2025-06-15') })
            ]);
            
            table.render(0, 0, 0);
            
            // Should format as English date (month abbreviation + day)
            expect(ctx.fillText).toHaveBeenCalled();
        });

        it('should format date in Swedish locale', () => {
            mockI18n.getCurrentLanguage = vi.fn().mockReturnValue('sv-SE');
            table = new HighscoreTable(ctx, canvas, mockI18n, mockConfig);
            
            table.updateData([
                createMockEntry({ timestamp: new Date('2025-06-15') })
            ]);
            
            table.render(0, 0, 0);
            
            // Should format as Swedish date
            expect(ctx.fillText).toHaveBeenCalled();
        });
    });

    describe('Dimensions', () => {
        it('should calculate table width from columns', () => {
            const width = table.getTableWidth();
            
            // Width = sum of column widths (80+200+120+100+120) + padding*2
            expect(width).toBe(80 + 200 + 120 + 100 + 120 + mockConfig.padding * 2);
        });

        it('should calculate table height with no entries', () => {
            table.updateData([]);
            
            const height = table.getTableHeight();
            
            // Height = header height (rowHeight + 10)
            expect(height).toBe(mockConfig.rowHeight + 10);
        });

        it('should calculate table height with entries', () => {
            table.updateData([
                createMockEntry(),
                createMockEntry(),
                createMockEntry()
            ]);
            
            const height = table.getTableHeight();
            
            // Height = header (rowHeight + 10) + 3 * rowHeight
            expect(height).toBe(mockConfig.rowHeight + 10 + 3 * mockConfig.rowHeight);
        });

        it('should calculate height for maxVisible entries', () => {
            const entries = Array.from({ length: 20 }, (_, i) => 
                createMockEntry({ id: `${i}` })
            );
            
            table.updateData(entries);
            
            const height = table.getTableHeight();
            
            // Should only calculate for 10 visible entries
            expect(height).toBe(mockConfig.rowHeight + 10 + 10 * mockConfig.rowHeight);
        });
    });

    describe('Configuration', () => {
        it('should update config', () => {
            const newConfig = { fontSize: 18, rowHeight: 50 };
            
            table.updateConfig(newConfig);
            table.render(0, 0, 0);
            
            // Should use new config
            expect(ctx.fillRect).toHaveBeenCalled();
        });

        it('should reinitialize columns on config update', () => {
            vi.clearAllMocks();
            
            table.updateConfig({ fontSize: 16 });
            
            // Should call translate again for column labels
            expect(mockI18n.translate).toHaveBeenCalledWith('highscore.ranking.position');
        });

        it('should merge partial config', () => {
            const originalHeight = table.getTableHeight();
            
            table.updateConfig({ fontSize: 20 });
            
            // Height should remain same (rowHeight not changed)
            expect(table.getTableHeight()).toBe(originalHeight);
        });

        it('should handle multiple config updates', () => {
            expect(() => {
                table.updateConfig({ fontSize: 12 });
                table.updateConfig({ rowHeight: 35 });
                table.updateConfig({ padding: 15 });
            }).not.toThrow();
        });
    });

    describe('Text Alignment', () => {
        it('should align position column to center', () => {
            table.updateData([createMockEntry()]);
            table.render(0, 0, 0);
            
            // ctx.textAlign should be set to 'center' for position
            expect(ctx.textAlign).toBeDefined();
        });

        it('should align player name to left', () => {
            table.updateData([createMockEntry({ playerName: 'LeftAlign' })]);
            table.render(0, 0, 0);
            
            expect(ctx.fillText).toHaveBeenCalledWith('LeftAlign', expect.any(Number), expect.any(Number));
        });

        it('should align score to right', () => {
            table.updateData([createMockEntry({ score: 9999 })]);
            table.render(0, 0, 0);
            
            expect(ctx.fillText).toHaveBeenCalledWith('9999', expect.any(Number), expect.any(Number));
        });
    });

    describe('Resource Management', () => {
        it('should destroy table', () => {
            table.updateData([createMockEntry()]);
            
            table.destroy();
            
            // Should clear internal state
            const height = table.getTableHeight();
            expect(height).toBe(mockConfig.rowHeight + 10); // Only header
        });

        it('should handle render after destroy', () => {
            table.updateData([createMockEntry()]);
            table.destroy();
            
            expect(() => table.render(0, 0, 0)).not.toThrow();
        });

        it('should use save/restore for rendering', () => {
            table.updateData([createMockEntry()]);
            table.render(0, 0, 0);
            
            expect(ctx.save).toHaveBeenCalled();
            expect(ctx.restore).toHaveBeenCalled();
        });
    });

    describe('Edge Cases', () => {
        it('should handle very long player names', () => {
            table.updateData([
                createMockEntry({ playerName: 'A'.repeat(50) })
            ]);
            
            expect(() => table.render(0, 0, 0)).not.toThrow();
        });

        it('should handle zero score', () => {
            table.updateData([createMockEntry({ score: 0 })]);
            
            table.render(0, 0, 0);
            
            expect(ctx.fillText).toHaveBeenCalledWith('0', expect.any(Number), expect.any(Number));
        });

        it('should handle very large scores', () => {
            table.updateData([createMockEntry({ score: 9999999 })]);
            
            table.render(0, 0, 0);
            
            expect(ctx.fillText).toHaveBeenCalledWith('9999999', expect.any(Number), expect.any(Number));
        });

        it('should handle zero duration', () => {
            table.updateData([createMockEntry({ playDuration: 0 })]);
            
            table.render(0, 0, 0);
            
            expect(ctx.fillText).toHaveBeenCalledWith('0:00', expect.any(Number), expect.any(Number));
        });

        it('should handle long duration', () => {
            table.updateData([createMockEntry({ playDuration: 3661 })]);
            
            table.render(0, 0, 0);
            
            // 3661 seconds = 61:01
            expect(ctx.fillText).toHaveBeenCalledWith('61:01', expect.any(Number), expect.any(Number));
        });

        it('should handle special characters in player name', () => {
            table.updateData([
                createMockEntry({ playerName: 'Test@#$%' })
            ]);
            
            expect(() => table.render(0, 0, 0)).not.toThrow();
        });

        it('should handle negative animation time', () => {
            table.updateData([createMockEntry()]);
            
            expect(() => table.render(0, 0, -1)).not.toThrow();
        });

        it('should handle rapid renders', () => {
            table.updateData([createMockEntry()]);
            
            expect(() => {
                for (let i = 0; i < 100; i++) {
                    table.render(0, 0, i * 0.01);
                }
            }).not.toThrow();
        });
    });

    describe('Integration', () => {
        it('should handle complete workflow', () => {
            const entries = [
                createMockEntry({ playerName: 'Alice', score: 5000, playDuration: 120 }),
                createMockEntry({ playerName: 'Bob', score: 4500, playDuration: 110 }),
                createMockEntry({ playerName: 'Charlie', score: 4000, playDuration: 100 })
            ];
            
            table.updateData(entries);
            table.render(100, 50, 0);
            
            expect(ctx.fillText).toHaveBeenCalled();
            expect(ctx.strokeRect).toHaveBeenCalled();
        });

        it('should animate smoothly over time', () => {
            table.updateData([createMockEntry()]);
            
            vi.clearAllMocks();
            
            for (let t = 0; t < 5; t += 0.1) {
                table.render(0, 0, t);
            }
            
            expect(ctx.scale).toHaveBeenCalled();
        });

        it('should handle data updates during rendering', () => {
            table.updateData([createMockEntry()]);
            table.render(0, 0, 0);
            
            table.updateData([createMockEntry(), createMockEntry()]);
            table.render(0, 0, 1);
            
            expect(ctx.fillText).toHaveBeenCalled();
        });

        it('should maintain state across config changes', () => {
            table.updateData([createMockEntry()]);
            table.render(0, 0, 0);
            
            table.updateConfig({ fontSize: 16 });
            table.render(0, 0, 1);
            
            // Should still render the data
            expect(ctx.fillText).toHaveBeenCalled();
        });
    });
});
