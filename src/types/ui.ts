/**
 * Meny och UI-relaterade typer
 */
export enum MenuState {
  MAIN_MENU = 'main_menu',
  GAME = 'game',
  SETTINGS = 'settings',
  INSTRUCTIONS = 'instructions',
  GAME_OVER = 'game_over',
  HIGHSCORE = 'highscore'
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

/**
 * Highscore UI-typer
 */
export enum HighscoreViewType {
  TABLE = 'table',
  ADD_SCORE = 'add_score',
  STATISTICS = 'statistics'
}

export interface HighscoreUIConfig {
  maxVisible: number;
  rowHeight: number;
  fontSize: number;
  padding: number;
  animationDuration: number;
}

export interface TableColumn {
  key: string;
  label: string;
  width: number;
  align: 'left' | 'center' | 'right';
  formatter?: (value: any) => string;
}

export interface FormField {
  id: string;
  type: 'text' | 'number';
  label: string;
  placeholder: string;
  value: string;
  isValid: boolean;
  errorMessage?: string;
}

export interface UIButton {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isEnabled: boolean;
  isHovered: boolean;
  onClick: () => void;
}

export interface ModalConfig {
  width: number;
  height: number;
  backgroundColor: string;
  borderRadius: number;
  padding: number;
  showCloseButton: boolean;
}