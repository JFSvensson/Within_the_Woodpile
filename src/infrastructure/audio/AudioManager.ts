import { AudioSettings } from './AudioSettings.js';
import { SoundService } from './SoundService.js';
import { AudioAsset, SoundConfig, SoundEvent, AudioCategory } from './types.js';

/**
 * Centraliserad ljudhanterare som koordinerar alla ljud-aspekter av spelet
 */
export class AudioManager {
    private audioSettings: AudioSettings;
    private soundService: SoundService;
    private isInitialized: boolean = false;
    private soundAssets: Map<string, AudioAsset> = new Map();

    constructor() {
        this.audioSettings = new AudioSettings();
        this.soundService = new SoundService(this.audioSettings);
        this.setupDefaultSoundAssets();
    }

    /**
     * Definierar alla ljudfiler som spelet använder
     */
    private setupDefaultSoundAssets(): void {
        const assets: AudioAsset[] = [
            // UI ljud (enkla toner som kan genereras eller placeholders)
            { 
                id: SoundEvent.UI_CLICK, 
                url: 'assets/audio/ui/click.mp3', 
                category: AudioCategory.UI,
                volume: 0.6 
            },
            { 
                id: SoundEvent.UI_HOVER, 
                url: 'assets/audio/ui/hover.mp3', 
                category: AudioCategory.UI,
                volume: 0.3 
            },
            { 
                id: SoundEvent.UI_OPEN_MODAL, 
                url: 'assets/audio/ui/open.mp3', 
                category: AudioCategory.UI,
                volume: 0.5 
            },
            { 
                id: SoundEvent.UI_CLOSE_MODAL, 
                url: 'assets/audio/ui/close.mp3', 
                category: AudioCategory.UI,
                volume: 0.5 
            },

            // Spel ljud
            { 
                id: SoundEvent.WOOD_PICKUP, 
                url: 'assets/audio/game/wood_pickup.mp3', 
                category: AudioCategory.SFX,
                volume: 0.7 
            },
            { 
                id: SoundEvent.WOOD_COLLAPSE, 
                url: 'assets/audio/game/wood_collapse.mp3', 
                category: AudioCategory.SFX,
                volume: 0.8 
            },
            { 
                id: SoundEvent.WOOD_HOVER, 
                url: 'assets/audio/game/wood_hover.mp3', 
                category: AudioCategory.SFX,
                volume: 0.2 
            },

            // Varelser
            { 
                id: SoundEvent.CREATURE_APPEAR, 
                url: 'assets/audio/creatures/appear.mp3', 
                category: AudioCategory.SFX,
                volume: 0.6 
            },
            { 
                id: SoundEvent.CREATURE_SUCCESS, 
                url: 'assets/audio/creatures/success.mp3', 
                category: AudioCategory.SFX,
                volume: 0.7 
            },
            { 
                id: SoundEvent.CREATURE_FAIL, 
                url: 'assets/audio/creatures/fail.mp3', 
                category: AudioCategory.SFX,
                volume: 0.8 
            },
            { 
                id: SoundEvent.SPIDER_SCURRY, 
                url: 'assets/audio/creatures/spider.mp3', 
                category: AudioCategory.SFX,
                volume: 0.5 
            },
            { 
                id: SoundEvent.WASP_BUZZ, 
                url: 'assets/audio/creatures/wasp.mp3', 
                category: AudioCategory.SFX,
                volume: 0.6 
            },
            { 
                id: SoundEvent.HEDGEHOG_RUSTLE, 
                url: 'assets/audio/creatures/hedgehog.mp3', 
                category: AudioCategory.SFX,
                volume: 0.4 
            },
            { 
                id: SoundEvent.GHOST_WHISPER, 
                url: 'assets/audio/creatures/ghost.mp3', 
                category: AudioCategory.SFX,
                volume: 0.7 
            },
            { 
                id: SoundEvent.PUMPKIN_ROLL, 
                url: 'assets/audio/creatures/pumpkin.mp3', 
                category: AudioCategory.SFX,
                volume: 0.5 
            },

            // Bakgrundsmusik
            { 
                id: SoundEvent.MENU_MUSIC, 
                url: 'assets/audio/music/menu.mp3', 
                category: AudioCategory.MUSIC,
                volume: 0.4,
                loop: true 
            },
            { 
                id: SoundEvent.GAME_MUSIC, 
                url: 'assets/audio/music/game.mp3', 
                category: AudioCategory.MUSIC,
                volume: 0.3,
                loop: true 
            },
            { 
                id: SoundEvent.GAME_OVER_MUSIC, 
                url: 'assets/audio/music/game_over.mp3', 
                category: AudioCategory.MUSIC,
                volume: 0.5 
            },

            // Spel events
            { 
                id: SoundEvent.HEALTH_LOW, 
                url: 'assets/audio/game/health_low.mp3', 
                category: AudioCategory.SFX,
                volume: 0.8 
            },
            { 
                id: SoundEvent.LEVEL_COMPLETE, 
                url: 'assets/audio/game/level_complete.mp3', 
                category: AudioCategory.SFX,
                volume: 0.7 
            },
            { 
                id: SoundEvent.SCORE_MILESTONE, 
                url: 'assets/audio/game/score_milestone.mp3', 
                category: AudioCategory.SFX,
                volume: 0.6 
            }
        ];

        // Registrera alla assets
        assets.forEach(asset => {
            this.soundAssets.set(asset.id, asset);
        });
    }

    /**
     * Initialiserar ljud-systemet och laddar kritiska ljud
     */
    public async initialize(): Promise<void> {
        try {
            console.log('Initializing audio system...');

            // Preload kritiska UI-ljud för responsivitet
            const criticalSounds = [
                SoundEvent.UI_CLICK,
                SoundEvent.UI_HOVER,
                SoundEvent.WOOD_PICKUP,
                SoundEvent.CREATURE_APPEAR
            ];

            const criticalAssets = criticalSounds
                .map(soundId => this.soundAssets.get(soundId))
                .filter(asset => asset !== undefined) as AudioAsset[];

            await this.soundService.preloadSounds(criticalAssets);

            this.isInitialized = true;
            console.log('Audio system initialized successfully');
        } catch (error) {
            console.warn('Failed to fully initialize audio system:', error);
            // Markera som initialiserad ändå så spelet kan köra utan ljud
            this.isInitialized = true;
        }
    }

    /**
     * Spelar upp ett ljud-event
     */
    public async playSound(event: SoundEvent, config?: SoundConfig): Promise<void> {
        if (!this.isInitialized) {
            console.warn('Audio system not initialized, cannot play sound:', event);
            return;
        }

        const asset = this.soundAssets.get(event);
        if (!asset) {
            console.warn('Sound asset not found:', event);
            return;
        }

        try {
            // Ladda ljud om det inte redan är cachat
            await this.soundService.loadSound(asset);
            
            // Spela upp med konfiguration
            await this.soundService.playSound(event, config);
        } catch (error) {
            console.warn(`Failed to play sound ${event}:`, error);
        }
    }

    /**
     * Spelar bakgrundsmusik med smooth övergång
     */
    public async playBackgroundMusic(musicEvent: SoundEvent): Promise<void> {
        // Stoppa befintlig musik
        this.soundService.stopSoundsByCategory(AudioCategory.MUSIC);
        
        // Spela ny musik
        await this.playSound(musicEvent, { loop: true });
    }

    /**
     * Stoppar all bakgrundsmusik
     */
    public stopBackgroundMusic(): void {
        this.soundService.stopSoundsByCategory(AudioCategory.MUSIC);
    }

    /**
     * Hanterar inställningsändringar från UI
     */
    public updateSettings(settings: {
        masterVolume?: number;
        soundsEnabled?: boolean;
        musicEnabled?: boolean;
        uiSoundsEnabled?: boolean;
    }): void {
        if (settings.masterVolume !== undefined) {
            this.audioSettings.setMasterVolume(settings.masterVolume);
        }
        if (settings.soundsEnabled !== undefined) {
            this.audioSettings.setSoundsEnabled(settings.soundsEnabled);
        }
        if (settings.musicEnabled !== undefined) {
            this.audioSettings.setMusicEnabled(settings.musicEnabled);
        }
        if (settings.uiSoundsEnabled !== undefined) {
            this.audioSettings.setUISoundsEnabled(settings.uiSoundsEnabled);
        }
    }

    /**
     * Återställer ljud-inställningar till standard
     */
    public resetSettings(): void {
        this.audioSettings.resetToDefaults();
    }

    /**
     * Hämtar aktuella ljud-inställningar
     */
    public getSettings(): {
        masterVolume: number;
        soundsEnabled: boolean;
        musicEnabled: boolean;
        uiSoundsEnabled: boolean;
    } {
        return this.audioSettings.getSettings();
    }

    /**
     * Registrerar en callback som anropas när inställningar ändras
     */
    public onSettingsChange(callback: () => void): void {
        this.audioSettings.addChangeListener(callback);
    }

    /**
     * Pausar all audio (användbart vid tab switch etc.)
     */
    public pauseAll(): void {
        this.soundService.stopAllSounds();
    }

    /**
     * Återupptar audio efter paus
     */
    public resumeAll(): void {
        // Efter pause kan vi spela upp ambient ljud igen om så önskas
        // För nu gör vi inget - musik kommer spelas när den behövs
    }

    /**
     * Convenience metoder för vanliga ljud-events
     */
    public playUIClick(): void {
        this.playSound(SoundEvent.UI_CLICK);
    }

    public playUIHover(): void {
        this.playSound(SoundEvent.UI_HOVER);
    }

    public playWoodPickup(): void {
        this.playSound(SoundEvent.WOOD_PICKUP);
    }

    public playWoodCollapse(): void {
        this.playSound(SoundEvent.WOOD_COLLAPSE);
    }

    public playCreatureAppear(): void {
        this.playSound(SoundEvent.CREATURE_APPEAR);
    }

    public playCreatureSuccess(): void {
        this.playSound(SoundEvent.CREATURE_SUCCESS);
    }

    public playCreatureFail(): void {
        this.playSound(SoundEvent.CREATURE_FAIL);
    }

    /**
     * Förstör audio-systemet och frigör resurser
     */
    public destroy(): void {
        this.soundService.destroy();
        this.soundAssets.clear();
        this.isInitialized = false;
    }

    /**
     * Debug-information om ljud-systemets status
     */
    public getDebugInfo(): object {
        return {
            initialized: this.isInitialized,
            settings: this.getSettings(),
            serviceStatus: this.soundService.getStatus(),
            registeredAssets: Array.from(this.soundAssets.keys())
        };
    }
}