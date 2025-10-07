import { WoodPiece, GameState, CreatureType } from '../../types/index.js';
import { KEY_BINDINGS } from '../../shared/constants/index.js';
import type { InputHandler, GameInputCallbacks } from './interfaces.js';

/**
 * Hanterar all input från användaren - mus och tangentbord
 * Följer Single Responsibility Principle genom att fokusera enbart på input-hantering
 */
export class GameInputHandler implements InputHandler {
    private canvas: HTMLCanvasElement;
    private woodPieces: WoodPiece[];
    private gameState: GameState;
    private callbacks: GameInputCallbacks = {};
    private onHoverChange?: (piece?: WoodPiece) => void;

    private currentHoveredPiece?: WoodPiece;

    constructor(canvas: HTMLCanvasElement, woodPieces: WoodPiece[], gameState: GameState) {
        this.canvas = canvas;
        this.woodPieces = woodPieces;
        this.gameState = gameState;
        
        this.setupEventListeners();
    }

    /**
     * Sätter upp alla event listeners för input
     */
    public setupEventListeners(): void {
        // Musinteraktion
        this.canvas.addEventListener('click', this.handleCanvasClick.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
        
        // Tangentbordsinput för varelsereaktioner
        document.addEventListener('keydown', this.handleKeyPress.bind(this));
    }

    /**
     * Hanterar musklick på canvas
     */
    private handleCanvasClick(event: MouseEvent): void {
        if (this.gameState.isGameOver) {
            this.callbacks.onGameRestart?.();
            return;
        }
        
        if (this.gameState.isPaused || this.gameState.activeCreature) {
            return;
        }
        
        const clickedPiece = this.getClickedPiece(event);
        if (clickedPiece) {
            this.callbacks.onWoodPieceClick?.(clickedPiece);
        }
    }

    /**
     * Hanterar musrörelse för hover-effekter
     */
    private handleMouseMove(event: MouseEvent): void {
        if (this.gameState.isGameOver || this.gameState.activeCreature) {
            return;
        }
        
        const hoveredPiece = this.getClickedPiece(event);
        if (hoveredPiece !== this.currentHoveredPiece) {
            this.currentHoveredPiece = hoveredPiece;
            this.onHoverChange?.(hoveredPiece);
        }
    }

    /**
     * Hanterar när muspekaren lämnar canvas
     */
    private handleMouseLeave(): void {
        this.currentHoveredPiece = undefined;
        this.onHoverChange?.(undefined);
    }

    /**
     * Hanterar tangenttryckningar för varelsereaktioner
     */
    private handleKeyPress(event: KeyboardEvent): void {
        if (!this.gameState.activeCreature) {
            return;
        }
        
        const binding = KEY_BINDINGS.find(b => 
            b.creature === this.gameState.activeCreature!.type &&
            (b.key === event.key || b.keyCode === event.code)
        );
        
        if (binding) {
            this.callbacks.onSuccessfulCreatureReaction?.();
            event.preventDefault();
        }
    }

    /**
     * Hittar vedpinne vid musposition (uppdaterat för runda vedpinnar)
     */
    private getClickedPiece(event: MouseEvent): WoodPiece | undefined {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Kolla vedpinnar i omvänd ordning (översta först)
        for (let i = this.woodPieces.length - 1; i >= 0; i--) {
            const piece = this.woodPieces[i];
            if (piece.isRemoved) continue;
            
            // Beräkna centrum och radie för rund vedpinne
            const centerX = piece.position.x + piece.size.width / 2;
            const centerY = piece.position.y + piece.size.height / 2;
            const radius = Math.min(piece.size.width, piece.size.height) / 2;
            
            // Kontrollera om musposition är inom cirkelns radie
            const distance = Math.sqrt(
                Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
            );
            
            if (distance <= radius) {
                return piece;
            }
        }
        
        return undefined;
    }

    /**
     * Uppdaterar referenserna till woodPieces och gameState
     * Anropas när dessa ändras i huvudspelet
     */
    public updateReferences(woodPieces: WoodPiece[], gameState: GameState): void {
        this.woodPieces = woodPieces;
        this.gameState = gameState;
    }

    /**
     * Sätter callbacks för input events
     */
    public setCallbacks(callbacks: GameInputCallbacks): void {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    public setOnWoodPieceClick(callback: (piece: WoodPiece) => void): void {
        this.callbacks.onWoodPieceClick = callback;
    }

    public setOnSuccessfulCreatureReaction(callback: () => void): void {
        this.callbacks.onSuccessfulCreatureReaction = callback;
    }

    public setOnGameRestart(callback: () => void): void {
        this.callbacks.onGameRestart = callback;
    }

    public setOnHoverChange(callback: (piece?: WoodPiece) => void): void {
        this.onHoverChange = callback;
    }

    /**
     * Getter för nuvarande hoverade piece
     */
    public getCurrentHoveredPiece(): WoodPiece | undefined {
        return this.currentHoveredPiece;
    }

    /**
     * Implementerar InputHandler cleanup
     */
    public cleanup(): void {
        this.canvas.removeEventListener('click', this.handleCanvasClick);
        this.canvas.removeEventListener('mousemove', this.handleMouseMove);
        this.canvas.removeEventListener('mouseleave', this.handleMouseLeave);
        document.removeEventListener('keydown', this.handleKeyPress);
    }

    /**
     * Rensa event listeners och resurser (deprecated, använd cleanup)
     */
    public destroy(): void {
        this.cleanup();
    }
}