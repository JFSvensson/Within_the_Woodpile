import { WoodPiece } from '../../types/game.js';

/**
 * Hanterar animationer för rasande ved med fysik-baserade effekter
 */
export class WoodCollapseAnimator {
    private static readonly GRAVITY = 0.5; // Pixels per frame squared
    private static readonly MAX_FALL_SPEED = 15; // Max fall hastighet
    private static readonly MIN_ROTATION_SPEED = -0.15;
    private static readonly MAX_ROTATION_SPEED = 0.15;
    private static readonly ANIMATION_DURATION = 1000; // ms
    
    private collapsingPieces: Map<string, WoodPiece> = new Map();
    private onCollapseComplete?: (piece: WoodPiece) => void;

    /**
     * Startar kollaps-animation för flera vedpinnar
     * @param pieces Vedpinnar som ska kollapsa
     */
    public startCollapse(pieces: WoodPiece[]): void {
        const currentTime = performance.now();
        
        pieces.forEach(piece => {
            // Initiera animations-properties
            piece.isCollapsing = true;
            piece.collapseStartTime = currentTime;
            
            // Slumpmässig fallhastighet och rotation för naturlig effekt
            const randomXVelocity = (Math.random() - 0.5) * 4; // -2 till 2 pixels/frame
            piece.collapseVelocity = {
                x: randomXVelocity,
                y: 0 // Startar med 0, ökar med gravity
            };
            
            // Slumpmässig rotationshastighet
            piece.collapseRotation = 0;
            piece.collapseRotationSpeed = 
                WoodCollapseAnimator.MIN_ROTATION_SPEED + 
                Math.random() * (WoodCollapseAnimator.MAX_ROTATION_SPEED - WoodCollapseAnimator.MIN_ROTATION_SPEED);
            
            // Spara för uppdatering
            this.collapsingPieces.set(piece.id, piece);
        });
    }

    /**
     * Uppdaterar alla aktiva kollaps-animationer
     * @param deltaTime Tid sedan senaste frame (ms)
     * @returns Array med vedpinnar som fortfarande kollapsar
     */
    public update(deltaTime: number): WoodPiece[] {
        const stillCollapsing: WoodPiece[] = [];
        const currentTime = performance.now();
        
        this.collapsingPieces.forEach((piece, id) => {
            if (!piece.isCollapsing || !piece.collapseStartTime || !piece.collapseVelocity) {
                this.collapsingPieces.delete(id);
                return;
            }
            
            const elapsed = currentTime - piece.collapseStartTime;
            
            // Kolla om animationen är klar
            if (elapsed >= WoodCollapseAnimator.ANIMATION_DURATION) {
                piece.isCollapsing = false;
                piece.isRemoved = true;
                this.collapsingPieces.delete(id);
                this.onCollapseComplete?.(piece);
                return;
            }
            
            // Uppdatera velocity med gravity
            piece.collapseVelocity.y = Math.min(
                piece.collapseVelocity.y + WoodCollapseAnimator.GRAVITY,
                WoodCollapseAnimator.MAX_FALL_SPEED
            );
            
            // Uppdatera position
            piece.position.x += piece.collapseVelocity.x;
            piece.position.y += piece.collapseVelocity.y;
            
            // Uppdatera rotation
            if (piece.collapseRotationSpeed !== undefined) {
                piece.collapseRotation = (piece.collapseRotation || 0) + piece.collapseRotationSpeed;
            }
            
            stillCollapsing.push(piece);
        });
        
        return stillCollapsing;
    }

    /**
     * Renderar en kollapsande vedpinne med rotation och fade
     * @param ctx Canvas rendering context
     * @param piece Vedpinnen att rendera
     */
    public render(ctx: CanvasRenderingContext2D, piece: WoodPiece): void {
        if (!piece.isCollapsing || !piece.collapseStartTime) {
            return;
        }
        
        const elapsed = performance.now() - piece.collapseStartTime;
        const progress = Math.min(elapsed / WoodCollapseAnimator.ANIMATION_DURATION, 1);
        
        // Fade out effekt
        const opacity = 1 - progress;
        
        ctx.save();
        
        // Flytta till centrum av vedpinnen
        ctx.translate(
            piece.position.x + piece.size.width / 2,
            piece.position.y + piece.size.height / 2
        );
        
        // Applicera rotation
        if (piece.collapseRotation) {
            ctx.rotate(piece.collapseRotation);
        }
        
        // Sätt opacity
        ctx.globalAlpha = opacity;
        
        // Rita vedpinnen (centrerad)
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(
            -piece.size.width / 2,
            -piece.size.height / 2,
            piece.size.width,
            piece.size.height
        );
        
        // Rita outline
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.strokeRect(
            -piece.size.width / 2,
            -piece.size.height / 2,
            piece.size.width,
            piece.size.height
        );
        
        ctx.restore();
    }

    /**
     * Kontrollerar om det finns aktiva kollaps-animationer
     */
    public hasActiveAnimations(): boolean {
        return this.collapsingPieces.size > 0;
    }

    /**
     * Hämtar antal aktiva animationer
     */
    public getActiveCount(): number {
        return this.collapsingPieces.size;
    }

    /**
     * Callback när en kollaps-animation är färdig
     */
    public setOnCollapseComplete(callback: (piece: WoodPiece) => void): void {
        this.onCollapseComplete = callback;
    }

    /**
     * Rensar alla aktiva animationer
     */
    public clear(): void {
        this.collapsingPieces.clear();
    }

    /**
     * Cleanup
     */
    public destroy(): void {
        this.clear();
    }
}
