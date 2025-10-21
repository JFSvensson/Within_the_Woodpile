import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MenuButtonManager } from '../../../src/ui/MenuButtonManager.js';
import { I18n } from '../../../src/infrastructure/i18n/I18n.js';

// Helper för att skapa mock canvas context
function createMockCanvasContext() {
    return {
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 0,
        font: '',
        textAlign: '',
        shadowColor: '',
        shadowBlur: 0,
        fillRect: vi.fn(),
        strokeRect: vi.fn(),
        clearRect: vi.fn(),
        fillText: vi.fn(),
        strokeText: vi.fn(),
        measureText: vi.fn(() => ({ width: 100 })),
        beginPath: vi.fn(),
        closePath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        stroke: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        translate: vi.fn(),
        scale: vi.fn(),
        rotate: vi.fn(),
        createLinearGradient: vi.fn(() => ({
            addColorStop: vi.fn()
        })),
        quadraticCurveTo: vi.fn()
    } as unknown as CanvasRenderingContext2D;
}

describe('MenuButtonManager Tests', () => {
    let manager: MenuButtonManager;
    let ctx: CanvasRenderingContext2D;
    let canvas: HTMLCanvasElement;
    let i18n: I18n;

    beforeEach(async () => {
        ctx = createMockCanvasContext();
        canvas = {
            width: 800,
            height: 600,
            getContext: vi.fn(() => ctx)
        } as unknown as HTMLCanvasElement;
        
        i18n = new I18n();
        await i18n.loadLanguage('en');
        
        manager = new MenuButtonManager(ctx, canvas, i18n);
    });

    describe('Initialization', () => {
        it('should create instance with canvas context', () => {
            expect(manager).toBeDefined();
        });

        it('should initialize 4 buttons', () => {
            // Verifiera genom att testa render
            manager.render(0);
            
            // 4 buttons * (gradient creation + rendering)
            expect(ctx.createLinearGradient).toHaveBeenCalledTimes(4);
        });

        it('should initialize buttons with correct IDs', () => {
            // Verifiera genom att aktivera varje knapp
            expect(manager.activateButton('play')).toBe(true);
            expect(manager.activateButton('highscore')).toBe(true);
            expect(manager.activateButton('instructions')).toBe(true);
            expect(manager.activateButton('settings')).toBe(true);
        });

        it('should initialize buttons centered horizontally', () => {
            // Knappar ska vara 200px breda och centrerade
            // x-position ska vara canvas.width/2 - 100 = 300
            manager.render(0);
            
            // Translate ska anropas med button center (x + width/2, y + height/2)
            // För x=300, width=200 => centerX = 400
            expect(ctx.translate).toHaveBeenCalledWith(400, expect.any(Number));
        });
    });

    describe('Button Rendering', () => {
        it('should render all buttons', () => {
            manager.render(0);
            
            // 4 buttons, varje med fill + stroke
            expect(ctx.fill).toHaveBeenCalledTimes(4);
            expect(ctx.stroke).toHaveBeenCalledTimes(4);
        });

        it('should render buttons with wood gradient', () => {
            const gradient = {
                addColorStop: vi.fn()
            };
            vi.mocked(ctx.createLinearGradient).mockReturnValue(gradient as any);
            
            manager.render(0);
            
            // Gradient med träfärger
            expect(gradient.addColorStop).toHaveBeenCalledWith(0, '#DEB887');
            expect(gradient.addColorStop).toHaveBeenCalledWith(1, '#D2691E');
        });

        it('should render buttons with bark texture border', () => {
            manager.render(0);
            
            // Bark border (strokeStyle + lineWidth + stroke)
            expect(ctx.strokeStyle).toBe('#8B4513');
            expect(ctx.lineWidth).toBe(3);
        });

        it('should render button text with i18n', () => {
            manager.render(0);
            
            // 4 knappar med text
            expect(ctx.fillText).toHaveBeenCalledTimes(4);
        });

        it('should render button text with shadow', () => {
            manager.render(0);
            
            // Text shadow för djup
            expect(ctx.shadowColor).toBe('#000000');
            expect(ctx.shadowBlur).toBe(2);
        });

        it('should use rounded rectangles for buttons', () => {
            manager.render(0);
            
            // 4 buttons med rounded corners (quadraticCurveTo för varje hörn)
            // 8 hörn per button (4 corners * 2 calls each) = 32 calls
            expect(ctx.quadraticCurveTo).toHaveBeenCalled();
        });

        it('should save and restore canvas state for each button', () => {
            manager.render(0);
            
            // 4 buttons
            expect(ctx.save).toHaveBeenCalledTimes(4);
            expect(ctx.restore).toHaveBeenCalledTimes(4);
        });
    });

    describe('Hover Effects', () => {
        it('should not scale button when not hovered', () => {
            manager.handleMouseMove(-100, -100); // Utanför alla knappar
            manager.render(0);
            
            // Scale 1.0 för alla knappar (no hover)
            expect(ctx.scale).toHaveBeenCalledWith(1, 1);
        });

        it('should scale button when hovered', () => {
            // Hover över play button (x=300-500, y=350-410)
            manager.handleMouseMove(400, 380);
            manager.render(0);
            
            // Minst en knapp ska ha hover scale 1.05
            const scaleCalls = vi.mocked(ctx.scale).mock.calls;
            const hasHoverScale = scaleCalls.some(call => 
                call[0] === 1.05 && call[1] === 1.05
            );
            expect(hasHoverScale).toBe(true);
        });

        it('should apply rotation when hovered', () => {
            manager.handleMouseMove(400, 380); // Hover över play
            manager.render(1000); // Med animation time
            
            // Rotation ska anropas (värdet beror på sin-funktion)
            expect(ctx.rotate).toHaveBeenCalled();
            
            // Verifiera att rotation är liten (max 0.02 radianer)
            const rotateCalls = vi.mocked(ctx.rotate).mock.calls;
            const hasNonZeroRotation = rotateCalls.some(call => 
                Math.abs(call[0]) > 0
            );
            expect(hasNonZeroRotation).toBe(true);
        });

        it('should update hover state for multiple buttons', () => {
            // Hover över första knappen
            manager.handleMouseMove(400, 380);
            manager.render(0);
            
            // Flytta till andra knappen
            manager.handleMouseMove(400, 450);
            manager.render(0);
            
            // Båda positionerna ska ha triggat hover
            expect(ctx.scale).toHaveBeenCalled();
        });

        it('should remove hover when mouse leaves button', () => {
            // Hover över knapp
            manager.handleMouseMove(400, 380);
            
            // Flytta musen bort
            manager.handleMouseMove(-100, -100);
            manager.render(0);
            
            // Alla knappar ska ha scale 1.0
            const scaleCalls = vi.mocked(ctx.scale).mock.calls;
            const allNormalScale = scaleCalls.every(call => 
                call[0] === 1 && call[1] === 1
            );
            expect(allNormalScale).toBe(true);
        });
    });

    describe('Click Handling', () => {
        it('should detect click on play button', () => {
            const callback = vi.fn();
            manager.setOnPlayClick(callback);
            
            // Klicka på play button (x=300-500, y=350-410)
            // startY = 600/2 + 50 = 350
            const clicked = manager.handleClick(400, 380);
            
            expect(clicked).toBe(true);
            expect(callback).toHaveBeenCalledTimes(1);
        });

        it('should detect click on highscore button', () => {
            const callback = vi.fn();
            manager.setOnHighscoreClick(callback);
            
            // Klicka på highscore button (y = 350 + 70 = 420)
            const clicked = manager.handleClick(400, 450);
            
            expect(clicked).toBe(true);
            expect(callback).toHaveBeenCalledTimes(1);
        });

        it('should detect click on instructions button', () => {
            const callback = vi.fn();
            manager.setOnInstructionsClick(callback);
            
            // Klicka på instructions button (y = 350 + 140 = 490)
            const clicked = manager.handleClick(400, 520);
            
            expect(clicked).toBe(true);
            expect(callback).toHaveBeenCalledTimes(1);
        });

        it('should detect click on settings button', () => {
            const callback = vi.fn();
            manager.setOnSettingsClick(callback);
            
            // Klicka på settings button (y = 350 + 210 = 560)
            const clicked = manager.handleClick(400, 590);
            
            expect(clicked).toBe(true);
            expect(callback).toHaveBeenCalledTimes(1);
        });

        it('should return false when clicking outside buttons', () => {
            const clicked = manager.handleClick(-100, -100);
            
            expect(clicked).toBe(false);
        });

        it('should only trigger first matching button', () => {
            const playCallback = vi.fn();
            const highscoreCallback = vi.fn();
            
            manager.setOnPlayClick(playCallback);
            manager.setOnHighscoreClick(highscoreCallback);
            
            // Klicka på play button
            manager.handleClick(400, 380);
            
            expect(playCallback).toHaveBeenCalledTimes(1);
            expect(highscoreCallback).not.toHaveBeenCalled();
        });

        it('should handle edge clicks correctly', () => {
            const callback = vi.fn();
            manager.setOnPlayClick(callback);
            
            // Klicka på kanten (x=300 är left edge, y=350 är top edge)
            const clicked1 = manager.handleClick(300, 350);
            expect(clicked1).toBe(true);
            
            // Klicka precis utanför (x=299)
            const clicked2 = manager.handleClick(299, 350);
            expect(clicked2).toBe(false);
        });
    });

    describe('Keyboard Navigation', () => {
        it('should set button hover state', () => {
            manager.setButtonHover('play', true);
            manager.render(0);
            
            // Play button ska ha hover scale
            const scaleCalls = vi.mocked(ctx.scale).mock.calls;
            const hasHoverScale = scaleCalls.some(call => 
                call[0] === 1.05 && call[1] === 1.05
            );
            expect(hasHoverScale).toBe(true);
        });

        it('should remove button hover state', () => {
            manager.setButtonHover('play', true);
            manager.setButtonHover('play', false);
            manager.render(0);
            
            // Alla knappar ska ha normal scale
            const scaleCalls = vi.mocked(ctx.scale).mock.calls;
            const allNormalScale = scaleCalls.every(call => 
                call[0] === 1 && call[1] === 1
            );
            expect(allNormalScale).toBe(true);
        });

        it('should activate button by ID', () => {
            const callback = vi.fn();
            manager.setOnPlayClick(callback);
            
            const activated = manager.activateButton('play');
            
            expect(activated).toBe(true);
            expect(callback).toHaveBeenCalledTimes(1);
        });

        it('should return false for invalid button ID', () => {
            const activated = manager.activateButton('invalid');
            
            expect(activated).toBe(false);
        });

        it('should handle hover on multiple buttons via keyboard', () => {
            manager.setButtonHover('play', true);
            manager.setButtonHover('highscore', true);
            manager.render(0);
            
            // Minst två knappar ska ha hover scale
            const scaleCalls = vi.mocked(ctx.scale).mock.calls;
            const hoverCount = scaleCalls.filter(call => 
                call[0] === 1.05 && call[1] === 1.05
            ).length;
            expect(hoverCount).toBeGreaterThanOrEqual(2);
        });
    });

    describe('Callback Management', () => {
        it('should update play click callback', () => {
            const callback1 = vi.fn();
            const callback2 = vi.fn();
            
            manager.setOnPlayClick(callback1);
            manager.handleClick(400, 380);
            
            manager.setOnPlayClick(callback2);
            manager.handleClick(400, 380);
            
            expect(callback1).toHaveBeenCalledTimes(1);
            expect(callback2).toHaveBeenCalledTimes(1);
        });

        it('should update instructions click callback', () => {
            const callback = vi.fn();
            manager.setOnInstructionsClick(callback);
            
            manager.activateButton('instructions');
            
            expect(callback).toHaveBeenCalledTimes(1);
        });

        it('should update settings click callback', () => {
            const callback = vi.fn();
            manager.setOnSettingsClick(callback);
            
            manager.activateButton('settings');
            
            expect(callback).toHaveBeenCalledTimes(1);
        });

        it('should update highscore click callback', () => {
            const callback = vi.fn();
            manager.setOnHighscoreClick(callback);
            
            manager.activateButton('highscore');
            
            expect(callback).toHaveBeenCalledTimes(1);
        });
    });

    describe('Animation Integration', () => {
        it('should update animation time on render', () => {
            manager.render(100);
            manager.render(200);
            manager.render(300);
            
            // Animation time används för hover rotation
            expect(ctx.rotate).toHaveBeenCalled();
        });

        it('should animate hover rotation over time', () => {
            manager.handleMouseMove(400, 380); // Hover
            
            vi.mocked(ctx.rotate).mockClear();
            
            manager.render(0);
            const rotation1 = vi.mocked(ctx.rotate).mock.calls[0]?.[0] || 0;
            
            vi.mocked(ctx.rotate).mockClear();
            
            manager.render(Math.PI / 8); // Quarter cycle
            const rotation2 = vi.mocked(ctx.rotate).mock.calls[0]?.[0] || 0;
            
            // Rotationen ska ändras över tiden
            expect(Math.abs(rotation1 - rotation2)).toBeGreaterThan(0);
        });
    });

    describe('Responsive Behavior', () => {
        it('should update button positions when canvas resizes', () => {
            // Ändra canvas storlek
            canvas.width = 1200;
            
            manager.updateButtonPositions();
            manager.render(0);
            
            // Nya centrerade positioner (1200/2 = 600, x = 600 - 100 + 100 = 600)
            expect(ctx.translate).toHaveBeenCalledWith(600, expect.any(Number));
        });

        it('should maintain button functionality after resize', () => {
            canvas.width = 1200;
            manager.updateButtonPositions();
            
            const callback = vi.fn();
            manager.setOnPlayClick(callback);
            
            // Klicka på ny position (x: 500-700, y: 350-410)
            const clicked = manager.handleClick(600, 380);
            
            expect(clicked).toBe(true);
            expect(callback).toHaveBeenCalled();
        });
    });

    describe('Resource Management', () => {
        it('should clear buttons on destroy', () => {
            manager.destroy();
            
            manager.render(0);
            
            // Inga buttons ska renderas
            expect(ctx.createLinearGradient).not.toHaveBeenCalled();
        });

        it('should handle clicks after destroy', () => {
            manager.destroy();
            
            const clicked = manager.handleClick(400, 180);
            
            expect(clicked).toBe(false);
        });

        it('should handle hover after destroy', () => {
            manager.destroy();
            
            expect(() => {
                manager.handleMouseMove(400, 180);
            }).not.toThrow();
        });
    });

    describe('Edge Cases', () => {
        it('should handle render with no animation time', () => {
            expect(() => {
                manager.render(0);
            }).not.toThrow();
        });

        it('should handle clicks at exact button boundaries', () => {
            const callback = vi.fn();
            manager.setOnPlayClick(callback);
            
            // Play button: x=300-500, y=350-410
            // Test alla hörn
            expect(manager.handleClick(300, 350)).toBe(true); // Top-left
            expect(manager.handleClick(500, 350)).toBe(true); // Top-right
            expect(manager.handleClick(300, 410)).toBe(true); // Bottom-left
            expect(manager.handleClick(500, 410)).toBe(true); // Bottom-right
            
            expect(callback).toHaveBeenCalledTimes(4);
        });

        it('should handle hover on button gaps', () => {
            // Mellan play (410) och highscore (420)
            manager.handleMouseMove(400, 415);
            manager.render(0);
            
            // Ingen knapp ska ha hover
            const scaleCalls = vi.mocked(ctx.scale).mock.calls;
            const allNormalScale = scaleCalls.every(call => 
                call[0] === 1 && call[1] === 1
            );
            expect(allNormalScale).toBe(true);
        });

        it('should handle rapid hover changes', () => {
            manager.handleMouseMove(400, 380); // Play
            manager.handleMouseMove(400, 450); // Highscore
            manager.handleMouseMove(400, 520); // Instructions
            manager.handleMouseMove(400, 590); // Settings
            
            expect(() => {
                manager.render(0);
            }).not.toThrow();
        });

        it('should handle negative coordinates', () => {
            const clicked = manager.handleClick(-100, -100);
            expect(clicked).toBe(false);
            
            manager.handleMouseMove(-100, -100);
            expect(() => {
                manager.render(0);
            }).not.toThrow();
        });

        it('should handle coordinates beyond canvas', () => {
            const clicked = manager.handleClick(10000, 10000);
            expect(clicked).toBe(false);
        });
    });
});
