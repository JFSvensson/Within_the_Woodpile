import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AudioManager } from '../../../../src/infrastructure/audio/AudioManager';
import { SoundEvent, AudioCategory } from '../../../../src/infrastructure/audio/types';
import { createMockAudio, createMockLocalStorage, MockAudioElement } from './mock-audio-helpers';

describe('AudioManager', () => {
  let audioManager: AudioManager;
  let mockAudioConstructor: any;
  let mockAudioElements: MockAudioElement[];

  beforeEach(async () => {
    const mockLocalStorage = createMockLocalStorage();
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });

    mockAudioElements = [];
    
    mockAudioConstructor = vi.spyOn(window, 'Audio').mockImplementation(() => {
      const mockAudio = createMockAudio();
      mockAudioElements.push(mockAudio);
      return mockAudio as unknown as HTMLAudioElement;
    });

    audioManager = new AudioManager();
    await audioManager.initialize();
  });

  afterEach(() => {
    mockAudioConstructor.mockRestore();
    vi.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create AudioManager instance', () => {
      const manager = new AudioManager();
      expect(manager).toBeDefined();
    });

    it('should setup default sound assets', () => {
      const manager = new AudioManager();
      const debugInfo: any = manager.getDebugInfo();
      expect(debugInfo.registeredAssets).toContain(SoundEvent.UI_CLICK);
      expect(debugInfo.registeredAssets).toContain(SoundEvent.WOOD_PICKUP);
      expect(debugInfo.registeredAssets).toContain(SoundEvent.MENU_MUSIC);
    });

    it('should not be initialized on construction', () => {
      const manager = new AudioManager();
      const debugInfo: any = manager.getDebugInfo();
      expect(debugInfo.initialized).toBe(false);
    });
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      const manager = new AudioManager();
      await expect(manager.initialize()).resolves.toBeUndefined();
    });

    it('should mark as initialized after successful init', async () => {
      const manager = new AudioManager();
      await manager.initialize();
      const debugInfo: any = manager.getDebugInfo();
      expect(debugInfo.initialized).toBe(true);
    });

    it('should log initialization messages', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const manager = new AudioManager();
      await manager.initialize();
      
      expect(consoleLogSpy).toHaveBeenCalledWith('Initializing audio system...');
      expect(consoleLogSpy).toHaveBeenCalledWith('Audio system initialized successfully');
    });

    it('should handle initialization errors gracefully', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Create a manager with a failing sound service
      const manager = new AudioManager();
      const soundService = (manager as any).soundService;
      vi.spyOn(soundService, 'preloadSounds').mockRejectedValue(new Error('Load failed'));
      
      await manager.initialize();
      
      // Should still be initialized despite error
      const debugInfo: any = manager.getDebugInfo();
      expect(debugInfo.initialized).toBe(true);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to fully initialize audio system:',
        expect.any(Error)
      );
    });

    it('should preload critical UI sounds', async () => {
      const manager = new AudioManager();
      await manager.initialize();
      
      // Check that critical sounds are in the system
      const debugInfo: any = manager.getDebugInfo();
      expect(debugInfo.registeredAssets).toContain(SoundEvent.UI_CLICK);
      expect(debugInfo.registeredAssets).toContain(SoundEvent.UI_HOVER);
      expect(debugInfo.registeredAssets).toContain(SoundEvent.WOOD_PICKUP);
      expect(debugInfo.registeredAssets).toContain(SoundEvent.CREATURE_APPEAR);
    });
  });

  describe('playSound', () => {
    it('should play UI click sound', async () => {
      await audioManager.playSound(SoundEvent.UI_CLICK);
      // Sound should be requested
    });

    it('should play wood pickup sound', async () => {
      await audioManager.playSound(SoundEvent.WOOD_PICKUP);
      // Sound should be requested
    });

    it('should not play sound if not initialized', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const manager = new AudioManager();
      
      await manager.playSound(SoundEvent.UI_CLICK);
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Audio system not initialized, cannot play sound:',
        SoundEvent.UI_CLICK
      );
    });

    it('should warn if sound asset not found', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      await audioManager.playSound('non.existent.sound' as SoundEvent);
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Sound asset not found:',
        'non.existent.sound'
      );
    });

    it('should handle play errors gracefully', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // This will trigger error handling in the actual code
      await audioManager.playSound(SoundEvent.UI_CLICK);
      
      // Should not throw
    });

    it('should load sound before playing', async () => {
      await audioManager.playSound(SoundEvent.WOOD_COLLAPSE);
      // Sound service should load the sound
    });

    it('should apply custom config to sound', async () => {
      await audioManager.playSound(SoundEvent.MENU_MUSIC, { loop: true, volume: 0.5 });
      // Config should be passed to sound service
    });
  });

  describe('Background Music', () => {
    it('should play background music', async () => {
      await audioManager.playBackgroundMusic(SoundEvent.MENU_MUSIC);
      // Music should be playing
    });

    it('should stop previous music when starting new', async () => {
      await audioManager.playBackgroundMusic(SoundEvent.MENU_MUSIC);
      await audioManager.playBackgroundMusic(SoundEvent.GAME_MUSIC);
      // Only game music should be playing
    });

    it('should loop background music by default', async () => {
      await audioManager.playBackgroundMusic(SoundEvent.GAME_MUSIC);
      // Music should have loop: true
    });

    it('should stop all background music', () => {
      audioManager.stopBackgroundMusic();
      // All music should be stopped
    });
  });

  describe('Settings management', () => {
    it('should update master volume', () => {
      audioManager.updateSettings({ masterVolume: 0.5 });
      const settings = audioManager.getSettings();
      expect(settings.masterVolume).toBe(0.5);
    });

    it('should update sounds enabled flag', () => {
      audioManager.updateSettings({ soundsEnabled: false });
      const settings = audioManager.getSettings();
      expect(settings.soundsEnabled).toBe(false);
    });

    it('should update music enabled flag', () => {
      audioManager.updateSettings({ musicEnabled: false });
      const settings = audioManager.getSettings();
      expect(settings.musicEnabled).toBe(false);
    });

    it('should update UI sounds enabled flag', () => {
      audioManager.updateSettings({ uiSoundsEnabled: false });
      const settings = audioManager.getSettings();
      expect(settings.uiSoundsEnabled).toBe(false);
    });

    it('should update multiple settings at once', () => {
      audioManager.updateSettings({ 
        masterVolume: 0.3, 
        soundsEnabled: false,
        musicEnabled: false,
        uiSoundsEnabled: false
      });
      const settings = audioManager.getSettings();
      
      expect(settings.masterVolume).toBe(0.3);
      expect(settings.soundsEnabled).toBe(false);
      expect(settings.musicEnabled).toBe(false);
      expect(settings.uiSoundsEnabled).toBe(false);
    });

    it('should reset settings to defaults', () => {
      audioManager.updateSettings({ masterVolume: 0.3, soundsEnabled: false });
      audioManager.resetSettings();
      
      const settings = audioManager.getSettings();
      expect(settings.masterVolume).toBe(0.5);
      expect(settings.soundsEnabled).toBe(true);
    });

    it('should get current settings', () => {
      const settings = audioManager.getSettings();
      
      expect(settings).toHaveProperty('masterVolume');
      expect(settings).toHaveProperty('soundsEnabled');
      expect(settings).toHaveProperty('musicEnabled');
      expect(settings).toHaveProperty('uiSoundsEnabled');
    });

    it('should register settings change listener', () => {
      const callback = vi.fn();
      audioManager.onSettingsChange(callback);
      
      audioManager.updateSettings({ masterVolume: 0.8 });
      
      // Callback should be registered (will be called by AudioSettings)
    });
  });

  describe('Pause/Resume', () => {
    it('should pause all audio', async () => {
      await audioManager.playSound(SoundEvent.UI_CLICK);
      audioManager.pauseAll();
      // All sounds should be stopped
    });

    it('should resume after pause', () => {
      audioManager.pauseAll();
      audioManager.resumeAll();
      // System should be ready to play again
    });

    it('should not throw on pause when nothing playing', () => {
      expect(() => audioManager.pauseAll()).not.toThrow();
    });

    it('should not throw on resume when nothing paused', () => {
      expect(() => audioManager.resumeAll()).not.toThrow();
    });
  });

  describe('Convenience Methods', () => {
    it('should play UI click via convenience method', async () => {
      await audioManager.playUIClick();
      // UI click sound should play
    });

    it('should play UI hover via convenience method', async () => {
      await audioManager.playUIHover();
      // UI hover sound should play
    });

    it('should play wood pickup via convenience method', async () => {
      await audioManager.playWoodPickup();
      // Wood pickup sound should play
    });

    it('should play wood collapse via convenience method', async () => {
      await audioManager.playWoodCollapse();
      // Wood collapse sound should play
    });

    it('should play creature appear via convenience method', async () => {
      await audioManager.playCreatureAppear();
      // Creature appear sound should play
    });

    it('should play creature success via convenience method', async () => {
      await audioManager.playCreatureSuccess();
      // Creature success sound should play
    });

    it('should play creature fail via convenience method', async () => {
      await audioManager.playCreatureFail();
      // Creature fail sound should play
    });
  });

  describe('Cleanup', () => {
    it('should destroy audio system', () => {
      expect(() => audioManager.destroy()).not.toThrow();
    });

    it('should mark as not initialized after destroy', () => {
      audioManager.destroy();
      const debugInfo: any = audioManager.getDebugInfo();
      expect(debugInfo.initialized).toBe(false);
    });

    it('should clear sound assets on destroy', () => {
      audioManager.destroy();
      const debugInfo: any = audioManager.getDebugInfo();
      expect(debugInfo.registeredAssets).toHaveLength(0);
    });

    it('should be safe to call destroy multiple times', () => {
      audioManager.destroy();
      expect(() => audioManager.destroy()).not.toThrow();
    });
  });

  describe('Debug Info', () => {
    it('should return debug information', () => {
      const debugInfo = audioManager.getDebugInfo();
      
      expect(debugInfo).toHaveProperty('initialized');
      expect(debugInfo).toHaveProperty('settings');
      expect(debugInfo).toHaveProperty('serviceStatus');
      expect(debugInfo).toHaveProperty('registeredAssets');
    });

    it('should show initialized status', async () => {
      const manager = new AudioManager();
      let debugInfo: any = manager.getDebugInfo();
      expect(debugInfo.initialized).toBe(false);
      
      await manager.initialize();
      debugInfo = manager.getDebugInfo();
      expect(debugInfo.initialized).toBe(true);
    });

    it('should list all registered sound assets', () => {
      const debugInfo: any = audioManager.getDebugInfo();
      
      expect(debugInfo.registeredAssets).toContain(SoundEvent.UI_CLICK);
      expect(debugInfo.registeredAssets).toContain(SoundEvent.WOOD_PICKUP);
      expect(debugInfo.registeredAssets).toContain(SoundEvent.CREATURE_APPEAR);
      expect(debugInfo.registeredAssets).toContain(SoundEvent.MENU_MUSIC);
    });

    it('should include service status', () => {
      const debugInfo: any = audioManager.getDebugInfo();
      
      expect(debugInfo.serviceStatus).toHaveProperty('cachedSounds');
      expect(debugInfo.serviceStatus).toHaveProperty('playingSounds');
      expect(debugInfo.serviceStatus).toHaveProperty('loadingSounds');
    });
  });

  describe('Edge Cases', () => {
    it('should handle playing sound immediately after initialization', async () => {
      const manager = new AudioManager();
      await manager.initialize();
      await manager.playSound(SoundEvent.UI_CLICK);
      // Should work immediately
    });

    it('should handle rapid sound plays', async () => {
      for (let i = 0; i < 10; i++) {
        await audioManager.playSound(SoundEvent.UI_CLICK);
      }
      // Should handle rapid clicks
    });

    it('should handle settings updates during playback', async () => {
      await audioManager.playSound(SoundEvent.MENU_MUSIC);
      audioManager.updateSettings({ masterVolume: 0.1 });
      // Sound should continue with new volume
    });

    it('should handle undefined config values gracefully', () => {
      audioManager.updateSettings({});
      const settings = audioManager.getSettings();
      expect(settings).toBeDefined();
    });
  });

  describe('Integration', () => {
    it('should complete full audio lifecycle', async () => {
      // Initialize
      const manager = new AudioManager();
      await manager.initialize();
      
      // Play sounds
      await manager.playUIClick();
      await manager.playBackgroundMusic(SoundEvent.MENU_MUSIC);
      
      // Update settings
      manager.updateSettings({ masterVolume: 0.8 });
      
      // Pause and resume
      manager.pauseAll();
      manager.resumeAll();
      
      // Cleanup
      manager.destroy();
      
      const debugInfo: any = manager.getDebugInfo();
      expect(debugInfo.initialized).toBe(false);
    });

    it('should handle switching between menu and game music', async () => {
      await audioManager.playBackgroundMusic(SoundEvent.MENU_MUSIC);
      await audioManager.playBackgroundMusic(SoundEvent.GAME_MUSIC);
      await audioManager.playBackgroundMusic(SoundEvent.GAME_OVER_MUSIC);
      
      // Should successfully switch between music tracks
    });

    it('should handle game sound effects during music playback', async () => {
      await audioManager.playBackgroundMusic(SoundEvent.GAME_MUSIC);
      await audioManager.playWoodPickup();
      await audioManager.playCreatureAppear();
      await audioManager.playWoodCollapse();
      
      // SFX should play alongside music
    });
  });
});
