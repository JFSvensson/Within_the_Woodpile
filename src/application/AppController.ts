import { I18n } from '../infrastructure/i18n/I18n.js';
import { AudioManager } from '../infrastructure/audio/index.js';
import { ResponsiveManager } from '../ResponsiveManager.js';
import { TransitionManager } from '../TransitionManager.js';
import { AppStateManager } from '../appStateManager.js';
import { MenuController } from './MenuController.js';
import { GameController } from './GameController.js';
import { ModalManager } from './ModalManager.js';
import { HighscoreManager } from '../core/managers/HighscoreManager.js';
import { HighscoreStorageService } from '../infrastructure/storage/HighscoreStorageService.js';
import { LocalStorageService } from '../infrastructure/storage/LocalStorageService.js';
import { DifficultyLevel } from '../types/index.js';

/**
 * Huvudkontroller för applikationen
 * Följer Facade-pattern och orchestrerar alla sub-controllers
 */
export class AppController {
    private i18n!: I18n;
    private audioManager!: AudioManager;
    private appStateManager!: AppStateManager;
    private transitionManager!: TransitionManager;
    private responsiveManager!: ResponsiveManager;
    private highscoreManager!: HighscoreManager;
    
    private menuController!: MenuController;
    private gameController!: GameController;
    private modalManager!: ModalManager;
    
    private canvas!: HTMLCanvasElement;
    private isInitialized = false;

    /**
     * Initialiserar hela applikationen
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) {
            console.warn('AppController already initialized');
            return;
        }

        try {
            console.log('Initializing Within the Woodpile...');
            
            // Initiera kärnkomponenter
            await this.initializeCore();
            
            // Initiera managers
            this.initializeManagers();
            
            // Initiera controllers
            await this.initializeControllers();
            
            // Sätt upp global error handling
            this.setupErrorHandling();
            
            // Starta menyläget
            this.menuController.start();
            
            this.isInitialized = true;
            console.log('Application initialized successfully');
            
        } catch (error) {
            console.error('Fatal error during initialization:', error);
            this.showFatalError(error as Error);
            throw error;
        }
    }

    /**
     * Initialiserar kärnkomponenter (I18n, Audio, Canvas)
     */
    private async initializeCore(): Promise<void> {
        // Initiera språksystemet
        this.i18n = new I18n();
        await this.i18n.initialize();
        
        // Initiera ljud-systemet
        this.audioManager = new AudioManager();
        await this.audioManager.initialize();
        
        // Hämta canvas-element
        this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
        if (!this.canvas) {
            throw new Error('Canvas element not found');
        }
    }

    /**
     * Initialiserar managers
     */
    private initializeManagers(): void {
        // State manager
        this.appStateManager = new AppStateManager();
        
        // Responsive manager
        this.responsiveManager = new ResponsiveManager(this.canvas);
        
        // Transition manager
        this.transitionManager = new TransitionManager(this.i18n, this.responsiveManager);
        
        // Highscore system
        const storageService = new LocalStorageService();
        const highscoreRepository = new HighscoreStorageService(storageService);
        this.highscoreManager = new HighscoreManager(highscoreRepository, this.i18n);
    }

    /**
     * Initialiserar sub-controllers
     */
    private async initializeControllers(): Promise<void> {
        // Modal manager
        this.modalManager = new ModalManager(
            this.i18n,
            this.audioManager,
            this.transitionManager
        );
        
        // Menu controller
        this.menuController = new MenuController(
            this.canvas,
            this.i18n,
            this.audioManager,
            this.appStateManager,
            this.transitionManager,
            this.responsiveManager,
            this.modalManager,
            this.highscoreManager
        );
        
        // Game controller
        this.gameController = new GameController(
            this.canvas,
            this.i18n,
            this.audioManager,
            this.appStateManager,
            this.transitionManager,
            this.highscoreManager,
            this.modalManager
        );
        
        // Koppla controllers
        this.menuController.setOnStartGame((difficulty: DifficultyLevel) => {
            this.gameController.startGame(difficulty);
        });
        
        this.gameController.setOnReturnToMenu(() => {
            this.menuController.start();
        });
    }

    /**
     * Sätter upp global error handling
     */
    private setupErrorHandling(): void {
        window.addEventListener('error', (event) => {
            console.error('Uncaught error:', event.error);
            // Här kan vi logga till analytics, visa error modal, etc.
        });
        
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
        });
    }

    /**
     * Visar fatal error till användaren
     */
    private showFatalError(error: Error): void {
        if (this.canvas) {
            const ctx = this.canvas.getContext('2d');
            if (ctx) {
                ctx.fillStyle = '#FF0000';
                ctx.font = '24px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(
                    'Fatal error loading application',
                    this.canvas.width / 2,
                    this.canvas.height / 2
                );
                ctx.fillText(
                    'Check console for details',
                    this.canvas.width / 2,
                    this.canvas.height / 2 + 30
                );
            }
        }
    }

    /**
     * Rensar alla resurser
     */
    cleanup(): void {
        if (!this.isInitialized) {
            return;
        }

        console.log('Cleaning up application...');
        
        this.gameController?.cleanup();
        this.menuController?.cleanup();
        this.responsiveManager?.destroy();
        this.audioManager?.destroy();
        
        this.isInitialized = false;
    }

    /**
     * Hämtar I18n-instans (för debugging)
     */
    getI18n(): I18n {
        return this.i18n;
    }

    /**
     * Hämtar audio manager (för debugging)
     */
    getAudioManager(): AudioManager {
        return this.audioManager;
    }
}
