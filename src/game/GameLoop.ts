/**
 * Hanterar huvudspelloop - timing, animation och koordinering av updates
 * Följer Single Responsibility Principle genom att fokusera enbart på loop-hantering
 */
export class GameLoop {
    private animationId?: number;
    private lastUpdateTime: number = 0;
    private isRunning: boolean = false;

    // Callbacks för loop events
    private onUpdate?: (deltaTime: number) => void;
    private onRender?: () => void;

    constructor() {
        // Binda loop-funktionen för konsistent 'this' context
        this.gameLoop = this.gameLoop.bind(this);
    }

    /**
     * Startar huvudspelloop
     */
    public start(): void {
        if (this.isRunning) {
            return; // Redan igång
        }
        
        this.isRunning = true;
        this.lastUpdateTime = performance.now();
        this.animationId = requestAnimationFrame(this.gameLoop);
    }

    /**
     * Stoppar spelloop
     */
    public stop(): void {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = undefined;
        }
        this.isRunning = false;
    }

    /**
     * Kontrollerar om loop körs
     */
    public isLoopRunning(): boolean {
        return this.isRunning;
    }

    /**
     * Huvudspelloop - kallas av requestAnimationFrame
     */
    private gameLoop(currentTime: number): void {
        if (!this.isRunning) {
            return;
        }

        // Beräkna delta time
        const deltaTime = currentTime - this.lastUpdateTime;
        this.lastUpdateTime = currentTime;
        
        // Utför update och render
        this.onUpdate?.(deltaTime);
        this.onRender?.();
        
        // Schemalägg nästa frame
        this.animationId = requestAnimationFrame(this.gameLoop);
    }

    /**
     * Pausar loop (stoppar utan att rensa state)
     */
    public pause(): void {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = undefined;
        }
        this.isRunning = false;
    }

    /**
     * Återupptar loop från pausad state
     */
    public resume(): void {
        if (this.isRunning) {
            return; // Redan igång
        }
        
        this.isRunning = true;
        this.lastUpdateTime = performance.now(); // Reset timing för smooth resume
        this.animationId = requestAnimationFrame(this.gameLoop);
    }

    /**
     * Hämtar aktuell framerate (approximativ)
     */
    public getCurrentFPS(deltaTime: number): number {
        return deltaTime > 0 ? Math.round(1000 / deltaTime) : 0;
    }

    /**
     * Hämtar loop-statistik för debugging
     */
    public getLoopStats(): {
        isRunning: boolean;
        hasAnimationId: boolean;
        lastUpdateTime: number;
    } {
        return {
            isRunning: this.isRunning,
            hasAnimationId: this.animationId !== undefined,
            lastUpdateTime: this.lastUpdateTime
        };
    }

    /**
     * Callback-setters för att koppla loop till spellogik
     */
    public setOnUpdate(callback: (deltaTime: number) => void): void {
        this.onUpdate = callback;
    }

    public setOnRender(callback: () => void): void {
        this.onRender = callback;
    }

    /**
     * Rensa resurser och stoppa loop
     */
    public destroy(): void {
        this.stop();
        this.onUpdate = undefined;
        this.onRender = undefined;
    }
}