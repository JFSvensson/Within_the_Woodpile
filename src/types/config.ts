/**
 * Spelkonfiguration och konstanter
 */
export interface GameConfig {
  canvasWidth: number;
  canvasHeight: number;
  woodWidth: number;
  woodHeight: number;
  creatureProbability: number;
  reactionTime: number;
  pointsPerWood: number;
  healthPenalty: number;
  collapseDamage: number;
}