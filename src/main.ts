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
 * Skapar en overlay för modaler
 */
function createOverlay(id: string): HTMLElement {
    // Ta bort befintlig overlay om den finns
    const existing = document.getElementById(id);
    if (existing) {
        existing.remove();
    }
    
    const overlay = document.createElement('div');
    overlay.id = id;
    overlay.className = 'modal-overlay';
    
    // Klick utanför stänger modalen
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeOverlay(id);
        }
    });
    
    return overlay;
}

/**
 * Stänger en overlay
 */
function closeOverlay(id: string): void {
    const overlay = document.getElementById(id);
    if (overlay) {
        overlay.remove();
    }
}

/**
 * Ändrar språk från inställningar
 */
function changeLanguageFromSettings(language: string): void {
    i18n.loadLanguage(language).then(() => {
        i18n.updateUI();
    });
}

/**
 * Togglar partiklar på/av
 */
function toggleParticles(enabled: boolean): void {
    console.log('Particles:', enabled ? 'enabled' : 'disabled');
    // TODO: Implementera partikel-toggle i particle system
}

/**
 * Togglar animationer på/av
 */
function toggleAnimations(enabled: boolean): void {
    console.log('Animations:', enabled ? 'enabled' : 'disabled');
    // TODO: Implementera animation-toggle
}

/**
 * Sätter volym
 */
function setVolume(value: string): void {
    const volumeValue = document.getElementById('volumeValue');
    if (volumeValue) {
        volumeValue.textContent = `${value}%`;
    }
    console.log('Volume set to:', value);
    // TODO: Implementera faktisk volym-kontroll
}

/**
 * Togglar ljudeffekter
 */
function toggleSounds(enabled: boolean): void {
    console.log('Sounds:', enabled ? 'enabled' : 'disabled');
    // TODO: Implementera ljud-toggle
}

/**
 * Återställer inställningar till standard
 */
function resetSettings(): void {
    // Återställ språk
    i18n.loadLanguage('sv').then(() => {
        i18n.updateUI();
        const languageSelect = document.getElementById('settingsLanguageSelect') as HTMLSelectElement;
        if (languageSelect) languageSelect.value = 'sv';
    });
    
    // Återställ checkboxes
    const checkboxes = ['enableParticles', 'enableAnimations', 'enableSounds'];
    checkboxes.forEach(id => {
        const checkbox = document.getElementById(id) as HTMLInputElement;
        if (checkbox) checkbox.checked = true;
    });
    
    // Återställ volym
    const volumeSlider = document.getElementById('volumeSlider') as HTMLInputElement;
    if (volumeSlider) {
        volumeSlider.value = '50';
        setVolume('50');
    }
    
    console.log('Settings reset to defaults');
}

/**
 * Visar instruktions-overlay
 */
function showInstructions(): void {
    console.log('Showing instructions...');
    
    // Skapa instruktions-overlay
    const overlay = createOverlay('instructions-overlay');
    
    const content = `
        <div class="modal-content">
            <div class="modal-header">
                <h2 data-i18n="instructions.title">Instruktioner</h2>
                <button class="close-button" onclick="closeOverlay('instructions-overlay')">&times;</button>
            </div>
            <div class="modal-body">
                <div class="instruction-section">
                    <h3 data-i18n="instructions.objective">Mål</h3>
                    <p data-i18n="instructions.objectiveText">Plocka ved från högen utan att störa de farliga varelserna som gömmer sig där.</p>
                </div>
                
                <div class="instruction-section">
                    <h3 data-i18n="instructions.controls">Kontroller</h3>
                    <div class="controls-grid">
                        <div class="control-item">
                            <span class="control-key">🖱️</span>
                            <span data-i18n="instructions.click">Klicka på ved för att plocka</span>
                        </div>
                        <div class="control-item">
                            <span class="control-key">MELLANSLAG</span>
                            <span data-i18n="instructions.spider">Skrämma bort spindlar</span>
                        </div>
                        <div class="control-item">
                            <span class="control-key">ESCAPE</span>
                            <span data-i18n="instructions.wasp">Undvika getingar</span>
                        </div>
                        <div class="control-item">
                            <span class="control-key">S</span>
                            <span data-i18n="instructions.hedgehog">Locka igelkottar</span>
                        </div>
                        <div class="control-item">
                            <span class="control-key">L</span>
                            <span data-i18n="instructions.ghost">Lysa upp spöken</span>
                        </div>
                        <div class="control-item">
                            <span class="control-key">R</span>
                            <span data-i18n="instructions.pumpkin">Rulla bort pumpor</span>
                        </div>
                    </div>
                </div>
                
                <div class="instruction-section">
                    <h3 data-i18n="instructions.tips">Tips</h3>
                    <ul>
                        <li data-i18n="instructions.tip1">Var försiktig - vissa vedstycken kan få högen att kollapsa!</li>
                        <li data-i18n="instructions.tip2">Håll koll på din hälsa - varelserna kan skada dig.</li>
                        <li data-i18n="instructions.tip3">Tjäna poäng genom att plocka ved säkert.</li>
                    </ul>
                </div>
            </div>
            <div class="modal-footer">
                <button class="wood-button" onclick="closeOverlay('instructions-overlay')" data-i18n="common.close">Stäng</button>
            </div>
        </div>
    `;
    
    overlay.innerHTML = content;
    document.body.appendChild(overlay);
    
    // Uppdatera översättningar
    i18n.updateUI();
    
    // Lägg till escape-hantering
    const escapeHandler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            closeOverlay('instructions-overlay');
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
}

/**
 * Visar inställnings-overlay
 */
function showSettings(): void {
    console.log('Showing settings...');
    
    // Skapa inställnings-overlay
    const overlay = createOverlay('settings-overlay');
    
    const content = `
        <div class="modal-content">
            <div class="modal-header">
                <h2 data-i18n="settings.title">Inställningar</h2>
                <button class="close-button" onclick="closeOverlay('settings-overlay')">&times;</button>
            </div>
            <div class="modal-body">
                <div class="setting-section">
                    <h3 data-i18n="settings.language">Språk</h3>
                    <select id="settingsLanguageSelect" onchange="changeLanguageFromSettings(this.value)">
                        <option value="sv">Svenska</option>
                        <option value="en">English</option>
                    </select>
                </div>
                
                <div class="setting-section">
                    <h3 data-i18n="settings.graphics">Grafik</h3>
                    <label class="setting-item">
                        <input type="checkbox" id="enableParticles" checked onchange="toggleParticles(this.checked)">
                        <span data-i18n="settings.particles">Aktivera partiklar</span>
                    </label>
                    <label class="setting-item">
                        <input type="checkbox" id="enableAnimations" checked onchange="toggleAnimations(this.checked)">
                        <span data-i18n="settings.animations">Aktivera animationer</span>
                    </label>
                </div>
                
                <div class="setting-section">
                    <h3 data-i18n="settings.audio">Ljud</h3>
                    <label class="setting-item">
                        <span data-i18n="settings.volume">Volym</span>
                        <input type="range" id="volumeSlider" min="0" max="100" value="50" oninput="setVolume(this.value)">
                        <span id="volumeValue">50%</span>
                    </label>
                    <label class="setting-item">
                        <input type="checkbox" id="enableSounds" checked onchange="toggleSounds(this.checked)">
                        <span data-i18n="settings.sounds">Aktivera ljudeffekter</span>
                    </label>
                </div>
            </div>
            <div class="modal-footer">
                <button class="wood-button" onclick="resetSettings()" data-i18n="settings.reset">Återställ</button>
                <button class="wood-button primary" onclick="closeOverlay('settings-overlay')" data-i18n="common.close">Stäng</button>
            </div>
        </div>
    `;
    
    overlay.innerHTML = content;
    document.body.appendChild(overlay);
    
    // Sätt aktuella värden
    const languageSelect = document.getElementById('settingsLanguageSelect') as HTMLSelectElement;
    if (languageSelect) {
        languageSelect.value = i18n.getCurrentLanguage();
    }
    
    // Uppdatera översättningar
    i18n.updateUI();
    
    // Lägg till escape-hantering
    const escapeHandler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            closeOverlay('settings-overlay');
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
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
        menuRenderer.setOnInstructionsClick(showInstructions);
        menuRenderer.setOnSettingsClick(showSettings);
        
        // Sätt upp meny event listeners
        setupMenuEventListeners();
        
        // Sätt upp tangentbordsnavigation
        setupKeyboardNavigation();
        
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
 * Sätter upp tangentbordsnavigation för menyhantering
 */
function setupKeyboardNavigation(): void {
    let currentButtonIndex = 0;
    const buttonIds = ['play', 'instructions', 'settings'];
    
    document.addEventListener('keydown', (event) => {
        // Bara hantera tangentbord när vi är i menyläge
        if (appStateManager.getCurrentState() !== MenuState.MAIN_MENU) {
            return;
        }
        
        // Kolla om det finns några öppna modaler
        const hasOpenModal = document.querySelector('.modal-overlay') !== null;
        if (hasOpenModal) {
            return; // Låt modaler hantera sina egna tangentbords-events
        }
        
        switch (event.key) {
            case 'Tab':
                event.preventDefault();
                if (event.shiftKey) {
                    // Shift+Tab - gå bakåt
                    currentButtonIndex = (currentButtonIndex - 1 + buttonIds.length) % buttonIds.length;
                } else {
                    // Tab - gå framåt
                    currentButtonIndex = (currentButtonIndex + 1) % buttonIds.length;
                }
                highlightButton(currentButtonIndex);
                break;
                
            case 'Enter':
            case ' ': // Mellanslag
                event.preventDefault();
                activateCurrentButton(currentButtonIndex);
                break;
                
            case 'Escape':
                event.preventDefault();
                // Escape från meny kan stänga spel eller gå till inställningar
                console.log('Escape pressed in menu');
                break;
                
            case 'ArrowUp':
                event.preventDefault();
                currentButtonIndex = (currentButtonIndex - 1 + buttonIds.length) % buttonIds.length;
                highlightButton(currentButtonIndex);
                break;
                
            case 'ArrowDown':
                event.preventDefault();
                currentButtonIndex = (currentButtonIndex + 1) % buttonIds.length;
                highlightButton(currentButtonIndex);
                break;
                
            case '1':
                event.preventDefault();
                currentButtonIndex = 0;
                activateCurrentButton(currentButtonIndex);
                break;
                
            case '2':
                event.preventDefault();
                currentButtonIndex = 1;
                activateCurrentButton(currentButtonIndex);
                break;
                
            case '3':
                event.preventDefault();
                currentButtonIndex = 2;
                activateCurrentButton(currentButtonIndex);
                break;
        }
    });
    
    // Visa initial highlight på första knappen
    highlightButton(currentButtonIndex);
}

/**
 * Highlightar en specifik knapp visuellt
 */
function highlightButton(index: number): void {
    // Återställ alla knappar och sätt highlight på den valda
    const buttons = ['play', 'instructions', 'settings'];
    buttons.forEach((buttonId, i) => {
        if (menuRenderer) {
            menuRenderer.setButtonHover(buttonId, i === index);
        }
    });
    
    console.log(`Button highlighted: ${buttons[index]}`);
}

/**
 * Aktiverar den aktuellt markerade knappen
 */
function activateCurrentButton(index: number): void {
    switch (index) {
        case 0: // Play
            startGameFromMenu();
            break;
        case 1: // Instructions
            showInstructions();
            break;
        case 2: // Settings
            showSettings();
            break;
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

// Exponera globala funktioner för debugging och HTML-callbacks
(window as any).debugGame = {
    togglePause: () => game?.togglePause(),
    getGameState: () => game?.getGameState(),
    changeLanguage: (lang: string) => i18n?.loadLanguage(lang).then(() => i18n?.updateUI()),
};

// Exponera funktioner för HTML-callbacks
(window as any).closeOverlay = closeOverlay;
(window as any).changeLanguageFromSettings = changeLanguageFromSettings;
(window as any).toggleParticles = toggleParticles;
(window as any).toggleAnimations = toggleAnimations;
(window as any).setVolume = setVolume;
(window as any).toggleSounds = toggleSounds;
(window as any).resetSettings = resetSettings;
