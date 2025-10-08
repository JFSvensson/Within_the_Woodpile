/**
 * Hanterar responsiv design och anpassning för olika skärmstorlekar
 */
export class ResponsiveManager {
  private canvas: HTMLCanvasElement;
  private resizeTimeout: number | null = null;
  private currentBreakpoint: string = '';

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.setupEventListeners();
    this.updateCanvasSize();
  }

  /**
   * Sätter upp event listeners för resize och orientation change
   */
  private setupEventListeners(): void {
    window.addEventListener('resize', () => this.handleResize());
    window.addEventListener('orientationchange', () => {
      // Vänta lite efter orientation change för att få rätt dimensioner
      setTimeout(() => this.handleResize(), 100);
    });
  }

  /**
   * Hanterar resize events med debouncing
   */
  private handleResize(): void {
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    
    this.resizeTimeout = window.setTimeout(() => {
      this.updateCanvasSize();
      this.resizeTimeout = null;
    }, 250);
  }

  /**
   * Uppdaterar canvas-storlek baserat på skärmstorlek
   */
  private updateCanvasSize(): void {
    const breakpoint = this.getCurrentBreakpoint();
    
    // Bara uppdatera om breakpoint har ändrats
    if (breakpoint === this.currentBreakpoint) {
      return;
    }
    
    this.currentBreakpoint = breakpoint;
    
    const dimensions = this.getCanvasDimensions(breakpoint);
    
    // Uppdatera canvas storlek
    this.canvas.width = dimensions.width;
    this.canvas.height = dimensions.height;
    
    // Trigga event för andra komponenter som behöver veta om resize
    window.dispatchEvent(new CustomEvent('canvasResize', {
      detail: { width: dimensions.width, height: dimensions.height, breakpoint }
    }));
    
    console.log(`Canvas resized to ${dimensions.width}x${dimensions.height} (${breakpoint})`);
  }

  /**
   * Returnerar nuvarande breakpoint
   */
  private getCurrentBreakpoint(): string {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isLandscape = width > height;
    
    if (width <= 480) {
      return isLandscape ? 'mobile-landscape' : 'mobile';
    } else if (width <= 768) {
      return 'tablet';
    } else if (width <= 1200) {
      return 'desktop';
    } else {
      return 'large-desktop';
    }
  }

  /**
   * Returnerar optimala canvas-dimensioner för given breakpoint
   */
  private getCanvasDimensions(breakpoint: string): { width: number; height: number } {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    switch (breakpoint) {
      case 'mobile':
        return {
          width: Math.min(400, viewportWidth - 16),
          height: 300
        };
        
      case 'mobile-landscape':
        return {
          width: Math.min(600, viewportWidth - 16),
          height: Math.min(400, viewportHeight - 200)
        };
        
      case 'tablet':
        return {
          width: Math.min(600, viewportWidth - 30),
          height: 450
        };
        
      case 'desktop':
        return {
          width: 800,
          height: 600
        };
        
      case 'large-desktop':
        return {
          width: 900,
          height: 675
        };
        
      default:
        return {
          width: 800,
          height: 600
        };
    }
  }

  /**
   * Returnerar om vi är på en mobil enhet
   */
  isMobile(): boolean {
    return this.currentBreakpoint.includes('mobile');
  }

  /**
   * Returnerar om vi är på en tablet
   */
  isTablet(): boolean {
    return this.currentBreakpoint === 'tablet';
  }

  /**
   * Returnerar om vi är på desktop eller större
   */
  isDesktop(): boolean {
    return this.currentBreakpoint.includes('desktop');
  }

  /**
   * Returnerar nuvarande breakpoint
   */
  getBreakpoint(): string {
    return this.currentBreakpoint;
  }

  /**
   * Förstör event listeners
   */
  destroy(): void {
    window.removeEventListener('resize', () => this.handleResize());
    window.removeEventListener('orientationchange', () => this.handleResize());
    
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
  }
}