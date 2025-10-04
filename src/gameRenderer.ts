import { 
  WoodPiece, 
  GameState
} from './types.js';
import { I18n } from './i18n.js';
import { CollapsePredictionCalculator } from './collapsePredictionCalculator.js';
import { WoodPieceRenderer } from './woodPieceRenderer.js';
import { UIRenderer } from './uiRenderer.js';

/**
 * Koordinerar all visuell rendering av spelet genom specialiserade renderare
 */
export class GameRenderer {
  private collapseCalculator: CollapsePredictionCalculator;
  private woodPieceRenderer: WoodPieceRenderer;
  private uiRenderer: UIRenderer;
  private i18n: I18n;
  
  constructor(canvas: HTMLCanvasElement, i18n: I18n) {
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Cannot get 2D context from canvas');
    }
    
    // Initialisera specialiserade renderare
    this.collapseCalculator = new CollapsePredictionCalculator(canvas.height);
    this.woodPieceRenderer = new WoodPieceRenderer(context);
    this.uiRenderer = new UIRenderer(context, i18n);
    this.i18n = i18n;
  }
  
  /**
   * Ritar hela spelscenen genom att koordinera specialiserade renderare
   */
  render(woodPieces: WoodPiece[], gameState: GameState, hoveredPiece?: WoodPiece): void {
    // Rensa och rita bakgrund
    this.woodPieceRenderer.clearCanvas();
    this.woodPieceRenderer.drawBackground();
    
    // Beräkna vilka pinnar som påverkas av hover
    const affectedPieces = hoveredPiece ? 
      this.collapseCalculator.calculateAffectedPieces(hoveredPiece, woodPieces) : [];
    
    // Rita vedpinnar med påverkanshighlighting
    this.woodPieceRenderer.drawWoodPieces(woodPieces, hoveredPiece, affectedPieces);
    
    // Rita spelstatus
    this.uiRenderer.drawGameStatus(gameState);
    
    // Rita aktiv varelse om det finns någon
    if (gameState.activeCreature) {
      this.uiRenderer.drawActiveCreature(gameState.activeCreature);
    }
    
    // Rita game over-overlay om spelet är slut
    if (gameState.isGameOver) {
      this.uiRenderer.drawGameOverOverlay();
    }
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