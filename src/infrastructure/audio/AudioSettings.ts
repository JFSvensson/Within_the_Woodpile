/**
 * Hanterar ljudinställningar och persistering av användarens preferenser
 */
export class AudioSettings {
    private static readonly STORAGE_KEYS = {
        MASTER_VOLUME: 'audio.masterVolume',
        SOUNDS_ENABLED: 'audio.soundsEnabled',
        MUSIC_ENABLED: 'audio.musicEnabled',
        UI_SOUNDS_ENABLED: 'audio.uiSoundsEnabled'
    } as const;

    private masterVolume: number = 0.5;
    private soundsEnabled: boolean = true;
    private musicEnabled: boolean = true;
    private uiSoundsEnabled: boolean = true;
    private listeners: Array<() => void> = [];

    constructor() {
        this.loadSettings();
    }

    /**
     * Laddar inställningar från localStorage
     */
    private loadSettings(): void {
        try {
            const masterVolume = localStorage.getItem(AudioSettings.STORAGE_KEYS.MASTER_VOLUME);
            if (masterVolume !== null) {
                this.masterVolume = Math.max(0, Math.min(1, parseFloat(masterVolume)));
            }

            const soundsEnabled = localStorage.getItem(AudioSettings.STORAGE_KEYS.SOUNDS_ENABLED);
            if (soundsEnabled !== null) {
                this.soundsEnabled = soundsEnabled === 'true';
            }

            const musicEnabled = localStorage.getItem(AudioSettings.STORAGE_KEYS.MUSIC_ENABLED);
            if (musicEnabled !== null) {
                this.musicEnabled = musicEnabled === 'true';
            }

            const uiSoundsEnabled = localStorage.getItem(AudioSettings.STORAGE_KEYS.UI_SOUNDS_ENABLED);
            if (uiSoundsEnabled !== null) {
                this.uiSoundsEnabled = uiSoundsEnabled === 'true';
            }
        } catch (error) {
            console.warn('Failed to load audio settings:', error);
        }
    }

    /**
     * Sparar inställningar till localStorage
     */
    private saveSettings(): void {
        try {
            localStorage.setItem(AudioSettings.STORAGE_KEYS.MASTER_VOLUME, this.masterVolume.toString());
            localStorage.setItem(AudioSettings.STORAGE_KEYS.SOUNDS_ENABLED, this.soundsEnabled.toString());
            localStorage.setItem(AudioSettings.STORAGE_KEYS.MUSIC_ENABLED, this.musicEnabled.toString());
            localStorage.setItem(AudioSettings.STORAGE_KEYS.UI_SOUNDS_ENABLED, this.uiSoundsEnabled.toString());
            
            // Notifiera lyssnare om ändringar
            this.notifyListeners();
        } catch (error) {
            console.warn('Failed to save audio settings:', error);
        }
    }

    /**
     * Registrerar en callback som anropas när inställningar ändras
     */
    public addChangeListener(callback: () => void): void {
        this.listeners.push(callback);
    }

    /**
     * Tar bort en change listener
     */
    public removeChangeListener(callback: () => void): void {
        const index = this.listeners.indexOf(callback);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }

    /**
     * Notifierar alla lyssnare om ändringar
     */
    private notifyListeners(): void {
        this.listeners.forEach(callback => {
            try {
                callback();
            } catch (error) {
                console.warn('Error calling audio settings change listener:', error);
            }
        });
    }

    // Getters
    public getMasterVolume(): number {
        return this.masterVolume;
    }

    public areSoundsEnabled(): boolean {
        return this.soundsEnabled;
    }

    public isMusicEnabled(): boolean {
        return this.musicEnabled;
    }

    public areUISoundsEnabled(): boolean {
        return this.uiSoundsEnabled;
    }

    /**
     * Beräknar effektiv volym för ljudeffekter
     */
    public getEffectiveVolume(): number {
        return this.soundsEnabled ? this.masterVolume : 0;
    }

    /**
     * Beräknar effektiv volym för musik
     */
    public getEffectiveMusicVolume(): number {
        return this.musicEnabled ? this.masterVolume : 0;
    }

    /**
     * Beräknar effektiv volym för UI-ljud
     */
    public getEffectiveUIVolume(): number {
        return this.uiSoundsEnabled ? this.masterVolume : 0;
    }

    // Setters
    public setMasterVolume(volume: number): void {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        this.saveSettings();
    }

    public setSoundsEnabled(enabled: boolean): void {
        this.soundsEnabled = enabled;
        this.saveSettings();
    }

    public setMusicEnabled(enabled: boolean): void {
        this.musicEnabled = enabled;
        this.saveSettings();
    }

    public setUISoundsEnabled(enabled: boolean): void {
        this.uiSoundsEnabled = enabled;
        this.saveSettings();
    }

    /**
     * Återställer alla inställningar till standardvärden
     */
    public resetToDefaults(): void {
        this.masterVolume = 0.5;
        this.soundsEnabled = true;
        this.musicEnabled = true;
        this.uiSoundsEnabled = true;
        this.saveSettings();
    }

    /**
     * Returnerar en summary av alla inställningar
     */
    public getSettings(): {
        masterVolume: number;
        soundsEnabled: boolean;
        musicEnabled: boolean;
        uiSoundsEnabled: boolean;
    } {
        return {
            masterVolume: this.masterVolume,
            soundsEnabled: this.soundsEnabled,
            musicEnabled: this.musicEnabled,
            uiSoundsEnabled: this.uiSoundsEnabled
        };
    }
}