import { 
    DifficultyLevel, 
    LevelInfo, 
    LevelProgress, 
    LevelEvent,
    DifficultyModifiers 
} from '../../types/difficulty.js';
import { GameConfig } from '../../types/config.js';
import { 
    DIFFICULTY_CONFIGS, 
    LEVEL_PROGRESSION, 
    MAX_LEVELS,
    SPEED_BONUS_PER_SECOND,
    BASE_TIME_FOR_BONUS
} from '../../shared/constants/difficultyConfig.js';

/**
 * Hanterar nivåprogression, svårighetsgrader och level-baserad logik
 */
export class LevelManager {
    private currentLevel: number = 1;
    private difficulty: DifficultyLevel;
    private levelStartTime: number = 0;
    private highestLevelReached: number = 1;
    private totalSessionScore: number = 0;
    private woodCollectedThisLevel: number = 0;
    private eventCallbacks: Map<LevelEvent['type'], Array<(event: LevelEvent) => void>> = new Map();

    constructor(
        difficulty: DifficultyLevel = DifficultyLevel.NORMAL,
        startingLevel: number = 1
    ) {
        this.difficulty = difficulty;
        this.currentLevel = Math.max(1, Math.min(startingLevel, MAX_LEVELS));
        this.highestLevelReached = this.currentLevel;
    }

    /**
     * Hämtar information om nuvarande nivå
     */
    getCurrentLevelInfo(): LevelInfo {
        const progression = LEVEL_PROGRESSION[this.currentLevel - 1] || LEVEL_PROGRESSION[0];
        
        return {
            levelNumber: this.currentLevel,
            woodPieceCount: progression.woodCount,
            stackHeight: progression.stackHeight,
            difficulty: this.difficulty,
            targetScore: progression.targetScore,
            speedBonus: this.calculateSpeedBonus(),
            timeLimit: BASE_TIME_FOR_BONUS
        };
    }

    /**
     * Hämtar modifierare för nuvarande svårighetsgrad
     */
    getDifficultyModifiers(): DifficultyModifiers {
        return DIFFICULTY_CONFIGS[this.difficulty];
    }

    /**
     * Applicerar svårighetsgrad-modifierare på en GameConfig
     */
    applyDifficultyToConfig(baseConfig: GameConfig): GameConfig {
        const modifiers = this.getDifficultyModifiers();
        
        return {
            ...baseConfig,
            reactionTime: modifiers.reactionTime,
            creatureProbability: baseConfig.creatureProbability * modifiers.creatureSpawnMultiplier,
            healthPenalty: Math.round(baseConfig.healthPenalty * modifiers.healthMultiplier),
            collapseDamage: Math.round(baseConfig.collapseDamage * modifiers.collapseDamageMultiplier)
        };
    }

    /**
     * Startar en ny nivå
     */
    startLevel(levelNumber?: number): void {
        if (levelNumber !== undefined) {
            this.currentLevel = Math.max(1, Math.min(levelNumber, MAX_LEVELS));
        }
        
        this.levelStartTime = Date.now();
        this.woodCollectedThisLevel = 0;
        
        this.emitEvent({
            type: 'LEVEL_START',
            level: this.currentLevel,
            difficulty: this.difficulty,
            timestamp: this.levelStartTime
        });
    }

    /**
     * Registrerar att en vedpinne plockats
     */
    onWoodCollected(points: number): void {
        this.woodCollectedThisLevel++;
        this.totalSessionScore += points;
    }

    /**
     * Kontrollerar om nivån är klar
     */
    isLevelComplete(): boolean {
        const levelInfo = this.getCurrentLevelInfo();
        return this.woodCollectedThisLevel >= levelInfo.woodPieceCount;
    }

    /**
     * Avslutar nuvarande nivå och returnerar level complete data
     */
    completeLevel(): {
        levelNumber: number;
        speedBonus: number;
        totalScore: number;
        completionTime: number;
        nextLevel: number | null;
    } {
        const speedBonus = this.calculateSpeedBonus();
        const completionTime = this.getLevelDuration();
        const levelNumber = this.currentLevel;
        
        // Öka total poäng med speed bonus
        this.totalSessionScore += speedBonus;
        
        // Uppdatera högsta nivå
        this.highestLevelReached = Math.max(this.highestLevelReached, this.currentLevel);
        
        // Gå till nästa nivå
        const hasNextLevel = this.currentLevel < MAX_LEVELS;
        const nextLevel = hasNextLevel ? this.currentLevel + 1 : null;
        
        if (hasNextLevel) {
            this.currentLevel++;
        }
        
        this.emitEvent({
            type: 'LEVEL_COMPLETE',
            level: levelNumber,
            difficulty: this.difficulty,
            timestamp: Date.now(),
            data: { speedBonus, completionTime, nextLevel }
        });
        
        return {
            levelNumber,
            speedBonus,
            totalScore: this.totalSessionScore,
            completionTime,
            nextLevel
        };
    }

    /**
     * Beräknar speed bonus baserat på hur snabbt nivån klarades
     */
    private calculateSpeedBonus(): number {
        if (this.levelStartTime === 0) return 0;
        
        const duration = this.getLevelDuration();
        const timeUnderLimit = Math.max(0, BASE_TIME_FOR_BONUS - duration);
        
        return Math.floor(timeUnderLimit * SPEED_BONUS_PER_SECOND);
    }

    /**
     * Hämtar hur länge nivån pågått (i sekunder)
     */
    getLevelDuration(): number {
        if (this.levelStartTime === 0) return 0;
        return Math.floor((Date.now() - this.levelStartTime) / 1000);
    }

    /**
     * Hämtar progress-information
     */
    getProgress(): LevelProgress {
        const levelInfo = this.getCurrentLevelInfo();
        
        return {
            currentLevel: this.currentLevel,
            highestLevelReached: this.highestLevelReached,
            totalScore: this.totalSessionScore,
            woodCollectedThisLevel: this.woodCollectedThisLevel,
            totalWoodOnLevel: levelInfo.woodPieceCount,
            levelStartTime: this.levelStartTime,
            difficulty: this.difficulty,
            isComplete: this.currentLevel >= MAX_LEVELS && this.isLevelComplete()
        };
    }

    /**
     * Ändrar svårighetsgrad (typiskt vid start av nytt spel)
     */
    setDifficulty(difficulty: DifficultyLevel): void {
        const oldDifficulty = this.difficulty;
        this.difficulty = difficulty;
        
        if (oldDifficulty !== difficulty) {
            this.emitEvent({
                type: 'DIFFICULTY_CHANGE',
                level: this.currentLevel,
                difficulty: this.difficulty,
                timestamp: Date.now(),
                data: { previousDifficulty: oldDifficulty }
            });
        }
    }

    /**
     * Återställer till nivå 1
     */
    reset(): void {
        this.currentLevel = 1;
        this.levelStartTime = 0;
        this.totalSessionScore = 0;
        this.woodCollectedThisLevel = 0;
    }

    /**
     * Beräknar totala poäng med difficulty multiplier
     */
    calculateScoreWithDifficulty(baseScore: number): number {
        const modifiers = this.getDifficultyModifiers();
        return Math.floor(baseScore * modifiers.scoreMultiplier);
    }

    /**
     * Hämtar starting health baserat på svårighetsgrad
     */
    getStartingHealth(): number {
        return this.getDifficultyModifiers().startingHealth;
    }

    /**
     * Registrerar callback för level events
     */
    on(eventType: LevelEvent['type'], callback: (event: LevelEvent) => void): void {
        if (!this.eventCallbacks.has(eventType)) {
            this.eventCallbacks.set(eventType, []);
        }
        this.eventCallbacks.get(eventType)!.push(callback);
    }

    /**
     * Avregistrerar callback
     */
    off(eventType: LevelEvent['type'], callback: (event: LevelEvent) => void): void {
        const callbacks = this.eventCallbacks.get(eventType);
        if (callbacks) {
            const index = callbacks.indexOf(callback);
            if (index !== -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    /**
     * Emitterar ett event
     */
    private emitEvent(event: LevelEvent): void {
        const callbacks = this.eventCallbacks.get(event.type);
        if (callbacks) {
            callbacks.forEach(callback => callback(event));
        }
    }

    /**
     * Hämtar nuvarande nivånummer
     */
    getCurrentLevel(): number {
        return this.currentLevel;
    }

    /**
     * Hämtar nuvarande svårighetsgrad
     */
    getDifficulty(): DifficultyLevel {
        return this.difficulty;
    }

    /**
     * Hämtar total session score
     */
    getTotalScore(): number {
        return this.totalSessionScore;
    }

    /**
     * Kontrollerar om det finns fler nivåer
     */
    hasNextLevel(): boolean {
        return this.currentLevel < MAX_LEVELS;
    }

    /**
     * Hämtar färg för nuvarande svårighetsgrad
     */
    getDifficultyColor(): string {
        return this.getDifficultyModifiers().color;
    }
}
