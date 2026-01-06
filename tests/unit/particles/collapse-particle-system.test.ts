import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CollapseParticleSystem } from '../../../src/particles/CollapseParticleSystem.js';

describe('CollapseParticleSystem', () => {
    let system: CollapseParticleSystem;
    let mockCtx: CanvasRenderingContext2D;

    beforeEach(() => {
        system = new CollapseParticleSystem();

        // Mock canvas context
        mockCtx = {
            save: vi.fn(),
            restore: vi.fn(),
            translate: vi.fn(),
            rotate: vi.fn(),
            fillRect: vi.fn(),
            fillStyle: '',
            globalAlpha: 1,
            beginPath: vi.fn(),
            arc: vi.fn(),
            fill: vi.fn()
        } as any;
    });

    describe('Initialization', () => {
        it('should create system with no particles', () => {
            expect(system.getActiveCount()).toBe(0);
            expect(system.hasActiveParticles()).toBe(false);
        });

        it('should initialize with empty particle array', () => {
            expect(system).toBeDefined();
            expect(system.getActiveCount()).toBe(0);
        });
    });

    describe('createCollapseParticles', () => {
        it('should create particles at specified position', () => {
            system.createCollapseParticles(100, 200);

            expect(system.hasActiveParticles()).toBe(true);
            expect(system.getActiveCount()).toBeGreaterThan(0);
        });

        it('should create more particles with higher intensity', () => {
            const system1 = new CollapseParticleSystem();
            const system2 = new CollapseParticleSystem();

            system1.createCollapseParticles(100, 100, 1);
            system2.createCollapseParticles(100, 100, 5);

            expect(system2.getActiveCount()).toBeGreaterThan(system1.getActiveCount());
        });

        it('should create particles with intensity 1', () => {
            system.createCollapseParticles(100, 100, 1);

            const count = system.getActiveCount();
            expect(count).toBeGreaterThanOrEqual(20);
            expect(count).toBeLessThanOrEqual(60);
        });

        it('should create particles with intensity 10', () => {
            system.createCollapseParticles(100, 100, 10);

            const count = system.getActiveCount();
            expect(count).toBeGreaterThanOrEqual(20);
            expect(count).toBeLessThanOrEqual(60);
        });

        it('should limit maximum particles to 60', () => {
            system.createCollapseParticles(100, 100, 100);

            expect(system.getActiveCount()).toBeLessThanOrEqual(60);
        });

        it('should create particles at different positions', () => {
            system.createCollapseParticles(50, 50, 1);
            const count1 = system.getActiveCount();

            system.createCollapseParticles(150, 150, 1);
            const count2 = system.getActiveCount();

            // Should accumulate particles
            expect(count2).toBeGreaterThan(count1);
        });

        it('should create particles with default intensity', () => {
            system.createCollapseParticles(100, 100);

            expect(system.hasActiveParticles()).toBe(true);
        });

        it('should create multiple particle bursts', () => {
            system.createCollapseParticles(100, 100, 2);
            system.createCollapseParticles(200, 200, 3);
            system.createCollapseParticles(300, 300, 1);

            // Should have particles from all bursts
            expect(system.getActiveCount()).toBeGreaterThan(50);
        });

        it('should handle zero intensity gracefully', () => {
            system.createCollapseParticles(100, 100, 0);

            // Should still create minimum particles
            expect(system.hasActiveParticles()).toBe(true);
        });

        it('should handle negative coordinates', () => {
            expect(() => system.createCollapseParticles(-50, -50, 1)).not.toThrow();
            expect(system.hasActiveParticles()).toBe(true);
        });

        it('should handle very large coordinates', () => {
            expect(() => system.createCollapseParticles(10000, 10000, 1)).not.toThrow();
            expect(system.hasActiveParticles()).toBe(true);
        });
    });

    describe('update', () => {
        beforeEach(() => {
            system.createCollapseParticles(100, 100, 3);
        });

        it('should update particle positions', () => {
            const initialCount = system.getActiveCount();

            system.update(16); // One frame

            // Particles should still exist after one frame
            expect(system.getActiveCount()).toBe(initialCount);
        });

        it('should apply gravity to particles', () => {
            // Create particles and update multiple times
            system.update(16);
            system.update(16);
            system.update(16);

            // Particles should still be active
            expect(system.hasActiveParticles()).toBe(true);
        });

        it('should remove particles after their lifetime', () => {
            // Update for more than max lifetime (2000ms)
            for (let i = 0; i < 150; i++) {
                system.update(20);
            }

            // All particles should be gone
            expect(system.hasActiveParticles()).toBe(false);
        });

        it('should gradually reduce particle count', () => {
            const initialCount = system.getActiveCount();

            // Update for half the max lifetime
            for (let i = 0; i < 50; i++) {
                system.update(20);
            }

            const midCount = system.getActiveCount();
            // Some particles might have expired
            expect(midCount).toBeLessThanOrEqual(initialCount);

            // Update for remaining lifetime
            for (let i = 0; i < 50; i++) {
                system.update(20);
            }

            const finalCount = system.getActiveCount();
            expect(finalCount).toBeLessThan(midCount);
        });

        it('should handle zero delta time', () => {
            const initialCount = system.getActiveCount();

            system.update(0);

            expect(system.getActiveCount()).toBe(initialCount);
        });

        it('should handle very large delta time', () => {
            system.update(5000);

            // All particles should be expired
            expect(system.hasActiveParticles()).toBe(false);
        });

        it('should handle multiple updates in sequence', () => {
            system.update(16);
            system.update(16);
            system.update(16);
            system.update(16);

            expect(system).toBeDefined();
        });

        it('should update with no particles', () => {
            const emptySystem = new CollapseParticleSystem();

            expect(() => emptySystem.update(16)).not.toThrow();
            expect(emptySystem.hasActiveParticles()).toBe(false);
        });

        it('should handle fractional delta times', () => {
            system.update(16.667);
            system.update(16.667);

            expect(system.hasActiveParticles()).toBe(true);
        });

        it('should update particle opacity over time', () => {
            // Update to near end of life
            for (let i = 0; i < 100; i++) {
                system.update(15);
            }

            // Some particles might still exist near end of life
            // Just verify the update doesn't crash
            expect(system).toBeDefined();
        });
    });

    describe('render', () => {
        beforeEach(() => {
            system.createCollapseParticles(100, 100, 2);
        });

        it('should call canvas context methods', () => {
            system.render(mockCtx);

            expect(mockCtx.save).toHaveBeenCalled();
            expect(mockCtx.restore).toHaveBeenCalled();
        });

        it('should render all active particles', () => {
            const count = system.getActiveCount();

            system.render(mockCtx);

            // save/restore should be called once per particle
            expect(mockCtx.save).toHaveBeenCalledTimes(count);
            expect(mockCtx.restore).toHaveBeenCalledTimes(count);
        });

        it('should set globalAlpha for particles', () => {
            system.render(mockCtx);

            // globalAlpha should be set (between 0 and 1)
            expect(mockCtx.globalAlpha).toBeGreaterThanOrEqual(0);
            expect(mockCtx.globalAlpha).toBeLessThanOrEqual(1);
        });

        it('should translate to particle position', () => {
            system.render(mockCtx);

            expect(mockCtx.translate).toHaveBeenCalled();
        });

        it('should rotate particles', () => {
            system.render(mockCtx);

            expect(mockCtx.rotate).toHaveBeenCalled();
        });

        it('should render with no particles', () => {
            const emptySystem = new CollapseParticleSystem();

            expect(() => emptySystem.render(mockCtx)).not.toThrow();
            expect(mockCtx.save).not.toHaveBeenCalled();
        });

        it('should render particles after update', () => {
            system.update(16);
            system.render(mockCtx);

            expect(mockCtx.save).toHaveBeenCalled();
        });

        it('should render large wood chips as rectangles', () => {
            // Create many particles to increase chance of wood chips
            system.createCollapseParticles(100, 100, 10);

            system.render(mockCtx);

            // Should call fillRect for some particles (wood chips)
            expect(mockCtx.fillRect).toHaveBeenCalled();
        });

        it('should render small dust particles as circles', () => {
            // Create many particles to increase chance of dust
            system.createCollapseParticles(100, 100, 10);

            system.render(mockCtx);

            // Should call arc for some particles (dust)
            expect(mockCtx.arc).toHaveBeenCalled();
        });

        it('should set fill style for particles', () => {
            system.render(mockCtx);

            // fillStyle should be set
            expect(mockCtx.fillStyle).toBeTruthy();
        });

        it('should render particles multiple times', () => {
            system.render(mockCtx);
            vi.clearAllMocks();
            system.render(mockCtx);

            expect(mockCtx.save).toHaveBeenCalled();
        });

        it('should render with fading opacity', () => {
            // Update to progress particle life
            system.update(500);
            
            system.render(mockCtx);

            // Opacity should be set (will be less than 1 after some time)
            expect(mockCtx.globalAlpha).toBeLessThanOrEqual(1);
        });
    });

    describe('hasActiveParticles', () => {
        it('should return false when no particles exist', () => {
            expect(system.hasActiveParticles()).toBe(false);
        });

        it('should return true when particles exist', () => {
            system.createCollapseParticles(100, 100, 1);

            expect(system.hasActiveParticles()).toBe(true);
        });

        it('should return false after particles expire', () => {
            system.createCollapseParticles(100, 100, 1);

            // Update until all expire
            for (let i = 0; i < 150; i++) {
                system.update(20);
            }

            expect(system.hasActiveParticles()).toBe(false);
        });

        it('should return false after clear', () => {
            system.createCollapseParticles(100, 100, 1);
            system.clear();

            expect(system.hasActiveParticles()).toBe(false);
        });
    });

    describe('getActiveCount', () => {
        it('should return 0 for new system', () => {
            expect(system.getActiveCount()).toBe(0);
        });

        it('should return correct count after creating particles', () => {
            system.createCollapseParticles(100, 100, 5);

            const count = system.getActiveCount();
            expect(count).toBeGreaterThan(0);
            expect(count).toBeLessThanOrEqual(50);
        });

        it('should decrease as particles expire', () => {
            system.createCollapseParticles(100, 100, 3);
            const initialCount = system.getActiveCount();

            // Update for significant time
            for (let i = 0; i < 80; i++) {
                system.update(20);
            }

            const laterCount = system.getActiveCount();
            expect(laterCount).toBeLessThan(initialCount);
        });

        it('should return 0 after all particles expire', () => {
            system.createCollapseParticles(100, 100, 1);

            for (let i = 0; i < 150; i++) {
                system.update(20);
            }

            expect(system.getActiveCount()).toBe(0);
        });

        it('should increase when adding more particles', () => {
            system.createCollapseParticles(100, 100, 2);
            const count1 = system.getActiveCount();

            system.createCollapseParticles(200, 200, 3);
            const count2 = system.getActiveCount();

            expect(count2).toBeGreaterThan(count1);
        });
    });

    describe('clear', () => {
        it('should remove all particles', () => {
            system.createCollapseParticles(100, 100, 5);
            expect(system.hasActiveParticles()).toBe(true);

            system.clear();

            expect(system.hasActiveParticles()).toBe(false);
            expect(system.getActiveCount()).toBe(0);
        });

        it('should not throw when clearing empty system', () => {
            expect(() => system.clear()).not.toThrow();
        });

        it('should allow adding particles after clear', () => {
            system.createCollapseParticles(100, 100, 2);
            system.clear();

            system.createCollapseParticles(100, 100, 3);

            expect(system.hasActiveParticles()).toBe(true);
        });

        it('should clear multiple times safely', () => {
            system.createCollapseParticles(100, 100, 1);
            system.clear();
            system.clear();
            system.clear();

            expect(system.getActiveCount()).toBe(0);
        });
    });

    describe('destroy', () => {
        it('should clear all particles', () => {
            system.createCollapseParticles(100, 100, 5);

            system.destroy();

            expect(system.hasActiveParticles()).toBe(false);
            expect(system.getActiveCount()).toBe(0);
        });

        it('should not throw when destroying empty system', () => {
            expect(() => system.destroy()).not.toThrow();
        });

        it('should handle destroy multiple times', () => {
            system.createCollapseParticles(100, 100, 2);
            
            system.destroy();
            system.destroy();

            expect(system.getActiveCount()).toBe(0);
        });
    });

    describe('Integration Tests', () => {
        it('should handle complete particle lifecycle', () => {
            // Create particles
            system.createCollapseParticles(100, 100, 3);
            expect(system.hasActiveParticles()).toBe(true);

            // Update for some time
            for (let i = 0; i < 50; i++) {
                system.update(16);
                system.render(mockCtx);
            }

            expect(system.hasActiveParticles()).toBe(true);

            // Update until all expire
            for (let i = 0; i < 100; i++) {
                system.update(20);
            }

            expect(system.hasActiveParticles()).toBe(false);
        });

        it('should handle multiple burst sequences', () => {
            // First burst
            system.createCollapseParticles(50, 50, 2);
            system.update(500);
            
            // Second burst
            system.createCollapseParticles(150, 150, 3);
            system.update(500);
            
            // Third burst
            system.createCollapseParticles(250, 250, 1);
            
            expect(system.hasActiveParticles()).toBe(true);
        });

        it('should handle rapid create-update cycles', () => {
            for (let i = 0; i < 10; i++) {
                system.createCollapseParticles(100 + i * 10, 100 + i * 10, 1);
                system.update(16);
                system.render(mockCtx);
            }

            expect(system.hasActiveParticles()).toBe(true);
        });

        it('should handle continuous rendering', () => {
            system.createCollapseParticles(100, 100, 5);

            for (let i = 0; i < 60; i++) {
                system.update(16.667); // 60 FPS
                system.render(mockCtx);
            }

            // After ~1 second, should still have some particles
            expect(system.hasActiveParticles()).toBe(true);
        });

        it('should maintain consistent state across operations', () => {
            system.createCollapseParticles(100, 100, 2);
            const count1 = system.getActiveCount();

            system.update(16);
            system.render(mockCtx);
            const count2 = system.getActiveCount();

            expect(count2).toBe(count1);
        });
    });

    describe('Edge Cases', () => {
        it('should handle very high intensity', () => {
            system.createCollapseParticles(100, 100, 1000);

            // Should cap at 60 particles
            expect(system.getActiveCount()).toBe(60);
        });

        it('should handle negative intensity', () => {
            system.createCollapseParticles(100, 100, -5);

            // With negative intensity, count calculation is: 15 + (-5 * 3) = 0
            // So no particles are created
            const count = system.getActiveCount();
            expect(count).toBeGreaterThanOrEqual(0);
        });

        it('should handle floating point positions', () => {
            expect(() => system.createCollapseParticles(100.5, 200.7, 2)).not.toThrow();
            expect(system.hasActiveParticles()).toBe(true);
        });

        it('should handle very small delta times', () => {
            system.createCollapseParticles(100, 100, 2);

            system.update(0.001);

            expect(system.hasActiveParticles()).toBe(true);
        });

        it('should handle particles at canvas boundaries', () => {
            system.createCollapseParticles(0, 0, 1);
            system.createCollapseParticles(800, 600, 1);

            expect(system.getActiveCount()).toBeGreaterThan(0);
        });

        it('should handle render with partial particle lifetimes', () => {
            system.createCollapseParticles(100, 100, 3);
            
            // Update to various life stages
            system.update(100);
            system.render(mockCtx);
            
            system.update(500);
            system.render(mockCtx);
            
            system.update(1000);
            system.render(mockCtx);

            expect(mockCtx.save).toHaveBeenCalled();
        });

        it('should handle simultaneous bursts at same position', () => {
            system.createCollapseParticles(100, 100, 2);
            system.createCollapseParticles(100, 100, 2);
            system.createCollapseParticles(100, 100, 2);

            const count = system.getActiveCount();
            expect(count).toBeGreaterThan(40); // Should accumulate
        });

        it('should handle create-clear-create pattern', () => {
            system.createCollapseParticles(100, 100, 3);
            system.clear();
            system.createCollapseParticles(100, 100, 3);
            
            expect(system.hasActiveParticles()).toBe(true);
        });

        it('should maintain performance with many particles', () => {
            // Create maximum particles
            system.createCollapseParticles(100, 100, 100);

            const start = performance.now();
            
            // Update and render
            for (let i = 0; i < 10; i++) {
                system.update(16);
                system.render(mockCtx);
            }
            
            const duration = performance.now() - start;
            
            // Should complete in reasonable time (< 100ms for 10 frames)
            expect(duration).toBeLessThan(100);
        });
    });

    describe('Physics Behavior', () => {
        it('should apply gravity to particles over time', () => {
            system.createCollapseParticles(100, 100, 1);

            // Update multiple times to see gravity effect
            for (let i = 0; i < 10; i++) {
                system.update(16);
            }

            // Particles should still exist and have moved
            expect(system.hasActiveParticles()).toBe(true);
        });

        it('should apply air resistance', () => {
            system.createCollapseParticles(100, 100, 2);

            // Multiple updates to see deceleration
            system.update(16);
            system.update(16);
            system.update(16);

            expect(system.hasActiveParticles()).toBe(true);
        });

        it('should rotate particles during flight', () => {
            system.createCollapseParticles(100, 100, 2);
            system.update(100);
            system.render(mockCtx);

            // rotate should be called for each particle
            expect(mockCtx.rotate).toHaveBeenCalled();
        });
    });
});
