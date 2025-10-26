import { DifficultyLevel, DifficultyModifiers } from '../../types/difficulty.js';

/**
 * Konfigurationer för alla svårighetsgrader
 */
export const DIFFICULTY_CONFIGS: Record<DifficultyLevel, DifficultyModifiers> = {
    [DifficultyLevel.EASY]: {
        healthMultiplier: 1.5,
        scoreMultiplier: 0.8,
        creatureSpawnMultiplier: 0.5,
        reactionTime: 3000, // 3 sekunder
        startingHealth: 150,
        maxSimultaneousCreatures: 1,
        collapseDamageMultiplier: 0.7,
        color: '#4CAF50', // Grön
        description: 'difficulty.easy.description' // i18n key
    },
    
    [DifficultyLevel.NORMAL]: {
        healthMultiplier: 1.0,
        scoreMultiplier: 1.0,
        creatureSpawnMultiplier: 1.0,
        reactionTime: 2000, // 2 sekunder
        startingHealth: 100,
        maxSimultaneousCreatures: 2,
        collapseDamageMultiplier: 1.0,
        color: '#2196F3', // Blå
        description: 'difficulty.normal.description'
    },
    
    [DifficultyLevel.HARD]: {
        healthMultiplier: 0.8,
        scoreMultiplier: 1.3,
        creatureSpawnMultiplier: 1.5,
        reactionTime: 1500, // 1.5 sekunder
        startingHealth: 80,
        maxSimultaneousCreatures: 3,
        collapseDamageMultiplier: 1.3,
        color: '#FF9800', // Orange
        description: 'difficulty.hard.description'
    },
    
    [DifficultyLevel.EXPERT]: {
        healthMultiplier: 0.6,
        scoreMultiplier: 1.7,
        creatureSpawnMultiplier: 2.0,
        reactionTime: 1000, // 1 sekund
        startingHealth: 60,
        maxSimultaneousCreatures: 4,
        collapseDamageMultiplier: 1.5,
        color: '#F44336', // Röd
        description: 'difficulty.expert.description'
    },
    
    [DifficultyLevel.NIGHTMARE]: {
        healthMultiplier: 0.5,
        scoreMultiplier: 2.5,
        creatureSpawnMultiplier: 3.0,
        reactionTime: 750, // 0.75 sekunder
        startingHealth: 50,
        maxSimultaneousCreatures: 5,
        collapseDamageMultiplier: 2.0,
        color: '#9C27B0', // Lila
        description: 'difficulty.nightmare.description'
    }
};

/**
 * Standard svårighetsgrad
 */
export const DEFAULT_DIFFICULTY = DifficultyLevel.NORMAL;

/**
 * Nivåprogression - hur många vedpinnar och lager per nivå
 */
export const LEVEL_PROGRESSION = [
    { level: 1, woodCount: 15, stackHeight: 5, targetScore: 100 },
    { level: 2, woodCount: 18, stackHeight: 6, targetScore: 200 },
    { level: 3, woodCount: 21, stackHeight: 7, targetScore: 350 },
    { level: 4, woodCount: 24, stackHeight: 8, targetScore: 500 },
    { level: 5, woodCount: 27, stackHeight: 9, targetScore: 700 },
    { level: 6, woodCount: 30, stackHeight: 10, targetScore: 900 },
    { level: 7, woodCount: 33, stackHeight: 11, targetScore: 1150 },
    { level: 8, woodCount: 36, stackHeight: 12, targetScore: 1400 },
    { level: 9, woodCount: 39, stackHeight: 13, targetScore: 1700 },
    { level: 10, woodCount: 42, stackHeight: 14, targetScore: 2000 }
];

/**
 * Max antal nivåer
 */
export const MAX_LEVELS = LEVEL_PROGRESSION.length;

/**
 * Speed bonus per sekund (för att klara nivån snabbt)
 */
export const SPEED_BONUS_PER_SECOND = 5;

/**
 * Bas-tid för level complete (sekunder) - tid under denna ger bonus
 */
export const BASE_TIME_FOR_BONUS = 60;
