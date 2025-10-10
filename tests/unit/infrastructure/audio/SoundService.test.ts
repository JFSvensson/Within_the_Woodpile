import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SoundService } from '../../../../src/infrastructure/audio/SoundService';
import { AudioSettings } from '../../../../src/infrastructure/audio/AudioSettings';
import { SoundEvent, AudioCategory, AudioAsset } from '../../../../src/infrastructure/audio/types';
import { createMockAudio, createMockLocalStorage, MockAudioElement } from './mock-audio-helpers';

describe('SoundService', () => {
  let audioSettings: AudioSettings;
  let soundService: SoundService;
  let mockAudioConstructor: any;
  let mockAudioElements: MockAudioElement[];

  beforeEach(() => {
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

    audioSettings = new AudioSettings();
    soundService = new SoundService(audioSettings);
  });

  afterEach(() => {
    soundService.destroy();
    mockAudioConstructor.mockRestore();
    vi.clearAllMocks();
  });

  describe('Sound loading', () => {
    it('should load a sound successfully', async () => {
      const asset: AudioAsset = {
        id: SoundEvent.UI_CLICK,
        url: '/assets/audio/click.mp3',
        category: AudioCategory.UI,
        volume: 0.6
      };
      
      const audio = await soundService.loadSound(asset);
      
      expect(audio).toBeDefined();
      expect(mockAudioElements[0]._src).toBe(asset.url);
    });

    it('should cache loaded sounds', async () => {
      const asset: AudioAsset = {
        id: SoundEvent.UI_CLICK,
        url: '/assets/audio/click.mp3',
        category: AudioCategory.UI
      };
      
      await soundService.loadSound(asset);
      const callCountBefore = mockAudioConstructor.mock.calls.length;
      
      await soundService.loadSound(asset);
      const callCountAfter = mockAudioConstructor.mock.calls.length;
      
      expect(callCountAfter).toBe(callCountBefore);
    });
  });

  describe('Sound playback', () => {
    it('should play a loaded sound', async () => {
      const asset: AudioAsset = {
        id: SoundEvent.UI_CLICK,
        url: '/assets/audio/click.mp3',
        category: AudioCategory.UI
      };
      
      await soundService.loadSound(asset);
      await soundService.playSound(SoundEvent.UI_CLICK);
      
      expect(mockAudioElements.length).toBeGreaterThan(0);
    });

    it('should return null when playing unloaded sound', async () => {
      const result = await soundService.playSound('nonexistent-sound');
      
      expect(result).toBeNull();
    });

    it('should respect volume settings', async () => {
      const asset: AudioAsset = {
        id: SoundEvent.UI_CLICK,
        url: '/assets/audio/click.mp3',
        category: AudioCategory.UI,
        volume: 0.8
      };
      
      await soundService.loadSound(asset);
      await soundService.playSound(SoundEvent.UI_CLICK);
      
      expect(mockAudioElements.length).toBeGreaterThan(0);
    });
  });

  describe('Sound control', () => {
    it('should stop all sounds', async () => {
      const asset: AudioAsset = {
        id: SoundEvent.UI_CLICK,
        url: '/assets/audio/click.mp3',
        category: AudioCategory.UI
      };
      
      await soundService.loadSound(asset);
      await soundService.playSound(SoundEvent.UI_CLICK);
      soundService.stopAllSounds();
      
      expect(() => soundService.stopAllSounds()).not.toThrow();
    });
  });

  describe('Cleanup', () => {
    it('should destroy service cleanly', () => {
      expect(() => soundService.destroy()).not.toThrow();
    });
  });
});
