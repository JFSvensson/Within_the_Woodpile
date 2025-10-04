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

export enum CreatureType {
  SPIDER = 'spider',
  WASP = 'wasp', 
  HEDGEHOG = 'hedgehog',
  GHOST = 'ghost',
  PUMPKIN = 'pumpkin'
}

export enum CollapseRisk {
  NONE = 'none',
  LOW = 'low',
  MEDIUM = 'medium', 
  HIGH = 'high'
}

export interface GameState {
  score: number;
  health: number;
  isGameOver: boolean;
  activeCreature?: {
    type: CreatureType;
    timeLeft: number;
    position: Position;
  };
}

export interface KeyBinding {
  creature: CreatureType;
  key: string;
  action: string;
}