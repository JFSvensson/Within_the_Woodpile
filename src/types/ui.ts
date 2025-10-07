/**
 * Meny och UI-relaterade typer
 */
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