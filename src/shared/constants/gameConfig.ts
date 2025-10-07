import type { GameConfig } from '../../types/config.js';

/**
 * Standard spelkonfiguration
 */
export const DEFAULT_CONFIG: GameConfig = {
  canvasWidth: 800,
  canvasHeight: 600,
  woodWidth: 20,
  woodHeight: 20,
  creatureProbability: 0.3,
  reactionTime: 2000, // 2 sekunder
  pointsPerWood: 10,
  healthPenalty: 20,
  collapseDamage: 30
};