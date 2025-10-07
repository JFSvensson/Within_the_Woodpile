import { MenuState } from './types/index.js';

/**
 * AppStateManager hanterar övergångar mellan olika appllägen
 * Implementerar State Pattern för clean state management
 */
export class AppStateManager {
    private currentState: MenuState = MenuState.MAIN_MENU;
    private stateChangeCallbacks: Map<MenuState, (() => void)[]> = new Map();

    constructor() {
        // Initiera callback-arrays för varje state
        Object.values(MenuState).forEach(state => {
            this.stateChangeCallbacks.set(state, []);
        });
    }

    /**
     * Getter för nuvarande state
     */
    public getCurrentState(): MenuState {
        return this.currentState;
    }

    /**
     * Byter state och triggar callbacks
     */
    public setState(newState: MenuState): void {
        if (this.currentState === newState) {
            return; // Ingen förändring
        }

        const previousState = this.currentState;
        this.currentState = newState;

        console.log(`State changed: ${previousState} -> ${newState}`);

        // Trigga callbacks för nya state
        const callbacks = this.stateChangeCallbacks.get(newState);
        if (callbacks) {
            callbacks.forEach(callback => callback());
        }
    }

    /**
     * Registrerar callback som körs när ett specifikt state blir aktivt
     */
    public onStateEnter(state: MenuState, callback: () => void): void {
        const callbacks = this.stateChangeCallbacks.get(state);
        if (callbacks) {
            callbacks.push(callback);
        }
    }

    /**
     * Tar bort alla callbacks för ett state
     */
    public clearStateCallbacks(state: MenuState): void {
        this.stateChangeCallbacks.set(state, []);
    }

    /**
     * Kontrollerar om vi är i spelläge
     */
    public isInGame(): boolean {
        return this.currentState === MenuState.GAME;
    }

    /**
     * Kontrollerar om vi är i menyläge
     */
    public isInMenu(): boolean {
        return this.currentState !== MenuState.GAME;
    }

    /**
     * Återgår till huvudmenyn
     */
    public returnToMainMenu(): void {
        this.setState(MenuState.MAIN_MENU);
    }

    /**
     * Startar spelet
     */
    public startGame(): void {
        this.setState(MenuState.GAME);
    }

    /**
     * Går till inställningar
     */
    public goToSettings(): void {
        this.setState(MenuState.SETTINGS);
    }

    /**
     * Går till instruktioner
     */
    public goToInstructions(): void {
        this.setState(MenuState.INSTRUCTIONS);
    }

    /**
     * Hanterar när spelet tar slut
     */
    public gameOver(): void {
        this.setState(MenuState.GAME_OVER);
    }
}