import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BaseRenderer } from '../../../../src/presentation/renderers/shared/BaseRenderer.js';

// Konkret implementation av BaseRenderer för testing
class TestRenderer extends BaseRenderer {
    public render(): void {
        // Test implementation
    }

    // Exponera protected methods för testing
    public testClearCanvas(): void {
        this.clearCanvas();
    }

    public testClearArea(x: number, y: number, width: number, height: number): void {
        this.clearArea(x, y, width, height);
    }

    public testSetupContext(): void {
        this.setupContext();
    }

    public testSaveContext(): void {
        this.saveContext();
    }

    public testRestoreContext(): void {
        this.restoreContext();
    }

    public testGetCanvasDimensions() {
        return this.getCanvasDimensions();
    }

    public testIsPointInCanvas(x: number, y: number): boolean {
        return this.isPointInCanvas(x, y);
    }

    public testMeasureText(text: string, font?: string): number {
        return this.measureText(text, font);
    }

    public testRenderTextWithShadow(
        text: string,
        x: number,
        y: number,
        color?: string,
        shadowColor?: string
    ): void {
        this.renderTextWithShadow(text, x, y, color, shadowColor);
    }

    // Exponera protected properties för assertions
    public getContext(): CanvasRenderingContext2D {
        return this.ctx;
    }

    public getCanvas(): HTMLCanvasElement {
        return this.canvas;
    }
}

// Helper för att skapa mock canvas context
function createMockCanvasContext() {
    return {
        fillStyle: '',
        strokeStyle: '',
        font: '',
        textAlign: '',
        textBaseline: '',
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
        stroke: vi.fn()
    } as unknown as CanvasRenderingContext2D;
}

describe('BaseRenderer Tests', () => {
    let renderer: TestRenderer;
    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;

    beforeEach(() => {
        ctx = createMockCanvasContext();
        canvas = {
            width: 800,
            height: 600,
            getContext: vi.fn(() => ctx)
        } as unknown as HTMLCanvasElement;

        renderer = new TestRenderer(canvas);
    });

    describe('Constructor', () => {
        it('should create renderer with canvas', () => {
            expect(renderer).toBeDefined();
        });

        it('should get 2D context from canvas', () => {
            expect(canvas.getContext).toHaveBeenCalledWith('2d');
        });

        it('should store canvas reference', () => {
            expect(renderer.getCanvas()).toBe(canvas);
        });

        it('should store context reference', () => {
            expect(renderer.getContext()).toBe(ctx);
        });

        it('should throw error if context is null', () => {
            const nullCanvas = {
                getContext: vi.fn(() => null)
            } as unknown as HTMLCanvasElement;

            expect(() => {
                new TestRenderer(nullCanvas);
            }).toThrow('Could not get 2D context from canvas');
        });
    });

    describe('Canvas Clearing', () => {
        it('should clear entire canvas', () => {
            renderer.testClearCanvas();

            expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 800, 600);
        });

        it('should clear specific area', () => {
            renderer.testClearArea(10, 20, 100, 50);

            expect(ctx.clearRect).toHaveBeenCalledWith(10, 20, 100, 50);
        });

        it('should clear multiple areas', () => {
            renderer.testClearArea(0, 0, 100, 100);
            renderer.testClearArea(200, 200, 50, 50);
            renderer.testClearArea(400, 300, 200, 100);

            expect(ctx.clearRect).toHaveBeenCalledTimes(3);
        });
    });

    describe('Context Setup', () => {
        it('should enable image smoothing', () => {
            renderer.testSetupContext();

            expect(ctx.imageSmoothingEnabled).toBe(true);
        });

        it('should set text align to left', () => {
            renderer.testSetupContext();

            expect(ctx.textAlign).toBe('left');
        });

        it('should set text baseline to top', () => {
            renderer.testSetupContext();

            expect(ctx.textBaseline).toBe('top');
        });

        it('should apply all context settings', () => {
            renderer.testSetupContext();

            expect(ctx.imageSmoothingEnabled).toBe(true);
            expect(ctx.textAlign).toBe('left');
            expect(ctx.textBaseline).toBe('top');
        });
    });

    describe('Context State Management', () => {
        it('should save context state', () => {
            renderer.testSaveContext();

            expect(ctx.save).toHaveBeenCalledTimes(1);
        });

        it('should restore context state', () => {
            renderer.testRestoreContext();

            expect(ctx.restore).toHaveBeenCalledTimes(1);
        });

        it('should save and restore in pairs', () => {
            renderer.testSaveContext();
            renderer.testRestoreContext();

            expect(ctx.save).toHaveBeenCalledTimes(1);
            expect(ctx.restore).toHaveBeenCalledTimes(1);
        });

        it('should handle multiple save/restore pairs', () => {
            renderer.testSaveContext();
            renderer.testSaveContext();
            renderer.testRestoreContext();
            renderer.testRestoreContext();

            expect(ctx.save).toHaveBeenCalledTimes(2);
            expect(ctx.restore).toHaveBeenCalledTimes(2);
        });
    });

    describe('Canvas Dimensions', () => {
        it('should return canvas width', () => {
            const dims = renderer.testGetCanvasDimensions();

            expect(dims.width).toBe(800);
        });

        it('should return canvas height', () => {
            const dims = renderer.testGetCanvasDimensions();

            expect(dims.height).toBe(600);
        });

        it('should return both dimensions', () => {
            const dims = renderer.testGetCanvasDimensions();

            expect(dims).toEqual({ width: 800, height: 600 });
        });

        it('should reflect canvas size changes', () => {
            canvas.width = 1200;
            canvas.height = 900;

            const dims = renderer.testGetCanvasDimensions();

            expect(dims).toEqual({ width: 1200, height: 900 });
        });
    });

    describe('Point in Canvas Detection', () => {
        it('should detect point inside canvas', () => {
            expect(renderer.testIsPointInCanvas(400, 300)).toBe(true);
        });

        it('should detect point at top-left corner', () => {
            expect(renderer.testIsPointInCanvas(0, 0)).toBe(true);
        });

        it('should detect point at bottom-right edge', () => {
            expect(renderer.testIsPointInCanvas(799, 599)).toBe(true);
        });

        it('should reject point outside left edge', () => {
            expect(renderer.testIsPointInCanvas(-1, 300)).toBe(false);
        });

        it('should reject point outside top edge', () => {
            expect(renderer.testIsPointInCanvas(400, -1)).toBe(false);
        });

        it('should reject point outside right edge', () => {
            expect(renderer.testIsPointInCanvas(800, 300)).toBe(false);
        });

        it('should reject point outside bottom edge', () => {
            expect(renderer.testIsPointInCanvas(400, 600)).toBe(false);
        });

        it('should reject point far outside canvas', () => {
            expect(renderer.testIsPointInCanvas(1000, 1000)).toBe(false);
        });
    });

    describe('Text Measurement', () => {
        it('should measure text width', () => {
            const width = renderer.testMeasureText('Hello');

            expect(ctx.measureText).toHaveBeenCalledWith('Hello');
            expect(width).toBe(100);
        });

        it('should measure text with custom font', () => {
            renderer.testMeasureText('Test', 'bold 24px Arial');

            expect(ctx.font).toBe('bold 24px Arial');
            expect(ctx.measureText).toHaveBeenCalledWith('Test');
        });

        it('should save and restore context when using custom font', () => {
            renderer.testMeasureText('Test', 'bold 24px Arial');

            expect(ctx.save).toHaveBeenCalled();
            expect(ctx.restore).toHaveBeenCalled();
        });

        it('should not save/restore without custom font', () => {
            vi.mocked(ctx.save).mockClear();
            vi.mocked(ctx.restore).mockClear();

            renderer.testMeasureText('Test');

            expect(ctx.save).not.toHaveBeenCalled();
            expect(ctx.restore).not.toHaveBeenCalled();
        });

        it('should measure empty string', () => {
            const width = renderer.testMeasureText('');

            expect(ctx.measureText).toHaveBeenCalledWith('');
        });
    });

    describe('Text Rendering with Shadow', () => {
        it('should render text with default colors', () => {
            renderer.testRenderTextWithShadow('Hello', 100, 200);

            expect(ctx.fillText).toHaveBeenCalledTimes(2);
            expect(ctx.fillText).toHaveBeenCalledWith('Hello', 101, 201); // Shadow
            expect(ctx.fillText).toHaveBeenCalledWith('Hello', 100, 200); // Text
        });

        it('should use white text by default', () => {
            renderer.testRenderTextWithShadow('Test', 50, 50);

            expect(ctx.fillStyle).toBe('#FFFFFF');
        });

        it('should use black shadow by default', () => {
            renderer.testRenderTextWithShadow('Test', 50, 50);

            // First call sets shadow color
            const calls = vi.mocked(ctx.fillText).mock.calls;
            expect(calls[0]).toEqual(['Test', 51, 51]); // Shadow offset
        });

        it('should render text with custom color', () => {
            renderer.testRenderTextWithShadow('Test', 50, 50, '#FF0000');

            expect(ctx.fillStyle).toBe('#FF0000');
        });

        it('should render shadow with custom color', () => {
            renderer.testRenderTextWithShadow('Test', 50, 50, '#FFFFFF', '#0000FF');

            // Shadow ska ritas först med custom färg
            expect(ctx.fillText).toHaveBeenCalledWith('Test', 51, 51);
        });

        it('should render shadow offset by 1 pixel', () => {
            renderer.testRenderTextWithShadow('Test', 100, 200);

            expect(ctx.fillText).toHaveBeenCalledWith('Test', 101, 201); // Shadow
            expect(ctx.fillText).toHaveBeenCalledWith('Test', 100, 200); // Text
        });

        it('should render text at multiple positions', () => {
            renderer.testRenderTextWithShadow('A', 10, 10);
            renderer.testRenderTextWithShadow('B', 20, 20);
            renderer.testRenderTextWithShadow('C', 30, 30);

            expect(ctx.fillText).toHaveBeenCalledTimes(6); // 3 texts * 2 (shadow + text)
        });
    });

    describe('Abstract Render Method', () => {
        it('should have render method', () => {
            expect(renderer.render).toBeDefined();
        });

        it('should be able to call render', () => {
            expect(() => renderer.render()).not.toThrow();
        });
    });

    describe('Integration Tests', () => {
        it('should support complete rendering workflow', () => {
            renderer.testSetupContext();
            renderer.testSaveContext();
            renderer.testClearCanvas();
            renderer.testRenderTextWithShadow('Title', 400, 50);
            renderer.testRestoreContext();

            expect(ctx.clearRect).toHaveBeenCalled();
            expect(ctx.fillText).toHaveBeenCalled();
            expect(ctx.save).toHaveBeenCalled();
            expect(ctx.restore).toHaveBeenCalled();
        });

        it('should handle multiple rendering operations', () => {
            for (let i = 0; i < 10; i++) {
                renderer.testSaveContext();
                renderer.testClearArea(i * 10, i * 10, 50, 50);
                renderer.testRestoreContext();
            }

            expect(ctx.clearRect).toHaveBeenCalledTimes(10);
            expect(ctx.save).toHaveBeenCalledTimes(10);
            expect(ctx.restore).toHaveBeenCalledTimes(10);
        });
    });

    describe('Edge Cases', () => {
        it('should handle zero dimensions canvas', () => {
            canvas.width = 0;
            canvas.height = 0;

            renderer.testClearCanvas();

            expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 0, 0);
        });

        it('should handle negative coordinates', () => {
            renderer.testClearArea(-10, -20, 100, 100);

            expect(ctx.clearRect).toHaveBeenCalledWith(-10, -20, 100, 100);
        });

        it('should handle very large canvas', () => {
            canvas.width = 10000;
            canvas.height = 10000;

            const dims = renderer.testGetCanvasDimensions();

            expect(dims).toEqual({ width: 10000, height: 10000 });
        });

        it('should handle empty text measurement', () => {
            const width = renderer.testMeasureText('');

            expect(width).toBe(100); // Mock returns 100
        });

        it('should handle unicode text rendering', () => {
            renderer.testRenderTextWithShadow('🎮🌲', 50, 50);

            expect(ctx.fillText).toHaveBeenCalledWith('🎮🌲', 51, 51);
            expect(ctx.fillText).toHaveBeenCalledWith('🎮🌲', 50, 50);
        });
    });
});
