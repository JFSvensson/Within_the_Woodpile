import { I18n } from '../infrastructure/i18n/I18n.js';
import { AudioManager, SoundEvent } from '../infrastructure/audio/index.js';
import { MenuRenderer } from '../presentation/renderers/menu/MenuRenderer.js';
import { AppStateManager } from '../appStateManager.js';
import { TransitionManager } from '../TransitionManager.js';
import { ResponsiveManager } from '../ResponsiveManager.js';
import { ModalManager } from './ModalManager.js';
import { HighscoreManager } from '../core/managers/HighscoreManager.js';
import { MenuState, DifficultyLevel } from '../types/index.js';

/**
 * Kontrollerar meny-läget i applikationen
 * Ansvarar för menu rendering, interactions och navigation
 */
export class MenuController {
    private menuRenderer: MenuRenderer;
    private menuAnimationId: number = 0;
    private selectedDifficulty: DifficultyLevel = DifficultyLevel.NORMAL;
    private onStartGameCallback?: (difficulty: DifficultyLevel) => void;

    constructor(
        private canvas: HTMLCanvasElement,
        private i18n: I18n,
        private audioManager: AudioManager,
        private appStateManager: AppStateManager,
        private transitionManager: TransitionManager,
        private responsiveManager: ResponsiveManager,
        private modalManager: ModalManager,
        private highscoreManager: HighscoreManager
    ) {
        this.menuRenderer = new MenuRenderer(canvas, i18n);
        this.setupMenuCallbacks();
        this.setupMenuEventListeners();
        this.setupKeyboardNavigation();
    }

    /**
     * Startar menyläget
     */
    async start(): Promise<void> {
        console.log('Starting menu mode...');
        
        // Dölj spelstatistik och visa menyläge
        document.body.classList.add('menu-mode');
        const gameInfo = document.querySelector('.game-info') as HTMLElement;
        if (gameInfo) gameInfo.style.display = 'none';
        
        // Uppdatera state
        this.appStateManager.returnToMainMenu();
        
        // Starta meny-renderingsloop
        this.startMenuRenderLoop();
        
        // Starta menymusik
        this.audioManager?.playBackgroundMusic(SoundEvent.MENU_MUSIC);
    }

    /**
     * Startar menyloopen
     */
    private startMenuRenderLoop(): void {
        this.menuAnimationId = requestAnimationFrame(() => this.menuRenderLoop());
    }

    /**
     * Menyens renderingsloop
     */
    private menuRenderLoop(): void {
        if (this.appStateManager.getCurrentState() === MenuState.MAIN_MENU) {
            this.menuRenderer.render();
            this.menuAnimationId = requestAnimationFrame(() => this.menuRenderLoop());
        }
    }

    /**
     * Stoppar menyloopen
     */
    stop(): void {
        if (this.menuAnimationId) {
            cancelAnimationFrame(this.menuAnimationId);
            this.menuAnimationId = 0;
        }
    }

    /**
     * Sätter upp callbacks för meny-knappar
     */
    private setupMenuCallbacks(): void {
        this.menuRenderer.setOnPlayClick(() => this.handlePlayClick());
        this.menuRenderer.setOnInstructionsClick(() => this.modalManager.showInstructions());
        this.menuRenderer.setOnSettingsClick(() => this.modalManager.showSettings());
        this.menuRenderer.setOnHighscoreClick(() => this.modalManager.showHighscore(this.highscoreManager));
    }

    /**
     * Hanterar Play-klick
     */
    private async handlePlayClick(): Promise<void> {
        this.audioManager?.playUIClick();
        
        // Stoppa meny-loopen
        this.stop();
        
        // Smooth övergång
        await this.transitionManager.transitionToGame();
        
        // Notifiera via callback
        if (this.onStartGameCallback) {
            this.onStartGameCallback(this.selectedDifficulty);
        }
    }

    /**
     * Sätter upp event listeners för meny-interaktion
     */
    private setupMenuEventListeners(): void {
        // Musklick på canvas
        this.canvas.addEventListener('click', (event) => this.handleMenuInteraction(event));
        
        // Touch-events för mobil
        this.canvas.addEventListener('touchend', (event) => {
            event.preventDefault();
            
            if (this.appStateManager.getCurrentState() === MenuState.MAIN_MENU) {
                const touch = event.changedTouches[0];
                const rect = this.canvas.getBoundingClientRect();
                const x = touch.clientX - rect.left;
                const y = touch.clientY - rect.top;
                this.menuRenderer.handleClick(x, y);
            }
        });
        
        // Mushover på canvas (bara för desktop)
        this.canvas.addEventListener('mousemove', (event) => {
            if (this.appStateManager.getCurrentState() === MenuState.MAIN_MENU && 
                !this.responsiveManager.isMobile()) {
                const rect = this.canvas.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;
                this.menuRenderer.handleMouseMove(x, y);
            }
        });
    }

    /**
     * Hanterar meny-interaktioner (klick och touch)
     */
    private handleMenuInteraction(event: MouseEvent): void {
        if (this.appStateManager.getCurrentState() === MenuState.MAIN_MENU) {
            const rect = this.canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            this.menuRenderer.handleClick(x, y);
        }
    }

    /**
     * Sätter upp tangentbordsnavigation
     */
    private setupKeyboardNavigation(): void {
        let currentButtonIndex = 0;
        const buttonIds = ['play', 'instructions', 'settings', 'highscore'];
        
        document.addEventListener('keydown', (event) => {
            // Bara hantera tangentbord när vi är i menyläge
            if (this.appStateManager.getCurrentState() !== MenuState.MAIN_MENU) {
                return;
            }
            
            // Kolla om det finns några öppna modaler
            const hasOpenModal = document.querySelector('.modal-overlay') !== null;
            if (hasOpenModal) {
                return;
            }
            
            switch (event.key) {
                case 'Tab':
                    event.preventDefault();
                    if (event.shiftKey) {
                        currentButtonIndex = (currentButtonIndex - 1 + buttonIds.length) % buttonIds.length;
                    } else {
                        currentButtonIndex = (currentButtonIndex + 1) % buttonIds.length;
                    }
                    this.highlightButton(currentButtonIndex, buttonIds);
                    break;
                    
                case 'Enter':
                case ' ':
                    event.preventDefault();
                    this.activateButton(currentButtonIndex, buttonIds);
                    break;
                    
                case 'ArrowUp':
                    event.preventDefault();
                    currentButtonIndex = (currentButtonIndex - 1 + buttonIds.length) % buttonIds.length;
                    this.highlightButton(currentButtonIndex, buttonIds);
                    break;
                    
                case 'ArrowDown':
                    event.preventDefault();
                    currentButtonIndex = (currentButtonIndex + 1) % buttonIds.length;
                    this.highlightButton(currentButtonIndex, buttonIds);
                    break;
                    
                case '1':
                case '2':
                case '3':
                case '4':
                    event.preventDefault();
                    const index = parseInt(event.key) - 1;
                    if (index >= 0 && index < buttonIds.length) {
                        currentButtonIndex = index;
                        this.activateButton(currentButtonIndex, buttonIds);
                    }
                    break;
            }
        });
        
        // Visa initial highlight
        this.highlightButton(currentButtonIndex, buttonIds);
    }

    /**
     * Highlightar en specifik knapp
     */
    private highlightButton(index: number, buttonIds: string[]): void {
        buttonIds.forEach((buttonId, i) => {
            this.menuRenderer.setButtonHover(buttonId, i === index);
        });
        
        this.audioManager?.playUIHover();
    }

    /**
     * Aktiverar den markerade knappen
     */
    private activateButton(index: number, buttonIds: string[]): void {
        const actions = [
            () => this.handlePlayClick(),
            () => this.modalManager.showInstructions(),
            () => this.modalManager.showSettings(),
            () => this.modalManager.showHighscore(this.highscoreManager)
        ];
        
        if (index >= 0 && index < actions.length) {
            actions[index]();
        }
    }

    /**
     * Sätter difficulty
     */
    setDifficulty(difficulty: DifficultyLevel): void {
        this.selectedDifficulty = difficulty;
        console.log('Difficulty set to:', difficulty);
    }

    /**
     * Hämtar vald difficulty
     */
    getDifficulty(): DifficultyLevel {
        return this.selectedDifficulty;
    }

    /**
     * Sätter callback för start game
     */
    setOnStartGame(callback: (difficulty: DifficultyLevel) => void): void {
        this.onStartGameCallback = callback;
    }

    /**
     * Cleanup
     */
    cleanup(): void {
        this.stop();
        this.menuRenderer.destroy();
    }
}
