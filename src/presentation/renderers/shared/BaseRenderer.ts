/**
 * Abstract base class för alla renderare
 * Tillhandahåller gemensam funktionalitet och tvingar konsistent interface
 */
export abstract class BaseRenderer {
  protected ctx: CanvasRenderingContext2D;
  protected canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not get 2D context from canvas');
    }
    this.ctx = context;
  }

  /**
   * Abstract render-metod som alla renderare måste implementera
   */
  public abstract render(...args: any[]): void;

  /**
   * Rensar hela canvas
   */
  protected clearCanvas(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Rensar ett specifikt område
   */
  protected clearArea(x: number, y: number, width: number, height: number): void {
    this.ctx.clearRect(x, y, width, height);
  }

  /**
   * Sätter rendering-kontext med gemensamma inställningar
   */
  protected setupContext(): void {
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
  }

  /**
   * Sparar context state
   */
  protected saveContext(): void {
    this.ctx.save();
  }

  /**
   * Återställer context state
   */
  protected restoreContext(): void {
    this.ctx.restore();
  }

  /**
   * Hämtar canvas dimensioner
   */
  protected getCanvasDimensions(): { width: number; height: number } {
    return {
      width: this.canvas.width,
      height: this.canvas.height
    };
  }

  /**
   * Kontrollerar om en punkt är inom canvas
   */
  protected isPointInCanvas(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.canvas.width && y < this.canvas.height;
  }

  /**
   * Beräknar textbredd
   */
  protected measureText(text: string, font?: string): number {
    if (font) {
      this.saveContext();
      this.ctx.font = font;
    }
    
    const width = this.ctx.measureText(text).width;
    
    if (font) {
      this.restoreContext();
    }
    
    return width;
  }

  /**
   * Ritar text med shadow-effekt
   */
  protected renderTextWithShadow(
    text: string, 
    x: number, 
    y: number, 
    color: string = '#FFFFFF', 
    shadowColor: string = '#000000'
  ): void {
    // Rita shadow
    this.ctx.fillStyle = shadowColor;
    this.ctx.fillText(text, x + 1, y + 1);
    
    // Rita text
    this.ctx.fillStyle = color;
    this.ctx.fillText(text, x, y);
  }
}