/**
 * Centraliserad export av alla typer
 * Barrel export för enkel import
 */

// Game-relaterade typer
export type {
  Position,
  Size,
  WoodPiece,
  ActiveCreature,
  KeyBinding,
  GameState,
  AffectedPiece
} from './game.js';

export {
  CollapseRisk,
  CollapsePrediction,
  CreatureType
} from './game.js';

// UI-relaterade typer
export type {
  MenuButton
} from './ui.js';

export {
  MenuState
} from './ui.js';

// Konfigurations-typer
export type {
  GameConfig
} from './config.js';

// Highscore-typer
export type {
  HighscoreEntry,
  HighscoreList,
  HighscoreValidationResult,
  NewHighscoreInput,
  HighscoreExport,
  HighscoreFilter,
  HighscoreStats,
  IHighscoreRepository,
  IHighscoreService,
  HighscoreEvents,
  HighscoreUIState
} from './highscore.js';

export {
  HighscoreError,
  HighscoreValidationError
} from './highscore.js';