import { 
  WoodPiece, 
  GameState
} from '../../../types/index.js';
import { I18n } from '../../../infrastructure/i18n/I18n.js';
import { CollapsePredictionCalculator } from '../../../core/services/CollapsePredictionCalculator.js';
import { WoodPieceRenderer } from './WoodPieceRenderer.js';
import { UIRenderer } from './UIRenderer.js';
import { BaseRenderer } from '../shared/BaseRenderer.js';

/**
 * Koordinerar all visuell rendering av spelet genom specialiserade renderare
 */
export class GameRenderer extends BaseRenderer {
  private collapseCalculator: CollapsePredictionCalculator;
  private woodPieceRenderer: WoodPieceRenderer;
  private uiRenderer: UIRenderer;
  private i18n: I18n;
  
  constructor(canvas: HTMLCanvasElement, i18n: I18n) {
    super(canvas);
    
    // Initialisera specialiserade renderare
    this.collapseCalculator = new CollapsePredictionCalculator(canvas.height);
    this.woodPieceRenderer = new WoodPieceRenderer(canvas);
    this.uiRenderer = new UIRenderer(canvas, i18n);
    this.i18n = i18n;
  }
  
  /**
   * Ritar hela spelscenen genom att koordinera specialiserade renderare
   */
  public render(woodPieces: WoodPiece[], gameState: GameState, hoveredPiece?: WoodPiece): void {
    // Rensa och rita bakgrund
    this.clearCanvas();
    this.woodPieceRenderer.drawBackground();
    
    // Beräkna vilka pinnar som påverkas av hover
    const affectedPieces = hoveredPiece ? 
      this.collapseCalculator.calculateAffectedPieces(hoveredPiece, woodPieces) : [];
    
    // Rita vedpinnar med påverkanshighlighting
    this.woodPieceRenderer.drawWoodPieces(woodPieces, hoveredPiece, affectedPieces);
    
    // Rita UI-element (aktiv varelse, game over, etc.)
    this.uiRenderer.render(gameState);
  }

  /**
   * Uppdatera i18n när språk ändras
   */
  updateI18n(newI18n: I18n): void {
    this.i18n = newI18n;
    this.uiRenderer.updateI18n(newI18n);
  }

  /**
   * Uppdatera canvas-dimensioner om de ändras
   */
  updateCanvasSize(width: number, height: number): void {
    this.collapseCalculator.updateCanvasHeight(height);
  }

  /**
   * Hämta kollapsberäknaren för extern användning (t.ex. i Game-klassen)
   */
  getCollapseCalculator(): CollapsePredictionCalculator {
    return this.collapseCalculator;
  }

  /**
   * Rita instruktioner (kan kallas separat)
   */
  drawInstructions(): void {
    this.uiRenderer.drawInstructions();
  }
}