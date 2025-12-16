import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
    WoodType, 
    WOOD_TYPE_CONFIG, 
    selectRandomWoodType,
    type WoodTypeProperties 
} from '../../../src/types/wood.js';

describe('Wood Types System', () => {
    describe('WoodType enum', () => {
        it('should have exactly 5 wood types defined', () => {
            const types = Object.values(WoodType);
            expect(types).toHaveLength(5);
        });

        it('should contain all expected wood types', () => {
            expect(WoodType.NORMAL).toBe('normal');
            expect(WoodType.GOLDEN).toBe('golden');
            expect(WoodType.CURSED).toBe('cursed');
            expect(WoodType.FRAGILE).toBe('fragile');
            expect(WoodType.BONUS).toBe('bonus');
        });
    });

    describe('WOOD_TYPE_CONFIG', () => {
        it('should have configuration for all wood types', () => {
            expect(WOOD_TYPE_CONFIG[WoodType.NORMAL]).toBeDefined();
            expect(WOOD_TYPE_CONFIG[WoodType.GOLDEN]).toBeDefined();
            expect(WOOD_TYPE_CONFIG[WoodType.CURSED]).toBeDefined();
            expect(WOOD_TYPE_CONFIG[WoodType.FRAGILE]).toBeDefined();
            expect(WOOD_TYPE_CONFIG[WoodType.BONUS]).toBeDefined();
        });

        describe('Normal wood type', () => {
            it('should have standard properties', () => {
                const config = WOOD_TYPE_CONFIG[WoodType.NORMAL];
                expect(config.visual).toBe('🪵');
                expect(config.scoreMultiplier).toBe(1.0);
                expect(config.healthEffect).toBe(0);
                expect(config.collapseRiskMultiplier).toBe(1.0);
                expect(config.spawnChance).toBe(0.7);
            });

            it('should have brown highlight color', () => {
                expect(WOOD_TYPE_CONFIG[WoodType.NORMAL].highlightColor).toBe('#8B4513');
            });

            it('should have i18n description key', () => {
                expect(WOOD_TYPE_CONFIG[WoodType.NORMAL].descriptionKey).toBe('wood.normal.description');
            });
        });

        describe('Golden wood type', () => {
            it('should have double score multiplier', () => {
                const config = WOOD_TYPE_CONFIG[WoodType.GOLDEN];
                expect(config.scoreMultiplier).toBe(2.0);
            });

            it('should have no health effect', () => {
                expect(WOOD_TYPE_CONFIG[WoodType.GOLDEN].healthEffect).toBe(0);
            });

            it('should have 10% spawn chance', () => {
                expect(WOOD_TYPE_CONFIG[WoodType.GOLDEN].spawnChance).toBe(0.1);
            });

            it('should have golden visual and color', () => {
                const config = WOOD_TYPE_CONFIG[WoodType.GOLDEN];
                expect(config.visual).toBe('✨');
                expect(config.highlightColor).toBe('#FFD700');
            });
        });

        describe('Cursed wood type', () => {
            it('should have 1.5x score multiplier', () => {
                expect(WOOD_TYPE_CONFIG[WoodType.CURSED].scoreMultiplier).toBe(1.5);
            });

            it('should have negative health effect', () => {
                expect(WOOD_TYPE_CONFIG[WoodType.CURSED].healthEffect).toBe(-5);
            });

            it('should have increased collapse risk', () => {
                expect(WOOD_TYPE_CONFIG[WoodType.CURSED].collapseRiskMultiplier).toBe(1.2);
            });

            it('should have 10% spawn chance', () => {
                expect(WOOD_TYPE_CONFIG[WoodType.CURSED].spawnChance).toBe(0.1);
            });

            it('should have skull visual and purple color', () => {
                const config = WOOD_TYPE_CONFIG[WoodType.CURSED];
                expect(config.visual).toBe('💀');
                expect(config.highlightColor).toBe('#9C27B0');
            });
        });

        describe('Fragile wood type', () => {
            it('should have reduced score multiplier', () => {
                expect(WOOD_TYPE_CONFIG[WoodType.FRAGILE].scoreMultiplier).toBe(0.8);
            });

            it('should have double collapse risk', () => {
                expect(WOOD_TYPE_CONFIG[WoodType.FRAGILE].collapseRiskMultiplier).toBe(2.0);
            });

            it('should have 5% spawn chance', () => {
                expect(WOOD_TYPE_CONFIG[WoodType.FRAGILE].spawnChance).toBe(0.05);
            });

            it('should have leaf visual and red color', () => {
                const config = WOOD_TYPE_CONFIG[WoodType.FRAGILE];
                expect(config.visual).toBe('🍂');
                expect(config.highlightColor).toBe('#FF6B6B');
            });
        });

        describe('Bonus wood type', () => {
            it('should have reduced score multiplier', () => {
                expect(WOOD_TYPE_CONFIG[WoodType.BONUS].scoreMultiplier).toBe(0.5);
            });

            it('should have positive health effect', () => {
                expect(WOOD_TYPE_CONFIG[WoodType.BONUS].healthEffect).toBe(10);
            });

            it('should have normal collapse risk', () => {
                expect(WOOD_TYPE_CONFIG[WoodType.BONUS].collapseRiskMultiplier).toBe(1.0);
            });

            it('should have 5% spawn chance', () => {
                expect(WOOD_TYPE_CONFIG[WoodType.BONUS].spawnChance).toBe(0.05);
            });

            it('should have heart visual and green color', () => {
                const config = WOOD_TYPE_CONFIG[WoodType.BONUS];
                expect(config.visual).toBe('💚');
                expect(config.highlightColor).toBe('#4CAF50');
            });
        });

        describe('Spawn chance validation', () => {
            it('should have spawn chances that sum to 1.0', () => {
                const totalChance = Object.values(WOOD_TYPE_CONFIG)
                    .reduce((sum, config) => sum + config.spawnChance, 0);
                
                expect(totalChance).toBeCloseTo(1.0, 10);
            });

            it('should have all spawn chances between 0 and 1', () => {
                Object.values(WOOD_TYPE_CONFIG).forEach(config => {
                    expect(config.spawnChance).toBeGreaterThanOrEqual(0);
                    expect(config.spawnChance).toBeLessThanOrEqual(1);
                });
            });
        });

        describe('Property validation', () => {
            it('should have all required properties for each type', () => {
                const requiredProperties: (keyof WoodTypeProperties)[] = [
                    'visual',
                    'scoreMultiplier',
                    'healthEffect',
                    'collapseRiskMultiplier',
                    'highlightColor',
                    'descriptionKey',
                    'spawnChance'
                ];

                Object.values(WOOD_TYPE_CONFIG).forEach(config => {
                    requiredProperties.forEach(prop => {
                        expect(config[prop]).toBeDefined();
                    });
                });
            });

            it('should have positive score multipliers', () => {
                Object.values(WOOD_TYPE_CONFIG).forEach(config => {
                    expect(config.scoreMultiplier).toBeGreaterThan(0);
                });
            });

            it('should have positive collapse risk multipliers', () => {
                Object.values(WOOD_TYPE_CONFIG).forEach(config => {
                    expect(config.collapseRiskMultiplier).toBeGreaterThan(0);
                });
            });

            it('should have valid hex color codes', () => {
                const hexColorPattern = /^#[0-9A-Fa-f]{6}$/;
                Object.values(WOOD_TYPE_CONFIG).forEach(config => {
                    expect(config.highlightColor).toMatch(hexColorPattern);
                });
            });

            it('should have non-empty visuals', () => {
                Object.values(WOOD_TYPE_CONFIG).forEach(config => {
                    expect(config.visual).toBeTruthy();
                    expect(config.visual.length).toBeGreaterThan(0);
                });
            });

            it('should have valid i18n description keys', () => {
                Object.entries(WOOD_TYPE_CONFIG).forEach(([type, config]) => {
                    expect(config.descriptionKey).toMatch(/^wood\.\w+\.description$/);
                    expect(config.descriptionKey).toContain(type);
                });
            });
        });

        describe('Balance validation', () => {
            it('should have trade-offs for high-value types', () => {
                // Golden: High score but rare
                const golden = WOOD_TYPE_CONFIG[WoodType.GOLDEN];
                expect(golden.scoreMultiplier).toBeGreaterThan(1.5);
                expect(golden.spawnChance).toBeLessThan(0.15);

                // Cursed: Good score but costs health
                const cursed = WOOD_TYPE_CONFIG[WoodType.CURSED];
                expect(cursed.scoreMultiplier).toBeGreaterThan(1.0);
                expect(cursed.healthEffect).toBeLessThan(0);
            });

            it('should have normal wood as most common', () => {
                const normalChance = WOOD_TYPE_CONFIG[WoodType.NORMAL].spawnChance;
                Object.entries(WOOD_TYPE_CONFIG).forEach(([type, config]) => {
                    if (type !== WoodType.NORMAL) {
                        expect(normalChance).toBeGreaterThan(config.spawnChance);
                    }
                });
            });

            it('should have rare types with special effects', () => {
                const rareTypes = [WoodType.FRAGILE, WoodType.BONUS];
                rareTypes.forEach(type => {
                    const config = WOOD_TYPE_CONFIG[type];
                    expect(config.spawnChance).toBeLessThan(0.1);
                    
                    // Should have either special health or collapse effect
                    const hasSpecialEffect = 
                        config.healthEffect !== 0 || 
                        config.collapseRiskMultiplier !== 1.0 ||
                        config.scoreMultiplier !== 1.0;
                    expect(hasSpecialEffect).toBe(true);
                });
            });
        });
    });

    describe('selectRandomWoodType', () => {
        let mathRandomSpy: any;

        beforeEach(() => {
            mathRandomSpy = vi.spyOn(Math, 'random');
        });

        afterEach(() => {
            mathRandomSpy.mockRestore();
        });

        it('should return NORMAL for random values 0 to 0.7', () => {
            mathRandomSpy.mockReturnValue(0);
            expect(selectRandomWoodType()).toBe(WoodType.NORMAL);

            mathRandomSpy.mockReturnValue(0.35);
            expect(selectRandomWoodType()).toBe(WoodType.NORMAL);

            mathRandomSpy.mockReturnValue(0.69);
            expect(selectRandomWoodType()).toBe(WoodType.NORMAL);
        });

        it('should return GOLDEN for random values > 0.7 to 0.8', () => {
            mathRandomSpy.mockReturnValue(0.71);
            expect(selectRandomWoodType()).toBe(WoodType.GOLDEN);

            mathRandomSpy.mockReturnValue(0.75);
            expect(selectRandomWoodType()).toBe(WoodType.GOLDEN);

            mathRandomSpy.mockReturnValue(0.79);
            expect(selectRandomWoodType()).toBe(WoodType.GOLDEN);
        });

        it('should return CURSED for random values 0.8 to 0.9', () => {
            mathRandomSpy.mockReturnValue(0.8);
            expect(selectRandomWoodType()).toBe(WoodType.CURSED);

            mathRandomSpy.mockReturnValue(0.85);
            expect(selectRandomWoodType()).toBe(WoodType.CURSED);

            mathRandomSpy.mockReturnValue(0.89);
            expect(selectRandomWoodType()).toBe(WoodType.CURSED);
        });

        it('should return FRAGILE for random values 0.9 to 0.95', () => {
            mathRandomSpy.mockReturnValue(0.9);
            expect(selectRandomWoodType()).toBe(WoodType.FRAGILE);

            mathRandomSpy.mockReturnValue(0.925);
            expect(selectRandomWoodType()).toBe(WoodType.FRAGILE);

            mathRandomSpy.mockReturnValue(0.949);
            expect(selectRandomWoodType()).toBe(WoodType.FRAGILE);
        });

        it('should return BONUS for random values > 0.95 to < 1.0', () => {
            mathRandomSpy.mockReturnValue(0.951);
            expect(selectRandomWoodType()).toBe(WoodType.BONUS);

            mathRandomSpy.mockReturnValue(0.975);
            expect(selectRandomWoodType()).toBe(WoodType.BONUS);

            mathRandomSpy.mockReturnValue(0.999);
            expect(selectRandomWoodType()).toBe(WoodType.BONUS);
        });

        it('should return BONUS for edge case 1.0', () => {
            mathRandomSpy.mockReturnValue(1.0);
            // 1.0 är <= cumulativeChance för BONUS (1.0), så BONUS returneras
            expect(selectRandomWoodType()).toBe(WoodType.BONUS);
        });

        describe('Probability distribution', () => {
            it('should generate NORMAL most frequently over many iterations', () => {
                mathRandomSpy.mockRestore();
                const results: Record<WoodType, number> = {
                    [WoodType.NORMAL]: 0,
                    [WoodType.GOLDEN]: 0,
                    [WoodType.CURSED]: 0,
                    [WoodType.FRAGILE]: 0,
                    [WoodType.BONUS]: 0
                };

                const iterations = 10000;
                for (let i = 0; i < iterations; i++) {
                    const type = selectRandomWoodType();
                    results[type]++;
                }

                // Normal should be ~70% (7000 ± 300)
                expect(results[WoodType.NORMAL]).toBeGreaterThan(6500);
                expect(results[WoodType.NORMAL]).toBeLessThan(7500);

                // Golden should be ~10% (1000 ± 150)
                expect(results[WoodType.GOLDEN]).toBeGreaterThan(800);
                expect(results[WoodType.GOLDEN]).toBeLessThan(1200);

                // Cursed should be ~10% (1000 ± 150)
                expect(results[WoodType.CURSED]).toBeGreaterThan(800);
                expect(results[WoodType.CURSED]).toBeLessThan(1200);

                // Fragile should be ~5% (500 ± 100)
                expect(results[WoodType.FRAGILE]).toBeGreaterThan(350);
                expect(results[WoodType.FRAGILE]).toBeLessThan(650);

                // Bonus should be ~5% (500 ± 100)
                expect(results[WoodType.BONUS]).toBeGreaterThan(350);
                expect(results[WoodType.BONUS]).toBeLessThan(650);
            });

            it('should respect configured spawn chances', () => {
                mathRandomSpy.mockRestore();
                const results: Record<WoodType, number> = {
                    [WoodType.NORMAL]: 0,
                    [WoodType.GOLDEN]: 0,
                    [WoodType.CURSED]: 0,
                    [WoodType.FRAGILE]: 0,
                    [WoodType.BONUS]: 0
                };

                const iterations = 1000;
                for (let i = 0; i < iterations; i++) {
                    const type = selectRandomWoodType();
                    results[type]++;
                }

                // Verify all types can spawn
                Object.values(WoodType).forEach(type => {
                    expect(results[type]).toBeGreaterThan(0);
                });

                // Verify relative frequencies
                expect(results[WoodType.NORMAL]).toBeGreaterThan(results[WoodType.GOLDEN]);
                expect(results[WoodType.NORMAL]).toBeGreaterThan(results[WoodType.CURSED]);
                expect(results[WoodType.GOLDEN]).toBeGreaterThan(results[WoodType.FRAGILE]);
                expect(results[WoodType.CURSED]).toBeGreaterThan(results[WoodType.BONUS]);
            });
        });

        describe('Edge cases', () => {
            it('should handle Math.random() returning 0', () => {
                mathRandomSpy.mockReturnValue(0);
                expect(() => selectRandomWoodType()).not.toThrow();
                expect(selectRandomWoodType()).toBe(WoodType.NORMAL);
            });

            it('should handle Math.random() returning exactly 1', () => {
                mathRandomSpy.mockReturnValue(1);
                expect(() => selectRandomWoodType()).not.toThrow();
                // 1.0 matchas av sista typen (BONUS) eftersom 1.0 <= 1.0
                expect(selectRandomWoodType()).toBe(WoodType.BONUS);
            });

            it('should handle Math.random() returning boundary values', () => {
                const boundaries = [0.7, 0.8, 0.9, 0.95];
                boundaries.forEach(value => {
                    mathRandomSpy.mockReturnValue(value);
                    expect(() => selectRandomWoodType()).not.toThrow();
                });
            });
        });
    });
});
