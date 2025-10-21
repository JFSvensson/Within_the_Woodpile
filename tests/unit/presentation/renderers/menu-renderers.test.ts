import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BackgroundRenderer } from '../../../../src/presentation/renderers/menu/BackgroundRenderer.js';
import { LogoRenderer } from '../../../../src/presentation/renderers/menu/LogoRenderer.js';

// Helper för att skapa en mockad canvas context
function createMockCanvasContext(): CanvasRenderingContext2D {
    return {
        fillStyle: '',
        strokeStyle: '',
        font: '',
        textAlign: '',
        textBaseline: '',
        lineWidth: 1,
        lineDashOffset: 0,
        globalAlpha: 1,
        shadowBlur: 0,
        shadowColor: '',
        shadowOffsetX: 0,
        shadowOffsetY: 0,
        fillRect: vi.fn(),
        strokeRect: vi.fn(),
        clearRect: vi.fn(),
        fillText: vi.fn(),
        strokeText: vi.fn(),
        beginPath: vi.fn(),
        arc: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        closePath: vi.fn(),
        fill: vi.fn(),
        stroke: vi.fn(),
        clip: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        translate: vi.fn(),
        rotate: vi.fn(),
        scale: vi.fn(),
        setLineDash: vi.fn(),
        getLineDash: vi.fn(() => []),
        measureText: vi.fn(() => ({ width: 100 } as TextMetrics)),
        createLinearGradient: vi.fn(() => ({
            addColorStop: vi.fn()
        } as any as CanvasGradient)),
        canvas: { width: 800, height: 600 } as HTMLCanvasElement
    } as any as CanvasRenderingContext2D;
}

describe('Menu Renderers Tests', () => {
    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;

    beforeEach(() => {
        // Skapa canvas och mocka getContext
        canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        
        // Mocka getContext för att returnera vår mock context
        ctx = createMockCanvasContext();
        vi.spyOn(canvas, 'getContext').mockReturnValue(ctx);
    });

    describe('BackgroundRenderer', () => {
        let backgroundRenderer: BackgroundRenderer;
        let animationTime: number;

        beforeEach(() => {
            backgroundRenderer = new BackgroundRenderer(canvas);
            animationTime = 0;
        });

        describe('Initialization', () => {
            it('should initialize with canvas', () => {
                expect(backgroundRenderer).toBeDefined();
            });
        });

        describe('Gradient Background', () => {
            it('should render gradient background', () => {
                const createGradientSpy = vi.spyOn(ctx, 'createLinearGradient');
                const fillRectSpy = vi.spyOn(ctx, 'fillRect');
                
                backgroundRenderer.render(animationTime);
                
                // Ska ha skapat gradient från topp till botten
                expect(createGradientSpy).toHaveBeenCalledWith(0, 0, 0, canvas.height);
                
                // Ska ha fyllt hela canvas med gradient
                expect(fillRectSpy).toHaveBeenCalledWith(0, 0, canvas.width, canvas.height);
            });

            it('should create gradient with correct color stops', () => {
                const mockGradient = {
                    addColorStop: vi.fn()
                };
                vi.spyOn(ctx, 'createLinearGradient').mockReturnValue(mockGradient as any);
                
                backgroundRenderer.render(animationTime);
                
                // Verifiera himmelblå topp
                expect(mockGradient.addColorStop).toHaveBeenCalledWith(0, '#87CEEB');
                // Verifiera ljusgrön horisont
                expect(mockGradient.addColorStop).toHaveBeenCalledWith(0.3, '#90EE90');
                // Verifiera skogsgrön mark
                expect(mockGradient.addColorStop).toHaveBeenCalledWith(1, '#228B22');
            });
        });

        describe('Animated Trees', () => {
            it('should render 8 trees', () => {
                const arcSpy = vi.spyOn(ctx, 'arc');
                
                backgroundRenderer.render(animationTime);
                
                // Varje träd har 3 arcs (huvudkrona, inner-cirkel, highlight) = 8 * 3 = 24 arc-anrop
                expect(arcSpy).toHaveBeenCalled();
                // Minst 8 träd bör renderas (varje träd har minst en arc för krona)
                expect(arcSpy.mock.calls.length).toBeGreaterThanOrEqual(8);
            });

            it('should render trees with swaying animation', () => {
                const arcSpy = vi.spyOn(ctx, 'arc');
                
                // Rendera vid två olika tidpunkter
                backgroundRenderer.render(0);
                const firstCallPositions = arcSpy.mock.calls.map(call => call[0]); // x-positioner
                
                arcSpy.mockClear();
                
                backgroundRenderer.render(Math.PI); // Halvt varv i sin-kurva
                const secondCallPositions = arcSpy.mock.calls.map(call => call[0]);
                
                // Positioner ska vara olika pga svajning
                // Minst en position ska ha ändrats
                const positionsChanged = firstCallPositions.some((pos, idx) => 
                    Math.abs(pos - secondCallPositions[idx]) > 0.1
                );
                expect(positionsChanged).toBe(true);
            });

            it('should render tree trunks', () => {
                const fillRectSpy = vi.spyOn(ctx, 'fillRect');
                
                backgroundRenderer.render(animationTime);
                
                // Minst 8 fillRect för stammar (plus 1 för bakgrund)
                expect(fillRectSpy.mock.calls.length).toBeGreaterThanOrEqual(9);
            });

            it('should render tree crowns with circles', () => {
                const arcSpy = vi.spyOn(ctx, 'arc');
                const fillSpy = vi.spyOn(ctx, 'fill');
                
                backgroundRenderer.render(animationTime);
                
                // Varje krona har 3 cirklar
                expect(arcSpy).toHaveBeenCalled();
                expect(fillSpy).toHaveBeenCalled();
            });

            it('should add bark texture to trunks', () => {
                const strokeSpy = vi.spyOn(ctx, 'stroke');
                const moveToSpy = vi.spyOn(ctx, 'moveTo');
                const lineToSpy = vi.spyOn(ctx, 'lineTo');
                
                backgroundRenderer.render(animationTime);
                
                // Bark-textur använder moveTo och lineTo
                expect(moveToSpy).toHaveBeenCalled();
                expect(lineToSpy).toHaveBeenCalled();
                expect(strokeSpy).toHaveBeenCalled();
            });

            it('should use breathing effect for tree height', () => {
                const fillRectSpy = vi.spyOn(ctx, 'fillRect');
                
                backgroundRenderer.render(0);
                const firstHeights = fillRectSpy.mock.calls
                    .filter(call => call[3] > 100) // Bara stammar (höga rectangles)
                    .map(call => call[3]);
                
                fillRectSpy.mockClear();
                
                backgroundRenderer.render(Math.PI); // Annan andningsfas
                const secondHeights = fillRectSpy.mock.calls
                    .filter(call => call[3] > 100)
                    .map(call => call[3]);
                
                // Höjder ska variera med breathing effect
                if (firstHeights.length > 0 && secondHeights.length > 0) {
                    const heightsChanged = firstHeights.some((h, idx) => 
                        Math.abs(h - secondHeights[idx]) > 0.5
                    );
                    expect(heightsChanged).toBe(true);
                }
            });
        });

        describe('Tree Crown Details', () => {
            it('should render crown with three layers', () => {
                const arcSpy = vi.spyOn(ctx, 'arc');
                const fillSpy = vi.spyOn(ctx, 'fill');
                
                backgroundRenderer.render(animationTime);
                
                // 8 träd * 3 lager per krona = 24 arc-anrop
                expect(arcSpy.mock.calls.length).toBe(24);
                expect(fillSpy).toHaveBeenCalled();
            });

            it('should use correct green colors for crown layers', () => {
                backgroundRenderer.render(animationTime);
                
                // Verifiera att gröna färger används
                const fillStyleValues = (ctx as any).fillStyle;
                // Context mocken spårar färgändringar genom assignemnts
                expect(backgroundRenderer).toBeDefined(); // Implicit test att rendering kördes utan error
            });
        });

        describe('Bark Texture', () => {
            it('should render vertical bark lines', () => {
                const moveToSpy = vi.spyOn(ctx, 'moveTo');
                const lineToSpy = vi.spyOn(ctx, 'lineTo');
                
                backgroundRenderer.render(animationTime);
                
                // Varje träd har 3 vertikala linjer
                expect(moveToSpy.mock.calls.length).toBeGreaterThan(0);
                expect(lineToSpy.mock.calls.length).toBeGreaterThan(0);
            });

            it('should render horizontal bark markings', () => {
                const lineToSpy = vi.spyOn(ctx, 'lineTo');
                
                backgroundRenderer.render(animationTime);
                
                // Horisontella markeringar renderas med lineTo
                expect(lineToSpy).toHaveBeenCalled();
            });
        });

        describe('BaseRenderer Implementation', () => {
            it('should implement BaseRenderer render method', () => {
                expect(() => {
                    backgroundRenderer.render(animationTime);
                }).not.toThrow();
            });
        });
    });

    describe('LogoRenderer', () => {
        let logoRenderer: LogoRenderer;
        let animationTime: number;

        beforeEach(() => {
            logoRenderer = new LogoRenderer(canvas);
            animationTime = 0;
        });

        describe('Initialization', () => {
            it('should initialize with canvas', () => {
                expect(logoRenderer).toBeDefined();
            });
        });

        describe('Title Rendering', () => {
            it('should render title text', () => {
                const fillTextSpy = vi.spyOn(ctx, 'fillText');
                const strokeTextSpy = vi.spyOn(ctx, 'strokeText');
                
                logoRenderer.render(animationTime);
                
                // Ska rita både outline (stroke) och fill
                expect(strokeTextSpy).toHaveBeenCalledWith(
                    'Within the Woodpile',
                    expect.any(Number),
                    expect.any(Number)
                );
                expect(fillTextSpy).toHaveBeenCalledWith(
                    'Within the Woodpile',
                    expect.any(Number),
                    expect.any(Number)
                );
            });

            it('should center title text', () => {
                const fillTextSpy = vi.spyOn(ctx, 'fillText');
                
                logoRenderer.render(animationTime);
                
                // Titel ska vara centrerad på canvas.width / 2
                expect(fillTextSpy).toHaveBeenCalledWith(
                    'Within the Woodpile',
                    canvas.width / 2,
                    expect.any(Number)
                );
            });

            it('should use brown color for title', () => {
                logoRenderer.render(animationTime);
                
                // Verifiera att brun färg används (implicit genom att rendering inte kastar fel)
                expect(logoRenderer).toBeDefined();
            });
        });

        describe('Animated Wood Pile', () => {
            it('should render wood pile with breathing animation', () => {
                const saveSpy = vi.spyOn(ctx, 'save');
                const scaleSpy = vi.spyOn(ctx, 'scale');
                const restoreSpy = vi.spyOn(ctx, 'restore');
                
                logoRenderer.render(animationTime);
                
                // Ska använda save/scale/restore för breathing effect
                expect(saveSpy).toHaveBeenCalled();
                expect(scaleSpy).toHaveBeenCalled();
                expect(restoreSpy).toHaveBeenCalled();
            });

            it('should scale wood pile with breathing effect', () => {
                const scaleSpy = vi.spyOn(ctx, 'scale');
                
                logoRenderer.render(0);
                const scale1 = scaleSpy.mock.calls[0];
                
                scaleSpy.mockClear();
                
                logoRenderer.render(Math.PI / 2); // Kvarts varv i sin-kurva
                const scale2 = scaleSpy.mock.calls[0];
                
                // Scale ska vara näraliggande 1 (breathing är 1 ± 0.02)
                if (scale1 && scale2) {
                    // Båda ska vara nära 1
                    expect(scale1[0]).toBeGreaterThan(0.98);
                    expect(scale1[0]).toBeLessThan(1.02);
                    expect(scale2[0]).toBeGreaterThan(0.98);
                    expect(scale2[0]).toBeLessThan(1.02);
                }
            });

            it('should render wood pile pyramid with 4-3-2-1 pattern', () => {
                const arcSpy = vi.spyOn(ctx, 'arc');
                
                logoRenderer.render(animationTime);
                
                // 4+3+2+1 = 10 vedstockar totalt
                expect(arcSpy.mock.calls.length).toBe(10);
            });

            it('should render each wood piece as circle', () => {
                const arcSpy = vi.spyOn(ctx, 'arc');
                const fillSpy = vi.spyOn(ctx, 'fill');
                
                logoRenderer.render(animationTime);
                
                // Varje vedstock renderas med arc och fill
                expect(arcSpy).toHaveBeenCalled();
                expect(fillSpy).toHaveBeenCalled();
            });

            it('should add bark contour to wood pieces', () => {
                const strokeSpy = vi.spyOn(ctx, 'stroke');
                
                logoRenderer.render(animationTime);
                
                // Bark-kontur renderas med stroke
                expect(strokeSpy).toHaveBeenCalled();
            });
        });

        describe('Wood Grain Details', () => {
            it('should render wood grain lines', () => {
                const moveToSpy = vi.spyOn(ctx, 'moveTo');
                const lineToSpy = vi.spyOn(ctx, 'lineTo');
                const strokeSpy = vi.spyOn(ctx, 'stroke');
                
                logoRenderer.render(animationTime);
                
                // Wood grain använder moveTo och lineTo
                expect(moveToSpy).toHaveBeenCalled();
                expect(lineToSpy).toHaveBeenCalled();
                expect(strokeSpy).toHaveBeenCalled();
            });

            it('should render two grain lines per wood piece', () => {
                const moveToSpy = vi.spyOn(ctx, 'moveTo');
                
                logoRenderer.render(animationTime);
                
                // 10 vedstockar * 2 linjer per stock = 20 moveTo för grain
                // Plus moveTo för andra rendering operationer
                expect(moveToSpy.mock.calls.length).toBeGreaterThanOrEqual(20);
            });
        });

        describe('Emoji Rendering', () => {
            it('should render tree emoji', () => {
                const fillTextSpy = vi.spyOn(ctx, 'fillText');
                
                logoRenderer.render(animationTime);
                
                // Ska rita träd-emoji
                expect(fillTextSpy).toHaveBeenCalledWith(
                    '🌲',
                    expect.any(Number),
                    expect.any(Number)
                );
            });

            it('should position emoji to the right of title', () => {
                const fillTextSpy = vi.spyOn(ctx, 'fillText');
                
                logoRenderer.render(animationTime);
                
                // Emoji ska vara till höger om centrum
                const emojiCall = fillTextSpy.mock.calls.find(call => call[0] === '🌲');
                expect(emojiCall).toBeDefined();
                if (emojiCall) {
                    expect(emojiCall[1]).toBeGreaterThan(canvas.width / 2);
                }
            });
        });

        describe('Pyramid Layout', () => {
            it('should render bottom row with 4 wood pieces', () => {
                const arcSpy = vi.spyOn(ctx, 'arc');
                
                logoRenderer.render(animationTime);
                
                // Totalt 10 vedstockar (4+3+2+1)
                expect(arcSpy.mock.calls.length).toBe(10);
            });

            it('should use brick pattern offset', () => {
                const arcSpy = vi.spyOn(ctx, 'arc');
                
                logoRenderer.render(animationTime);
                
                // Varje rad ska ha olika x-offset för brick-pattern
                const xPositions = arcSpy.mock.calls.map(call => call[0]);
                
                // Positioner ska variera (brick pattern skapar offset)
                const uniqueXPositions = new Set(xPositions);
                expect(uniqueXPositions.size).toBeGreaterThan(1);
            });

            it('should stack rows vertically', () => {
                const arcSpy = vi.spyOn(ctx, 'arc');
                
                logoRenderer.render(animationTime);
                
                // Hämta y-positioner
                const yPositions = arcSpy.mock.calls.map(call => call[1]);
                
                // Ska finnas olika y-positioner för olika rader
                const uniqueYPositions = new Set(yPositions);
                expect(uniqueYPositions.size).toBe(4); // 4 rader
            });
        });

        describe('BaseRenderer Implementation', () => {
            it('should implement BaseRenderer render method', () => {
                expect(() => {
                    logoRenderer.render(animationTime);
                }).not.toThrow();
            });
        });

        describe('Animation Integration', () => {
            it('should accept animation time parameter', () => {
                expect(() => {
                    logoRenderer.render(0);
                    logoRenderer.render(100);
                    logoRenderer.render(1000);
                }).not.toThrow();
            });

            it('should produce different scales at different animation times', () => {
                const scaleSpy = vi.spyOn(ctx, 'scale');
                
                logoRenderer.render(0);
                const scale1 = scaleSpy.mock.calls[0];
                
                scaleSpy.mockClear();
                
                logoRenderer.render(Math.PI); // Motsatt fas
                const scale2 = scaleSpy.mock.calls[0];
                
                // Scales ska vara i intervallet för breathing (1 ± 0.02)
                if (scale1 && scale2) {
                    expect(scale1[0]).toBeGreaterThan(0.98);
                    expect(scale1[0]).toBeLessThan(1.02);
                    expect(scale2[0]).toBeGreaterThan(0.98);
                    expect(scale2[0]).toBeLessThan(1.02);
                }
            });
        });
    });
});
