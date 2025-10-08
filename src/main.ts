import { I18n } from './infrastructure/i18n/I18n.js';
import { Game } from './core/game/Game.js';
import { MenuRenderer } from './presentation/renderers/menu/MenuRenderer.js';
import { AppStateManager } from './appStateManager.js';
import { TransitionManager } from './TransitionManager.js';
import { ResponsiveManager } from './ResponsiveManager.js';
import { DEFAULT_CONFIG } from './shared/constants/index.js';
import { MenuState } from './types/index.js';

// Globala variabler
let game: Game | null = null;
let i18n: I18n;
let menuRenderer: MenuRenderer;
let appStateManager: AppStateManager;
let transitionManager: TransitionManager;
let responsiveManager: ResponsiveManager;
let canvas: HTMLCanvasElement;
let menuAnimationId: number;

/**
 * Menyens renderingsloop (bara när vi är i menyläge)
 */
function menuRenderLoop(): void {
    if (appStateManager.getCurrentState() === MenuState.MAIN_MENU) {
        menuRenderer.render();
        menuAnimationId = requestAnimationFrame(menuRenderLoop);
    }
}

/**
 * Startar menyloopen
 */
function startMenuRenderLoop(): void {
    menuAnimationId = requestAnimationFrame(menuRenderLoop);
}

/**
 * Startar spelet från menyn
 */
async function startGameFromMenu(): Promise<void> {
    try {
        // Stoppa meny-renderingsloopen
        if (menuAnimationId) {
            cancelAnimationFrame(menuAnimationId);
        }

        // Smooth övergång till spel
        await transitionManager.transitionToGame();

        // Skapa nytt spelobjekt
        game = new Game(canvas, i18n, DEFAULT_CONFIG);
        
        // Sätt upp callbacks för UI-uppdateringar
        game.onScore((score: number) => updateGameStats(score, undefined));
        game.onHealth((health: number) => updateGameStats(undefined, health));
        game.onGameEnd(handleGameOver);
        
        // Initiera UI
        updateGameStats(0, 100);
        
        // Byt till spelläge
        appStateManager.startGame();
        
        console.log('Game started from menu');
    } catch (error) {
        console.error('Failed to start game:', error);
        
        // Fallback till snabb övergång vid fel
        transitionManager.quickTransitionToMenu();
        appStateManager.returnToMainMenu();
        startMenuRenderLoop();
    }
}
/**
 * Hanterar när spelet tar slut
 */
async function handleGameOver(): Promise<void> {
    console.log('Game Over!');
    
    try {
        // Smooth övergång tillbaka till meny
        await transitionManager.transitionToMenu();
        
        // Förstör spelobjekt
        if (game) {
            game.destroy();
            game = null;
        }
        
        // Återgå till menyläge
        appStateManager.returnToMainMenu();
        startMenuRenderLoop();
    } catch (error) {
        console.error('Error during game over transition:', error);
        
        // Fallback till snabb övergång
        if (game) {
            game.destroy();
            game = null;
        }
        
        transitionManager.quickTransitionToMenu();
        appStateManager.returnToMainMenu();
        startMenuRenderLoop();
    }
}

/**
 * Initialiserar hela applikationen
 */
async function initializeApp(): Promise<void> {
    console.log('Initialiserar Within the Woodpile...');
    
    try {
        // Initiera språksystemet
        i18n = new I18n();
        await i18n.initialize();
        
        // Hämta canvas-element
        canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
        if (!canvas) {
            throw new Error('Kunde inte hitta canvas-element');
        }
        
        // Skapa state manager
        appStateManager = new AppStateManager();
        
        // Skapa responsive manager
        responsiveManager = new ResponsiveManager(canvas);
        
        // Skapa transition manager
        transitionManager = new TransitionManager(i18n);
        
        // Skapa meny renderer
        menuRenderer = new MenuRenderer(canvas, i18n);
        
        // Sätt upp meny callbacks
        menuRenderer.setOnPlayClick(startGameFromMenu);
        
        // Sätt upp meny event listeners
        setupMenuEventListeners();
        
        // Sätt upp responsive canvas listeners
        setupCanvasResizeListeners();
        
        // Dölj spelstatistik initialt och visa menyläge
        document.body.classList.add('menu-mode');
        const gameInfo = document.querySelector('.game-info') as HTMLElement;
        if (gameInfo) gameInfo.style.display = 'none';
        
        // Starta menyloopen
        startMenuRenderLoop();
        
        console.log('Applikationen initialiserad');
        
    } catch (error) {
        console.error('Fel vid initialisering av applikationen:', error);
        
        // Visa felmeddelande på sidan
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.fillStyle = '#FF0000';
                ctx.font = '24px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(
                    'Fel vid laddning av applikationen', 
                    canvas.width / 2, 
                    canvas.height / 2
                );
                ctx.fillText(
                    'Se konsolen för mer information', 
                    canvas.width / 2, 
                    canvas.height / 2 + 30
                );
            }
        }
    }
}

/**
 * Sätter upp event listeners för menyn
 */
function setupMenuEventListeners(): void {
    // Musklick på canvas
    canvas.addEventListener('click', handleMenuInteraction);
    
    // Touch-events för mobil
    canvas.addEventListener('touchend', (event) => {
        event.preventDefault(); // Förhindra zoom och andra touch-beteenden
        
        if (appStateManager.getCurrentState() === MenuState.MAIN_MENU) {
            const touch = event.changedTouches[0];
            const rect = canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            menuRenderer.handleClick(x, y);
        }
    });
    
    // Mushover på canvas (bara för desktop)
    canvas.addEventListener('mousemove', (event) => {
        if (appStateManager.getCurrentState() === MenuState.MAIN_MENU && !responsiveManager.isMobile()) {
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            menuRenderer.handleMouseMove(x, y);
        }
    });
}

/**
 * Hanterar meny-interaktioner (klick och touch)
 */
function handleMenuInteraction(event: MouseEvent): void {
    if (appStateManager.getCurrentState() === MenuState.MAIN_MENU) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        menuRenderer.handleClick(x, y);
    }
}

/**
 * Sätter upp event listeners för canvas resize
 */
function setupCanvasResizeListeners(): void {
    window.addEventListener('canvasResize', (event: Event) => {
        const customEvent = event as CustomEvent;
        const { width, height, breakpoint } = customEvent.detail;
        
        console.log(`Canvas resized: ${width}x${height} (${breakpoint})`);
        
        // Future: Uppdatera renderer-komponenter när de stöder resize
        // if (menuRenderer?.handleCanvasResize) {
        //     menuRenderer.handleCanvasResize(width, height);
        // }
        // if (game?.handleCanvasResize) {
        //     game.handleCanvasResize(width, height);
        // }
    });
}

/**
 * Uppdaterar poäng och hälsa på skärmen
 */
function updateGameStats(score?: number, health?: number): void {
    if (score !== undefined) {
        const scoreElement = document.getElementById('score');
        if (scoreElement) scoreElement.textContent = score.toString();
    }
    
    if (health !== undefined) {
        const healthElement = document.getElementById('health');
        if (healthElement) healthElement.textContent = health.toString();
    }
}

/**
 * Rensar resurser
 */
function cleanup(): void {
    if (game) {
        game.destroy();
    }
    
    if (responsiveManager) {
        responsiveManager.destroy();
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', initializeApp);
window.addEventListener('beforeunload', cleanup);

// Exponera globala funktioner för debugging
(window as any).debugGame = {
    togglePause: () => game?.togglePause(),
    getGameState: () => game?.getGameState(),
    changeLanguage: (lang: string) => i18n?.loadLanguage(lang).then(() => i18n?.updateUI()),
};
