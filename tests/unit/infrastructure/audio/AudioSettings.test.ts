import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AudioSettings } from '../../../../src/infrastructure/audio/AudioSettings';
import { AudioCategory } from '../../../../src/infrastructure/audio/types';
import { createMockLocalStorage } from './mock-audio-helpers';

describe('AudioSettings', () => {
  let mockLocalStorage: Storage;
  let originalLocalStorage: Storage;

  beforeEach(() => {
    mockLocalStorage = createMockLocalStorage();
    originalLocalStorage = global.localStorage;
    Object.defineProperty(global, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(global, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
    });
    vi.clearAllMocks();
  });

  describe('Default values', () => {
    it('should have sound enabled by default', () => {
      const settings = new AudioSettings();
      expect(settings.areSoundsEnabled()).toBe(true);
    });

    it('should have master volume at 0.5 by default', () => {
      const settings = new AudioSettings();
      expect(settings.getMasterVolume()).toBe(0.5);
    });

    it('should have music enabled by default', () => {
      const settings = new AudioSettings();
      expect(settings.isMusicEnabled()).toBe(true);
      expect(settings.areUISoundsEnabled()).toBe(true);
    });
  });

  describe('Master volume', () => {
    it('should set master volume correctly', () => {
      const settings = new AudioSettings();
      settings.setMasterVolume(0.5);
      expect(settings.getMasterVolume()).toBe(0.5);
    });

    it('should clamp master volume to 0-1 range', () => {
      const settings = new AudioSettings();
      
      settings.setMasterVolume(1.5);
      expect(settings.getMasterVolume()).toBe(1.0);
      
      settings.setMasterVolume(-0.5);
      expect(settings.getMasterVolume()).toBe(0.0);
    });

    it('should trigger change listener when master volume changes', () => {
      const settings = new AudioSettings();
      const listener = vi.fn();
      settings.addChangeListener(listener);

      settings.setMasterVolume(0.3);
      
      expect(listener).toHaveBeenCalled();
    });
  });

  describe('Category volume', () => {
    it('should handle different sound categories', () => {
      const settings = new AudioSettings();
      
      // Test effective volumes for different categories
      expect(settings.getEffectiveVolume()).toBe(0.5);
      expect(settings.getEffectiveMusicVolume()).toBe(0.5);
      expect(settings.getEffectiveUIVolume()).toBe(0.5);
    });

    it('should respect category enable flags', () => {
      const settings = new AudioSettings();
      
      settings.setSoundsEnabled(false);
      expect(settings.getEffectiveVolume()).toBe(0);
      
      settings.setSoundsEnabled(true);
      settings.setMusicEnabled(false);
      expect(settings.getEffectiveMusicVolume()).toBe(0);
      
      settings.setMusicEnabled(true);
      settings.setUISoundsEnabled(false);
      expect(settings.getEffectiveUIVolume()).toBe(0);
    });

    it('should trigger change listener when category settings change', () => {
      const settings = new AudioSettings();
      const listener = vi.fn();
      settings.addChangeListener(listener);

      settings.setMusicEnabled(false);
      
      expect(listener).toHaveBeenCalled();
    });
  });

  describe('Sound enabled toggle', () => {
    it('should toggle sound enabled state', () => {
      const settings = new AudioSettings();
      
      settings.setSoundsEnabled(false);
      expect(settings.areSoundsEnabled()).toBe(false);
      
      settings.setSoundsEnabled(true);
      expect(settings.areSoundsEnabled()).toBe(true);
    });

    it('should trigger change listener when sound enabled changes', () => {
      const settings = new AudioSettings();
      const listener = vi.fn();
      settings.addChangeListener(listener);

      settings.setSoundsEnabled(false);
      
      expect(listener).toHaveBeenCalled();
    });
  });

  describe('Effective volume calculation', () => {
    it('should calculate effective volume based on master volume', () => {
      const settings = new AudioSettings();
      settings.setMasterVolume(0.8);
      
      expect(settings.getEffectiveVolume()).toBe(0.8);
      expect(settings.getEffectiveMusicVolume()).toBe(0.8);
      expect(settings.getEffectiveUIVolume()).toBe(0.8);
    });

    it('should return 0 when sound is disabled', () => {
      const settings = new AudioSettings();
      settings.setMasterVolume(0.8);
      settings.setSoundsEnabled(false);
      
      expect(settings.getEffectiveVolume()).toBe(0);
    });

    it('should handle edge cases correctly', () => {
      const settings = new AudioSettings();
      
      settings.setMasterVolume(0);
      expect(settings.getEffectiveVolume()).toBe(0);
      
      settings.setMasterVolume(1);
      expect(settings.getEffectiveVolume()).toBe(1);
    });
  });

  describe('Change listeners', () => {
    it('should add and notify multiple listeners', () => {
      const settings = new AudioSettings();
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      
      settings.addChangeListener(listener1);
      settings.addChangeListener(listener2);
      settings.setMasterVolume(0.5);
      
      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });

    it('should remove listener correctly', () => {
      const settings = new AudioSettings();
      const listener = vi.fn();
      
      settings.addChangeListener(listener);
      settings.removeChangeListener(listener);
      settings.setMasterVolume(0.5);
      
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('LocalStorage persistence', () => {
    it('should save settings to localStorage', () => {
      const settings = new AudioSettings();
      settings.setMasterVolume(0.6);
      settings.setSoundsEnabled(false);
      settings.setMusicEnabled(false);

      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('should load settings from localStorage on initialization', () => {
      mockLocalStorage.setItem('audio.masterVolume', '0.4');
      mockLocalStorage.setItem('audio.soundsEnabled', 'false');
      mockLocalStorage.setItem('audio.musicEnabled', 'false');

      const settings = new AudioSettings();
      
      expect(settings.getMasterVolume()).toBe(0.4);
      expect(settings.areSoundsEnabled()).toBe(false);
      expect(settings.isMusicEnabled()).toBe(false);
    });

    it('should handle missing localStorage gracefully', () => {
      Object.defineProperty(global, 'localStorage', {
        value: undefined,
        writable: true,
      });

      expect(() => new AudioSettings()).not.toThrow();
    });
  });

  describe('Reset functionality', () => {
    it('should reset all settings to defaults', () => {
      const settings = new AudioSettings();
      settings.setMasterVolume(0.3);
      settings.setSoundsEnabled(false);
      settings.setMusicEnabled(false);

      settings.resetToDefaults();

      expect(settings.areSoundsEnabled()).toBe(true);
      expect(settings.getMasterVolume()).toBe(0.5);
      expect(settings.isMusicEnabled()).toBe(true);
    });

    it('should trigger change listener on reset', () => {
      const settings = new AudioSettings();
      settings.setMasterVolume(0.3);
      
      const listener = vi.fn();
      settings.addChangeListener(listener);

      settings.resetToDefaults();

      expect(listener).toHaveBeenCalled();
    });
  });

  describe('Get all settings', () => {
    it('should return complete settings object', () => {
      const settings = new AudioSettings();
      settings.setMasterVolume(0.5);
      settings.setSoundsEnabled(false);
      settings.setMusicEnabled(false);

      const allSettings = settings.getSettings();

      expect(allSettings).toEqual({
        masterVolume: 0.5,
        soundsEnabled: false,
        musicEnabled: false,
        uiSoundsEnabled: true,
      });
    });
  });
});
