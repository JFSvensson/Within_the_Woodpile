/**
 * Svårighetsgrader och nivå-relaterade typer
 */

/**
 * Tillgängliga svårighetsgrader
 */
export enum DifficultyLevel {
    EASY = 'easy',
    NORMAL = 'normal',
    HARD = 'hard',
    EXPERT = 'expert',
    NIGHTMARE = 'nightmare'
}

/**
 * Modifierare för olika svårighetsgrader
 */
export interface DifficultyModifiers {
    /** Multiplicerar hälsopoängen (högre = fler hälsopoäng) */
    healthMultiplier: number;
    
    /** Multiplicerar poäng per ved (högre = fler poäng) */
    scoreMultiplier: number;
    
    /** Multiplicerar sannolikheten för varelser (högre = fler varelser) */
    creatureSpawnMultiplier: number;
    
    /** Tid för att reagera på varelser (i millisekunder) */
    reactionTime: number;
    
    /** Hälsopoäng vid start */
    startingHealth: number;
    
    /** Max antal varelser samtidigt */
    maxSimultaneousCreatures: number;
    
    /** Kollapsskada-multiplikator */
    collapseDamageMultiplier: number;
    
    /** Färg för UI-indikation */
    color: string;
    
    /** Beskrivning av svårighetsgraden */
    description: string;
}

/**
 * Nivåinformation
 */
export interface LevelInfo {
    /** Nuvarande nivånummer (1-baserat) */
    levelNumber: number;
    
    /** Antal vedpinnar på denna nivå */
    woodPieceCount: number;
    
    /** Höjden på vedstapeln (antal lager) */
    stackHeight: number;
    
    /** Svårighetsgrad för denna nivå */
    difficulty: DifficultyLevel;
    
    /** Poäng som behövs för att klara nivån (0 = bara ta all ved) */
    targetScore: number;
    
    /** Bonus-poäng för att klara nivån snabbt */
    speedBonus: number;
    
    /** Max tid för att få full speed bonus (sekunder) */
    timeLimit?: number;
}

/**
 * Nivåprogression och statistik
 */
export interface LevelProgress {
    /** Nuvarande nivå */
    currentLevel: number;
    
    /** Högsta nivå som spelaren uppnått */
    highestLevelReached: number;
    
    /** Total poäng hittills i denna session */
    totalScore: number;
    
    /** Antal vedpinnar plockat på denna nivå */
    woodCollectedThisLevel: number;
    
    /** Antal totalt vedpinnar på nivån */
    totalWoodOnLevel: number;
    
    /** När nivån startades (för tidsberäkning) */
    levelStartTime: number;
    
    /** Nuvarande svårighetsgrad */
    difficulty: DifficultyLevel;
    
    /** Har spelaren klarar alla nivåer? */
    isComplete: boolean;
}

/**
 * Nivå-händelser
 */
export interface LevelEvent {
    type: 'LEVEL_START' | 'LEVEL_COMPLETE' | 'LEVEL_FAILED' | 'DIFFICULTY_CHANGE';
    level: number;
    difficulty: DifficultyLevel;
    timestamp: number;
    data?: any;
}
