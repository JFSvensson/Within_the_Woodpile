import { vi } from 'vitest'

/**
 * Mock helpers for HTMLAudioElement testing
 */

export interface MockAudioElement extends Partial<HTMLAudioElement> {
  _listeners: Map<string, EventListener[]>;
  _paused: boolean;
  _currentTime: number;
  _volume: number;
  _muted: boolean;
  _src: string;
  _duration: number;
  _ended: boolean;
  _error: MediaError | null;
  _readyState: number;
  triggerEvent: (eventName: string, detail?: any) => void;
  triggerError: (error?: MediaError) => void;
}

/**
 * Creates a mock HTMLAudioElement for testing
 */
export function createMockAudio(): MockAudioElement {
  const listeners = new Map<string, EventListener[]>();
  
  const mockAudio: MockAudioElement = {
    _listeners: listeners,
    _paused: true,
    _currentTime: 0,
    _volume: 1,
    _muted: false,
    _src: '',
    _duration: 0,
    _ended: false,
    _error: null,
    _readyState: 4, // HAVE_ENOUGH_DATA

    get paused() { return this._paused; },
    set paused(value: boolean) { this._paused = value; },

    get currentTime() { return this._currentTime; },
    set currentTime(value: number) { this._currentTime = value; },

    get volume() { return this._volume; },
    set volume(value: number) { 
      this._volume = Math.max(0, Math.min(1, value));
    },

    get muted() { return this._muted; },
    set muted(value: boolean) { this._muted = value; },

    get src() { return this._src; },
    set src(value: string) { 
      this._src = value;
      // Simulate loading
      setTimeout(() => this.triggerEvent('canplaythrough'), 0);
    },

    get duration() { return this._duration; },
    get ended() { return this._ended; },
    get error() { return this._error; },
    get readyState() { return this._readyState; },

    play: vi.fn(function(this: MockAudioElement) {
      return new Promise<void>((resolve, reject) => {
        if (this._error) {
          reject(this._error);
          return;
        }
        this._paused = false;
        this._ended = false;
        this.triggerEvent('play');
        resolve();
      });
    }),

    pause: vi.fn(function(this: MockAudioElement) {
      this._paused = true;
      this.triggerEvent('pause');
    }),

    load: vi.fn(function(this: MockAudioElement) {
      this.triggerEvent('loadstart');
      setTimeout(() => {
        if (!this._error) {
          this._readyState = 4;
          this.triggerEvent('canplaythrough');
        }
      }, 0);
    }),

    addEventListener: vi.fn(function(this: MockAudioElement, event: string, listener: EventListener) {
      if (!listeners.has(event)) {
        listeners.set(event, []);
      }
      listeners.get(event)!.push(listener);
    }),

    removeEventListener: vi.fn(function(this: MockAudioElement, event: string, listener: EventListener) {
      const eventListeners = listeners.get(event);
      if (eventListeners) {
        const index = eventListeners.indexOf(listener);
        if (index > -1) {
          eventListeners.splice(index, 1);
        }
      }
    }),

    cloneNode: vi.fn(function(this: MockAudioElement) {
      const clone = createMockAudio();
      clone._src = this._src;
      clone._volume = this._volume;
      clone._muted = this._muted;
      return clone;
    }),

    triggerEvent: function(this: MockAudioElement, eventName: string, detail?: any) {
      const eventListeners = listeners.get(eventName);
      if (eventListeners) {
        const event = new Event(eventName);
        if (detail) {
          Object.assign(event, detail);
        }
        eventListeners.forEach(listener => listener(event));
      }
    },

    triggerError: function(this: MockAudioElement, error?: MediaError) {
      this._error = error || {
        code: 4, // MEDIA_ELEMENT_ERROR: MEDIA_ERR_SRC_NOT_SUPPORTED
        message: 'Mock audio error',
        MEDIA_ERR_ABORTED: 1,
        MEDIA_ERR_NETWORK: 2,
        MEDIA_ERR_DECODE: 3,
        MEDIA_ERR_SRC_NOT_SUPPORTED: 4,
      } as MediaError;
      this.triggerEvent('error', { error: this._error });
    },
  };

  return mockAudio;
}

/**
 * Sets up global Audio constructor mock
 */
export function setupGlobalAudioMock() {
  return vi.spyOn(global, 'Audio').mockImplementation(() => {
    return createMockAudio() as unknown as HTMLAudioElement;
  });
}

/**
 * Creates a mock localStorage for testing
 */
export function createMockLocalStorage(): Storage {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    key: vi.fn((index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }),
    get length() {
      return Object.keys(store).length;
    },
  };
}
