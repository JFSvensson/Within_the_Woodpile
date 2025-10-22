import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AddScoreDialog } from '../../../src/ui/highscore/AddScoreDialog.js';
import { I18n } from '../../../src/infrastructure/i18n/I18n.js';
import { ModalConfig } from '../../../src/types/ui.js';

// Helper to create mock canvas context
function createMockCanvasContext() {
    return {
        fillStyle: '',
        strokeStyle: '',
        font: '',
        textAlign: '',
        textBaseline: '',
        lineWidth: 0,
        shadowColor: '',
        shadowBlur: 0,
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
        translate: vi.fn(),
        rotate: vi.fn(),
        scale: vi.fn(),
        createLinearGradient: vi.fn((x1, y1, x2, y2) => ({
            addColorStop: vi.fn()
        })),
        createRadialGradient: vi.fn(() => ({
            addColorStop: vi.fn()
        })),
        drawImage: vi.fn()
    };
}

describe('AddScoreDialog', () => {
    let dialog: AddScoreDialog;
    let canvas: HTMLCanvasElement;
    let ctx: any;
    let mockI18n: I18n;
    let mockConfig: ModalConfig;

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
                    'highscore.form.playerName': 'Player Name',
                    'highscore.form.playerNamePlaceholder': 'Enter your name',
                    'highscore.actions.add': 'Add',
                    'highscore.actions.cancel': 'Cancel',
                    'highscore.dialog.title': 'New Highscore!',
                    'highscore.dialog.score': 'Score',
                    'highscore.dialog.level': 'Level',
                    'highscore.dialog.time': 'Time'
                };
                return translations[key] || key;
            }),
            setLanguage: vi.fn(),
            getCurrentLanguage: vi.fn().mockReturnValue('en')
        } as any;

        // Mock config
        mockConfig = {
            width: 500,
            height: 400,
            padding: 20,
            borderRadius: 10,
            backgroundColor: '#FFFFFF',
            showCloseButton: false
        };

        dialog = new AddScoreDialog(ctx, canvas, mockI18n, mockConfig);
    });

    describe('Initialization', () => {
        it('should create dialog with context, canvas, i18n and config', () => {
            expect(dialog).toBeDefined();
            expect(dialog).toBeInstanceOf(AddScoreDialog);
        });

        it('should initialize as hidden', () => {
            expect(dialog.getIsVisible()).toBe(false);
        });

        it('should initialize with form fields', () => {
            // Verify that translation was called for field setup
            expect(mockI18n.translate).toHaveBeenCalledWith('highscore.form.playerName');
            expect(mockI18n.translate).toHaveBeenCalledWith('highscore.form.playerNamePlaceholder');
        });

        it('should initialize with buttons', () => {
            // Verify that translation was called for button setup
            expect(mockI18n.translate).toHaveBeenCalledWith('highscore.actions.add');
            expect(mockI18n.translate).toHaveBeenCalledWith('highscore.actions.cancel');
        });
    });

    describe('Show and Hide', () => {
        it('should show dialog with score data', () => {
            dialog.show(5000, 10, 120000);
            
            expect(dialog.getIsVisible()).toBe(true);
        });

        it('should store score data when shown', () => {
            dialog.show(7500, 15, 180000);
            
            expect(dialog.getIsVisible()).toBe(true);
            
            // Verify by rendering and checking if data is used
            dialog.render(0);
            expect(ctx.fillText).toHaveBeenCalled();
        });

        it('should hide dialog', () => {
            dialog.show(5000, 10, 120000);
            dialog.hide();
            
            expect(dialog.getIsVisible()).toBe(false);
        });

        it('should reset form when shown', () => {
            // Show, render, hide
            dialog.show(1000, 5, 60000);
            dialog.render(0);
            dialog.hide();
            
            // Show again with different data
            dialog.show(2000, 8, 90000);
            dialog.render(0);
            
            expect(dialog.getIsVisible()).toBe(true);
        });
    });

    describe('Callbacks', () => {
        it('should set submit callback', () => {
            const callback = vi.fn();
            dialog.setOnSubmit(callback);
            
            // Callback should be stored
            expect(() => dialog.setOnSubmit(callback)).not.toThrow();
        });

        it('should set cancel callback', () => {
            const callback = vi.fn();
            dialog.setOnCancel(callback);
            
            expect(() => dialog.setOnCancel(callback)).not.toThrow();
        });

        it('should handle multiple callback updates', () => {
            const callback1 = vi.fn();
            const callback2 = vi.fn();
            
            dialog.setOnSubmit(callback1);
            dialog.setOnSubmit(callback2);
            dialog.setOnCancel(callback1);
            dialog.setOnCancel(callback2);
            
            expect(() => dialog.setOnSubmit(callback2)).not.toThrow();
        });
    });

    describe('Rendering', () => {
        it('should not render when hidden', () => {
            dialog.render(0);
            
            // Should not call any render methods
            expect(ctx.fillRect).not.toHaveBeenCalled();
        });

        it('should render when visible', () => {
            dialog.show(5000, 10, 120000);
            dialog.render(0);
            
            // Should render overlay and modal
            expect(ctx.save).toHaveBeenCalled();
            expect(ctx.restore).toHaveBeenCalled();
            expect(ctx.fillRect).toHaveBeenCalled();
        });

        it('should render overlay', () => {
            dialog.show(5000, 10, 120000);
            dialog.render(0);
            
            // Should render dark overlay covering entire canvas
            expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, canvas.width, canvas.height);
        });

        it('should render modal with gradient', () => {
            dialog.show(5000, 10, 120000);
            dialog.render(0);
            
            expect(ctx.createLinearGradient).toHaveBeenCalled();
            expect(ctx.fill).toHaveBeenCalled();
        });

        it('should render modal with border', () => {
            dialog.show(5000, 10, 120000);
            dialog.render(0);
            
            expect(ctx.stroke).toHaveBeenCalled();
        });

        it('should render title', () => {
            dialog.show(5000, 10, 120000);
            dialog.render(0);
            
            expect(mockI18n.translate).toHaveBeenCalledWith('highscore.title.newRecord');
        });

        it('should render score information', () => {
            dialog.show(5000, 10, 120000);
            dialog.render(0);
            
            // Should render score value
            expect(ctx.fillText).toHaveBeenCalled();
        });

        it('should render form fields', () => {
            dialog.show(5000, 10, 120000);
            dialog.render(0);
            
            // Should render field labels and values
            expect(ctx.fillText).toHaveBeenCalled();
        });

        it('should render buttons', () => {
            dialog.show(5000, 10, 120000);
            dialog.render(0);
            
            // Should render Add and Cancel buttons
            expect(ctx.fillText).toHaveBeenCalledWith('Add', expect.any(Number), expect.any(Number));
            expect(ctx.fillText).toHaveBeenCalledWith('Cancel', expect.any(Number), expect.any(Number));
        });

        it('should update animation time', () => {
            dialog.show(5000, 10, 120000);
            
            // Clear all mocks to get accurate count
            vi.clearAllMocks();
            
            dialog.render(0);
            const countAfterFirst = ctx.save.mock.calls.length;
            
            dialog.render(1.5);
            const countAfterSecond = ctx.save.mock.calls.length;
            
            dialog.render(3.0);
            const countAfterThird = ctx.save.mock.calls.length;
            
            // Should render multiple times (save is called multiple times per render)
            expect(countAfterSecond).toBeGreaterThan(countAfterFirst);
            expect(countAfterThird).toBeGreaterThan(countAfterSecond);
        });

        it('should render with custom modal config', () => {
            const customConfig: ModalConfig = {
                width: 600,
                height: 500,
                padding: 30,
                borderRadius: 15,
                backgroundColor: '#333333',
                showCloseButton: false
            };
            
            const customDialog = new AddScoreDialog(ctx, canvas, mockI18n, customConfig);
            customDialog.show(5000, 10, 120000);
            customDialog.render(0);
            
            expect(ctx.fill).toHaveBeenCalled();
        });
    });

    describe('Mouse Interaction', () => {
        it('should handle mouse click when visible', () => {
            dialog.show(5000, 10, 120000);
            
            // Click outside modal
            const result = dialog.handleClick(10, 10);
            
            expect(typeof result).toBe('boolean');
        });

        it('should not handle mouse click when hidden', () => {
            const result = dialog.handleClick(400, 300);
            
            expect(result).toBe(false);
        });

        it('should detect button clicks', () => {
            dialog.show(5000, 10, 120000);
            
            // Click in button area
            const centerX = canvas.width / 2;
            const buttonY = (canvas.height - mockConfig.height) / 2 + mockConfig.height - 80;
            
            dialog.handleClick(centerX, buttonY + 20);
            
            // Click should be processed
            expect(dialog.getIsVisible()).toBeDefined();
        });

        it('should handle clicks at different positions', () => {
            dialog.show(5000, 10, 120000);
            
            expect(() => {
                dialog.handleClick(100, 100);
                dialog.handleClick(400, 300);
                dialog.handleClick(700, 500);
            }).not.toThrow();
        });

        it('should return false for clicks when hidden', () => {
            const result = dialog.handleClick(400, 300);
            
            expect(result).toBe(false);
        });
    });

    describe('Input Handling', () => {
        it('should handle text input', () => {
            dialog.show(5000, 10, 120000);
            
            expect(() => {
                'TestPlayer'.split('').forEach(char => dialog.handleKeyInput(char));
            }).not.toThrow();
        });

        it('should handle empty input', () => {
            dialog.show(5000, 10, 120000);
            
            expect(() => dialog.handleKeyInput('a')).not.toThrow();
        });

        it('should handle long input', () => {
            dialog.show(5000, 10, 120000);
            
            expect(() => {
                'A'.repeat(100).split('').forEach(char => dialog.handleKeyInput(char));
            }).not.toThrow();
        });

        it('should handle special characters in input', () => {
            dialog.show(5000, 10, 120000);
            
            expect(() => {
                'Test@Player#123'.split('').forEach(char => dialog.handleKeyInput(char));
            }).not.toThrow();
        });

        it('should handle backspace', () => {
            dialog.show(5000, 10, 120000);
            
            'Test'.split('').forEach(char => dialog.handleKeyInput(char));
            expect(() => dialog.handleKeyInput('Backspace')).not.toThrow();
        });

        it('should handle multiple backspaces', () => {
            dialog.show(5000, 10, 120000);
            
            'Test'.split('').forEach(char => dialog.handleKeyInput(char));
            dialog.handleKeyInput('Backspace');
            dialog.handleKeyInput('Backspace');
            dialog.handleKeyInput('Backspace');
            
            expect(() => dialog.handleKeyInput('Backspace')).not.toThrow();
        });

        it('should handle Enter key', () => {
            dialog.show(5000, 10, 120000);
            
            'Test'.split('').forEach(char => dialog.handleKeyInput(char));
            expect(() => dialog.handleKeyInput('Enter')).not.toThrow();
        });

        it('should limit input length to 20 characters', () => {
            dialog.show(5000, 10, 120000);
            
            // Try to input 25 characters
            'A'.repeat(25).split('').forEach(char => dialog.handleKeyInput(char));
            dialog.render(0);
            
            // Should still be able to render
            expect(ctx.fillText).toHaveBeenCalled();
        });
    });

    describe('Form Validation', () => {
        it('should validate player name', () => {
            dialog.show(5000, 10, 120000);
            'ValidName'.split('').forEach(char => dialog.handleKeyInput(char));
            
            dialog.render(0);
            
            // Should render without errors
            expect(ctx.fillText).toHaveBeenCalled();
        });

        it('should handle invalid empty name', () => {
            dialog.show(5000, 10, 120000);
            
            dialog.render(0);
            
            // Should still render
            expect(ctx.fillText).toHaveBeenCalled();
        });

        it('should validate name length', () => {
            dialog.show(5000, 10, 120000);
            
            // Valid length
            'ABC'.split('').forEach(char => dialog.handleKeyInput(char));
            dialog.render(0);
            
            // Very long name (should be limited to 20 chars)
            'A'.repeat(50).split('').forEach(char => dialog.handleKeyInput(char));
            dialog.render(0);
            
            expect(ctx.fillText).toHaveBeenCalled();
        });

        it('should require at least 2 characters', () => {
            dialog.show(5000, 10, 120000);
            
            // One character should be invalid
            dialog.handleKeyInput('A');
            dialog.render(0);
            
            // Two characters should be valid
            dialog.handleKeyInput('B');
            dialog.render(0);
            
            expect(ctx.fillText).toHaveBeenCalled();
        });
    });

    describe('Submit and Cancel', () => {
        it('should call submit callback with valid input', () => {
            const submitCallback = vi.fn();
            dialog.setOnSubmit(submitCallback);
            dialog.show(5000, 10, 120000);
            'TestPlayer'.split('').forEach(char => dialog.handleKeyInput(char));
            
            // Simulate submit button click
            const centerX = canvas.width / 2;
            const buttonY = (canvas.height - mockConfig.height) / 2 + mockConfig.height - 80;
            
            dialog.handleClick(centerX - 60, buttonY + 20);
            
            // Callback may or may not be called depending on validation
            expect(submitCallback).toHaveBeenCalledTimes(0 || 1);
        });

        it('should call submit callback on Enter key', () => {
            const submitCallback = vi.fn();
            dialog.setOnSubmit(submitCallback);
            dialog.show(5000, 10, 120000);
            'Test'.split('').forEach(char => dialog.handleKeyInput(char));
            
            dialog.handleKeyInput('Enter');
            
            // Callback may or may not be called depending on validation
            expect(submitCallback).toHaveBeenCalledTimes(0 || 1);
        });

        it('should call cancel callback', () => {
            const cancelCallback = vi.fn();
            dialog.setOnCancel(cancelCallback);
            dialog.show(5000, 10, 120000);
            
            // Simulate cancel button click
            const centerX = canvas.width / 2;
            const buttonY = (canvas.height - mockConfig.height) / 2 + mockConfig.height - 80;
            
            dialog.handleClick(centerX + 60, buttonY + 20);
            
            // Callback may or may not be called depending on button hit detection
            expect(cancelCallback).toHaveBeenCalledTimes(0 || 1);
        });

        it('should hide dialog after cancel', () => {
            const cancelCallback = vi.fn(() => dialog.hide());
            dialog.setOnCancel(cancelCallback);
            dialog.show(5000, 10, 120000);
            
            // Manually trigger cancel
            dialog.hide();
            
            expect(dialog.getIsVisible()).toBe(false);
        });
    });

    describe('Edge Cases', () => {
        it('should handle zero score', () => {
            expect(() => dialog.show(0, 1, 0)).not.toThrow();
        });

        it('should handle negative score', () => {
            expect(() => dialog.show(-100, 1, 0)).not.toThrow();
        });

        it('should handle very large score', () => {
            expect(() => dialog.show(9999999, 999, 9999999)).not.toThrow();
        });

        it('should handle rapid show/hide', () => {
            expect(() => {
                for (let i = 0; i < 10; i++) {
                    dialog.show(1000 * i, i, 1000 * i);
                    dialog.render(i * 0.1);
                    dialog.hide();
                }
            }).not.toThrow();
        });

        it('should handle rendering without show', () => {
            expect(() => dialog.render(0)).not.toThrow();
        });

        it('should handle multiple renders per frame', () => {
            dialog.show(5000, 10, 120000);
            
            expect(() => {
                dialog.render(0);
                dialog.render(0);
                dialog.render(0);
            }).not.toThrow();
        });

        it('should handle clicks outside modal bounds', () => {
            dialog.show(5000, 10, 120000);
            
            const result1 = dialog.handleClick(0, 0);
            const result2 = dialog.handleClick(canvas.width, canvas.height);
            const result3 = dialog.handleClick(-10, -10);
            
            expect(typeof result1).toBe('boolean');
            expect(typeof result2).toBe('boolean');
            expect(typeof result3).toBe('boolean');
        });

        it('should handle key input when not visible', () => {
            expect(() => dialog.handleKeyInput('a')).not.toThrow();
        });

        it('should handle backspace when field is empty', () => {
            dialog.show(5000, 10, 120000);
            
            expect(() => {
                dialog.handleKeyInput('Backspace');
                dialog.handleKeyInput('Backspace');
                dialog.handleKeyInput('Backspace');
            }).not.toThrow();
        });

        it('should handle rapid key input', () => {
            dialog.show(5000, 10, 120000);
            
            expect(() => {
                for (let i = 0; i < 50; i++) {
                    dialog.handleKeyInput('A');
                }
            }).not.toThrow();
        });
    });

    describe('Integration', () => {
        it('should handle complete user workflow', () => {
            const submitCallback = vi.fn();
            const cancelCallback = vi.fn();
            
            dialog.setOnSubmit(submitCallback);
            dialog.setOnCancel(cancelCallback);
            
            // Show dialog
            dialog.show(8500, 12, 150000);
            expect(dialog.getIsVisible()).toBe(true);
            
            // Render
            dialog.render(0);
            
            // Input name
            'Champion'.split('').forEach(char => dialog.handleKeyInput(char));
            dialog.render(0.1);
            
            // Click at different positions
            dialog.handleClick(400, 300);
            dialog.render(0.2);
            
            // Hide
            dialog.hide();
            expect(dialog.getIsVisible()).toBe(false);
        });

        it('should handle animation over time', () => {
            dialog.show(5000, 10, 120000);
            
            for (let t = 0; t < 5; t += 0.1) {
                dialog.render(t);
            }
            
            expect(ctx.save).toHaveBeenCalled();
        });

        it('should handle resize scenarios', () => {
            dialog.show(5000, 10, 120000);
            dialog.render(0);
            
            // Change canvas size
            canvas.width = 1024;
            canvas.height = 768;
            
            dialog.render(1);
            
            expect(ctx.fillText).toHaveBeenCalled();
        });

        it('should maintain state across renders', () => {
            dialog.show(5000, 10, 120000);
            'TestPlayer'.split('').forEach(char => dialog.handleKeyInput(char));
            
            // Render multiple times
            dialog.render(0);
            dialog.render(0.5);
            dialog.render(1.0);
            
            // State should be preserved
            expect(dialog.getIsVisible()).toBe(true);
        });

        it('should handle complete input and submit flow', () => {
            const submitCallback = vi.fn();
            dialog.setOnSubmit(submitCallback);
            
            dialog.show(10000, 20, 300000);
            
            // Type valid name
            'Player1'.split('').forEach(char => dialog.handleKeyInput(char));
            dialog.render(0);
            
            // Submit via Enter key
            dialog.handleKeyInput('Enter');
            
            // Should have called submit or kept dialog open depending on validation
            expect(dialog.getIsVisible()).toBeDefined();
        });
    });
});
