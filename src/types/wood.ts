/**
 * Special wood types med unika egenskaper
 */

export enum WoodType {
    NORMAL = 'normal',
    GOLDEN = 'golden',       // 2x poäng
    CURSED = 'cursed',       // Varning - kan skada
    FRAGILE = 'fragile',     // Extra känslig för kollaps
    BONUS = 'bonus'          // Ger extra hälsa
}

export interface WoodTypeProperties {
    /** Emoji eller visual representation */
    visual: string;
    
    /** Poäng-multiplikator */
    scoreMultiplier: number;
    
    /** Hälsoeffekt när den plockas */
    healthEffect: number;
    
    /** Ökad risk för kollaps */
    collapseRiskMultiplier: number;
    
    /** Färg för highlight */
    highlightColor: string;
    
    /** Beskrivning (i18n key) */
    descriptionKey: string;
    
    /** Sannolikhet att spawna (0-1) */
    spawnChance: number;
}

/**
 * Konfiguration för alla wood types
 */
export const WOOD_TYPE_CONFIG: Record<WoodType, WoodTypeProperties> = {
    [WoodType.NORMAL]: {
        visual: '🪵',
        scoreMultiplier: 1.0,
        healthEffect: 0,
        collapseRiskMultiplier: 1.0,
        highlightColor: '#8B4513',
        descriptionKey: 'wood.normal.description',
        spawnChance: 0.7 // 70% av all ved
    },
    
    [WoodType.GOLDEN]: {
        visual: '✨',
        scoreMultiplier: 2.0,
        healthEffect: 0,
        collapseRiskMultiplier: 1.0,
        highlightColor: '#FFD700',
        descriptionKey: 'wood.golden.description',
        spawnChance: 0.1 // 10% - sällsynt
    },
    
    [WoodType.CURSED]: {
        visual: '💀',
        scoreMultiplier: 1.5,
        healthEffect: -5,
        collapseRiskMultiplier: 1.2,
        highlightColor: '#9C27B0',
        descriptionKey: 'wood.cursed.description',
        spawnChance: 0.1 // 10%
    },
    
    [WoodType.FRAGILE]: {
        visual: '🍂',
        scoreMultiplier: 0.8,
        healthEffect: 0,
        collapseRiskMultiplier: 2.0, // Dubbel risk för kollaps
        highlightColor: '#FF6B6B',
        descriptionKey: 'wood.fragile.description',
        spawnChance: 0.05 // 5% - ovanlig
    },
    
    [WoodType.BONUS]: {
        visual: '💚',
        scoreMultiplier: 0.5,
        healthEffect: 10, // +10 hälsa
        collapseRiskMultiplier: 1.0,
        highlightColor: '#4CAF50',
        descriptionKey: 'wood.bonus.description',
        spawnChance: 0.05 // 5% - ovanlig
    }
};

/**
 * Väljer en slumpmässig wood type baserat på spawn chances
 */
export function selectRandomWoodType(): WoodType {
    const random = Math.random();
    let cumulativeChance = 0;
    
    for (const [type, config] of Object.entries(WOOD_TYPE_CONFIG)) {
        cumulativeChance += config.spawnChance;
        if (random <= cumulativeChance) {
            return type as WoodType;
        }
    }
    
    return WoodType.NORMAL; // Fallback
}
