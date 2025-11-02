import { I18n } from '../infrastructure/i18n/I18n.js';
import { AudioManager, SoundEvent } from '../infrastructure/audio/index.js';
import { TransitionManager } from '../TransitionManager.js';
import { HighscoreManager } from '../core/managers/HighscoreManager.js';
import { BASE_TIME_FOR_BONUS } from '../shared/constants/difficultyConfig.js';
import { HighscoreModal } from '../ui/highscore/HighscoreModal.js';

/**
 * Hanterar alla modaler i applikationen
 * Centraliserad modal management för settings, instructions, level complete, highscore
 */
export class ModalManager {
    private highscoreModal?: HighscoreModal;

    constructor(
        private i18n: I18n,
        private audioManager: AudioManager,
        private transitionManager: TransitionManager
    ) {
        // Exponera modal-funktioner globalt för HTML onclick
        this.exposeGlobalFunctions();
    }

    /**
     * Visar instruktions-modal
     */
    async showInstructions(): Promise<void> {
        console.log('Showing instructions...');
        this.audioManager?.playUIClick();
        
        const overlay = this.createOverlay('instructions-overlay');
        
        const content = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 data-i18n="instructions.title">Instruktioner</h2>
                    <button class="close-button" onclick="window.modalManager.closeOverlay('instructions-overlay')">&times;</button>
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
                    <button class="wood-button" onclick="window.modalManager.closeOverlay('instructions-overlay')" data-i18n="common.close">Stäng</button>
                </div>
            </div>
        `;
        
        overlay.innerHTML = content;
        document.body.appendChild(overlay);
        
        this.i18n.updateUI();
        await this.transitionManager?.transitionToModal(overlay);
        
        this.setupEscapeHandler('instructions-overlay');
    }

    /**
     * Visar settings-modal
     */
    async showSettings(): Promise<void> {
        console.log('Showing settings...');
        this.audioManager?.playUIClick();
        
        const overlay = this.createOverlay('settings-overlay');
        
        const content = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 data-i18n="settings.title">Inställningar</h2>
                    <button class="close-button" onclick="window.modalManager.closeOverlay('settings-overlay')">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="setting-section">
                        <h3 data-i18n="settings.language">Språk</h3>
                        <select id="settingsLanguageSelect" onchange="window.modalManager.changeLanguage(this.value)">
                            <option value="sv">Svenska</option>
                            <option value="en">English</option>
                        </select>
                    </div>
                    
                    <div class="setting-section">
                        <h3 data-i18n="settings.graphics">Grafik</h3>
                        <label class="setting-item">
                            <input type="checkbox" id="enableParticles" checked onchange="window.modalManager.toggleParticles(this.checked)">
                            <span data-i18n="settings.particles">Aktivera partiklar</span>
                        </label>
                        <label class="setting-item">
                            <input type="checkbox" id="enableAnimations" checked onchange="window.modalManager.toggleAnimations(this.checked)">
                            <span data-i18n="settings.animations">Aktivera animationer</span>
                        </label>
                    </div>
                    
                    <div class="setting-section">
                        <h3 data-i18n="settings.audio">Ljud</h3>
                        
                        <div class="setting-item volume-control">
                            <label for="volumeSlider">
                                <span data-i18n="settings.volume">Volym</span>
                            </label>
                            <div class="slider-container">
                                <input type="range" id="volumeSlider" min="0" max="100" value="50" oninput="window.modalManager.setVolume(this.value)">
                                <span id="volumeValue" class="volume-display">50%</span>
                            </div>
                        </div>
                        
                        <label class="setting-item toggle-item">
                            <span data-i18n="settings.sounds">Ljudeffekter</span>
                            <div class="toggle-switch">
                                <input type="checkbox" id="enableSounds" checked onchange="window.modalManager.toggleSounds(this.checked)">
                                <span class="toggle-slider"></span>
                            </div>
                        </label>
                        
                        <label class="setting-item toggle-item">
                            <span data-i18n="settings.music">Bakgrundsmusik</span>
                            <div class="toggle-switch">
                                <input type="checkbox" id="enableMusic" checked onchange="window.modalManager.toggleMusic(this.checked)">
                                <span class="toggle-slider"></span>
                            </div>
                        </label>
                        
                        <label class="setting-item toggle-item">
                            <span data-i18n="settings.uiSounds">UI-ljud</span>
                            <div class="toggle-switch">
                                <input type="checkbox" id="enableUISounds" checked onchange="window.modalManager.toggleUISounds(this.checked)">
                                <span class="toggle-slider"></span>
                            </div>
                        </label>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="wood-button" onclick="window.modalManager.resetSettings()" data-i18n="settings.reset">Återställ</button>
                    <button class="wood-button primary" onclick="window.modalManager.closeOverlay('settings-overlay')" data-i18n="common.close">Stäng</button>
                </div>
            </div>
        `;
        
        overlay.innerHTML = content;
        document.body.appendChild(overlay);
        
        this.loadSettingsValues();
        this.i18n.updateUI();
        await this.transitionManager?.transitionToModal(overlay);
        
        this.setupEscapeHandler('settings-overlay');
    }

    /**
     * Visar highscore modal
     */
    async showHighscore(highscoreManager: HighscoreManager): Promise<void> {
        if (!this.highscoreModal) {
            const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
            this.highscoreModal = new HighscoreModal(
                canvas.getContext('2d')!,
                canvas,
                this.i18n,
                highscoreManager
            );
        }

        this.highscoreModal.show();

        const escapeHandler = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                this.highscoreModal!.hide();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    }

    /**
     * Visar highscore med add score dialog
     */
    async showHighscoreWithAddScore(
        highscoreManager: HighscoreManager,
        score: number,
        level: number,
        playDuration: number
    ): Promise<void> {
        if (!this.highscoreModal) {
            const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
            this.highscoreModal = new HighscoreModal(
                canvas.getContext('2d')!,
                canvas,
                this.i18n,
                highscoreManager
            );
        }
        
        await this.highscoreModal.show();
        this.highscoreModal.showAddScoreDialog(score, level, playDuration);
    }

    /**
     * Visar level complete modal
     */
    async showLevelComplete(
        levelData: any,
        onContinue: () => void,
        onFinish: () => void,
        onQuit: () => void
    ): Promise<void> {
        const overlay = this.createOverlay('level-complete-overlay');
        
        const { levelNumber, speedBonus, totalScore, completionTime, nextLevel } = levelData;
        
        // Beräkna om speed bonus gavs
        const timeLimit = BASE_TIME_FOR_BONUS;
        const wasQuick = completionTime < timeLimit;
        const timeDiff = timeLimit - completionTime;
        
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
                        <div class="stat-item ${wasQuick ? 'quick-time' : ''}">
                            <span class="stat-label" data-i18n="levelComplete.time">Tid:</span>
                            <span class="stat-value">${completionTime}s</span>
                            ${wasQuick ? '<span class="quick-badge">⚡ SNABB!</span>' : ''}
                        </div>
                        <div class="stat-item highlight ${speedBonus > 0 ? 'bonus-earned' : 'no-bonus'}">
                            <span class="stat-label" data-i18n="levelComplete.speedBonus">Speed Bonus:</span>
                            <span class="stat-value ${speedBonus > 0 ? 'positive' : ''}">+${speedBonus}</span>
                        </div>
                    </div>
                    
                    ${speedBonus > 0 ? `
                        <div class="bonus-explanation">
                            <p class="bonus-text">
                                🎯 Du klarade nivån ${timeDiff}s under tidsgränsen (${timeLimit}s)!
                            </p>
                            <p class="bonus-formula">
                                ${timeDiff}s × 5 poäng/s = <strong>+${speedBonus} bonus</strong>
                            </p>
                        </div>
                    ` : `
                        <div class="bonus-explanation no-bonus-msg">
                            <p>⏱️ Klarade på ${completionTime}s (gräns: ${timeLimit}s för bonus)</p>
                        </div>
                    `}
                    
                    ${nextLevel ? `
                        <div class="next-level-info">
                            <p data-i18n="levelComplete.nextLevel">Nästa nivå: <strong>${nextLevel}</strong></p>
                        </div>
                    ` : `
                        <div class="congratulations">
                            <h3 data-i18n="levelComplete.allComplete">🎉 Alla nivåer klarade! 🎉</h3>
                            <p class="final-score">Total poäng: <strong>${totalScore}</strong></p>
                        </div>
                    `}
                </div>
                <div class="modal-footer">
                    ${nextLevel ? `
                        <button class="wood-button primary" id="continueButton" data-i18n="levelComplete.continue">Fortsätt</button>
                    ` : `
                        <button class="wood-button primary" id="finishButton" data-i18n="levelComplete.finish">Avsluta</button>
                    `}
                    <button class="wood-button" id="quitButton" data-i18n="levelComplete.quit">Avsluta till meny</button>
                </div>
            </div>
        `;
        
        overlay.innerHTML = content;
        document.body.appendChild(overlay);
        
        // Sätt upp event listeners
        const continueBtn = document.getElementById('continueButton');
        const finishBtn = document.getElementById('finishButton');
        const quitBtn = document.getElementById('quitButton');
        
        if (continueBtn) {
            continueBtn.addEventListener('click', () => {
                this.closeOverlay('level-complete-overlay');
                onContinue();
            });
        }
        
        if (finishBtn) {
            finishBtn.addEventListener('click', () => {
                this.closeOverlay('level-complete-overlay');
                onFinish();
            });
        }
        
        if (quitBtn) {
            quitBtn.addEventListener('click', () => {
                this.closeOverlay('level-complete-overlay');
                onQuit();
            });
        }
        
        this.i18n.updateUI();
        await this.transitionManager?.transitionToModal(overlay);
    }

    /**
     * Skapar en overlay för modaler
     */
    private createOverlay(id: string): HTMLElement {
        const existing = document.getElementById(id);
        if (existing) {
            existing.remove();
        }
        
        const overlay = document.createElement('div');
        overlay.id = id;
        overlay.className = 'modal-overlay';
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.closeOverlay(id);
            }
        });
        
        return overlay;
    }

    /**
     * Stänger en overlay
     */
    async closeOverlay(id: string): Promise<void> {
        const overlay = document.getElementById(id);
        if (overlay) {
            this.audioManager?.playUIClick();
            await this.transitionManager?.transitionFromModal(overlay);
            overlay.remove();
        }
    }

    /**
     * Sätter upp ESC-hantering för modal
     */
    private setupEscapeHandler(overlayId: string): void {
        const escapeHandler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                this.closeOverlay(overlayId);
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    }

    /**
     * Laddar settings-värden från audio system
     */
    private loadSettingsValues(): void {
        const languageSelect = document.getElementById('settingsLanguageSelect') as HTMLSelectElement;
        if (languageSelect) {
            languageSelect.value = this.i18n.getCurrentLanguage();
        }
        
        if (this.audioManager) {
            const audioSettings = this.audioManager.getSettings();
            
            const volumeSlider = document.getElementById('volumeSlider') as HTMLInputElement;
            if (volumeSlider) {
                volumeSlider.value = (audioSettings.masterVolume * 100).toString();
                this.setVolume(volumeSlider.value);
            }
            
            const soundsCheckbox = document.getElementById('enableSounds') as HTMLInputElement;
            if (soundsCheckbox) soundsCheckbox.checked = audioSettings.soundsEnabled;
            
            const musicCheckbox = document.getElementById('enableMusic') as HTMLInputElement;
            if (musicCheckbox) musicCheckbox.checked = audioSettings.musicEnabled;
            
            const uiSoundsCheckbox = document.getElementById('enableUISounds') as HTMLInputElement;
            if (uiSoundsCheckbox) uiSoundsCheckbox.checked = audioSettings.uiSoundsEnabled;
        }
    }

    // Settings handlers
    changeLanguage(language: string): void {
        this.i18n.loadLanguage(language).then(() => {
            this.i18n.updateUI();
        });
    }

    toggleParticles(enabled: boolean): void {
        console.log('Particles:', enabled ? 'enabled' : 'disabled');
        // TODO: Implementera partikel-toggle i particle system
    }

    toggleAnimations(enabled: boolean): void {
        console.log('Animations:', enabled ? 'enabled' : 'disabled');
        // TODO: Implementera animation-toggle
    }

    setVolume(value: string): void {
        const volumeValue = document.getElementById('volumeValue');
        if (volumeValue) {
            volumeValue.textContent = `${value}%`;
        }
        
        const volumeFloat = parseInt(value) / 100;
        this.audioManager?.updateSettings({ masterVolume: volumeFloat });
    }

    toggleSounds(enabled: boolean): void {
        this.audioManager?.updateSettings({ soundsEnabled: enabled });
        
        if (enabled && this.audioManager?.getSettings().uiSoundsEnabled) {
            this.audioManager?.playUIClick();
        }
    }

    toggleMusic(enabled: boolean): void {
        this.audioManager?.updateSettings({ musicEnabled: enabled });
        
        if (this.audioManager?.getSettings().uiSoundsEnabled) {
            this.audioManager?.playUIClick();
        }
    }

    toggleUISounds(enabled: boolean): void {
        this.audioManager?.updateSettings({ uiSoundsEnabled: enabled });
        
        if (enabled) {
            this.audioManager?.playUIClick();
        }
    }

    resetSettings(): void {
        this.audioManager?.playUIClick();
        
        this.i18n.loadLanguage('sv').then(() => {
            this.i18n.updateUI();
            const languageSelect = document.getElementById('settingsLanguageSelect') as HTMLSelectElement;
            if (languageSelect) languageSelect.value = 'sv';
        });
        
        const graphicsCheckboxes = ['enableParticles', 'enableAnimations'];
        graphicsCheckboxes.forEach(id => {
            const checkbox = document.getElementById(id) as HTMLInputElement;
            if (checkbox) checkbox.checked = true;
        });
        
        this.audioManager?.resetSettings();
        this.loadSettingsValues();
    }

    /**
     * Exponerar funktioner globalt för HTML onclick
     */
    private exposeGlobalFunctions(): void {
        (window as any).modalManager = this;
    }
}
