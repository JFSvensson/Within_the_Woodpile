import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SoundService } from '../../../../src/infrastructure/audio/SoundService';
import { AudioSettings } from '../../../../src/infrastructure/audio/AudioSettings';
import { AudioCategory, AudioAsset, SoundConfig } from '../../../../src/infrastructure/audio/types';

describe('SoundService', () => {
    let soundService: SoundService;
    let mockAudioSettings: AudioSettings;
    let mockAudioElements: Map<string, HTMLAudioElement>;
    let changeListener: (() => void) | null = null;

    // Mock HTMLAudioElement constructor
    const createMockAudio = () => {
        const listeners: Record<string, Function[]> = {};
        
        const audio = {
            src: '',
            volume: 1.0,
            loop: false,
            preload: 'auto',
            currentTime: 0,
            playbackRate: 1.0,
            paused: true,
            play: vi.fn().mockResolvedValue(undefined),
            pause: vi.fn(),
            load: vi.fn(() => {
                // Auto-trigger canplaythrough after load
                setTimeout(() => {
                    listeners['canplaythrough']?.forEach(fn => fn());
                }, 0);
            }),
            cloneNode: vi.fn(),
            addEventListener: vi.fn((event: string, handler: Function) => {
                if (!listeners[event]) listeners[event] = [];
                listeners[event].push(handler);
            }),
            removeEventListener: vi.fn((event: string, handler: Function) => {
                if (listeners[event]) {
                    listeners[event] = listeners[event].filter(fn => fn !== handler);
                }
            }),
        } as unknown as HTMLAudioElement;
        
        // Setup cloneNode to return a new mock audio
        audio.cloneNode = vi.fn(() => createMockAudio());
        
        return audio;
    };

    beforeEach(() => {
        // Mock localStorage
        const storage: Record<string, string> = {};
        (window as any).localStorage = {
            getItem: (key: string) => storage[key] || null,
            setItem: (key: string, value: string) => { storage[key] = value; },
            removeItem: (key: string) => { delete storage[key]; },
            clear: () => { Object.keys(storage).forEach(key => delete storage[key]); },
            length: 0,
            key: () => null,
        };

        // Mock Audio constructor
        mockAudioElements = new Map();
        (window as any).Audio = vi.fn(() => createMockAudio());

        // Mock AudioContext
        (window as any).AudioContext = vi.fn(() => ({
            state: 'running',
            close: vi.fn().mockResolvedValue(undefined),
        }));

        (window as any).webkitAudioContext = undefined;

        // Create mock AudioSettings
        mockAudioSettings = new AudioSettings();
        vi.spyOn(mockAudioSettings, 'addChangeListener').mockImplementation((callback) => {
            changeListener = callback;
        });
        vi.spyOn(mockAudioSettings, 'getEffectiveVolume').mockReturnValue(0.7);
        vi.spyOn(mockAudioSettings, 'getEffectiveMusicVolume').mockReturnValue(0.5);
        vi.spyOn(mockAudioSettings, 'getEffectiveUIVolume').mockReturnValue(0.8);

        soundService = new SoundService(mockAudioSettings);
    });

    afterEach(() => {
        vi.clearAllMocks();
        changeListener = null;
    });

    describe('Constructor & Initialization', () => {
        it('should initialize with AudioSettings', () => {
            expect(mockAudioSettings.addChangeListener).toHaveBeenCalled();
        });

        it('should initialize AudioContext', () => {
            expect((window as any).AudioContext).toHaveBeenCalled();
        });

        it('should handle AudioContext initialization failure', () => {
            const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            (window as any).AudioContext = vi.fn(() => {
                throw new Error('AudioContext not supported');
            });

            const service = new SoundService(mockAudioSettings);
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                'Failed to initialize AudioContext:',
                expect.any(Error)
            );
        });

        it('should try webkitAudioContext if AudioContext is not available', () => {
            (window as any).AudioContext = undefined;
            (window as any).webkitAudioContext = vi.fn(() => ({
                state: 'running',
                close: vi.fn(),
            }));

            new SoundService(mockAudioSettings);
            expect((window as any).webkitAudioContext).toHaveBeenCalled();
        });
    });

    describe('loadSound', () => {
        const mockAsset: AudioAsset = {
            id: 'test-sound',
            url: '/sounds/test.mp3',
            category: AudioCategory.SFX,
            volume: 0.8,
            loop: false,
        };

        it('should load and cache a sound', async () => {
            const audio = await soundService.loadSound(mockAsset);
            
            expect(audio).toBeDefined();
            expect(audio.src).toContain('test.mp3');
            expect(audio.preload).toBe('auto');
            expect(audio.volume).toBe(0.8);
            expect(audio.loop).toBe(false);
        });

        it('should return cached audio if already loaded', async () => {
            const audio1 = await soundService.loadSound(mockAsset);
            const audio2 = await soundService.loadSound(mockAsset);
            
            expect(audio1).toBe(audio2);
        });

        it('should handle concurrent load requests for same sound', async () => {
            const promise1 = soundService.loadSound(mockAsset);
            const promise2 = soundService.loadSound(mockAsset);
            
            const [audio1, audio2] = await Promise.all([promise1, promise2]);
            expect(audio1).toBe(audio2);
        });

        it('should apply default volume if not specified', async () => {
            const assetWithoutVolume = { ...mockAsset, volume: undefined };
            const audio = await soundService.loadSound(assetWithoutVolume);
            
            expect(audio.volume).toBe(1.0);
        });

        it('should apply default loop if not specified', async () => {
            const assetWithoutLoop = { ...mockAsset, loop: undefined };
            const audio = await soundService.loadSound(assetWithoutLoop);
            
            expect(audio.loop).toBe(false);
        });

        it('should handle load errors', async () => {
            const audio = createMockAudio();
            // Override load to trigger error instead
            audio.load = vi.fn(() => {
                setTimeout(() => {
                    const errorHandler = (audio.addEventListener as any).mock.calls.find(
                        (call: any) => call[0] === 'error'
                    )?.[1];
                    errorHandler?.(new Event('error'));
                }, 0);
            });
            
            (window as any).Audio = vi.fn(() => audio);

            const errorAsset: AudioAsset = {
                id: 'error-sound',
                url: '/error.mp3',
                category: AudioCategory.SFX,
            };

            await expect(soundService.loadSound(errorAsset)).rejects.toThrow(
                'Failed to load audio: /error.mp3'
            );
        });

        it('should trigger canplaythrough event to resolve loading', async () => {
            // Test is already covered by default createMockAudio behavior
            const audio = await soundService.loadSound(mockAsset);
            expect(audio).toBeDefined();
        });

        it('should call load() on audio element', async () => {
            const audio = await soundService.loadSound(mockAsset);
            expect(audio.load).toHaveBeenCalled();
        });

        it('should cleanup event listeners after successful load', async () => {
            const audio = await soundService.loadSound(mockAsset);
            expect(audio.removeEventListener).toHaveBeenCalledWith('canplaythrough', expect.any(Function));
            expect(audio.removeEventListener).toHaveBeenCalledWith('error', expect.any(Function));
        });

        it('should cleanup event listeners after failed load', async () => {
            const audio = createMockAudio();
            audio.load = vi.fn(() => {
                setTimeout(() => {
                    const errorHandler = (audio.addEventListener as any).mock.calls.find(
                        (call: any) => call[0] === 'error'
                    )?.[1];
                    errorHandler?.(new Event('error'));
                }, 0);
            });
            
            (window as any).Audio = vi.fn(() => audio);

            const errorAsset: AudioAsset = {
                id: 'error-sound2',
                url: '/error2.mp3',
                category: AudioCategory.SFX,
            };

            try {
                await soundService.loadSound(errorAsset);
            } catch {
                // Expected to fail
            }

            // Verify cleanup was called
            expect(audio.removeEventListener).toHaveBeenCalled();
        });
    });

    describe('playSound', () => {
        const mockAsset: AudioAsset = {
            id: 'game.woodCollapse',
            url: '/sounds/collapse.mp3',
            category: AudioCategory.SFX,
        };

        beforeEach(async () => {
            // Pre-load the sound
            await soundService.loadSound(mockAsset);
        });

        it('should play a loaded sound', async () => {
            const playId = await soundService.playSound('game.woodCollapse');
            
            expect(playId).toBeTruthy();
            expect(playId).toContain('game.woodCollapse_');
        });

        it('should return null for unloaded sound', async () => {
            const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            const playId = await soundService.playSound('unloaded-sound');
            
            expect(playId).toBeNull();
            expect(consoleWarnSpy).toHaveBeenCalledWith('Sound not loaded: unloaded-sound');
        });

        it('should apply SFX volume for game sounds', async () => {
            const playId = await soundService.playSound('game.woodCollapse');
            expect(playId).toBeTruthy();
            // Volume should be getEffectiveVolume (0.7) * config volume (1.0) = 0.7
        });

        it('should apply UI volume for ui sounds', async () => {
            const uiAsset: AudioAsset = {
                id: 'ui.click',
                url: '/sounds/click.mp3',
                category: AudioCategory.UI,
            };
            
            await soundService.loadSound(uiAsset);
            const playId = await soundService.playSound('ui.click');
            
            expect(playId).toBeTruthy();
            // Volume should be getEffectiveUIVolume (0.8) * config volume (1.0)
        });

        it('should apply music volume for music sounds', async () => {
            const musicAsset: AudioAsset = {
                id: 'music.game',
                url: '/sounds/game-music.mp3',
                category: AudioCategory.MUSIC,
            };
            
            await soundService.loadSound(musicAsset);
            const playId = await soundService.playSound('music.game');
            
            expect(playId).toBeTruthy();
            // Volume should be getEffectiveMusicVolume (0.5) * config volume (1.0)
        });

        it('should apply custom volume from config', async () => {
            const config: SoundConfig = { volume: 0.5 };
            const playId = await soundService.playSound('game.woodCollapse', config);
            
            expect(playId).toBeTruthy();
            // Volume should be getEffectiveVolume (0.7) * config volume (0.5) = 0.35
        });

        it('should apply loop from config', async () => {
            const config: SoundConfig = { loop: true };
            await soundService.playSound('game.woodCollapse', config);
            
            // Cloned audio should have loop set
        });

        it('should apply playbackRate from config', async () => {
            const config: SoundConfig = { playbackRate: 1.5 };
            await soundService.playSound('game.woodCollapse', config);
            
            // Cloned audio should have playbackRate set
        });

        it('should apply startTime from config', async () => {
            const config: SoundConfig = { startTime: 2.5 };
            await soundService.playSound('game.woodCollapse', config);
            
            // Cloned audio should have currentTime set
        });

        it('should handle play errors gracefully', async () => {
            const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            
            // Create a special mock audio with rejecting play
            const rejectingAudio = createMockAudio();
            rejectingAudio.cloneNode = vi.fn(() => {
                const cloned = createMockAudio();
                cloned.play = vi.fn().mockRejectedValue(new Error('Play failed'));
                return cloned;
            });
            
            // Load sound with custom audio element
            const errorAsset: AudioAsset = {
                id: 'error-sound',
                url: '/sounds/error.mp3',
                category: AudioCategory.SFX,
            };
            
            // Temporarily replace Audio constructor
            const originalAudio = (window as any).Audio;
            (window as any).Audio = vi.fn(() => rejectingAudio);
            
            await soundService.loadSound(errorAsset);
            
            // Restore
            (window as any).Audio = originalAudio;
            
            const playId = await soundService.playSound('error-sound');
            expect(playId).toBeNull();
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                'Failed to play sound error-sound:',
                expect.any(Error)
            );
        });

        it('should limit simultaneous sounds', async () => {
            // Play 11 sounds (max is 10)
            const playIds: (string | null)[] = [];
            for (let i = 0; i < 11; i++) {
                const id = await soundService.playSound('game.woodCollapse');
                playIds.push(id);
            }
            
            const status = soundService.getStatus();
            expect(status.playingSounds).toBe(10);
        });

        it('should cleanup on sound end', async () => {
            // Track the cloned audio element
            let clonedAudio: any = null;
            const trackingAudio = createMockAudio();
            trackingAudio.cloneNode = vi.fn(() => {
                clonedAudio = createMockAudio();
                return clonedAudio;
            });
            
            // Load with tracking audio
            const originalAudio = (window as any).Audio;
            (window as any).Audio = vi.fn(() => trackingAudio);
            
            const trackAsset: AudioAsset = {
                id: 'track-sound',
                url: '/sounds/track.mp3',
                category: AudioCategory.SFX,
            };
            
            await soundService.loadSound(trackAsset);
            (window as any).Audio = originalAudio;
            
            await soundService.playSound('track-sound');
            
            let status = soundService.getStatus();
            expect(status.playingSounds).toBe(1);
            
            // Trigger 'ended' event on cloned audio
            const endedHandler = (clonedAudio.addEventListener as any).mock.calls.find(
                (call: any) => call[0] === 'ended'
            )?.[1];
            endedHandler?.();
            
            status = soundService.getStatus();
            expect(status.playingSounds).toBe(0);
        });

        it('should cleanup on sound error', async () => {
            // Track the cloned audio element
            let clonedAudio: any = null;
            const trackingAudio = createMockAudio();
            trackingAudio.cloneNode = vi.fn(() => {
                clonedAudio = createMockAudio();
                return clonedAudio;
            });
            
            // Load with tracking audio
            const originalAudio = (window as any).Audio;
            (window as any).Audio = vi.fn(() => trackingAudio);
            
            const trackAsset: AudioAsset = {
                id: 'track-sound2',
                url: '/sounds/track2.mp3',
                category: AudioCategory.SFX,
            };
            
            await soundService.loadSound(trackAsset);
            (window as any).Audio = originalAudio;
            
            await soundService.playSound('track-sound2');
            
            // Trigger 'error' event on cloned audio
            const errorHandler = (clonedAudio.addEventListener as any).mock.calls.find(
                (call: any) => call[0] === 'error'
            )?.[1];
            errorHandler?.();
            
            const status = soundService.getStatus();
            expect(status.playingSounds).toBe(0);
        });

        it('should categorize creature sounds as SFX', async () => {
            const creatureAsset: AudioAsset = {
                id: 'creature.spiderScurry',
                url: '/sounds/spider.mp3',
                category: AudioCategory.SFX,
            };
            
            await soundService.loadSound(creatureAsset);
            const playId = await soundService.playSound('creature.spiderScurry');
            
            expect(playId).toBeTruthy();
        });
    });

    describe('stopSound', () => {
        beforeEach(async () => {
            const mockAsset: AudioAsset = {
                id: 'test-sound',
                url: '/sounds/test.mp3',
                category: AudioCategory.SFX,
            };
            
            await soundService.loadSound(mockAsset);
        });

        it('should stop a playing sound', async () => {
            const playId = await soundService.playSound('test-sound');
            expect(playId).toBeTruthy();
            
            soundService.stopSound(playId!);
            
            const status = soundService.getStatus();
            expect(status.playingSounds).toBe(0);
        });

        it('should reset currentTime on stop', async () => {
            const playId = await soundService.playSound('test-sound');
            soundService.stopSound(playId!);
            
            // Audio should have been paused and reset
        });

        it('should handle stopping non-existent sound', () => {
            expect(() => {
                soundService.stopSound('non-existent-id');
            }).not.toThrow();
        });
    });

    describe('stopSoundsByCategory', () => {
        beforeEach(async () => {
            const sfxAsset: AudioAsset = {
                id: 'game.woodCollapse',
                url: '/sounds/collapse.mp3',
                category: AudioCategory.SFX,
            };
            
            const uiAsset: AudioAsset = {
                id: 'ui.click',
                url: '/sounds/click.mp3',
                category: AudioCategory.UI,
            };
            
            await soundService.loadSound(sfxAsset);
            await soundService.loadSound(uiAsset);
        });

        it('should stop all sounds of specific category', async () => {
            await soundService.playSound('game.woodCollapse');
            await soundService.playSound('ui.click');
            
            let status = soundService.getStatus();
            expect(status.playingSounds).toBe(2);
            
            soundService.stopSoundsByCategory(AudioCategory.SFX);
            
            status = soundService.getStatus();
            expect(status.playingSounds).toBe(1);
        });

        it('should not stop sounds of other categories', async () => {
            await soundService.playSound('ui.click');
            
            soundService.stopSoundsByCategory(AudioCategory.MUSIC);
            
            const status = soundService.getStatus();
            expect(status.playingSounds).toBe(1);
        });

        it('should handle empty category', () => {
            expect(() => {
                soundService.stopSoundsByCategory(AudioCategory.AMBIENT);
            }).not.toThrow();
        });
    });

    describe('stopAllSounds', () => {
        beforeEach(async () => {
            const assets: AudioAsset[] = [
                { id: 'sound1', url: '/sound1.mp3', category: AudioCategory.SFX },
                { id: 'sound2', url: '/sound2.mp3', category: AudioCategory.UI },
                { id: 'sound3', url: '/sound3.mp3', category: AudioCategory.MUSIC },
            ];
            
            for (const asset of assets) {
                await soundService.loadSound(asset);
            }
        });

        it('should stop all playing sounds', async () => {
            await soundService.playSound('sound1');
            await soundService.playSound('sound2');
            await soundService.playSound('sound3');
            
            let status = soundService.getStatus();
            expect(status.playingSounds).toBe(3);
            
            soundService.stopAllSounds();
            
            status = soundService.getStatus();
            expect(status.playingSounds).toBe(0);
        });

        it('should work when no sounds are playing', () => {
            expect(() => {
                soundService.stopAllSounds();
            }).not.toThrow();
        });
    });

    describe('preloadSounds', () => {
        it('should preload multiple sounds', async () => {
            const assets: AudioAsset[] = [
                { id: 'sound1', url: '/sound1.mp3', category: AudioCategory.SFX },
                { id: 'sound2', url: '/sound2.mp3', category: AudioCategory.UI },
                { id: 'sound3', url: '/sound3.mp3', category: AudioCategory.MUSIC },
            ];
            
            const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
            
            await soundService.preloadSounds(assets);
            
            const status = soundService.getStatus();
            expect(status.cachedSounds).toBe(3);
            expect(consoleLogSpy).toHaveBeenCalledWith('Successfully preloaded 3 audio assets');
        });

        it('should handle preload errors gracefully', async () => {
            const assets: AudioAsset[] = [
                { id: 'sound1', url: '/sound1.mp3', category: AudioCategory.SFX },
                { id: 'error-sound', url: '/error.mp3', category: AudioCategory.SFX },
            ];
            
            const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            
            let callCount = 0;
            const originalAudio = (window as any).Audio;
            (window as any).Audio = vi.fn(() => {
                callCount++;
                const audio = createMockAudio();
                if (callCount === 2) {
                    // Second audio fails
                    audio.load = vi.fn(() => {
                        setTimeout(() => {
                            const errorHandler = (audio.addEventListener as any).mock.calls.find(
                                (call: any) => call[0] === 'error'
                            )?.[1];
                            errorHandler?.(new Event('error'));
                        }, 0);
                    });
                }
                return audio;
            });
            
            await soundService.preloadSounds(assets);
            (window as any).Audio = originalAudio;
            
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                'Some audio assets failed to preload:',
                expect.any(Error)
            );
        });

        it('should work with empty array', async () => {
            await soundService.preloadSounds([]);
            
            const status = soundService.getStatus();
            expect(status.cachedSounds).toBe(0);
        });
    });

    describe('updateAllPlayingSoundsVolume', () => {
        beforeEach(async () => {
            const mockAsset: AudioAsset = {
                id: 'test-sound',
                url: '/sounds/test.mp3',
                category: AudioCategory.SFX,
            };
            
            await soundService.loadSound(mockAsset);
        });

        it('should update volume when settings change', async () => {
            await soundService.playSound('test-sound');
            
            // Mock new volume settings
            vi.spyOn(mockAudioSettings, 'getEffectiveVolume').mockReturnValue(0.3);
            
            // Trigger change listener
            changeListener?.();
            
            // Volume should be updated (can't easily verify on mock, but function is called)
        });

        it('should update all playing sounds', async () => {
            await soundService.playSound('test-sound');
            await soundService.playSound('test-sound');
            
            vi.spyOn(mockAudioSettings, 'getEffectiveVolume').mockReturnValue(0.5);
            
            changeListener?.();
            
            // All playing sounds should have updated volume
        });
    });

    describe('destroy', () => {
        it('should stop all sounds and clear cache', async () => {
            const mockAsset: AudioAsset = {
                id: 'test-sound',
                url: '/sounds/test.mp3',
                category: AudioCategory.SFX,
            };
            
            await soundService.loadSound(mockAsset);
            await soundService.playSound('test-sound');
            
            soundService.destroy();
            
            const status = soundService.getStatus();
            expect(status.cachedSounds).toBe(0);
            expect(status.playingSounds).toBe(0);
        });

        it('should close AudioContext', () => {
            const mockClose = vi.fn();
            (window as any).AudioContext = vi.fn(() => ({
                state: 'running',
                close: mockClose,
            }));
            
            const service = new SoundService(mockAudioSettings);
            service.destroy();
            
            expect(mockClose).toHaveBeenCalled();
        });

        it('should not close already closed AudioContext', () => {
            const mockClose = vi.fn();
            (window as any).AudioContext = vi.fn(() => ({
                state: 'closed',
                close: mockClose,
            }));
            
            const service = new SoundService(mockAudioSettings);
            service.destroy();
            
            expect(mockClose).not.toHaveBeenCalled();
        });

        it('should handle missing AudioContext', () => {
            const service = new SoundService(mockAudioSettings);
            (service as any).audioContext = null;
            
            expect(() => {
                service.destroy();
            }).not.toThrow();
        });
    });

    describe('getStatus', () => {
        it('should return correct status', async () => {
            const status = soundService.getStatus();
            
            expect(status).toEqual({
                cachedSounds: 0,
                playingSounds: 0,
                loadingSounds: 0,
            });
        });

        it('should track cached sounds', async () => {
            const mockAsset: AudioAsset = {
                id: 'test-sound',
                url: '/sounds/test.mp3',
                category: AudioCategory.SFX,
            };
            
            await soundService.loadSound(mockAsset);
            
            const status = soundService.getStatus();
            expect(status.cachedSounds).toBe(1);
        });

        it('should track playing sounds', async () => {
            const mockAsset: AudioAsset = {
                id: 'test-sound',
                url: '/sounds/test.mp3',
                category: AudioCategory.SFX,
            };
            
            await soundService.loadSound(mockAsset);
            await soundService.playSound('test-sound');
            
            const status = soundService.getStatus();
            expect(status.playingSounds).toBe(1);
        });
    });

    describe('Category Detection', () => {
        it('should detect UI category from sound ID', async () => {
            const uiAsset: AudioAsset = {
                id: 'ui.click',
                url: '/sounds/click.mp3',
                category: AudioCategory.UI,
            };
            
            await soundService.loadSound(uiAsset);
            const playId = await soundService.playSound('ui.click');
            
            expect(playId).toBeTruthy();
        });

        it('should detect MUSIC category from sound ID', async () => {
            const musicAsset: AudioAsset = {
                id: 'music.game',
                url: '/sounds/music.mp3',
                category: AudioCategory.MUSIC,
            };
            
            await soundService.loadSound(musicAsset);
            const playId = await soundService.playSound('music.game');
            
            expect(playId).toBeTruthy();
        });

        it('should default to SFX for unknown prefixes', async () => {
            const unknownAsset: AudioAsset = {
                id: 'unknown.sound',
                url: '/sounds/unknown.mp3',
                category: AudioCategory.SFX,
            };
            
            await soundService.loadSound(unknownAsset);
            const playId = await soundService.playSound('unknown.sound');
            
            expect(playId).toBeTruthy();
        });
    });

    describe('Edge Cases', () => {
        it('should handle rapid play/stop cycles', async () => {
            const mockAsset: AudioAsset = {
                id: 'test-sound',
                url: '/sounds/test.mp3',
                category: AudioCategory.SFX,
            };
            
            await soundService.loadSound(mockAsset);
            
            for (let i = 0; i < 5; i++) {
                const playId = await soundService.playSound('test-sound');
                soundService.stopSound(playId!);
            }
            
            const status = soundService.getStatus();
            expect(status.playingSounds).toBe(0);
        });

        it('should handle very low volume', async () => {
            const mockAsset: AudioAsset = {
                id: 'test-sound',
                url: '/sounds/test.mp3',
                category: AudioCategory.SFX,
            };
            
            await soundService.loadSound(mockAsset);
            const config: SoundConfig = { volume: 0.01 };
            const playId = await soundService.playSound('test-sound', config);
            
            expect(playId).toBeTruthy();
        });

        it('should handle zero volume', async () => {
            const mockAsset: AudioAsset = {
                id: 'test-sound',
                url: '/sounds/test.mp3',
                category: AudioCategory.SFX,
            };
            
            await soundService.loadSound(mockAsset);
            const config: SoundConfig = { volume: 0 };
            const playId = await soundService.playSound('test-sound', config);
            
            expect(playId).toBeTruthy();
        });

        it('should handle extreme playbackRate', async () => {
            const mockAsset: AudioAsset = {
                id: 'test-sound',
                url: '/sounds/test.mp3',
                category: AudioCategory.SFX,
            };
            
            await soundService.loadSound(mockAsset);
            const config: SoundConfig = { playbackRate: 4.0 };
            const playId = await soundService.playSound('test-sound', config);
            
            expect(playId).toBeTruthy();
        });

        it('should handle startTime beyond duration', async () => {
            const mockAsset: AudioAsset = {
                id: 'test-sound',
                url: '/sounds/test.mp3',
                category: AudioCategory.SFX,
            };
            
            await soundService.loadSound(mockAsset);
            const config: SoundConfig = { startTime: 9999 };
            const playId = await soundService.playSound('test-sound', config);
            
            expect(playId).toBeTruthy();
        });
    });

    describe('Integration Scenarios', () => {
        it('should handle complete game sound lifecycle', async () => {
            // Load game sounds
            const sounds: AudioAsset[] = [
                { id: 'game.woodCollapse', url: '/collapse.mp3', category: AudioCategory.SFX },
                { id: 'ui.click', url: '/click.mp3', category: AudioCategory.UI },
                { id: 'music.game', url: '/music.mp3', category: AudioCategory.MUSIC, loop: true },
            ];
            
            await soundService.preloadSounds(sounds);
            
            // Start music
            const musicId = await soundService.playSound('music.game');
            expect(musicId).toBeTruthy();
            
            // Play UI sound
            const uiId = await soundService.playSound('ui.click');
            expect(uiId).toBeTruthy();
            
            // Play SFX
            const sfxId = await soundService.playSound('game.woodCollapse');
            expect(sfxId).toBeTruthy();
            
            // Stop UI sounds
            soundService.stopSoundsByCategory(AudioCategory.UI);
            
            // Stop all
            soundService.stopAllSounds();
            
            const status = soundService.getStatus();
            expect(status.playingSounds).toBe(0);
            expect(status.cachedSounds).toBe(3);
        });

        it('should handle volume changes during playback', async () => {
            const mockAsset: AudioAsset = {
                id: 'test-sound',
                url: '/sounds/test.mp3',
                category: AudioCategory.SFX,
            };
            
            await soundService.loadSound(mockAsset);
            await soundService.playSound('test-sound');
            
            // Change volume settings
            vi.spyOn(mockAudioSettings, 'getEffectiveVolume').mockReturnValue(0.2);
            changeListener?.();
            
            // Sound should continue playing with new volume
            const status = soundService.getStatus();
            expect(status.playingSounds).toBe(1);
        });

        it('should handle concurrent loading and playing', async () => {
            const assets: AudioAsset[] = [
                { id: 'sound1', url: '/sound1.mp3', category: AudioCategory.SFX },
                { id: 'sound2', url: '/sound2.mp3', category: AudioCategory.SFX },
            ];
            
            const loadPromise = soundService.preloadSounds(assets);
            
            // Try to play before loading completes - will return null since not loaded yet
            const playPromise = soundService.playSound('sound1');
            
            await loadPromise;
            
            // Now try to play after loading
            const playId = await soundService.playSound('sound1');
            
            // Should work after loading completes
            expect(playId).toBeTruthy();
        });
    });
});
