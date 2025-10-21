/**
 * Hanterar screen shake-effekter för dramatiska händelser
 */
export class ScreenShakeManager {
    private isShaking: boolean = false;
    private shakeIntensity: number = 0;
    private shakeDuration: number = 0;
    private shakeStartTime: number = 0;
    private shakeOffsetX: number = 0;
    private shakeOffsetY: number = 0;

    private static readonly BASE_INTENSITY = 5; // pixels
    private static readonly INTENSITY_PER_PIECE = 2; // extra pixels per collapsing piece
    private static readonly MAX_INTENSITY = 20; // max shake distance
    private static readonly BASE_DURATION = 250; // ms
    private static readonly DURATION_PER_PIECE = 50; // extra ms per piece

    /**
     * Startar screen shake baserat på kollaps-intensitet
     * @param collapseCount Antal vedpinnar som kollapsar
     */
    public startShake(collapseCount: number): void {
        // Beräkna intensitet baserat på antal rasande pinnar
        this.shakeIntensity = Math.min(
            ScreenShakeManager.BASE_INTENSITY + (collapseCount * ScreenShakeManager.INTENSITY_PER_PIECE),
            ScreenShakeManager.MAX_INTENSITY
        );

        // Beräkna duration baserat på intensitet
        this.shakeDuration = ScreenShakeManager.BASE_DURATION + (collapseCount * ScreenShakeManager.DURATION_PER_PIECE);
        this.shakeDuration = Math.min(this.shakeDuration, 600); // Max 600ms

        this.shakeStartTime = performance.now();
        this.isShaking = true;

        console.log(`Screen shake started: intensity=${this.shakeIntensity}, duration=${this.shakeDuration}ms`);
    }

    /**
     * Uppdaterar screen shake-effekten
     * @returns Offset för canvas rendering { x, y, rotation }
     */
    public update(): { x: number; y: number; rotation: number } {
        if (!this.isShaking) {
            return { x: 0, y: 0, rotation: 0 };
        }

        const elapsed = performance.now() - this.shakeStartTime;
        
        // Kolla om shake är färdig
        if (elapsed >= this.shakeDuration) {
            this.isShaking = false;
            this.shakeOffsetX = 0;
            this.shakeOffsetY = 0;
            return { x: 0, y: 0, rotation: 0 };
        }

        // Beräkna decay (minskar över tid)
        const progress = elapsed / this.shakeDuration;
        const decay = 1 - progress; // 1.0 → 0.0

        // Slumpmässig offset med decay
        const currentIntensity = this.shakeIntensity * decay;
        this.shakeOffsetX = (Math.random() - 0.5) * 2 * currentIntensity;
        this.shakeOffsetY = (Math.random() - 0.5) * 2 * currentIntensity;

        // Lägg till lite rotation för extra effekt
        const rotation = (Math.random() - 0.5) * 0.02 * decay; // Max ±0.01 radians

        return {
            x: this.shakeOffsetX,
            y: this.shakeOffsetY,
            rotation
        };
    }

    /**
     * Applicerar shake-offset på canvas context
     * @param ctx Canvas rendering context
     */
    public applyShake(ctx: CanvasRenderingContext2D): void {
        if (!this.isShaking) {
            return;
        }

        const offset = this.update();
        
        // Flytta canvas baserat på shake
        ctx.translate(offset.x, offset.y);
        
        // Lägg till subtil rotation runt centrum
        if (offset.rotation !== 0) {
            const centerX = ctx.canvas.width / 2;
            const centerY = ctx.canvas.height / 2;
            ctx.translate(centerX, centerY);
            ctx.rotate(offset.rotation);
            ctx.translate(-centerX, -centerY);
        }
    }

    /**
     * Återställer canvas transform efter shake
     * @param ctx Canvas rendering context
     */
    public resetShake(ctx: CanvasRenderingContext2D): void {
        // Canvas transform återställs automatiskt med ctx.restore() i render-loopen
    }

    /**
     * Kontrollerar om shake är aktiv
     */
    public isActive(): boolean {
        return this.isShaking;
    }

    /**
     * Hämtar nuvarande shake-intensitet (för debugging)
     */
    public getCurrentIntensity(): number {
        if (!this.isShaking) return 0;
        
        const elapsed = performance.now() - this.shakeStartTime;
        const progress = elapsed / this.shakeDuration;
        const decay = 1 - progress;
        
        return this.shakeIntensity * decay;
    }

    /**
     * Stoppar shake direkt (för emergency stop)
     */
    public stop(): void {
        this.isShaking = false;
        this.shakeOffsetX = 0;
        this.shakeOffsetY = 0;
    }

    /**
     * Cleanup
     */
    public destroy(): void {
        this.stop();
    }
}
