import { WoodPiece, GameState, GameConfig, ActiveCreature, CreatureType } from '../types.js';

/**
 * Hanterar alla varelser (creatures) i spelet - spawning, reactions och timers
 * Följer Single Responsibility Principle genom att fokusera enbart på creature-logik
 */
export class CreatureManager {
    private config: GameConfig;
    private gameState: GameState;

    // Callbacks för creature events
    private onScoreUpdate?: (points: number) => void;
    private onHealthUpdate?: (damage: number) => void;

    constructor(config: GameConfig, gameState: GameState) {
        this.config = config;
        this.gameState = gameState;
    }

    /**
     * Hanterar möte med varelse när en vedpinne plockas
     */
    public encounterCreature(piece: WoodPiece): void {
        if (!piece.creature) return;
        
        this.gameState.activeCreature = {
            type: piece.creature,
            timeLeft: this.config.reactionTime,
            position: { ...piece.position },
            maxTime: this.config.reactionTime
        };
        
        // Ta bort veden (varelser visas ovanpå)
        piece.isRemoved = true;
    }

    /**
     * Hanterar lyckad reaktion på varelse (rätt tangent tryckt i tid)
     */
    public handleSuccessfulReaction(): void {
        if (!this.gameState.activeCreature) return;
        
        // Ge dubbla poäng för lyckad reaktion
        const points = this.config.pointsPerWood * 2;
        this.onScoreUpdate?.(points);
        
        // Ta bort aktiv varelse
        this.gameState.activeCreature = undefined;
    }

    /**
     * Hanterar misslyckad reaktion på varelse (timeout eller fel tangent)
     */
    public handleFailedReaction(): void {
        if (!this.gameState.activeCreature) return;
        
        // Minska hälsa
        this.onHealthUpdate?.(this.config.healthPenalty);
        
        // Ta bort aktiv varelse
        this.gameState.activeCreature = undefined;
    }

    /**
     * Uppdaterar aktiv varelse (timers och timeout-kontroll)
     */
    public updateActiveCreature(deltaTime: number): boolean {
        if (!this.gameState.activeCreature) {
            return false;
        }

        // Minska återstående tid
        this.gameState.activeCreature.timeLeft -= deltaTime;
        
        // Kontrollera timeout
        if (this.gameState.activeCreature.timeLeft <= 0) {
            this.handleFailedReaction();
            return true; // Timeout inträffade
        }
        
        return false; // Creature fortfarande aktiv
    }

    /**
     * Kontrollerar om det finns en aktiv varelse
     */
    public hasActiveCreature(): boolean {
        return this.gameState.activeCreature !== undefined;
    }

    /**
     * Hämtar aktiv varelse (för rendering och UI)
     */
    public getActiveCreature(): ActiveCreature | undefined {
        return this.gameState.activeCreature;
    }

    /**
     * Kontrollerar om en vedpinne innehåller en varelse
     */
    public hasCreature(piece: WoodPiece): boolean {
        return piece.creature !== undefined;
    }

    /**
     * Tvingar bort aktiv varelse (används vid restart)
     */
    public clearActiveCreature(): void {
        this.gameState.activeCreature = undefined;
    }

    /**
     * Uppdaterar referens till gameState (anropas när state ändras)
     */
    public updateGameState(gameState: GameState): void {
        this.gameState = gameState;
    }

    /**
     * Callback-setters för att koppla creature events till spellogik
     */
    public setOnScoreUpdate(callback: (points: number) => void): void {
        this.onScoreUpdate = callback;
    }

    public setOnHealthUpdate(callback: (damage: number) => void): void {
        this.onHealthUpdate = callback;
    }

    /**
     * Rensa resurser (för närvarande inga att rensa)
     */
    public destroy(): void {
        this.gameState.activeCreature = undefined;
    }
}