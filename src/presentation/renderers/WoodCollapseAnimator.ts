import { WoodPiece } from '../../types/game.js';
import { WoodType, WOOD_TYPE_CONFIG } from '../../types/wood.js';

/**
 * Hanterar animationer för rasande ved med fysik-baserade effekter
 */
export class WoodCollapseAnimator {
    private static readonly GRAVITY = 0.6; // Pixels per frame squared (ökat från 0.5 för snabbare fall)
    private static readonly MAX_FALL_SPEED = 18; // Max fall hastighet (ökat från 15)
    private static readonly MIN_ROTATION_SPEED = -0.18; // Mer rotation för dramatik
    private static readonly MAX_ROTATION_SPEED = 0.18;
    private static readonly ANIMATION_DURATION = 1200; // ms (längre för smooth fade-out)
    
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
     * Renderar en kollapsande vedpinne med rotation och fade (rund ved)
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
        
        const radius = Math.min(piece.size.width, piece.size.height) / 2;
        const centerX = piece.position.x + piece.size.width / 2;
        const centerY = piece.position.y + piece.size.height / 2;
        
        ctx.save();
        
        // Flytta till centrum av vedpinnen
        ctx.translate(centerX, centerY);
        
        // Applicera rotation
        if (piece.collapseRotation) {
            ctx.rotate(piece.collapseRotation);
        }
        
        // Sätt opacity
        ctx.globalAlpha = opacity;
        
        // Hämta färg baserat på wood type
        const woodType = piece.woodType || WoodType.NORMAL;
        const baseColor = this.getWoodColor(woodType);
        
        // Rita rund vedpinne
        ctx.fillStyle = baseColor;
        ctx.beginPath();
        ctx.arc(0, 0, radius - 1, 0, 2 * Math.PI);
        ctx.fill();
        
        // Rita outline
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, radius - 1, 0, 2 * Math.PI);
        ctx.stroke();
        
        ctx.restore();
    }

    /**
     * Hämtar färg för wood type (matchar WoodPieceRenderer)
     */
    private getWoodColor(woodType: WoodType | string): string {
        const type = typeof woodType === 'string' ? woodType.toLowerCase() : woodType;
        
        switch (type) {
            case WoodType.GOLDEN:
            case 'golden':
                return '#DAA520'; // Guldbrun
            case WoodType.CURSED:
            case 'cursed':
                return '#4A148C'; // Mörklila
            case WoodType.FRAGILE:
            case 'fragile':
                return '#D84315'; // Rödaktig
            case WoodType.BONUS:
            case 'bonus':
                return '#388E3C'; // Grön
            default:
                return '#8b4513'; // Normal brun
        }
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
