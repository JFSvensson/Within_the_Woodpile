import { GameState, GameConfig } from '../../types/index.js';

/**
 * Hanterar all spelstate - poäng, hälsa, speltillstånd och game flow
 * Följer Single Responsibility Principle genom att fokusera enbart på state management
 */
export class GameStateManager {
    private gameState: GameState;
    private config: GameConfig;

    // Callbacks för state events
    private onScoreUpdate?: (score: number) => void;
    private onHealthUpdate?: (health: number) => void;
    private onGameOver?: () => void;
    private onGameRestart?: () => void;

    constructor(config: GameConfig, initialState?: GameState) {
        this.config = config;
        this.gameState = initialState || this.createInitialGameState();
    }

    /**
     * Skapar initialt speltillstånd
     */
    private createInitialGameState(): GameState {
        return {
            score: 0,
            health: 100,
            isGameOver: false,
            isPaused: false,
            activeCreature: undefined
        };
    }

    /**
     * Lägger till poäng och triggar callback
     */
    public addScore(points: number): void {
        this.gameState.score += points;
        this.onScoreUpdate?.(this.gameState.score);
    }

    /**
     * Minskar hälsa och kontrollerar game over
     */
    public reduceHealth(damage: number): void {
        this.gameState.health = Math.max(0, this.gameState.health - damage);
        this.onHealthUpdate?.(this.gameState.health);
        
        if (this.gameState.health <= 0) {
            this.endGame();
        }
    }

    /**
     * Avslutar spelet
     */
    public endGame(): void {
        this.gameState.isGameOver = true;
        this.onGameOver?.();
    }

    /**
     * Startar om spelet med fresh state
     */
    public restartGame(): void {
        this.gameState = this.createInitialGameState();
        
        // Trigga callbacks för UI update
        this.onScoreUpdate?.(0);
        this.onHealthUpdate?.(100);
        this.onGameRestart?.();
    }

    /**
     * Pausar/återupptar spelet
     */
    public togglePause(): void {
        this.gameState.isPaused = !this.gameState.isPaused;
    }

    /**
     * Sätter paus-status direkt
     */
    public setPaused(paused: boolean): void {
        this.gameState.isPaused = paused;
    }

    /**
     * Kontrollerar om spelet är över
     */
    public isGameOver(): boolean {
        return this.gameState.isGameOver;
    }

    /**
     * Kontrollerar om spelet är pausat
     */
    public isPaused(): boolean {
        return this.gameState.isPaused;
    }

    /**
     * Hämtar aktuell poäng
     */
    public getScore(): number {
        return this.gameState.score;
    }

    /**
     * Hämtar aktuell hälsa
     */
    public getHealth(): number {
        return this.gameState.health;
    }

    /**
     * Hämtar komplett speltillstånd (readonly kopia)
     */
    public getGameState(): GameState {
        return { ...this.gameState };
    }

    /**
     * Hämtar referens till speltillstånd (för andra managers som behöver direkt access)
     * OBS: Används sparsamt och med försiktighet
     */
    public getGameStateReference(): GameState {
        return this.gameState;
    }

    /**
     * Uppdaterar specifik del av game state (advanced usage)
     */
    public updateGameState(updates: Partial<GameState>): void {
        this.gameState = { ...this.gameState, ...updates };
        
        // Trigga relevanta callbacks
        if (updates.score !== undefined) {
            this.onScoreUpdate?.(this.gameState.score);
        }
        if (updates.health !== undefined) {
            this.onHealthUpdate?.(this.gameState.health);
        }
        if (updates.isGameOver === true) {
            this.onGameOver?.();
        }
    }

    /**
     * Kontrollerar om spelet kan fortsätta (inte över eller pausat)
     */
    public canContinueGame(): boolean {
        return !this.gameState.isGameOver && !this.gameState.isPaused;
    }

    /**
     * Hämtar spelstatistik för debug/analys
     */
    public getGameStats(): {
        score: number;
        health: number;
        healthPercentage: number;
        isActive: boolean;
        hasActiveCreature: boolean;
    } {
        return {
            score: this.gameState.score,
            health: this.gameState.health,
            healthPercentage: this.gameState.health,
            isActive: this.canContinueGame(),
            hasActiveCreature: this.gameState.activeCreature !== undefined
        };
    }

    /**
     * Callback-setters för att koppla state events till UI
     */
    public setOnScoreUpdate(callback: (score: number) => void): void {
        this.onScoreUpdate = callback;
    }

    public setOnHealthUpdate(callback: (health: number) => void): void {
        this.onHealthUpdate = callback;
    }

    public setOnGameOver(callback: () => void): void {
        this.onGameOver = callback;
    }

    public setOnGameRestart(callback: () => void): void {
        this.onGameRestart = callback;
    }

    /**
     * Rensa resurser
     */
    public destroy(): void {
        // Rensa callbacks
        this.onScoreUpdate = undefined;
        this.onHealthUpdate = undefined;
        this.onGameOver = undefined;
        this.onGameRestart = undefined;
    }
}