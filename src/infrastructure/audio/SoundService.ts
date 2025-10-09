import { AudioSettings } from './AudioSettings.js';
import { SoundConfig, AudioAsset, AudioCategory, PlayingSoundInfo } from './types.js';

/**
 * Hanterar laddning, cachning och uppspelning av ljudfiler
 */
export class SoundService {
    private audioSettings: AudioSettings;
    private audioCache: Map<string, HTMLAudioElement> = new Map();
    private playingSounds: Map<string, PlayingSoundInfo> = new Map();
    private loadingPromises: Map<string, Promise<HTMLAudioElement>> = new Map();
    private maxSimultaneousSounds: number = 10;
    private audioContext: AudioContext | null = null;

    constructor(audioSettings: AudioSettings) {
        this.audioSettings = audioSettings;
        this.initializeAudioContext();
        this.setupAudioSettingsListener();
    }

    /**
     * Initialiserar Web Audio API context för bättre kontroll
     */
    private initializeAudioContext(): void {
        try {
            // Skapa AudioContext om det stöds
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContextClass) {
                this.audioContext = new AudioContextClass();
            }
        } catch (error) {
            console.warn('Failed to initialize AudioContext:', error);
        }
    }

    /**
     * Lyssnar på ändringar i ljudinställningar
     */
    private setupAudioSettingsListener(): void {
        this.audioSettings.addChangeListener(() => {
            this.updateAllPlayingSoundsVolume();
        });
    }

    /**
     * Laddar en ljudfil och cachar den
     */
    public async loadSound(asset: AudioAsset): Promise<HTMLAudioElement> {
        // Kolla om ljudet redan finns i cache
        if (this.audioCache.has(asset.id)) {
            return this.audioCache.get(asset.id)!;
        }

        // Kolla om vi redan laddar detta ljud
        if (this.loadingPromises.has(asset.id)) {
            return this.loadingPromises.get(asset.id)!;
        }

        // Skapa loading promise
        const loadingPromise = this.createAudioElement(asset);
        this.loadingPromises.set(asset.id, loadingPromise);

        try {
            const audio = await loadingPromise;
            this.audioCache.set(asset.id, audio);
            this.loadingPromises.delete(asset.id);
            return audio;
        } catch (error) {
            this.loadingPromises.delete(asset.id);
            throw error;
        }
    }

    /**
     * Skapar ett HTMLAudioElement för en ljud-asset
     */
    private async createAudioElement(asset: AudioAsset): Promise<HTMLAudioElement> {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            
            // Sätt grundläggande properties
            audio.preload = 'auto';
            audio.volume = asset.volume || 1.0;
            audio.loop = asset.loop || false;

            // Event listeners för laddning
            const onCanPlayThrough = () => {
                cleanup();
                resolve(audio);
            };

            const onError = (error: Event) => {
                cleanup();
                reject(new Error(`Failed to load audio: ${asset.url}`));
            };

            const cleanup = () => {
                audio.removeEventListener('canplaythrough', onCanPlayThrough);
                audio.removeEventListener('error', onError);
            };

            audio.addEventListener('canplaythrough', onCanPlayThrough);
            audio.addEventListener('error', onError);

            // Börja ladda
            audio.src = asset.url;
            audio.load();
        });
    }

    /**
     * Spelar upp ett ljud med given konfiguration
     */
    public async playSound(soundId: string, config: SoundConfig = {}): Promise<string | null> {
        try {
            // Hämta ljud från cache
            const audio = this.audioCache.get(soundId);
            if (!audio) {
                console.warn(`Sound not loaded: ${soundId}`);
                return null;
            }

            // Begränsa antal samtidiga ljud
            if (this.playingSounds.size >= this.maxSimultaneousSounds) {
                this.stopOldestSound();
            }

            // Klona audio element för samtidig uppspelning
            const playingAudio = audio.cloneNode() as HTMLAudioElement;
            
            // Applicera konfiguration
            this.applyConfig(playingAudio, config);
            
            // Sätt volym baserat på kategori och inställningar
            const category = this.getCategoryForSound(soundId);
            const effectiveVolume = this.getEffectiveVolumeForCategory(category);
            playingAudio.volume = effectiveVolume * (config.volume || 1.0);

            // Generera unikt play ID
            const playId = `${soundId}_${Date.now()}_${Math.random()}`;

            // Registrera som spelande ljud
            const playingInfo: PlayingSoundInfo = {
                id: playId,
                audio: playingAudio,
                category,
                startTime: Date.now(),
                config
            };
            this.playingSounds.set(playId, playingInfo);

            // Sätt upp cleanup när ljudet slutar
            const cleanup = () => {
                this.playingSounds.delete(playId);
                playingAudio.removeEventListener('ended', cleanup);
                playingAudio.removeEventListener('error', cleanup);
            };
            playingAudio.addEventListener('ended', cleanup);
            playingAudio.addEventListener('error', cleanup);

            // Starta uppspelning
            await playingAudio.play();
            
            return playId;
        } catch (error) {
            console.warn(`Failed to play sound ${soundId}:`, error);
            return null;
        }
    }

    /**
     * Stoppar ett specifikt ljud
     */
    public stopSound(playId: string): void {
        const playingInfo = this.playingSounds.get(playId);
        if (playingInfo) {
            playingInfo.audio.pause();
            playingInfo.audio.currentTime = 0;
            this.playingSounds.delete(playId);
        }
    }

    /**
     * Stoppar alla ljud av en viss kategori
     */
    public stopSoundsByCategory(category: AudioCategory): void {
        for (const [playId, info] of this.playingSounds.entries()) {
            if (info.category === category) {
                this.stopSound(playId);
            }
        }
    }

    /**
     * Stoppar alla ljud
     */
    public stopAllSounds(): void {
        for (const playId of this.playingSounds.keys()) {
            this.stopSound(playId);
        }
    }

    /**
     * Applicerar konfiguration på ett audio element
     */
    private applyConfig(audio: HTMLAudioElement, config: SoundConfig): void {
        if (config.loop !== undefined) {
            audio.loop = config.loop;
        }
        if (config.playbackRate !== undefined) {
            audio.playbackRate = config.playbackRate;
        }
        if (config.startTime !== undefined) {
            audio.currentTime = config.startTime;
        }
    }

    /**
     * Stoppar det äldsta ljudet för att frigöra resurser
     */
    private stopOldestSound(): void {
        let oldestTime = Infinity;
        let oldestPlayId = '';

        for (const [playId, info] of this.playingSounds.entries()) {
            if (info.startTime < oldestTime) {
                oldestTime = info.startTime;
                oldestPlayId = playId;
            }
        }

        if (oldestPlayId) {
            this.stopSound(oldestPlayId);
        }
    }

    /**
     * Uppdaterar volym för alla spelande ljud baserat på nya inställningar
     */
    private updateAllPlayingSoundsVolume(): void {
        for (const info of this.playingSounds.values()) {
            const effectiveVolume = this.getEffectiveVolumeForCategory(info.category);
            info.audio.volume = effectiveVolume * (info.config.volume || 1.0);
        }
    }

    /**
     * Hämtar kategori för ett ljud baserat på ID
     */
    private getCategoryForSound(soundId: string): AudioCategory {
        if (soundId.startsWith('ui.')) return AudioCategory.UI;
        if (soundId.startsWith('music.')) return AudioCategory.MUSIC;
        if (soundId.startsWith('creature.')) return AudioCategory.SFX;
        if (soundId.startsWith('game.')) return AudioCategory.SFX;
        return AudioCategory.SFX; // Default
    }

    /**
     * Beräknar effektiv volym för en kategori
     */
    private getEffectiveVolumeForCategory(category: AudioCategory): number {
        switch (category) {
            case AudioCategory.MUSIC:
                return this.audioSettings.getEffectiveMusicVolume();
            case AudioCategory.UI:
                return this.audioSettings.getEffectiveUIVolume();
            case AudioCategory.SFX:
            case AudioCategory.AMBIENT:
            default:
                return this.audioSettings.getEffectiveVolume();
        }
    }

    /**
     * Preload multiple sounds simultaneously
     */
    public async preloadSounds(assets: AudioAsset[]): Promise<void> {
        const loadPromises = assets.map(asset => this.loadSound(asset));
        
        try {
            await Promise.all(loadPromises);
            console.log(`Successfully preloaded ${assets.length} audio assets`);
        } catch (error) {
            console.warn('Some audio assets failed to preload:', error);
        }
    }

    /**
     * Frigör alla cachade ljud och stoppar uppspelning
     */
    public destroy(): void {
        this.stopAllSounds();
        this.audioCache.clear();
        this.loadingPromises.clear();
        
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }
    }

    /**
     * Returnerar information om aktuellt ljud-status
     */
    public getStatus(): {
        cachedSounds: number;
        playingSounds: number;
        loadingSounds: number;
    } {
        return {
            cachedSounds: this.audioCache.size,
            playingSounds: this.playingSounds.size,
            loadingSounds: this.loadingPromises.size
        };
    }
}