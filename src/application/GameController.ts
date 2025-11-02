import { I18n } from '../infrastructure/i18n/I18n.js';
import { AudioManager, SoundEvent } from '../infrastructure/audio/index.js';
import { Game } from '../core/game/Game.js';
import { AppStateManager } from '../appStateManager.js';
import { TransitionManager } from '../TransitionManager.js';
import { HighscoreManager } from '../core/managers/HighscoreManager.js';
import { ModalManager } from './ModalManager.js';
import { DEFAULT_CONFIG } from '../shared/constants/index.js';
import { DifficultyLevel } from '../types/index.js';

/**
 * Kontrollerar game session
 * Ansvarar för game lifecycle, highscore tracking och level progression
 */
export class GameController {
    private game: Game | null = null;
    private gameStartTime: number | null = null;
    private currentLevel: number = 1;
    private onReturnToMenuCallback?: () => void;

    constructor(
        private canvas: HTMLCanvasElement,
        private i18n: I18n,
        private audioManager: AudioManager,
        private appStateManager: AppStateManager,
        private transitionManager: TransitionManager,
        private highscoreManager: HighscoreManager,
        private modalManager: ModalManager
    ) {}

    /**
     * Startar ett nytt spel
     */
    async startGame(difficulty: DifficultyLevel = DifficultyLevel.NORMAL): Promise<void> {
        try {
            console.log(`Starting game - Difficulty: ${difficulty}`);
            
            // Skapa nytt spelobjekt med vald difficulty
            this.game = new Game(this.canvas, this.i18n, DEFAULT_CONFIG, difficulty, 1);
            
            // Spåra spelstart för highscore
            this.gameStartTime = Date.now();
            this.currentLevel = 1;
            
            // Sätt upp game callbacks
            this.setupGameCallbacks();
            
            // Initiera UI
            this.initializeGameUI();
            
            // Byt till spelläge
            this.appStateManager.startGame();
            
            // Visa spelstatistik
            document.body.classList.remove('menu-mode');
            const gameInfo = document.querySelector('.game-info') as HTMLElement;
            if (gameInfo) gameInfo.style.display = 'block';
            
            // Starta spelmusik
            this.audioManager?.playBackgroundMusic(SoundEvent.GAME_MUSIC);
            
        } catch (error) {
            console.error('Failed to start game:', error);
            await this.handleGameStartError();
        }
    }

    /**
     * Sätter upp callbacks för game events
     */
    private setupGameCallbacks(): void {
        if (!this.game) return;

        this.game.onScore((score: number) => this.updateGameStats(score, undefined));
        this.game.onHealth((health: number) => this.updateGameStats(undefined, health));
        this.game.onGameEnd(() => this.handleGameOver());
        this.game.setOnLevelComplete((levelData: any) => this.handleLevelComplete(levelData));
    }

    /**
     * Initialiserar game UI
     */
    private initializeGameUI(): void {
        if (!this.game) return;

        const levelManager = this.game.getLevelManager();
        const levelInfo = levelManager.getCurrentLevelInfo();
        this.currentLevel = levelInfo.levelNumber;
        
        this.updateGameStats(0, levelManager.getStartingHealth());
        this.updateLevelInfo(levelInfo.levelNumber, levelInfo.difficulty);
    }

    /**
     * Uppdaterar level och difficulty i UI
     */
    private updateLevelInfo(level: number, difficulty: DifficultyLevel): void {
        // Uppdatera level
        const levelElement = document.getElementById('level');
        if (levelElement) {
            levelElement.textContent = level.toString();
        }
        
        // Uppdatera difficulty med översättning
        const difficultyElement = document.getElementById('difficulty');
        if (difficultyElement) {
            const difficultyName = this.i18n.translate(`difficulty.${difficulty}.name`);
            difficultyElement.textContent = difficultyName;
            
            // Sätt färg baserat på difficulty
            const colors: Record<DifficultyLevel, string> = {
                [DifficultyLevel.EASY]: '#4CAF50',
                [DifficultyLevel.NORMAL]: '#2196F3',
                [DifficultyLevel.HARD]: '#FF9800',
                [DifficultyLevel.EXPERT]: '#F44336',
                [DifficultyLevel.NIGHTMARE]: '#9C27B0'
            };
            difficultyElement.style.color = colors[difficulty];
            difficultyElement.style.fontWeight = 'bold';
        }
    }

    /**
     * Uppdaterar game stats i UI
     */
    private updateGameStats(score?: number, health?: number): void {
        if (score !== undefined) {
            const scoreElement = document.getElementById('score');
            if (scoreElement) scoreElement.textContent = score.toString();
        }
        
        if (health !== undefined) {
            const healthElement = document.getElementById('health');
            if (healthElement) healthElement.textContent = health.toString();
        }
    }

    /**
     * Hanterar level complete
     */
    private async handleLevelComplete(levelData: any): Promise<void> {
        console.log('Level complete!', levelData);
        
        // Spela level complete ljud
        this.audioManager?.playSound(SoundEvent.LEVEL_COMPLETE);
        
        // Visa level complete modal
        await this.modalManager.showLevelComplete(
            levelData,
            () => this.continueToNextLevel(),
            () => this.finishGame(),
            () => this.quitToMenu()
        );
    }

    /**
     * Fortsätter till nästa level
     */
    private continueToNextLevel(): void {
        if (!this.game) return;

        this.audioManager?.playUIClick();
        this.game.startNextLevel();
        
        const levelManager = this.game.getLevelManager();
        this.currentLevel = levelManager.getCurrentLevel();
        const levelInfo = levelManager.getCurrentLevelInfo();
        
        // Uppdatera UI med ny level info
        this.updateLevelInfo(levelInfo.levelNumber, levelInfo.difficulty);
        
        console.log(`Starting level ${this.currentLevel}`);
    }

    /**
     * Avslutar spelet efter alla levels
     */
    private async finishGame(): Promise<void> {
        this.audioManager?.playUIClick();
        await this.handleGameOver();
    }

    /**
     * Går tillbaka till menyn
     */
    private async quitToMenu(): Promise<void> {
        this.audioManager?.playUIClick();
        await this.returnToMenu();
    }

    /**
     * Hanterar game over
     */
    private async handleGameOver(): Promise<void> {
        console.log('Game Over!');
        
        const finalScore = this.game?.getGameState().score || 0;
        const playDuration = this.gameStartTime ? Math.floor((Date.now() - this.gameStartTime) / 1000) : 0;
        const finalLevel = this.calculateLevelFromScore(finalScore);
        
        try {
            // Kontrollera om poäng kvalificerar för highscore
            const qualification = await this.highscoreManager.checkQualification(finalScore);
            
            if (qualification.result.qualifies) {
                console.log('Score qualifies for highscore!', qualification);
                await this.modalManager.showHighscoreWithAddScore(
                    this.highscoreManager,
                    finalScore,
                    finalLevel,
                    playDuration
                );
            } else {
                console.log('Score did not qualify:', qualification.message);
            }
        } catch (error) {
            console.error('Error checking highscore qualification:', error);
        } finally {
            // Alltid gå tillbaka till meny efter game over
            await this.returnToMenu();
        }
    }

    /**
     * Återgår till meny
     */
    private async returnToMenu(): Promise<void> {
        try {
            // Smooth övergång tillbaka till meny
            await this.transitionManager.transitionToMenu();
            
            // Förstör spelobjekt
            if (this.game) {
                this.game.destroy();
                this.game = null;
            }
            
            // Rensa spelsession variabler
            this.gameStartTime = null;
            this.currentLevel = 1;
            
            // Notifiera via callback
            if (this.onReturnToMenuCallback) {
                this.onReturnToMenuCallback();
            }
            
        } catch (error) {
            console.error('Error during game over transition:', error);
            
            // Fallback cleanup
            if (this.game) {
                this.game.destroy();
                this.game = null;
            }
            
            this.gameStartTime = null;
            this.currentLevel = 1;
            
            this.transitionManager.quickTransitionToMenu();
            
            if (this.onReturnToMenuCallback) {
                this.onReturnToMenuCallback();
            }
        }
    }

    /**
     * Hanterar fel vid game start
     */
    private async handleGameStartError(): Promise<void> {
        this.transitionManager.quickTransitionToMenu();
        
        if (this.onReturnToMenuCallback) {
            this.onReturnToMenuCallback();
        }
    }

    /**
     * Beräknar level baserat på poäng (approximering)
     */
    private calculateLevelFromScore(score: number): number {
        if (score < 100) return 1;
        if (score < 300) return 2;
        if (score < 600) return 3;
        if (score < 1000) return 4;
        if (score < 1500) return 5;
        return Math.min(10, Math.floor(score / 300) + 1);
    }

    /**
     * Pausar/återupptar spelet
     */
    togglePause(): void {
        this.game?.togglePause();
    }

    /**
     * Hämtar current game state
     */
    getGameState() {
        return this.game?.getGameState();
    }

    /**
     * Sätter callback för return to menu
     */
    setOnReturnToMenu(callback: () => void): void {
        this.onReturnToMenuCallback = callback;
    }

    /**
     * Cleanup
     */
    cleanup(): void {
        if (this.game) {
            this.game.destroy();
            this.game = null;
        }
        
        this.gameStartTime = null;
        this.currentLevel = 1;
    }
}
