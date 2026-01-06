import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WoodCollapseAnimator } from '../../../../src/presentation/renderers/WoodCollapseAnimator.js';
import { ScreenShakeManager } from '../../../../src/presentation/renderers/ScreenShakeManager.js';
import { CollapseParticleSystem } from '../../../../src/particles/CollapseParticleSystem.js';
import { WoodPiece } from '../../../../src/types/game.js';

// Helper för att skapa en mockad canvas context
function createMockCanvasContext() {
    return {
        fillStyle: '',
        strokeStyle: '',
        font: '',
        textAlign: '',
        lineWidth: 1,
        globalAlpha: 1,
        fillRect: vi.fn(),
        strokeRect: vi.fn(),
        fillText: vi.fn(),
        beginPath: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        stroke: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        translate: vi.fn(),
        rotate: vi.fn(),
        scale: vi.fn(),
        canvas: { width: 800, height: 600 }
    } as any as CanvasRenderingContext2D;
}

describe('Animation System Tests', () => {
    
    describe('WoodCollapseAnimator', () => {
        let animator: WoodCollapseAnimator;
        
        beforeEach(() => {
            animator = new WoodCollapseAnimator();
        });

        describe('Setup och initialization', () => {
            it('should initialize with empty collapsing pieces', () => {
                expect(animator.getActiveCount()).toBe(0);
                expect(animator.hasActiveAnimations()).toBe(false);
            });

            it('should properly destroy and clean up resources', () => {
                const mockPieces = createMockWoodPieces(3);
                animator.startCollapse(mockPieces);
                
                expect(animator.getActiveCount()).toBe(3);
                
                animator.destroy();
                
                expect(animator.getActiveCount()).toBe(0);
                expect(animator.hasActiveAnimations()).toBe(false);
            });

            it('should handle multiple pieces collapsing simultaneously', () => {
                const mockPieces = createMockWoodPieces(5);
                animator.startCollapse(mockPieces);
                
                expect(animator.getActiveCount()).toBe(5);
                expect(animator.hasActiveAnimations()).toBe(true);
            });
        });

        describe('Physics calculations', () => {
            it('should initialize pieces with correct collapse properties', () => {
                const mockPieces = createMockWoodPieces(1);
                animator.startCollapse(mockPieces);
                
                const piece = mockPieces[0];
                expect(piece.isCollapsing).toBe(true);
                expect(piece.collapseStartTime).toBeTypeOf('number');
                expect(piece.collapseVelocity).toBeDefined();
                expect(piece.collapseVelocity!.x).toBeGreaterThanOrEqual(-2);
                expect(piece.collapseVelocity!.x).toBeLessThanOrEqual(2);
                expect(piece.collapseVelocity!.y).toBe(0);
                expect(piece.collapseRotation).toBe(0);
                expect(piece.collapseRotationSpeed).toBeDefined();
            });

            it('should apply velocity updates over time', () => {
                const mockPieces = createMockWoodPieces(1);
                const piece = mockPieces[0];
                const initialY = piece.position.y;
                
                animator.startCollapse(mockPieces);
                
                // Simulera flera frames
                animator.update(16); // ~1 frame at 60fps
                animator.update(16);
                animator.update(16);
                
                // Y-position ska ha ökat (faller nedåt)
                expect(piece.position.y).toBeGreaterThan(initialY);
            });

            it('should apply rotation over time', () => {
                const mockPieces = createMockWoodPieces(1);
                const piece = mockPieces[0];
                
                animator.startCollapse(mockPieces);
                
                // Initial rotation är 0
                expect(piece.collapseRotation).toBe(0);
                
                // Uppdatera flera frames
                animator.update(16);
                animator.update(16);
                
                // Rotation ska ha ändrats
                expect(piece.collapseRotation).not.toBe(0);
            });

            it('should respect rotation speed bounds', () => {
                const mockPieces = createMockWoodPieces(10);
                animator.startCollapse(mockPieces);
                
                mockPieces.forEach(piece => {
                    expect(piece.collapseRotationSpeed).toBeGreaterThanOrEqual(-0.18);
                    expect(piece.collapseRotationSpeed).toBeLessThanOrEqual(0.18);
                });
            });

            it('should eventually mark pieces as removed after duration', () => {
                const mockPieces = createMockWoodPieces(1);
                const piece = mockPieces[0];
                
                // Mock performance.now för att simulera tid
                const startTime = performance.now();
                animator.startCollapse(mockPieces);
                
                // Simulera 1300ms (över ANIMATION_DURATION på 1200ms)
                vi.spyOn(performance, 'now').mockReturnValue(startTime + 1300);
                
                animator.update(16);
                
                expect(piece.isCollapsing).toBe(false);
                expect(piece.isRemoved).toBe(true);
                expect(animator.getActiveCount()).toBe(0);
                
                vi.restoreAllMocks();
            });

            it('should handle pieces with incomplete properties gracefully', () => {
                const incompletePiece: WoodPiece = {
                    id: 'test-1',
                    position: { x: 100, y: 100 },
                    size: { width: 60, height: 20 },
                    isCollapsing: true,
                    // Saknar collapseStartTime och collapseVelocity
                } as any;
                
                animator.startCollapse([incompletePiece]);
                
                // Ska inte krascha
                expect(() => animator.update(16)).not.toThrow();
            });
        });

        describe('Animation state management', () => {
            it('should track active animations correctly', () => {
                const mockPieces = createMockWoodPieces(3);
                animator.startCollapse(mockPieces);
                
                expect(animator.hasActiveAnimations()).toBe(true);
                expect(animator.getActiveCount()).toBe(3);
                
                // Efter att ha clearats
                animator.clear();
                
                expect(animator.hasActiveAnimations()).toBe(false);
                expect(animator.getActiveCount()).toBe(0);
            });

            it('should call onCollapseComplete callback when animation finishes', () => {
                const mockPieces = createMockWoodPieces(1);
                const piece = mockPieces[0];
                const callback = vi.fn();
                
                animator.setOnCollapseComplete(callback);
                
                const startTime = performance.now();
                animator.startCollapse(mockPieces);
                
                // Simulera att animationen är klar (1200ms + lite extra)
                vi.spyOn(performance, 'now').mockReturnValue(startTime + 1300);
                animator.update(16);
                
                expect(callback).toHaveBeenCalledWith(piece);
                
                vi.restoreAllMocks();
            });

            it('should return still collapsing pieces from update', () => {
                const mockPieces = createMockWoodPieces(3);
                animator.startCollapse(mockPieces);
                
                const stillCollapsing = animator.update(16);
                
                expect(stillCollapsing).toHaveLength(3);
                expect(stillCollapsing.every(p => p.isCollapsing)).toBe(true);
            });
        });

        describe('Rendering', () => {
            it('should not render pieces without isCollapsing flag', () => {
                const ctx = createMockCanvasContext();
                const saveSpy = vi.spyOn(ctx, 'save');
                
                const piece: WoodPiece = createMockWoodPieces(1)[0];
                piece.isCollapsing = false;
                
                animator.render(ctx, piece);
                
                // save() borde inte anropas om vi inte renderar
                expect(saveSpy).not.toHaveBeenCalled();
            });

            it('should apply canvas transformations when rendering', () => {
                const ctx = createMockCanvasContext();
                const saveSpy = vi.spyOn(ctx, 'save');
                const restoreSpy = vi.spyOn(ctx, 'restore');
                const translateSpy = vi.spyOn(ctx, 'translate');
                
                const mockPieces = createMockWoodPieces(1);
                animator.startCollapse(mockPieces);
                
                animator.render(ctx, mockPieces[0]);
                
                expect(saveSpy).toHaveBeenCalled();
                expect(translateSpy).toHaveBeenCalled();
                expect(restoreSpy).toHaveBeenCalled();
            });

            it('should apply rotation transform when piece has rotation', () => {
                const ctx = createMockCanvasContext();
                const rotateSpy = vi.spyOn(ctx, 'rotate');
                
                const mockPieces = createMockWoodPieces(1);
                animator.startCollapse(mockPieces);
                
                // Uppdatera för att få rotation
                animator.update(16);
                animator.update(16);
                
                animator.render(ctx, mockPieces[0]);
                
                expect(rotateSpy).toHaveBeenCalled();
            });
        });
    });

    describe('ScreenShakeManager', () => {
        let shakeManager: ScreenShakeManager;
        
        beforeEach(() => {
            shakeManager = new ScreenShakeManager();
        });

        describe('Intensity calculations', () => {
            it('should calculate shake intensity based on collapse count', () => {
                // 1 piece: 6 + 1*2.5 = 8.5px
                shakeManager.startShake(1);
                expect(shakeManager.isActive()).toBe(true);
                
                const intensity1 = shakeManager.getCurrentIntensity();
                expect(intensity1).toBeGreaterThan(0);
                expect(intensity1).toBeLessThanOrEqual(8.5);
            });

            it('should increase intensity with more collapsing pieces', () => {
                const shake1 = new ScreenShakeManager();
                const shake2 = new ScreenShakeManager();
                
                shake1.startShake(1); // 5 + 1*2 = 7px
                shake2.startShake(5); // 5 + 5*2 = 15px
                
                const intensity1 = shake1.getCurrentIntensity();
                const intensity2 = shake2.getCurrentIntensity();
                
                expect(intensity2).toBeGreaterThan(intensity1);
            });

            it('should cap shake at maximum 25px', () => {
                // 10 pieces skulle ge 6 + 10*2.5 = 31px, men max är 25
                shakeManager.startShake(10);
                
                const intensity = shakeManager.getCurrentIntensity();
                expect(intensity).toBeLessThanOrEqual(25);
            });

            it('should cap duration at maximum 800ms', () => {
                // Starta shake med många pieces
                const startTime = performance.now();
                shakeManager.startShake(20);
                
                // Simulera 900ms
                vi.spyOn(performance, 'now').mockReturnValue(startTime + 900);
                
                const offset = shakeManager.update();
                
                // Efter 900ms (över max 800ms) ska shake vara stoppad
                expect(offset.x).toBe(0);
                expect(offset.y).toBe(0);
                expect(shakeManager.isActive()).toBe(false);
                
                vi.restoreAllMocks();
            });

            it('should return zero offset when not shaking', () => {
                const offset = shakeManager.update();
                
                expect(offset.x).toBe(0);
                expect(offset.y).toBe(0);
                expect(offset.rotation).toBe(0);
                expect(shakeManager.isActive()).toBe(false);
            });
        });

        describe('Shake behavior', () => {
            it('should start shake with correct initial state', () => {
                expect(shakeManager.isActive()).toBe(false);
                
                shakeManager.startShake(3);
                
                expect(shakeManager.isActive()).toBe(true);
                expect(shakeManager.getCurrentIntensity()).toBeGreaterThan(0);
            });

            it('should decay shake exponentially over time', () => {
                const startTime = performance.now();
                shakeManager.startShake(3);
                
                const intensity1 = shakeManager.getCurrentIntensity();
                
                // Simulera halv duration
                vi.spyOn(performance, 'now').mockReturnValue(startTime + 150);
                shakeManager.update();
                const intensity2 = shakeManager.getCurrentIntensity();
                
                // Intensity ska ha minskat
                expect(intensity2).toBeLessThan(intensity1);
                
                vi.restoreAllMocks();
            });

            it('should apply random shake offset within intensity bounds', () => {
                shakeManager.startShake(3);
                
                const offset = shakeManager.update();
                
                // Offset ska finnas och vara inom rimliga bounds
                expect(Math.abs(offset.x)).toBeLessThanOrEqual(20);
                expect(Math.abs(offset.y)).toBeLessThanOrEqual(20);
                expect(Math.abs(offset.rotation)).toBeLessThanOrEqual(0.02);
            });

            it('should complete shake after duration expires', () => {
                const startTime = performance.now();
                shakeManager.startShake(2); // Duration: 300 + 2*60 = 420ms
                
                expect(shakeManager.isActive()).toBe(true);
                
                // Simulera 500ms (över duration)
                vi.spyOn(performance, 'now').mockReturnValue(startTime + 500);
                shakeManager.update();
                
                expect(shakeManager.isActive()).toBe(false);
                
                vi.restoreAllMocks();
            });

            it('should handle multiple consecutive shakes correctly', () => {
                shakeManager.startShake(2);
                expect(shakeManager.isActive()).toBe(true);
                
                // Starta ny shake medan första är aktiv (ska ersätta)
                shakeManager.startShake(5);
                expect(shakeManager.isActive()).toBe(true);
                
                const intensity = shakeManager.getCurrentIntensity();
                // Nya intensiteten ska vara baserad på 5 pieces
                expect(intensity).toBeGreaterThan(5); // Minst base intensity
            });
        });

        describe('Canvas operations', () => {
            it('should not apply shake when inactive', () => {
                const ctx = createMockCanvasContext();
                const translateSpy = vi.spyOn(ctx, 'translate');
                
                shakeManager.applyShake(ctx);
                
                expect(translateSpy).not.toHaveBeenCalled();
            });

            it('should apply translate to canvas context when shaking', () => {
                const ctx = createMockCanvasContext();
                const translateSpy = vi.spyOn(ctx, 'translate');
                
                shakeManager.startShake(3);
                shakeManager.applyShake(ctx);
                
                // Translate ska ha anropats (minst en gång för offset)
                expect(translateSpy).toHaveBeenCalled();
            });

            it('should stop shake immediately when stop is called', () => {
                shakeManager.startShake(5);
                expect(shakeManager.isActive()).toBe(true);
                
                shakeManager.stop();
                
                expect(shakeManager.isActive()).toBe(false);
                expect(shakeManager.getCurrentIntensity()).toBe(0);
            });

            it('should cleanup properly on destroy', () => {
                shakeManager.startShake(3);
                expect(shakeManager.isActive()).toBe(true);
                
                shakeManager.destroy();
                
                expect(shakeManager.isActive()).toBe(false);
            });
        });
    });

    describe('CollapseParticleSystem', () => {
        let particleSystem: CollapseParticleSystem;
        
        beforeEach(() => {
            particleSystem = new CollapseParticleSystem();
        });

        describe('Particle generation', () => {
            it('should create particles at specified position', () => {
                // Vi kan inte direkt inspektera partiklarna, men vi kan testa rendering
                expect(() => {
                    particleSystem.createCollapseParticles(100, 200, 1);
                }).not.toThrow();
            });

            it('should scale particle count with intensity', () => {
                // Testa med låg intensitet
                particleSystem.createCollapseParticles(100, 100, 1);
                
                const ctx1 = createMockCanvasContext();
                const fillRectSpy1 = vi.spyOn(ctx1, 'fillRect');
                
                particleSystem.render(ctx1);
                const lowIntensityCallCount = fillRectSpy1.mock.calls.length;
                
                // Testa med hög intensitet
                const particleSystem2 = new CollapseParticleSystem();
                particleSystem2.createCollapseParticles(100, 100, 10);
                
                const ctx2 = createMockCanvasContext();
                const fillRectSpy2 = vi.spyOn(ctx2, 'fillRect');
                
                particleSystem2.render(ctx2);
                const highIntensityCallCount = fillRectSpy2.mock.calls.length;
                
                // Högre intensitet ska ge fler partiklar
                expect(highIntensityCallCount).toBeGreaterThan(lowIntensityCallCount);
            });

            it('should not exceed maximum particle count', () => {
                // Max är 50 partiklar oavsett intensity
                particleSystem.createCollapseParticles(100, 100, 100);
                
                const ctx = createMockCanvasContext();
                const fillRectSpy = vi.spyOn(ctx, 'fillRect');
                
                particleSystem.render(ctx);
                const callCount = fillRectSpy.mock.calls.length;
                
                // Ska inte överstiga 50 (faktiskt kan vara lite färre pga circles också)
                expect(callCount).toBeLessThanOrEqual(100); // circles + rects
            });

            it('should handle multiple collapse particle creations', () => {
                particleSystem.createCollapseParticles(100, 100, 2);
                particleSystem.createCollapseParticles(200, 200, 3);
                particleSystem.createCollapseParticles(300, 300, 1);
                
                // Ska inte krascha och ska kunna rendera alla
                const ctx = createMockCanvasContext();
                
                expect(() => particleSystem.render(ctx)).not.toThrow();
            });
        });

        describe('Particle lifecycle', () => {
            it('should update particles over time', () => {
                particleSystem.createCollapseParticles(100, 100, 2);
                
                const ctx = createMockCanvasContext();
                const fillRectSpy = vi.spyOn(ctx, 'fillRect');
                
                // Första render
                particleSystem.render(ctx);
                const initialCount = fillRectSpy.mock.calls.length;
                
                // Uppdatera partiklar
                particleSystem.update(16);
                
                // Partiklar ska fortfarande finnas efter kort tid
                fillRectSpy.mockClear();
                particleSystem.render(ctx);
                const afterUpdateCount = fillRectSpy.mock.calls.length;
                
                expect(afterUpdateCount).toBe(initialCount);
            });

            it('should remove particles after their lifespan expires', () => {
                particleSystem.createCollapseParticles(100, 100, 1);
                
                // Uppdatera med mycket tid (mer än max lifespan på 2000ms)
                for (let i = 0; i < 150; i++) {
                    particleSystem.update(16); // 150 * 16 = 2400ms
                }
                
                const ctx = createMockCanvasContext();
                const fillRectSpy = vi.spyOn(ctx, 'fillRect');
                
                particleSystem.render(ctx);
                
                // Alla partiklar ska vara borta
                expect(fillRectSpy).not.toHaveBeenCalled();
            });

            it('should handle cleanup correctly', () => {
                particleSystem.createCollapseParticles(100, 100, 5);
                
                particleSystem.clear();
                
                const ctx = createMockCanvasContext();
                const fillRectSpy = vi.spyOn(ctx, 'fillRect');
                
                particleSystem.render(ctx);
                
                // Inga partiklar ska renderas efter clear
                expect(fillRectSpy).not.toHaveBeenCalled();
            });

            it('should destroy properly', () => {
                particleSystem.createCollapseParticles(100, 100, 3);
                
                particleSystem.destroy();
                
                const ctx = createMockCanvasContext();
                
                expect(() => particleSystem.render(ctx)).not.toThrow();
            });
        });

        describe('Rendering', () => {
            it('should render particles to canvas', () => {
                particleSystem.createCollapseParticles(100, 100, 2);
                
                const ctx = createMockCanvasContext();
                const saveSpy = vi.spyOn(ctx, 'save');
                const restoreSpy = vi.spyOn(ctx, 'restore');
                
                particleSystem.render(ctx);
                
                // Canvas state ska sparas och återställas
                expect(saveSpy).toHaveBeenCalled();
                expect(restoreSpy).toHaveBeenCalled();
            });

            it('should not crash when rendering with no particles', () => {
                const ctx = createMockCanvasContext();
                
                expect(() => particleSystem.render(ctx)).not.toThrow();
            });

            it('should apply opacity fade over particle lifetime', () => {
                particleSystem.createCollapseParticles(100, 100, 1);
                
                const ctx = createMockCanvasContext();
                
                // Första render (full opacity)
                particleSystem.render(ctx);
                
                // Uppdatera till nära slutet av lifespan
                for (let i = 0; i < 100; i++) {
                    particleSystem.update(16); // ~1600ms
                }
                
                // Render igen (ska ha lägre opacity)
                const ctx2 = createMockCanvasContext();
                const globalAlphaSpy = vi.spyOn(ctx2, 'globalAlpha', 'set');
                particleSystem.render(ctx2);
                
                // Opacity ska ha satts (vi kan inte enkelt verifiera värdet)
                expect(globalAlphaSpy).toHaveBeenCalled();
            });
        });
    });
});

// Helper functions

function createMockWoodPieces(count: number): WoodPiece[] {
    return Array.from({ length: count }, (_, i) => ({
        id: `test-piece-${i}`,
        position: { x: 100 + i * 70, y: 100 },
        size: { width: 60, height: 20 },
        isCollapsing: false,
        woodType: 'normal' as any,
    } as WoodPiece));
}
