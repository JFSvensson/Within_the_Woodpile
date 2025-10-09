/**
 * Typer för ljud-systemet
 */
export interface SoundConfig {
    volume?: number;
    loop?: boolean;
    playbackRate?: number;
    startTime?: number;
    endTime?: number;
}

export interface AudioAsset {
    id: string;
    url: string;
    category: AudioCategory;
    volume?: number;
    loop?: boolean;
}

export enum AudioCategory {
    MUSIC = 'music',
    SFX = 'sfx',
    UI = 'ui',
    AMBIENT = 'ambient'
}

export enum SoundEvent {
    // UI ljud
    UI_CLICK = 'ui.click',
    UI_HOVER = 'ui.hover',
    UI_OPEN_MODAL = 'ui.openModal',
    UI_CLOSE_MODAL = 'ui.closeModal',
    
    // Spel ljud
    WOOD_PICKUP = 'game.woodPickup',
    WOOD_COLLAPSE = 'game.woodCollapse',
    WOOD_HOVER = 'game.woodHover',
    
    // Varelse ljud
    CREATURE_APPEAR = 'creature.appear',
    CREATURE_SUCCESS = 'creature.success',
    CREATURE_FAIL = 'creature.fail',
    SPIDER_SCURRY = 'creature.spiderScurry',
    WASP_BUZZ = 'creature.waspBuzz',
    HEDGEHOG_RUSTLE = 'creature.hedgehogRustle',
    GHOST_WHISPER = 'creature.ghostWhisper',
    PUMPKIN_ROLL = 'creature.pumpkinRoll',
    
    // Bakgrundsmusik
    MENU_MUSIC = 'music.menu',
    GAME_MUSIC = 'music.game',
    GAME_OVER_MUSIC = 'music.gameOver',
    
    // Spel events
    HEALTH_LOW = 'game.healthLow',
    LEVEL_COMPLETE = 'game.levelComplete',
    SCORE_MILESTONE = 'game.scoreMilestone'
}

export interface PlayingSoundInfo {
    id: string;
    audio: HTMLAudioElement;
    category: AudioCategory;
    startTime: number;
    config: SoundConfig;
}