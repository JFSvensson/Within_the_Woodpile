export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface WoodPiece {
  id: string;
  position: Position;
  size: Size;
  isRemoved: boolean;
  creature?: CreatureType;
  collapseRisk: CollapseRisk;
}

export enum CollapseRisk {
  NONE = 'none',
  LOW = 'low',
  MEDIUM = 'medium', 
  HIGH = 'high'
}

export interface AffectedPiece {
  piece: WoodPiece;
  prediction: CollapsePrediction;
}

export enum CollapsePrediction {
  WILL_COLLAPSE = 'will_collapse',
  HIGH_RISK = 'high_risk',
  MEDIUM_RISK = 'medium_risk',
  LOW_RISK = 'low_risk'
}

export enum CreatureType {
  SPIDER = 'spider',
  WASP = 'wasp', 
  HEDGEHOG = 'hedgehog',
  GHOST = 'ghost',
  PUMPKIN = 'pumpkin'
}

export enum MenuState {
  MAIN_MENU = 'main_menu',
  GAME = 'game',
  SETTINGS = 'settings',
  INSTRUCTIONS = 'instructions',
  GAME_OVER = 'game_over'
}

export interface MenuButton {
  id: string;
  textKey: string;
  x: number;
  y: number;
  width: number;
  height: number;
  onClick: () => void;
  isHovered: boolean;
}

export interface GameState {
  score: number;
  health: number;
  isGameOver: boolean;
  isPaused: boolean;
  activeCreature?: ActiveCreature;
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

/**
 * Tangentbindningar för varelser
 */
export const KEY_BINDINGS: KeyBinding[] = [
  {
    creature: CreatureType.SPIDER,
    key: ' ',
    keyCode: 'Space',
    action: 'blowAway'
  },
  {
    creature: CreatureType.WASP,
    key: 'Escape',
    keyCode: 'Escape',
    action: 'duck'
  },
  {
    creature: CreatureType.HEDGEHOG,
    key: 's',
    keyCode: 'KeyS',
    action: 'backSlowly'
  },
  {
    creature: CreatureType.GHOST,
    key: 'l',
    keyCode: 'KeyL',
    action: 'lightLantern'
  },
  {
    creature: CreatureType.PUMPKIN,
    key: 'r',
    keyCode: 'KeyR',
    action: 'run'
  }
];