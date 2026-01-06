import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MenuParticleSystem } from '../../../src/particles/MenuParticleSystem.js';

// Helper för att skapa mock canvas
function createMockCanvas() {
    const ctx = {
        fillStyle: '',
        font: '',
        textAlign: '',
        clearRect: vi.fn(),
        fillText: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        translate: vi.fn(),
        rotate: vi.fn()
    } as unknown as CanvasRenderingContext2D;

    return {
        width: 800,
        height: 600,
        getContext: vi.fn(() => ctx)
    } as unknown as HTMLCanvasElement;
}

describe('MenuParticleSystem Tests', () => {
    let system: MenuParticleSystem;
    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;

    beforeEach(() => {
        canvas = createMockCanvas();
        ctx = canvas.getContext('2d')!;
        system = new MenuParticleSystem(canvas);
    });

    describe('Initialization', () => {
        it('should create system with canvas', () => {
            expect(system).toBeDefined();
        });

        it('should initialize with 25 particles', () => {
            expect(system.getParticleCount()).toBe(25);
        });

        it('should create particles with random positions', () => {
            // Verifiera att initialize körs i constructor
            expect(system.getParticleCount()).toBeGreaterThan(0);
        });

        it('should reinitialize particles when called', () => {
            system.initialize();
            expect(system.getParticleCount()).toBe(25);
        });
    });

    describe('Particle Updates', () => {
        it('should update particle positions', () => {
            const initialCount = system.getParticleCount();
            
            // Kör några update cycles
            system.update();
            system.update();
            system.update();
            
            // Partiklar ska fortfarande finnas
            expect(system.getParticleCount()).toBe(initialCount);
        });

        it('should handle multiple updates without errors', () => {
            expect(() => {
                for (let i = 0; i < 100; i++) {
                    system.update();
                }
            }).not.toThrow();
        });

        it('should maintain particle count during updates', () => {
            const initialCount = system.getParticleCount();
            
            for (let i = 0; i < 50; i++) {
                system.update();
            }
            
            expect(system.getParticleCount()).toBe(initialCount);
        });
    });

    describe('Particle Rendering', () => {
        it('should render all particles', () => {
            system.render();
            
            // 25 partiklar * (save + translate + rotate + fillText + restore)
            expect(ctx.save).toHaveBeenCalledTimes(25);
            expect(ctx.restore).toHaveBeenCalledTimes(25);
        });

        it('should render particles with emoji', () => {
            system.render();
            
            // Varje partikel ritas med fillText
            expect(ctx.fillText).toHaveBeenCalledTimes(25);
            
            // Verifiera att emoji används (🍂 eller 🍃)
            const calls = vi.mocked(ctx.fillText).mock.calls;
            const hasLeafEmoji = calls.some(call => 
                call[0] === '🍂' || call[0] === '🍃'
            );
            expect(hasLeafEmoji).toBe(true);
        });

        it('should apply rotation to particles', () => {
            system.render();
            
            // Varje partikel roteras
            expect(ctx.rotate).toHaveBeenCalledTimes(25);
        });

        it('should translate to particle position', () => {
            system.render();
            
            // Varje partikel flyttas till sin position
            expect(ctx.translate).toHaveBeenCalledTimes(25);
        });

        it('should set font size for particles', () => {
            system.render();
            
            // Font ska sättas för varje partikel
            expect(ctx.font).toBeTruthy();
        });
    });

    describe('Particle Count Management', () => {
        it('should reduce particle count', () => {
            system.setParticleCount(10);
            
            expect(system.getParticleCount()).toBe(10);
        });

        it('should increase particle count', () => {
            system.setParticleCount(30);
            
            expect(system.getParticleCount()).toBe(30);
        });

        it('should handle zero particles', () => {
            system.setParticleCount(0);
            
            expect(system.getParticleCount()).toBe(0);
            
            // Render ska inte krascha med 0 partiklar
            expect(() => system.render()).not.toThrow();
        });

        it('should handle large particle counts', () => {
            system.setParticleCount(100);
            
            expect(system.getParticleCount()).toBe(100);
        });

        it('should maintain particle count if set to same value', () => {
            system.setParticleCount(25);
            
            expect(system.getParticleCount()).toBe(25);
        });
    });

    describe('Pause Functionality', () => {
        it('should handle pause without errors', () => {
            expect(() => {
                system.setPaused(true);
            }).not.toThrow();
        });

        it('should handle unpause without errors', () => {
            expect(() => {
                system.setPaused(false);
            }).not.toThrow();
        });

        it('should toggle pause state', () => {
            system.setPaused(true);
            system.setPaused(false);
            system.setPaused(true);
            
            // Ingen error ska kastas
            expect(system.getParticleCount()).toBe(25);
        });
    });

    describe('Resource Management', () => {
        it('should destroy particles', () => {
            system.destroy();
            
            expect(system.getParticleCount()).toBe(0);
        });

        it('should handle render after destroy', () => {
            system.destroy();
            
            expect(() => system.render()).not.toThrow();
        });

        it('should handle update after destroy', () => {
            system.destroy();
            
            expect(() => system.update()).not.toThrow();
        });

        it('should reinitialize after destroy', () => {
            system.destroy();
            expect(system.getParticleCount()).toBe(0);
            
            system.initialize();
            expect(system.getParticleCount()).toBe(25);
        });
    });

    describe('Animation Loop Integration', () => {
        it('should handle continuous update and render cycles', () => {
            for (let i = 0; i < 60; i++) { // Simulera 60 frames
                system.update();
                system.render();
            }
            
            expect(system.getParticleCount()).toBe(25);
        });

        it('should maintain stability during long animation', () => {
            const initialCount = system.getParticleCount();
            
            for (let i = 0; i < 1000; i++) {
                system.update();
            }
            
            expect(system.getParticleCount()).toBe(initialCount);
        });
    });

    describe('Canvas Dimension Handling', () => {
        it('should work with different canvas sizes', () => {
            canvas.width = 1200;
            canvas.height = 900;
            
            system.initialize();
            
            expect(() => {
                system.update();
                system.render();
            }).not.toThrow();
        });

        it('should work with small canvas', () => {
            canvas.width = 400;
            canvas.height = 300;
            
            system.initialize();
            
            expect(system.getParticleCount()).toBe(25);
        });
    });

    describe('Edge Cases', () => {
        it('should handle rapid particle count changes', () => {
            system.setParticleCount(50);
            system.setParticleCount(5);
            system.setParticleCount(30);
            system.setParticleCount(15);
            
            expect(system.getParticleCount()).toBe(15);
        });

        it('should handle update without initialization', () => {
            const freshSystem = new MenuParticleSystem(canvas);
            
            expect(() => {
                freshSystem.update();
                freshSystem.render();
            }).not.toThrow();
        });

        it('should handle multiple destroy calls', () => {
            system.destroy();
            system.destroy();
            system.destroy();
            
            expect(system.getParticleCount()).toBe(0);
        });

        it('should handle setParticleCount with negative value', () => {
            // Även om det inte är explicit hanterat, ska det inte krascha
            system.setParticleCount(-5);
            
            // Ska ge 0 partiklar eller behålla nuvarande
            expect(system.getParticleCount()).toBeGreaterThanOrEqual(0);
        });
    });
});
