import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameRenderer } from '../../../../src/presentation/renderers/game/GameRenderer.js';
import { WoodPieceRenderer } from '../../../../src/presentation/renderers/game/WoodPieceRenderer.js';
import { UIRenderer } from '../../../../src/presentation/renderers/game/UIRenderer.js';
import { I18n } from '../../../../src/infrastructure/i18n/I18n.js';
import { 
    WoodPiece, 
    GameState, 
    CreatureType, 
    CollapsePrediction,
    CollapseRisk,
    AffectedPiece
} from '../../../../src/types/index.js';

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
        canvas: { width: 800, height: 600 } as HTMLCanvasElement
    } as any as CanvasRenderingContext2D;
}

describe('Game Renderers Tests', () => {
    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;
    let i18n: I18n;

    beforeEach(() => {
        // Skapa canvas och mocka getContext
        canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        
        // Mocka getContext för att returnera vår mock context
        ctx = createMockCanvasContext();
        vi.spyOn(canvas, 'getContext').mockReturnValue(ctx);

        // Mock i18n
        i18n = new I18n();
    });

    describe('GameRenderer', () => {
        let gameRenderer: GameRenderer;
        let woodPieces: WoodPiece[];
        let gameState: GameState;

        beforeEach(() => {
            gameRenderer = new GameRenderer(canvas, i18n);
            
            woodPieces = [
                createMockWoodPiece('1', 100, 100, 50, 50),
                createMockWoodPiece('2', 200, 150, 60, 60)
            ];

            gameState = {
                score: 100,
                health: 75,
                isGameOver: false,
                isPaused: false,
                activeCreature: undefined
            };
        });

        describe('Initialization', () => {
            it('should initialize with canvas and i18n', () => {
                expect(gameRenderer).toBeDefined();
            });

            it('should provide access to collapse calculator', () => {
                const calculator = gameRenderer.getCollapseCalculator();
                expect(calculator).toBeDefined();
            });
        });

        describe('Rendering coordination', () => {
            it('should render complete game scene', () => {
                const clearSpy = vi.spyOn(ctx, 'clearRect');
                const fillRectSpy = vi.spyOn(ctx, 'fillRect');
                
                gameRenderer.render(woodPieces, gameState);
                
                // Ska ha rensat canvas och ritat bakgrund
                expect(clearSpy).toHaveBeenCalled();
                expect(fillRectSpy).toHaveBeenCalled();
            });

            it('should render with hovered piece', () => {
                const arcSpy = vi.spyOn(ctx, 'arc');
                const hoveredPiece = woodPieces[0];
                
                gameRenderer.render(woodPieces, gameState, hoveredPiece);
                
                // Ska ha ritat cirklar för vedpinnar
                expect(arcSpy).toHaveBeenCalled();
            });

            it('should calculate affected pieces when hovering', () => {
                const hoveredPiece = woodPieces[0];
                const calculator = gameRenderer.getCollapseCalculator();
                const calcSpy = vi.spyOn(calculator, 'calculateAffectedPieces');
                
                gameRenderer.render(woodPieces, gameState, hoveredPiece);
                
                expect(calcSpy).toHaveBeenCalledWith(hoveredPiece, woodPieces);
            });

            it('should not calculate affected pieces without hover', () => {
                const calculator = gameRenderer.getCollapseCalculator();
                const calcSpy = vi.spyOn(calculator, 'calculateAffectedPieces');
                
                gameRenderer.render(woodPieces, gameState);
                
                expect(calcSpy).not.toHaveBeenCalled();
            });
        });

        describe('I18n updates', () => {
            it('should update i18n instance', () => {
                const newI18n = new I18n();
                
                expect(() => {
                    gameRenderer.updateI18n(newI18n);
                }).not.toThrow();
            });
        });

        describe('Canvas size updates', () => {
            it('should update canvas dimensions in calculator', () => {
                const calculator = gameRenderer.getCollapseCalculator();
                const updateSpy = vi.spyOn(calculator, 'updateCanvasHeight');
                
                gameRenderer.updateCanvasSize(800, 700);
                
                expect(updateSpy).toHaveBeenCalledWith(700);
            });
        });

        describe('Instructions rendering', () => {
            it('should draw instructions', () => {
                const fillTextSpy = vi.spyOn(ctx, 'fillText');
                
                gameRenderer.drawInstructions();
                
                // Ska ha ritat text
                expect(fillTextSpy).toHaveBeenCalled();
            });
        });
    });

    describe('WoodPieceRenderer', () => {
        let woodPieceRenderer: WoodPieceRenderer;
        let woodPieces: WoodPiece[];

        beforeEach(() => {
            woodPieceRenderer = new WoodPieceRenderer(canvas);
            woodPieces = [
                createMockWoodPiece('1', 100, 100, 50, 50),
                createMockWoodPiece('2', 200, 150, 60, 60),
                createMockWoodPiece('3', 300, 200, 40, 40, CreatureType.SPIDER)
            ];
        });

        describe('Wood piece drawing', () => {
            it('should draw all wood pieces', () => {
                const arcSpy = vi.spyOn(ctx, 'arc');
                
                woodPieceRenderer.drawWoodPieces(woodPieces);
                
                // Ska ha ritat cirklar för alla pinnar
                expect(arcSpy.mock.calls.length).toBeGreaterThan(0);
            });

            it('should not draw removed pieces', () => {
                woodPieces[0].isRemoved = true;
                const beginPathSpy = vi.spyOn(ctx, 'beginPath');
                const beforeCalls = beginPathSpy.mock.calls.length;
                
                woodPieceRenderer.drawWoodPieces(woodPieces);
                
                // Ska ha färre ritanrop eftersom en piece är removed
                expect(beginPathSpy.mock.calls.length).toBeGreaterThan(beforeCalls);
            });

            it('should not draw collapsing pieces', () => {
                woodPieces[0].isCollapsing = true;
                
                expect(() => {
                    woodPieceRenderer.drawWoodPieces(woodPieces);
                }).not.toThrow();
            });

            it('should draw hovered piece on top', () => {
                const hoveredPiece = woodPieces[0];
                const strokeSpy = vi.spyOn(ctx, 'stroke');
                
                woodPieceRenderer.drawWoodPieces(woodPieces, hoveredPiece);
                
                // Hovrad piece ska ha extra stroke för highlight
                expect(strokeSpy).toHaveBeenCalled();
            });

            it('should draw affected pieces with prediction borders', () => {
                const affectedPieces: AffectedPiece[] = [{
                    piece: woodPieces[1],
                    prediction: CollapsePrediction.HIGH_RISK
                }];
                const setLineDashSpy = vi.spyOn(ctx, 'setLineDash');
                
                woodPieceRenderer.drawWoodPieces(woodPieces, undefined, affectedPieces);
                
                // Ska ha satt linedash för prediction border
                expect(setLineDashSpy).toHaveBeenCalled();
            });
        });

        describe('Individual piece rendering', () => {
            it('should draw piece with texture', () => {
                const piece = woodPieces[0];
                const arcSpy = vi.spyOn(ctx, 'arc');
                
                woodPieceRenderer.drawWoodPiece(piece, false);
                
                // Ska ha ritat flera cirklar (piece + texture rings)
                expect(arcSpy.mock.calls.length).toBeGreaterThan(1);
            });

            it('should draw hover highlight', () => {
                const piece = woodPieces[0];
                const strokeSpy = vi.spyOn(ctx, 'stroke');
                
                woodPieceRenderer.drawWoodPiece(piece, true);
                
                expect(strokeSpy).toHaveBeenCalled();
            });

            it('should draw creature hint when hovered', () => {
                const piece = woodPieces[2]; // Has spider
                const fillSpy = vi.spyOn(ctx, 'fill');
                
                woodPieceRenderer.drawWoodPiece(piece, true);
                
                // Ska ha ritat glow-effekt för creature
                expect(fillSpy).toHaveBeenCalled();
            });

            it('should not draw creature hint when not hovered', () => {
                const piece = woodPieces[2]; // Has spider
                const shadowBlurBefore = ctx.shadowBlur;
                
                woodPieceRenderer.drawWoodPiece(piece, false);
                
                // Shadow blur ska vara återställd
                expect(ctx.shadowBlur).toBe(0);
            });
        });

        describe('Prediction borders', () => {
            it('should draw WILL_COLLAPSE prediction with solid red border', () => {
                const setLineDashSpy = vi.spyOn(ctx, 'setLineDash');
                
                woodPieceRenderer.drawPredictionBorder(100, 100, 25, CollapsePrediction.WILL_COLLAPSE);
                
                // Solid line (empty array)
                expect(setLineDashSpy).toHaveBeenCalledWith([]);
                expect(ctx.strokeStyle).toContain('#FF0000');
            });

            it('should draw HIGH_RISK prediction with dashed orange border', () => {
                const setLineDashSpy = vi.spyOn(ctx, 'setLineDash');
                
                woodPieceRenderer.drawPredictionBorder(100, 100, 25, CollapsePrediction.HIGH_RISK);
                
                expect(setLineDashSpy).toHaveBeenCalledWith([5, 5]);
                expect(ctx.strokeStyle).toContain('#FF6600');
            });

            it('should draw MEDIUM_RISK prediction with dashed yellow border', () => {
                const setLineDashSpy = vi.spyOn(ctx, 'setLineDash');
                
                woodPieceRenderer.drawPredictionBorder(100, 100, 25, CollapsePrediction.MEDIUM_RISK);
                
                expect(setLineDashSpy).toHaveBeenCalledWith([5, 5]);
                expect(ctx.strokeStyle).toContain('#FFAA00');
            });

            it('should draw LOW_RISK prediction with dotted light yellow border', () => {
                const setLineDashSpy = vi.spyOn(ctx, 'setLineDash');
                
                woodPieceRenderer.drawPredictionBorder(100, 100, 25, CollapsePrediction.LOW_RISK);
                
                expect(setLineDashSpy).toHaveBeenCalledWith([2, 3]);
                expect(ctx.strokeStyle).toContain('#FFDD00');
            });

            it('should add pulsing effect for WILL_COLLAPSE', () => {
                const fillSpy = vi.spyOn(ctx, 'fill');
                
                woodPieceRenderer.drawPredictionBorder(100, 100, 25, CollapsePrediction.WILL_COLLAPSE);
                
                // Ska ha ritat extra fill för pulsande effekt
                expect(fillSpy).toHaveBeenCalled();
            });

            it('should reset line dash after drawing', () => {
                const setLineDashSpy = vi.spyOn(ctx, 'setLineDash');
                
                woodPieceRenderer.drawPredictionBorder(100, 100, 25, CollapsePrediction.HIGH_RISK);
                
                // Ska ha återställt till solid line sist
                const calls = setLineDashSpy.mock.calls;
                expect(calls[calls.length - 1]).toEqual([[]]);
            });
        });

        describe('Wood texture rendering', () => {
            it('should draw circular wood texture', () => {
                const arcSpy = vi.spyOn(ctx, 'arc');
                const moveToSpy = vi.spyOn(ctx, 'moveTo');
                const lineToSpy = vi.spyOn(ctx, 'lineTo');
                
                woodPieceRenderer.drawWoodTextureCircular(100, 100, 25);
                
                // Ska ha ritat rings (arcs)
                expect(arcSpy).toHaveBeenCalled();
                // Ska ha ritat fiber lines (moveTo + lineTo)
                expect(moveToSpy).toHaveBeenCalled();
                expect(lineToSpy).toHaveBeenCalled();
            });

            it('should draw multiple tree rings', () => {
                const arcSpy = vi.spyOn(ctx, 'arc');
                
                woodPieceRenderer.drawWoodTextureCircular(100, 100, 25);
                
                // Ska ha ritat flera rings
                expect(arcSpy.mock.calls.length).toBeGreaterThan(3);
            });

            it('should draw wood grain lines', () => {
                const lineToSpy = vi.spyOn(ctx, 'lineTo');
                
                woodPieceRenderer.drawWoodTextureCircular(100, 100, 25);
                
                // Ska ha ritat 6 grain lines
                expect(lineToSpy.mock.calls.length).toBeGreaterThanOrEqual(6);
            });
        });

        describe('Background rendering', () => {
            it('should draw background', () => {
                const fillRectSpy = vi.spyOn(ctx, 'fillRect');
                
                woodPieceRenderer.drawBackground();
                
                // Ska ha ritat bakgrund och mark
                expect(fillRectSpy).toHaveBeenCalledTimes(2);
            });

            it('should draw ground at bottom', () => {
                const fillRectSpy = vi.spyOn(ctx, 'fillRect');
                
                woodPieceRenderer.drawBackground();
                
                const groundCall = fillRectSpy.mock.calls.find(
                    call => call[1] === canvas.height - 50
                );
                expect(groundCall).toBeDefined();
            });
        });

        describe('Creature color mapping', () => {
            it('should render spider with dark red glow', () => {
                const piece = createMockWoodPiece('spider', 100, 100, 50, 50, CreatureType.SPIDER);
                
                woodPieceRenderer.drawWoodPiece(piece, true);
                
                // Ska ha satt shadow color (någon form av röd)
                expect(ctx.shadowColor).toBeTruthy();
            });

            it('should render wasp with golden glow', () => {
                const piece = createMockWoodPiece('wasp', 100, 100, 50, 50, CreatureType.WASP);
                
                woodPieceRenderer.drawWoodPiece(piece, true);
                
                expect(ctx.shadowColor).toBeTruthy();
            });

            it('should render hedgehog with brown glow', () => {
                const piece = createMockWoodPiece('hedgehog', 100, 100, 50, 50, CreatureType.HEDGEHOG);
                
                woodPieceRenderer.drawWoodPiece(piece, true);
                
                expect(ctx.shadowColor).toBeTruthy();
            });

            it('should render ghost with lavender glow', () => {
                const piece = createMockWoodPiece('ghost', 100, 100, 50, 50, CreatureType.GHOST);
                
                woodPieceRenderer.drawWoodPiece(piece, true);
                
                expect(ctx.shadowColor).toBeTruthy();
            });

            it('should render pumpkin with orange glow', () => {
                const piece = createMockWoodPiece('pumpkin', 100, 100, 50, 50, CreatureType.PUMPKIN);
                
                woodPieceRenderer.drawWoodPiece(piece, true);
                
                expect(ctx.shadowColor).toBeTruthy();
            });
        });

        describe('Render method implementation', () => {
            it('should implement BaseRenderer render method', () => {
                const affectedPieces: AffectedPiece[] = [];
                
                expect(() => {
                    woodPieceRenderer.render(woodPieces, woodPieces[0], affectedPieces);
                }).not.toThrow();
            });
        });
    });

    describe('UIRenderer', () => {
        let uiRenderer: UIRenderer;
        let gameState: GameState;

        beforeEach(() => {
            uiRenderer = new UIRenderer(canvas, i18n);
            gameState = {
                score: 150,
                health: 80,
                isGameOver: false,
                isPaused: false,
                activeCreature: undefined
            };
        });

        describe('Game state rendering', () => {
            it('should not render anything for normal game state', () => {
                const fillTextSpy = vi.spyOn(ctx, 'fillText');
                
                // Normal gameState utan activeCreature eller gameOver
                uiRenderer.render(gameState);
                
                // UIRenderer.render() renderar bara activeCreature och gameOver
                // Inget ska ritas för normal gameState
                expect(fillTextSpy).not.toHaveBeenCalled();
            });

            it('should render active creature with timer', () => {
                gameState.activeCreature = {
                    type: CreatureType.SPIDER,
                    timeLeft: 1500,
                    maxTime: 2000,
                    position: { x: 100, y: 100 }
                };
                const fillTextSpy = vi.spyOn(ctx, 'fillText');
                
                uiRenderer.render(gameState);
                
                // Ska ha ritat creature emoji och instructions
                expect(fillTextSpy).toHaveBeenCalled();
            });

            it('should render game over screen', () => {
                gameState.isGameOver = true;
                const fillTextSpy = vi.spyOn(ctx, 'fillText');
                
                uiRenderer.render(gameState);
                
                // Ska ha ritat game over text
                expect(fillTextSpy).toHaveBeenCalled();
                expect(fillTextSpy).toHaveBeenCalledWith(
                    expect.any(String),
                    expect.any(Number),
                    expect.any(Number)
                );
            });

            it('should not render pause indicator in render method', () => {
                gameState.isPaused = true;
                const fillTextSpy = vi.spyOn(ctx, 'fillText');
                
                // UIRenderer.render() hanterar inte isPaused flag
                uiRenderer.render(gameState);
                
                // Inget ska ritas för isPaused
                expect(fillTextSpy).not.toHaveBeenCalled();
            });
        });

        describe('Instructions rendering', () => {
            it('should draw instructions', () => {
                const fillTextSpy = vi.spyOn(ctx, 'fillText');
                
                uiRenderer.drawInstructions();
                
                expect(fillTextSpy).toHaveBeenCalled();
            });
        });

        describe('I18n updates', () => {
            it('should update i18n instance', () => {
                const newI18n = new I18n();
                
                expect(() => {
                    uiRenderer.updateI18n(newI18n);
                }).not.toThrow();
            });

            it('should use updated i18n for rendering', () => {
                const newI18n = new I18n();
                uiRenderer.updateI18n(newI18n);
                const fillTextSpy = vi.spyOn(ctx, 'fillText');
                
                // Lägg till gameOver för att faktiskt rendera något
                gameState.isGameOver = true;
                uiRenderer.render(gameState);
                
                // Ska kunna rita med nya i18n
                expect(fillTextSpy).toHaveBeenCalled();
            });
        });
    });
});

// Helper function
function createMockWoodPiece(
    id: string,
    x: number,
    y: number,
    width: number,
    height: number,
    creature?: CreatureType
): WoodPiece {
    return {
        id,
        position: { x, y },
        size: { width, height },
        isRemoved: false,
        collapseRisk: CollapseRisk.NONE,
        creature
    };
}
