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

// Wood types
export type {
  WoodTypeProperties
} from './wood.js';

export {
  WoodType,
  WOOD_TYPE_CONFIG,
  selectRandomWoodType
} from './wood.js';

// UI-relaterade typer
export type {
  MenuButton,
  HighscoreUIConfig,
  TableColumn,
  FormField,
  UIButton,
  ModalConfig
} from './ui.js';

export {
  MenuState,
  HighscoreViewType
} from './ui.js';

// Konfigurations-typer
export type {
  GameConfig
} from './config.js';

// Difficulty och Level-typer
export type {
  DifficultyModifiers,
  LevelInfo,
  LevelProgress,
  LevelEvent
} from './difficulty.js';

export {
  DifficultyLevel
} from './difficulty.js';

// Highscore-typer
export type {
  HighscoreEntry,
  HighscoreList,
  HighscoreValidationResult,
  QualificationResult,
  NewHighscoreInput,
  HighscoreExport,
  HighscoreFilter,
  HighscoreStats,
  Achievement,
  IHighscoreRepository,
  IHighscoreService,
  HighscoreEvents,
  HighscoreUIState
} from './highscore.js';

export {
  HighscoreError,
  HighscoreValidationError
} from './highscore.js';