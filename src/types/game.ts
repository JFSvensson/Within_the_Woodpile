/**
 * Grundläggande geometriska och positionstyper
 */
export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

/**
 * Kollaps-relaterade typer
 */
export enum CollapseRisk {
  NONE = 'none',
  LOW = 'low',
  MEDIUM = 'medium', 
  HIGH = 'high'
}

export enum CollapsePrediction {
  WILL_COLLAPSE = 'will_collapse',
  HIGH_RISK = 'high_risk',
  MEDIUM_RISK = 'medium_risk',
  LOW_RISK = 'low_risk'
}

export interface AffectedPiece {
  piece: WoodPiece;
  prediction: CollapsePrediction;
}

/**
 * Vedpinne-typer (entitet)
 */
export interface WoodPiece {
  id: string;
  position: Position;
  size: Size;
  isRemoved: boolean;
  creature?: CreatureType;
  collapseRisk: CollapseRisk;
  woodType?: string; // WoodType - optional för bakåtkompatibilitet
  
  // Animation properties
  isCollapsing?: boolean;
  collapseStartTime?: number;
  collapseVelocity?: { x: number; y: number };
  collapseRotation?: number;
  collapseRotationSpeed?: number;
}

/**
 * Varelser och reaktioner
 */
export enum CreatureType {
  SPIDER = 'spider',
  WASP = 'wasp', 
  HEDGEHOG = 'hedgehog',
  GHOST = 'ghost',
  PUMPKIN = 'pumpkin'
}

export interface ActiveCreature {
  type: CreatureType;
  timeLeft: number;
  position: Position;
  maxTime: number;
}

export interface KeyBinding {
  creature: CreatureType;
  key: string;
  keyCode: string;
  action: string;
}

/**
 * Spelstate
 */
export interface GameState {
  score: number;
  health: number;
  isGameOver: boolean;
  isPaused: boolean;
  activeCreature?: ActiveCreature;
}