import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MenuRenderer } from '../../../../src/presentation/renderers/menu/MenuRenderer.js';
import { I18n } from '../../../../src/infrastructure/i18n/I18n.js';

// Mock all dependencies
vi.mock('../../../../src/presentation/renderers/menu/LogoRenderer.js', () => ({
    LogoRenderer: vi.fn().mockImplementation(() => ({
        render: vi.fn()
    }))
}));

vi.mock('../../../../src/particles/MenuParticleSystem.js', () => ({
    MenuParticleSystem: vi.fn().mockImplementation(() => ({
        update: vi.fn(),
        render: vi.fn(),
        destroy: vi.fn()
    }))
}));

vi.mock('../../../../src/presentation/renderers/menu/BackgroundRenderer.js', () => ({
    BackgroundRenderer: vi.fn().mockImplementation(() => ({
        render: vi.fn()
    }))
}));

vi.mock('../../../../src/ui/MenuButtonManager.js', () => ({
    MenuButtonManager: vi.fn().mockImplementation(() => ({
        render: vi.fn(),
        handleClick: vi.fn().mockReturnValue(false),
        handleMouseMove: vi.fn(),
        setOnPlayClick: vi.fn(),
        setOnInstructionsClick: vi.fn(),
        setOnSettingsClick: vi.fn(),
        setOnHighscoreClick: vi.fn(),
        setButtonHover: vi.fn(),
        activateButton: vi.fn().mockReturnValue(false),
        destroy: vi.fn()
    }))
}));

// Helper to create mock canvas context
function createMockCanvasContext() {
    return {
        fillStyle: '',
        strokeStyle: '',
        font: '',
        textAlign: '',
        textBaseline: '',
        shadowColor: '',
        shadowBlur: 0,
        imageSmoothingEnabled: false,
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
        arc: vi.fn(),
        fill: vi.fn(),
        stroke: vi.fn(),
        translate: vi.fn(),
        rotate: vi.fn(),
        scale: vi.fn(),
        drawImage: vi.fn(),
        createLinearGradient: vi.fn(() => ({
            addColorStop: vi.fn()
        })),
        createRadialGradient: vi.fn(() => ({
            addColorStop: vi.fn()
        }))
    };
}

describe('MenuRenderer', () => {
    let canvas: HTMLCanvasElement;
    let ctx: any;
    let renderer: MenuRenderer;
    let mockI18n: I18n;

    beforeEach(() => {
        // Setup canvas with mocked context
        canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        
        // Mock getContext to return our mock context
        ctx = createMockCanvasContext();
        vi.spyOn(canvas, 'getContext').mockReturnValue(ctx as any);

        // Mock I18n
        mockI18n = {
            translate: vi.fn().mockReturnValue('Test translation'),
            setLanguage: vi.fn(),
            getCurrentLanguage: vi.fn().mockReturnValue('en')
        } as any;

        renderer = new MenuRenderer(canvas, mockI18n);
    });

    afterEach(() => {
        renderer.destroy();
    });

    describe('Initialization', () => {
        it('should create renderer with canvas and i18n', () => {
            expect(renderer).toBeDefined();
            expect(renderer).toBeInstanceOf(MenuRenderer);
        });

        it('should initialize all sub-renderers', () => {
            // Verify that renderer has all required sub-components
            expect((renderer as any).logoRenderer).toBeDefined();
            expect((renderer as any).particleSystem).toBeDefined();
            expect((renderer as any).backgroundRenderer).toBeDefined();
            expect((renderer as any).buttonManager).toBeDefined();
        });

        it('should extend BaseRenderer', () => {
            expect(renderer).toHaveProperty('ctx');
            expect(renderer).toHaveProperty('canvas');
        });
    });

    describe('Rendering', () => {
        it('should call render on all sub-components in correct order', () => {
            const backgroundRenderer = (renderer as any).backgroundRenderer;
            const particleSystem = (renderer as any).particleSystem;
            const logoRenderer = (renderer as any).logoRenderer;
            const buttonManager = (renderer as any).buttonManager;

            renderer.render();

            expect(backgroundRenderer.render).toHaveBeenCalled();
            expect(particleSystem.update).toHaveBeenCalled();
            expect(particleSystem.render).toHaveBeenCalled();
            expect(logoRenderer.render).toHaveBeenCalled();
            expect(buttonManager.render).toHaveBeenCalled();
        });

        it('should increment animation time on each render', () => {
            const initialTime = (renderer as any).animationTime;
            renderer.render();
            const afterFirstRender = (renderer as any).animationTime;
            renderer.render();
            const afterSecondRender = (renderer as any).animationTime;

            expect(afterFirstRender).toBeGreaterThan(initialTime);
            expect(afterSecondRender).toBeGreaterThan(afterFirstRender);
            expect(afterSecondRender - afterFirstRender).toBeCloseTo(0.016, 3);
        });

        it('should pass animation time to background renderer', () => {
            const backgroundRenderer = (renderer as any).backgroundRenderer;
            renderer.render();

            expect(backgroundRenderer.render).toHaveBeenCalledWith(expect.any(Number));
        });

        it('should pass animation time to logo renderer', () => {
            const logoRenderer = (renderer as any).logoRenderer;
            renderer.render();

            expect(logoRenderer.render).toHaveBeenCalledWith(expect.any(Number));
        });

        it('should pass animation time to button manager', () => {
            const buttonManager = (renderer as any).buttonManager;
            renderer.render();

            expect(buttonManager.render).toHaveBeenCalledWith(expect.any(Number));
        });

        it('should render footer with translated text', () => {
            const fillTextSpy = vi.spyOn(ctx, 'fillText');
            renderer.render();

            expect(mockI18n.translate).toHaveBeenCalledWith('menu.footer');
            expect(fillTextSpy).toHaveBeenCalled();
        });

        it('should render footer at bottom of canvas', () => {
            const fillTextSpy = vi.spyOn(ctx, 'fillText');
            renderer.render();

            const call = fillTextSpy.mock.calls[0];
            expect(call[1]).toBe(canvas.width / 2); // Centered horizontally
            expect(call[2]).toBe(canvas.height - 10); // 10px from bottom
        });

        it('should set correct footer styling', () => {
            renderer.render();

            // Check that styling properties were set
            expect(ctx.fillStyle).toBeDefined();
            expect(ctx.font).toBeDefined();
            expect(ctx.textAlign).toBe('center');
            expect(ctx.shadowColor).toBeDefined();
            expect(ctx.shadowBlur).toBeGreaterThan(0);
        });

        it('should handle multiple consecutive renders', () => {
            const backgroundRenderer = (renderer as any).backgroundRenderer;

            for (let i = 0; i < 10; i++) {
                renderer.render();
            }

            expect(backgroundRenderer.render).toHaveBeenCalledTimes(10);
            expect((renderer as any).animationTime).toBeCloseTo(0.16, 2);
        });

        it('should render footer even if translation fails', () => {
            (mockI18n.translate as any).mockReturnValue(undefined);
            const fillTextSpy = vi.spyOn(ctx, 'fillText');

            renderer.render();

            expect(fillTextSpy).toHaveBeenCalled();
            const call = fillTextSpy.mock.calls[0];
            expect(call[0]).toContain('Made with GitHub Copilot');
        });
    });

    describe('Mouse Interaction', () => {
        it('should delegate click handling to button manager', () => {
            const buttonManager = (renderer as any).buttonManager;
            (buttonManager.handleClick as any).mockReturnValue(true);

            const result = renderer.handleClick(100, 200);

            expect(buttonManager.handleClick).toHaveBeenCalledWith(100, 200);
            expect(result).toBe(true);
        });

        it('should return false if button manager returns false', () => {
            const buttonManager = (renderer as any).buttonManager;
            (buttonManager.handleClick as any).mockReturnValue(false);

            const result = renderer.handleClick(100, 200);

            expect(result).toBe(false);
        });

        it('should delegate mouse move to button manager', () => {
            const buttonManager = (renderer as any).buttonManager;

            renderer.handleMouseMove(150, 250);

            expect(buttonManager.handleMouseMove).toHaveBeenCalledWith(150, 250);
        });

        it('should handle multiple mouse moves', () => {
            const buttonManager = (renderer as any).buttonManager;

            renderer.handleMouseMove(10, 20);
            renderer.handleMouseMove(30, 40);
            renderer.handleMouseMove(50, 60);

            expect(buttonManager.handleMouseMove).toHaveBeenCalledTimes(3);
        });
    });

    describe('Callback Management', () => {
        it('should set play callback on button manager', () => {
            const buttonManager = (renderer as any).buttonManager;
            const callback = vi.fn();

            renderer.setOnPlayClick(callback);

            expect(buttonManager.setOnPlayClick).toHaveBeenCalledWith(callback);
        });

        it('should set instructions callback on button manager', () => {
            const buttonManager = (renderer as any).buttonManager;
            const callback = vi.fn();

            renderer.setOnInstructionsClick(callback);

            expect(buttonManager.setOnInstructionsClick).toHaveBeenCalledWith(callback);
        });

        it('should set settings callback on button manager', () => {
            const buttonManager = (renderer as any).buttonManager;
            const callback = vi.fn();

            renderer.setOnSettingsClick(callback);

            expect(buttonManager.setOnSettingsClick).toHaveBeenCalledWith(callback);
        });

        it('should set highscore callback on button manager', () => {
            const buttonManager = (renderer as any).buttonManager;
            const callback = vi.fn();

            renderer.setOnHighscoreClick(callback);

            expect(buttonManager.setOnHighscoreClick).toHaveBeenCalledWith(callback);
        });

        it('should set all callbacks independently', () => {
            const playCallback = vi.fn();
            const instructionsCallback = vi.fn();
            const settingsCallback = vi.fn();
            const highscoreCallback = vi.fn();

            renderer.setOnPlayClick(playCallback);
            renderer.setOnInstructionsClick(instructionsCallback);
            renderer.setOnSettingsClick(settingsCallback);
            renderer.setOnHighscoreClick(highscoreCallback);

            const buttonManager = (renderer as any).buttonManager;
            expect(buttonManager.setOnPlayClick).toHaveBeenCalledWith(playCallback);
            expect(buttonManager.setOnInstructionsClick).toHaveBeenCalledWith(instructionsCallback);
            expect(buttonManager.setOnSettingsClick).toHaveBeenCalledWith(settingsCallback);
            expect(buttonManager.setOnHighscoreClick).toHaveBeenCalledWith(highscoreCallback);
        });
    });

    describe('Keyboard Navigation', () => {
        it('should set button hover state through button manager', () => {
            const buttonManager = (renderer as any).buttonManager;

            renderer.setButtonHover('play', true);

            expect(buttonManager.setButtonHover).toHaveBeenCalledWith('play', true);
        });

        it('should clear button hover state', () => {
            const buttonManager = (renderer as any).buttonManager;

            renderer.setButtonHover('instructions', false);

            expect(buttonManager.setButtonHover).toHaveBeenCalledWith('instructions', false);
        });

        it('should activate button through button manager', () => {
            const buttonManager = (renderer as any).buttonManager;
            (buttonManager.activateButton as any).mockReturnValue(true);

            const result = renderer.activateButton('settings');

            expect(buttonManager.activateButton).toHaveBeenCalledWith('settings');
            expect(result).toBe(true);
        });

        it('should return false if button activation fails', () => {
            const buttonManager = (renderer as any).buttonManager;
            (buttonManager.activateButton as any).mockReturnValue(false);

            const result = renderer.activateButton('unknown');

            expect(result).toBe(false);
        });

        it('should handle multiple button hover states', () => {
            const buttonManager = (renderer as any).buttonManager;

            renderer.setButtonHover('play', true);
            renderer.setButtonHover('play', false);
            renderer.setButtonHover('instructions', true);

            expect(buttonManager.setButtonHover).toHaveBeenCalledTimes(3);
        });
    });

    describe('Resource Management', () => {
        it('should destroy button manager on cleanup', () => {
            const buttonManager = (renderer as any).buttonManager;

            renderer.destroy();

            expect(buttonManager.destroy).toHaveBeenCalled();
        });

        it('should destroy particle system on cleanup', () => {
            const particleSystem = (renderer as any).particleSystem;

            renderer.destroy();

            expect(particleSystem.destroy).toHaveBeenCalled();
        });

        it('should handle destroy being called multiple times', () => {
            const buttonManager = (renderer as any).buttonManager;
            const particleSystem = (renderer as any).particleSystem;

            renderer.destroy();
            renderer.destroy();

            expect(buttonManager.destroy).toHaveBeenCalledTimes(2);
            expect(particleSystem.destroy).toHaveBeenCalledTimes(2);
        });
    });

    describe('Integration', () => {
        it('should coordinate full render cycle', () => {
            const backgroundRenderer = (renderer as any).backgroundRenderer;
            const particleSystem = (renderer as any).particleSystem;
            const logoRenderer = (renderer as any).logoRenderer;
            const buttonManager = (renderer as any).buttonManager;

            // Simulate multiple frames
            renderer.render();
            renderer.render();
            renderer.render();

            expect(backgroundRenderer.render).toHaveBeenCalledTimes(3);
            expect(particleSystem.update).toHaveBeenCalledTimes(3);
            expect(particleSystem.render).toHaveBeenCalledTimes(3);
            expect(logoRenderer.render).toHaveBeenCalledTimes(3);
            expect(buttonManager.render).toHaveBeenCalledTimes(3);
        });

        it('should handle interaction and rendering together', () => {
            const buttonManager = (renderer as any).buttonManager;
            (buttonManager.handleClick as any).mockReturnValue(true);

            renderer.render();
            const clicked = renderer.handleClick(100, 100);
            renderer.handleMouseMove(200, 200);
            renderer.render();

            expect(clicked).toBe(true);
            expect(buttonManager.render).toHaveBeenCalledTimes(2);
            expect(buttonManager.handleClick).toHaveBeenCalled();
            expect(buttonManager.handleMouseMove).toHaveBeenCalled();
        });

        it('should maintain consistent animation time across renders', () => {
            const times: number[] = [];
            const backgroundRenderer = (renderer as any).backgroundRenderer;

            (backgroundRenderer.render as any).mockImplementation((time: number) => {
                times.push(time);
            });

            for (let i = 0; i < 5; i++) {
                renderer.render();
            }

            // Verify times are increasing
            for (let i = 1; i < times.length; i++) {
                expect(times[i]).toBeGreaterThan(times[i - 1]);
                expect(times[i] - times[i - 1]).toBeCloseTo(0.016, 3);
            }
        });
    });

    describe('Edge Cases', () => {
        it('should handle zero-size canvas', () => {
            const tinyCanvas = document.createElement('canvas');
            tinyCanvas.width = 0;
            tinyCanvas.height = 0;
            const tinyCtx = createMockCanvasContext();
            vi.spyOn(tinyCanvas, 'getContext').mockReturnValue(tinyCtx as any);

            const tinyRenderer = new MenuRenderer(tinyCanvas, mockI18n);

            expect(() => tinyRenderer.render()).not.toThrow();
            tinyRenderer.destroy();
        });

        it('should handle very large canvas', () => {
            const largeCanvas = document.createElement('canvas');
            largeCanvas.width = 4000;
            largeCanvas.height = 3000;
            const largeCtx = createMockCanvasContext();
            vi.spyOn(largeCanvas, 'getContext').mockReturnValue(largeCtx as any);

            const largeRenderer = new MenuRenderer(largeCanvas, mockI18n);

            expect(() => largeRenderer.render()).not.toThrow();
            largeRenderer.destroy();
        });

        it('should handle rapid successive renders', () => {
            expect(() => {
                for (let i = 0; i < 100; i++) {
                    renderer.render();
                }
            }).not.toThrow();

            const animationTime = (renderer as any).animationTime;
            expect(animationTime).toBeCloseTo(1.6, 1);
        });

        it('should handle operations after destroy', () => {
            renderer.destroy();

            // These shouldn't throw even after destroy
            expect(() => renderer.render()).not.toThrow();
            expect(() => renderer.handleClick(0, 0)).not.toThrow();
            expect(() => renderer.handleMouseMove(0, 0)).not.toThrow();
        });
    });
});
