import { I18n } from './infrastructure/i18n/I18n.js';
import { Game } from './core/game/Game.js';
import { MenuRenderer } from './presentation/renderers/menu/MenuRenderer.js';
import { AppStateManager } from './appStateManager.js';
import { TransitionManager } from './TransitionManager.js';
import { ResponsiveManager } from './ResponsiveManager.js';
import { AudioManager, SoundEvent } from './infrastructure/audio/index.js';
import { DEFAULT_CONFIG } from './shared/constants/index.js';
import { MenuState, DifficultyLevel } from './types/index.js';
import { HighscoreModal } from './ui/highscore/HighscoreModal.js';
import { HighscoreManager } from './core/managers/HighscoreManager.js';
import { HighscoreService } from './core/services/HighscoreService.js';
import { HighscoreI18nService } from './core/services/HighscoreI18nService.js';
import { HighscoreStorageService } from './infrastructure/storage/HighscoreStorageService.js';
import { LocalStorageService } from './infrastructure/storage/LocalStorageService.js';

// Globala variabler
let game: Game | null = null;
let i18n: I18n;
let menuRenderer: MenuRenderer;
let appStateManager: AppStateManager;
let transitionManager: TransitionManager;
let responsiveManager: ResponsiveManager;
let audioManager: AudioManager;
let canvas: HTMLCanvasElement;
let menuAnimationId: number;

// Highscore-system variabler
let highscoreModal: HighscoreModal;
let highscoreManager: HighscoreManager;

// Game session variabler för highscore tracking
let gameStartTime: number | null = null;
let currentLevel: number = 1;
let selectedDifficulty: DifficultyLevel = DifficultyLevel.NORMAL;

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
        audioManager?.playUIClick();
        
        // Stoppa meny-renderingsloopen
        if (menuAnimationId) {
            cancelAnimationFrame(menuAnimationId);
        }

        // Smooth övergång till spel
        await transitionManager.transitionToGame();

        // Skapa nytt spelobjekt med vald difficulty
        game = new Game(canvas, i18n, DEFAULT_CONFIG, selectedDifficulty, 1);
        
        // Spåra spelstart för highscore
        gameStartTime = Date.now();
        currentLevel = 1;
        
        // Sätt upp callbacks för UI-uppdateringar
        game.onScore((score: number) => updateGameStats(score, undefined));
        game.onHealth((health: number) => updateGameStats(undefined, health));
        game.onGameEnd(handleGameOver);
        game.setOnLevelComplete(handleLevelComplete);
        
        // Initiera UI med level info
        const levelManager = game.getLevelManager();
        const levelInfo = levelManager.getCurrentLevelInfo();
        currentLevel = levelInfo.levelNumber;
        updateGameStats(0, levelManager.getStartingHealth());
        
        // Byt till spelläge
        appStateManager.startGame();
        
        // Starta spelmusik
        audioManager?.playBackgroundMusic(SoundEvent.GAME_MUSIC);
        
        console.log(`Game started - Difficulty: ${selectedDifficulty}, Level: ${currentLevel}`);
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
async function closeOverlay(id: string): Promise<void> {
    const overlay = document.getElementById(id);
    if (overlay) {
        audioManager?.playUIClick();
        
        // Använd TransitionManager för smooth exit
        await transitionManager?.transitionFromModal(overlay);
        
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
 * Sätter volym och uppdaterar audio system
 */
function setVolume(value: string): void {
    const volumeValue = document.getElementById('volumeValue');
    if (volumeValue) {
        volumeValue.textContent = `${value}%`;
    }
    
    // Uppdatera audio system
    const volumeFloat = parseInt(value) / 100;
    audioManager?.updateSettings({ masterVolume: volumeFloat });
    
    console.log('Volume set to:', value);
}

/**
 * Togglar ljudeffekter
 */
function toggleSounds(enabled: boolean): void {
    audioManager?.updateSettings({ soundsEnabled: enabled });
    
    // Spela feedback-ljud om UI sounds är aktiverade
    if (enabled && audioManager?.getSettings().uiSoundsEnabled) {
        audioManager?.playUIClick();
    }
    
    console.log('Sounds:', enabled ? 'enabled' : 'disabled');
}

/**
 * Togglar bakgrundsmusik
 */
function toggleMusic(enabled: boolean): void {
    audioManager?.updateSettings({ musicEnabled: enabled });
    
    // Spela feedback-ljud om UI sounds är aktiverade
    if (audioManager?.getSettings().uiSoundsEnabled) {
        audioManager?.playUIClick();
    }
    
    console.log('Music:', enabled ? 'enabled' : 'disabled');
}

/**
 * Togglar UI-ljud
 */
function toggleUISounds(enabled: boolean): void {
    audioManager?.updateSettings({ uiSoundsEnabled: enabled });
    
    // Spela feedback-ljud om det precis aktiverades
    if (enabled) {
        audioManager?.playUIClick();
    }
    
    console.log('UI Sounds:', enabled ? 'enabled' : 'disabled');
}

/**
 * Återställer inställningar till standard
 */
function resetSettings(): void {
    // Spela feedback-ljud
    audioManager?.playUIClick();
    
    // Återställ språk
    i18n.loadLanguage('sv').then(() => {
        i18n.updateUI();
        const languageSelect = document.getElementById('settingsLanguageSelect') as HTMLSelectElement;
        if (languageSelect) languageSelect.value = 'sv';
    });
    
    // Återställ grafik-checkboxes
    const graphicsCheckboxes = ['enableParticles', 'enableAnimations'];
    graphicsCheckboxes.forEach(id => {
        const checkbox = document.getElementById(id) as HTMLInputElement;
        if (checkbox) checkbox.checked = true;
    });
    
    // Återställ audio-inställningar i AudioManager (sätter defaults)
    audioManager?.resetSettings();
    
    // Uppdatera UI för att reflektera återställda värden
    if (audioManager) {
        const audioSettings = audioManager.getSettings();
        
        // Återställ volym slider
        const volumeSlider = document.getElementById('volumeSlider') as HTMLInputElement;
        if (volumeSlider) {
            volumeSlider.value = (audioSettings.masterVolume * 100).toString();
            setVolume(volumeSlider.value);
        }
        
        // Återställ alla audio checkboxes
        const soundsCheckbox = document.getElementById('enableSounds') as HTMLInputElement;
        if (soundsCheckbox) soundsCheckbox.checked = audioSettings.soundsEnabled;
        
        const musicCheckbox = document.getElementById('enableMusic') as HTMLInputElement;
        if (musicCheckbox) musicCheckbox.checked = audioSettings.musicEnabled;
        
        const uiSoundsCheckbox = document.getElementById('enableUISounds') as HTMLInputElement;
        if (uiSoundsCheckbox) uiSoundsCheckbox.checked = audioSettings.uiSoundsEnabled;
    }
    
    console.log('Settings reset to defaults');
}

/**
 * Visar instruktions-overlay med smooth transition
 */
async function showInstructions(): Promise<void> {
    console.log('Showing instructions...');
    audioManager?.playUIClick();
    
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
    
    // Använd TransitionManager för smooth entrance
    await transitionManager?.transitionToModal(overlay);
    
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
 * Visar inställnings-overlay med smooth transition
 */
async function showSettings(): Promise<void> {
    console.log('Showing settings...');
    audioManager?.playUIClick();
    
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
                    
                    <!-- Master Volume Slider -->
                    <div class="setting-item volume-control">
                        <label for="volumeSlider">
                            <span data-i18n="settings.volume">Volym</span>
                        </label>
                        <div class="slider-container">
                            <input type="range" id="volumeSlider" min="0" max="100" value="50" oninput="setVolume(this.value)">
                            <span id="volumeValue" class="volume-display">50%</span>
                        </div>
                    </div>
                    
                    <!-- Sound Effects Toggle -->
                    <label class="setting-item toggle-item">
                        <span data-i18n="settings.sounds">Ljudeffekter</span>
                        <div class="toggle-switch">
                            <input type="checkbox" id="enableSounds" checked onchange="toggleSounds(this.checked)">
                            <span class="toggle-slider"></span>
                        </div>
                    </label>
                    
                    <!-- Background Music Toggle -->
                    <label class="setting-item toggle-item">
                        <span data-i18n="settings.music">Bakgrundsmusik</span>
                        <div class="toggle-switch">
                            <input type="checkbox" id="enableMusic" checked onchange="toggleMusic(this.checked)">
                            <span class="toggle-slider"></span>
                        </div>
                    </label>
                    
                    <!-- UI Sounds Toggle -->
                    <label class="setting-item toggle-item">
                        <span data-i18n="settings.uiSounds">UI-ljud</span>
                        <div class="toggle-switch">
                            <input type="checkbox" id="enableUISounds" checked onchange="toggleUISounds(this.checked)">
                            <span class="toggle-slider"></span>
                        </div>
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
    
    // Sätt aktuella värden från audio system
    const languageSelect = document.getElementById('settingsLanguageSelect') as HTMLSelectElement;
    if (languageSelect) {
        languageSelect.value = i18n.getCurrentLanguage();
    }
    
    // Sätt audio-inställningar om audio system är initialiserat
    if (audioManager) {
        const audioSettings = audioManager.getSettings();
        
        // Sätt master volume
        const volumeSlider = document.getElementById('volumeSlider') as HTMLInputElement;
        if (volumeSlider) {
            volumeSlider.value = (audioSettings.masterVolume * 100).toString();
            setVolume(volumeSlider.value);
        }
        
        // Sätt sound effects toggle
        const soundsCheckbox = document.getElementById('enableSounds') as HTMLInputElement;
        if (soundsCheckbox) {
            soundsCheckbox.checked = audioSettings.soundsEnabled;
        }
        
        // Sätt music toggle
        const musicCheckbox = document.getElementById('enableMusic') as HTMLInputElement;
        if (musicCheckbox) {
            musicCheckbox.checked = audioSettings.musicEnabled;
        }
        
        // Sätt UI sounds toggle
        const uiSoundsCheckbox = document.getElementById('enableUISounds') as HTMLInputElement;
        if (uiSoundsCheckbox) {
            uiSoundsCheckbox.checked = audioSettings.uiSoundsEnabled;
        }
    }
    
    // Uppdatera översättningar
    i18n.updateUI();
    
    // Använd TransitionManager för smooth entrance
    await transitionManager?.transitionToModal(overlay);
    
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
 * Visar highscore modal
 */
function showHighscore(): void {
    if (!highscoreModal) {
        console.warn('HighscoreModal is not initialized');
        return;
    }

    highscoreModal.show();

    // Hantera ESC-tangent för att stänga modal
    const escapeHandler = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            highscoreModal!.hide();
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
}

/**
 * Beräknar level baserat på poäng (approximering)
 */
function calculateLevelFromScore(score: number): number {
    if (score < 100) return 1;
    if (score < 300) return 2;
    if (score < 600) return 3;
    if (score < 1000) return 4;
    if (score < 1500) return 5;
    return Math.min(10, Math.floor(score / 300) + 1);
}

/**
 * Hanterar level complete event
 */
async function handleLevelComplete(levelData: any): Promise<void> {
    console.log('Level complete!', levelData);
    
    // Spela level complete ljud
    audioManager?.playSound(SoundEvent.LEVEL_COMPLETE);
    
    // Visa level complete modal
    await showLevelCompleteModal(levelData);
}

/**
 * Visar level complete modal
 */
async function showLevelCompleteModal(levelData: any): Promise<void> {
    const overlay = createOverlay('level-complete-overlay');
    
    const { levelNumber, speedBonus, totalScore, completionTime, nextLevel } = levelData;
    
    const content = `
        <div class="modal-content level-complete">
            <div class="modal-header">
                <h2 data-i18n="levelComplete.title">Level ${levelNumber} Klart!</h2>
            </div>
            <div class="modal-body">
                <div class="level-stats">
                    <div class="stat-item">
                        <span class="stat-label" data-i18n="levelComplete.score">Poäng:</span>
                        <span class="stat-value">${totalScore}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label" data-i18n="levelComplete.time">Tid:</span>
                        <span class="stat-value">${completionTime}s</span>
                    </div>
                    <div class="stat-item highlight">
                        <span class="stat-label" data-i18n="levelComplete.speedBonus">Speed Bonus:</span>
                        <span class="stat-value">+${speedBonus}</span>
                    </div>
                </div>
                
                ${nextLevel ? `
                    <div class="next-level-info">
                        <p data-i18n="levelComplete.nextLevel">Nästa nivå: ${nextLevel}</p>
                    </div>
                ` : `
                    <div class="congratulations">
                        <h3 data-i18n="levelComplete.allComplete">🎉 Alla nivåer klarade! 🎉</h3>
                    </div>
                `}
            </div>
            <div class="modal-footer">
                ${nextLevel ? `
                    <button class="wood-button primary" onclick="continueToNextLevel()" data-i18n="levelComplete.continue">Fortsätt</button>
                ` : `
                    <button class="wood-button primary" onclick="finishGame()" data-i18n="levelComplete.finish">Avsluta</button>
                `}
                <button class="wood-button" onclick="quitToMenu()" data-i18n="levelComplete.quit">Avsluta till meny</button>
            </div>
        </div>
    `;
    
    overlay.innerHTML = content;
    document.body.appendChild(overlay);
    
    // Uppdatera översättningar
    i18n.updateUI();
    
    // Använd TransitionManager för smooth entrance
    await transitionManager?.transitionToModal(overlay);
}

/**
 * Fortsätter till nästa level
 */
function continueToNextLevel(): void {
    audioManager?.playUIClick();
    
    // Stäng modal
    closeOverlay('level-complete-overlay');
    
    // Starta nästa level
    if (game) {
        game.startNextLevel();
        
        // Uppdatera current level tracking
        const levelManager = game.getLevelManager();
        currentLevel = levelManager.getCurrentLevel();
        
        console.log(`Starting level ${currentLevel}`);
    }
}

/**
 * Avslutar spelet efter att ha klarat alla levels
 */
async function finishGame(): Promise<void> {
    audioManager?.playUIClick();
    
    // Stäng level complete modal
    closeOverlay('level-complete-overlay');
    
    // Behandla som game over för highscore
    await handleGameOver();
}

/**
 * Går tillbaka till menyn från level complete
 */
async function quitToMenu(): Promise<void> {
    audioManager?.playUIClick();
    
    // Stäng level complete modal
    closeOverlay('level-complete-overlay');
    
    // Gå till meny
    await performGameOverTransition();
}

/**
 * Hanterar när spelet tar slut
 */
async function handleGameOver(): Promise<void> {
    console.log('Game Over!');
    
    // Beräkna speldata för highscore
    const finalScore = game?.getGameState().score || 0;
    const playDuration = gameStartTime ? Math.floor((Date.now() - gameStartTime) / 1000) : 0;
    const finalLevel = calculateLevelFromScore(finalScore);
    
    console.log('Final game stats:', { 
        score: finalScore, 
        level: finalLevel, 
        duration: playDuration 
    });
    
    try {
        // Kontrollera om poäng kvalificerar för highscore
        const qualification = await highscoreManager.checkQualification(finalScore);
        
        if (qualification.result.qualifies) {
            console.log('Score qualifies for highscore!', qualification);
            
            // Visa highscore modal med Add Score dialog
            if (highscoreModal) {
                // Sätt upp modal för add score med speldata
                await showHighscoreWithAddScore(finalScore, finalLevel, playDuration);
            }
        } else {
            console.log('Score did not qualify:', qualification.message);
            
            // Visa vanlig game over meddelande och gå till meny
            await performGameOverTransition();
        }
    } catch (error) {
        console.error('Error checking highscore qualification:', error);
        
        // Fallback till vanlig game over-process
        await performGameOverTransition();
    }
}

/**
 * Visar highscore modal med Add Score dialog förifylld
 */
async function showHighscoreWithAddScore(score: number, level: number, playDuration: number): Promise<void> {
    if (!highscoreModal) {
        console.warn('HighscoreModal is not initialized');
        return;
    }
    
    // Visa highscore modal och växla till Add Score-vy
    await highscoreModal.show();
    highscoreModal.showAddScoreDialog(score, level, playDuration);
    
    // Hantera ESC-tangent för att stänga modal och gå till meny
    const escapeHandler = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            highscoreModal!.hide();
            document.removeEventListener('keydown', escapeHandler);
            // Gå till meny efter stängning
            performGameOverTransition();
        }
    };
    document.addEventListener('keydown', escapeHandler);
}

/**
 * Utför standard game over övergång till meny
 */
async function performGameOverTransition(): Promise<void> {
    try {
        // Smooth övergång tillbaka till meny
        await transitionManager.transitionToMenu();
        
        // Förstör spelobjekt
        if (game) {
            game.destroy();
            game = null;
        }
        
        // Rensa spelsession variabler
        gameStartTime = null;
        currentLevel = 1;
        
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
        
        gameStartTime = null;
        currentLevel = 1;
        
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
        
        // Initiera ljud-systemet
        audioManager = new AudioManager();
        await audioManager.initialize();
        
        // Hämta canvas-element
        canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
        if (!canvas) {
            throw new Error('Kunde inte hitta canvas-element');
        }
        
        // Skapa state manager
        appStateManager = new AppStateManager();
        
        // Skapa responsive manager
        responsiveManager = new ResponsiveManager(canvas);
        
        // Skapa transition manager med responsive manager
        transitionManager = new TransitionManager(i18n, responsiveManager);
        
        // Skapa meny renderer
        menuRenderer = new MenuRenderer(canvas, i18n);
        
        // Initiera highscore system med dependencies
        const storageService = new LocalStorageService();
        const highscoreRepository = new HighscoreStorageService(storageService);
        highscoreManager = new HighscoreManager(highscoreRepository, i18n);
        highscoreModal = new HighscoreModal(
            canvas.getContext('2d')!,
            canvas,
            i18n,
            highscoreManager
        );
        
        // Sätt upp meny callbacks
        menuRenderer.setOnPlayClick(startGameFromMenu);
        menuRenderer.setOnInstructionsClick(showInstructions);
        menuRenderer.setOnSettingsClick(showSettings);
        menuRenderer.setOnHighscoreClick(showHighscore);
        
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
        
        // Starta menymusik
        audioManager?.playBackgroundMusic(SoundEvent.MENU_MUSIC);
        
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
    
    // Spela hover-ljud
    audioManager?.playUIHover();
    
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
    
    if (audioManager) {
        audioManager.destroy();
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
(window as any).continueToNextLevel = continueToNextLevel;
(window as any).finishGame = finishGame;
(window as any).quitToMenu = quitToMenu;
