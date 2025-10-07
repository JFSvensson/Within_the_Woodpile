import type { WoodPiece } from '../../types/game.js';

/**
 * Interfaces för input-hantering
 */
export interface InputHandler {
  setupEventListeners(): void;
  cleanup(): void;
}

export interface GameInputCallbacks {
  onWoodPieceClick?: (piece: WoodPiece) => void;
  onSuccessfulCreatureReaction?: () => void;
  onGameRestart?: () => void;
}

export interface MenuInputCallbacks {
  onPlayClick?: () => void;
  onSettingsClick?: () => void;
  onInstructionsClick?: () => void;
}