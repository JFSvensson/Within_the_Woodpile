import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LocalStorageService } from '../../../../src/infrastructure/storage/LocalStorageService.js';

describe('LocalStorageService', () => {
    let service: LocalStorageService;
    let mockStorage: { [key: string]: string };

    beforeEach(() => {
        // Reset mock storage
        mockStorage = {};

        // Mock localStorage
        const localStorageMock = {
            getItem: vi.fn((key: string) => mockStorage[key] || null),
            setItem: vi.fn((key: string, value: string) => {
                mockStorage[key] = value;
            }),
            removeItem: vi.fn((key: string) => {
                delete mockStorage[key];
            }),
            clear: vi.fn(() => {
                mockStorage = {};
            })
        };

        // Replace global localStorage
        globalThis.localStorage = localStorageMock as any;

        // Create service
        service = new LocalStorageService();
    });

    describe('getItem', () => {
        it('should return null for non-existent key', () => {
            const result = service.getItem('non-existent');
            expect(result).toBeNull();
        });

        it('should retrieve and parse stored item', () => {
            const testData = { name: 'test', value: 42 };
            mockStorage['testKey'] = JSON.stringify(testData);

            const result = service.getItem('testKey');
            expect(result).toEqual(testData);
        });

        it('should return null for invalid JSON', () => {
            mockStorage['badKey'] = 'not valid json {';
            
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            const result = service.getItem('badKey');
            
            expect(result).toBeNull();
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        it('should handle numbers', () => {
            mockStorage['numberKey'] = JSON.stringify(123);
            
            const result = service.getItem<number>('numberKey');
            expect(result).toBe(123);
        });

        it('should handle strings', () => {
            mockStorage['stringKey'] = JSON.stringify('hello');
            
            const result = service.getItem<string>('stringKey');
            expect(result).toBe('hello');
        });

        it('should handle arrays', () => {
            const arr = [1, 2, 3];
            mockStorage['arrayKey'] = JSON.stringify(arr);
            
            const result = service.getItem<number[]>('arrayKey');
            expect(result).toEqual(arr);
        });

        it('should handle nested objects', () => {
            const nested = {
                level1: {
                    level2: {
                        value: 'deep'
                    }
                }
            };
            mockStorage['nestedKey'] = JSON.stringify(nested);
            
            const result = service.getItem('nestedKey');
            expect(result).toEqual(nested);
        });

        it('should handle boolean values', () => {
            mockStorage['boolKey'] = JSON.stringify(true);
            
            const result = service.getItem<boolean>('boolKey');
            expect(result).toBe(true);
        });

        it('should handle null values', () => {
            mockStorage['nullKey'] = JSON.stringify(null);
            
            const result = service.getItem('nullKey');
            expect(result).toBeNull();
        });

        it('should log warning on error', () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            
            // Force an error by making getItem throw
            (globalThis.localStorage.getItem as any).mockImplementationOnce(() => {
                throw new Error('Storage error');
            });
            
            const result = service.getItem('errorKey');
            
            expect(result).toBeNull();
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Failed to get item'),
                expect.any(Error)
            );
            consoleSpy.mockRestore();
        });
    });

    describe('setItem', () => {
        it('should store item as JSON string', () => {
            const testData = { name: 'test', value: 42 };
            
            service.setItem('testKey', testData);
            
            expect(localStorage.setItem).toHaveBeenCalledWith(
                'testKey',
                JSON.stringify(testData)
            );
            expect(mockStorage['testKey']).toBe(JSON.stringify(testData));
        });

        it('should store numbers', () => {
            service.setItem('numberKey', 123);
            
            expect(mockStorage['numberKey']).toBe(JSON.stringify(123));
        });

        it('should store strings', () => {
            service.setItem('stringKey', 'hello');
            
            expect(mockStorage['stringKey']).toBe(JSON.stringify('hello'));
        });

        it('should store arrays', () => {
            const arr = [1, 2, 3];
            service.setItem('arrayKey', arr);
            
            expect(mockStorage['arrayKey']).toBe(JSON.stringify(arr));
        });

        it('should store boolean values', () => {
            service.setItem('boolKey', true);
            
            expect(mockStorage['boolKey']).toBe(JSON.stringify(true));
        });

        it('should overwrite existing values', () => {
            service.setItem('key', 'first');
            service.setItem('key', 'second');
            
            expect(mockStorage['key']).toBe(JSON.stringify('second'));
        });

        it('should handle complex nested objects', () => {
            const complex = {
                array: [1, 2, { nested: true }],
                object: { deep: { value: 'test' } },
                null: null,
                boolean: false
            };
            
            service.setItem('complexKey', complex);
            
            const stored = JSON.parse(mockStorage['complexKey']);
            expect(stored).toEqual(complex);
        });

        it('should log warning on error', () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            
            // Force an error
            (globalThis.localStorage.setItem as any).mockImplementationOnce(() => {
                throw new Error('Quota exceeded');
            });
            
            service.setItem('errorKey', 'value');
            
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Failed to set item'),
                expect.any(Error)
            );
            consoleSpy.mockRestore();
        });

        it('should handle undefined gracefully', () => {
            service.setItem('undefinedKey', undefined as any);
            
            // setItem was called even though value is undefined
            expect(localStorage.setItem).toHaveBeenCalled();
        });
    });

    describe('removeItem', () => {
        it('should remove existing item', () => {
            mockStorage['testKey'] = JSON.stringify({ value: 'test' });
            
            service.removeItem('testKey');
            
            expect(localStorage.removeItem).toHaveBeenCalledWith('testKey');
            expect(mockStorage['testKey']).toBeUndefined();
        });

        it('should not throw when removing non-existent key', () => {
            expect(() => service.removeItem('non-existent')).not.toThrow();
        });

        it('should remove multiple different items', () => {
            mockStorage['key1'] = JSON.stringify('value1');
            mockStorage['key2'] = JSON.stringify('value2');
            
            service.removeItem('key1');
            
            expect(mockStorage['key1']).toBeUndefined();
            expect(mockStorage['key2']).toBeDefined();
        });

        it('should log warning on error', () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            
            // Force an error
            (globalThis.localStorage.removeItem as any).mockImplementationOnce(() => {
                throw new Error('Remove error');
            });
            
            service.removeItem('errorKey');
            
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Failed to remove item'),
                expect.any(Error)
            );
            consoleSpy.mockRestore();
        });
    });

    describe('clear', () => {
        it('should clear all storage', () => {
            mockStorage['key1'] = JSON.stringify('value1');
            mockStorage['key2'] = JSON.stringify('value2');
            mockStorage['key3'] = JSON.stringify('value3');
            
            service.clear();
            
            expect(localStorage.clear).toHaveBeenCalled();
        });

        it('should remove all items from storage', () => {
            mockStorage['key1'] = 'value1';
            mockStorage['key2'] = 'value2';
            
            service.clear();
            
            // mockStorage reference is replaced, but the clear was called
            expect(localStorage.clear).toHaveBeenCalled();
        });

        it('should not throw when clearing empty storage', () => {
            expect(() => service.clear()).not.toThrow();
        });

        it('should log warning on error', () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            
            // Force an error
            (globalThis.localStorage.clear as any).mockImplementationOnce(() => {
                throw new Error('Clear error');
            });
            
            service.clear();
            
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Failed to clear'),
                expect.any(Error)
            );
            consoleSpy.mockRestore();
        });
    });

    describe('Integration', () => {
        it('should handle complete set/get/remove workflow', () => {
            const testData = { value: 'test', count: 42 };
            
            // Set
            service.setItem('workflow', testData);
            
            // Get
            const retrieved = service.getItem('workflow');
            expect(retrieved).toEqual(testData);
            
            // Remove
            service.removeItem('workflow');
            
            // Verify removed
            const afterRemove = service.getItem('workflow');
            expect(afterRemove).toBeNull();
        });

        it('should handle multiple items independently', () => {
            service.setItem('key1', 'value1');
            service.setItem('key2', 'value2');
            service.setItem('key3', 'value3');
            
            expect(service.getItem('key1')).toBe('value1');
            expect(service.getItem('key2')).toBe('value2');
            expect(service.getItem('key3')).toBe('value3');
            
            service.removeItem('key2');
            
            expect(service.getItem('key1')).toBe('value1');
            expect(service.getItem('key2')).toBeNull();
            expect(service.getItem('key3')).toBe('value3');
        });

        it('should persist data across multiple operations', () => {
            const data = { counter: 0 };
            
            service.setItem('counter', data);
            
            const retrieved1 = service.getItem<typeof data>('counter');
            expect(retrieved1?.counter).toBe(0);
            
            if (retrieved1) {
                retrieved1.counter++;
                service.setItem('counter', retrieved1);
            }
            
            const retrieved2 = service.getItem<typeof data>('counter');
            expect(retrieved2?.counter).toBe(1);
        });

        it('should handle clear affecting all items', () => {
            service.setItem('key1', 'value1');
            service.setItem('key2', 'value2');
            service.setItem('key3', 'value3');
            
            service.clear();
            
            expect(service.getItem('key1')).toBeNull();
            expect(service.getItem('key2')).toBeNull();
            expect(service.getItem('key3')).toBeNull();
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty string as key', () => {
            service.setItem('', 'value');
            const result = service.getItem('');
            expect(result).toBe('value');
        });

        it('should handle very long keys', () => {
            const longKey = 'a'.repeat(1000);
            service.setItem(longKey, 'value');
            const result = service.getItem(longKey);
            expect(result).toBe('value');
        });

        it('should handle very large values', () => {
            const largeValue = { data: 'x'.repeat(10000) };
            service.setItem('large', largeValue);
            const result = service.getItem('large');
            expect(result).toEqual(largeValue);
        });

        it('should handle special characters in keys', () => {
            const specialKey = 'key-with.special_chars@123!';
            service.setItem(specialKey, 'value');
            const result = service.getItem(specialKey);
            expect(result).toBe('value');
        });

        it('should handle unicode characters', () => {
            const unicodeValue = { text: '你好世界 🌍 مرحبا' };
            service.setItem('unicode', unicodeValue);
            const result = service.getItem('unicode');
            expect(result).toEqual(unicodeValue);
        });

        it('should handle rapid successive operations', () => {
            for (let i = 0; i < 100; i++) {
                service.setItem(`key${i}`, i);
            }
            
            for (let i = 0; i < 100; i++) {
                expect(service.getItem(`key${i}`)).toBe(i);
            }
        });
    });
});
