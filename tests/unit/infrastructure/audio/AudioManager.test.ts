import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AudioManager } from '../../../../src/infrastructure/audio/AudioManager';
import { SoundEvent } from '../../../../src/infrastructure/audio/types';
import { createMockAudio, createMockLocalStorage, MockAudioElement } from './mock-audio-helpers';

describe('AudioManager', () => {
  let audioManager: AudioManager;
  let mockAudioConstructor: any;
  let mockAudioElements: MockAudioElement[];

  beforeEach(async () => {
    const mockLocalStorage = createMockLocalStorage();
    Object.defineProperty(global, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });

    mockAudioElements = [];
    
    mockAudioConstructor = vi.spyOn(global, 'Audio').mockImplementation(() => {
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

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      const manager = new AudioManager();
      await expect(manager.initialize()).resolves.toBeUndefined();
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

    it('should reset settings to defaults', () => {
      audioManager.updateSettings({ masterVolume: 0.3, soundsEnabled: false });
      audioManager.resetSettings();
      
      const settings = audioManager.getSettings();
      expect(settings.masterVolume).toBe(0.5);
      expect(settings.soundsEnabled).toBe(true);
    });
  });

  describe('Cleanup', () => {
    it('should destroy audio system', () => {
      expect(() => audioManager.destroy()).not.toThrow();
    });
  });
});
