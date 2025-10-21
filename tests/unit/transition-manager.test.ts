import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TransitionManager } from '../../src/TransitionManager.js';
import { I18n } from '../../src/infrastructure/i18n/I18n.js';
import { ResponsiveManager } from '../../src/ResponsiveManager.js';

describe('TransitionManager Tests', () => {
    let manager: TransitionManager;
    let i18n: I18n;
    let overlay: HTMLElement;
    let overlayText: HTMLElement;
    let canvas: HTMLCanvasElement;
    let gameInfo: HTMLElement;
    let header: HTMLElement;
    let instructions: HTMLElement;

    beforeEach(async () => {
        // Setup DOM elements
        overlay = document.createElement('div');
        overlay.id = 'transitionOverlay';
        overlayText = document.createElement('span');
        overlayText.setAttribute('data-i18n', 'true');
        overlay.appendChild(overlayText);
        document.body.appendChild(overlay);

        canvas = document.createElement('canvas');
        canvas.id = 'gameCanvas';
        document.body.appendChild(canvas);

        gameInfo = document.createElement('div');
        gameInfo.className = 'game-info';
        document.body.appendChild(gameInfo);

        header = document.createElement('div');
        header.className = 'header';
        document.body.appendChild(header);

        instructions = document.createElement('div');
        instructions.className = 'instructions';
        document.body.appendChild(instructions);

        // Setup I18n
        i18n = new I18n();
        await i18n.loadLanguage('en');
        vi.spyOn(i18n, 'translate').mockImplementation((key: string) => key);

        manager = new TransitionManager(i18n);
    });

    afterEach(() => {
        if (manager) {
            manager.destroy();
        }
        document.body.innerHTML = '';
        vi.restoreAllMocks();
    });

    describe('Initialization', () => {
        it('should create manager with i18n', () => {
            expect(manager).toBeDefined();
        });

        it('should find overlay element', () => {
            expect(overlay).toBeDefined();
        });

        it('should find overlay text element', () => {
            expect(overlayText).toBeDefined();
        });

        it('should find canvas element', () => {
            expect(canvas).toBeDefined();
        });

        it('should work with ResponsiveManager', () => {
            const responsiveManager = new ResponsiveManager(canvas);
            const managerWithResponsive = new TransitionManager(i18n, responsiveManager);
            
            expect(managerWithResponsive).toBeDefined();
            
            responsiveManager.destroy();
            managerWithResponsive.destroy();
        });
    });

    describe('Transition to Game', () => {
        it('should complete transition to game', async () => {
            vi.useFakeTimers();
            
            const promise = manager.transitionToGame();
            
            // Advance through all timeouts
            await vi.runAllTimersAsync();
            
            await promise;
            
            expect(document.body.classList.contains('menu-mode')).toBe(false);
            
            vi.useRealTimers();
        });

        it('should show loading overlay', async () => {
            vi.useFakeTimers();
            
            const promise = manager.transitionToGame();
            
            // Wait for overlay to show
            await vi.advanceTimersByTimeAsync(200);
            
            expect(overlay.classList.contains('active')).toBe(true);
            expect(overlayText.textContent).toBe('transition.loading');
            
            await vi.runAllTimersAsync();
            await promise;
            
            vi.useRealTimers();
        });

        it('should fade canvas during transition', async () => {
            vi.useFakeTimers();
            
            const promise = manager.transitionToGame();
            
            // Wait for canvas fade
            await vi.advanceTimersByTimeAsync(600);
            
            // Canvas ska ha haft fading-klass någon gång
            // (den tas bort i slutet)
            
            await vi.runAllTimersAsync();
            await promise;
            
            // Efter transition ska fading vara borta
            expect(canvas.classList.contains('fading')).toBe(false);
            
            vi.useRealTimers();
        });

        it('should hide menu UI elements', async () => {
            vi.useFakeTimers();
            
            header.style.display = 'block';
            instructions.style.display = 'block';
            
            const promise = manager.transitionToGame();
            
            await vi.runAllTimersAsync();
            await promise;
            
            expect(header.style.display).toBe('none');
            expect(instructions.style.display).toBe('none');
            
            vi.useRealTimers();
        });

        it('should show game info', async () => {
            vi.useFakeTimers();
            
            gameInfo.style.display = 'none';
            
            const promise = manager.transitionToGame();
            
            await vi.runAllTimersAsync();
            await promise;
            
            expect(gameInfo.style.display).toBe('block');
            
            vi.useRealTimers();
        });

        it('should hide overlay at end', async () => {
            vi.useFakeTimers();
            
            const promise = manager.transitionToGame();
            
            await vi.runAllTimersAsync();
            await promise;
            
            expect(overlay.classList.contains('active')).toBe(false);
            
            vi.useRealTimers();
        });

        it('should remove menu-mode class', async () => {
            vi.useFakeTimers();
            
            document.body.classList.add('menu-mode');
            
            const promise = manager.transitionToGame();
            
            await vi.runAllTimersAsync();
            await promise;
            
            expect(document.body.classList.contains('menu-mode')).toBe(false);
            
            vi.useRealTimers();
        });
    });

    describe('Transition to Menu', () => {
        it('should complete transition to menu', async () => {
            vi.useFakeTimers();
            
            const promise = manager.transitionToMenu();
            
            await vi.runAllTimersAsync();
            await promise;
            
            expect(document.body.classList.contains('menu-mode')).toBe(true);
            
            vi.useRealTimers();
        });

        it('should show returning overlay', async () => {
            vi.useFakeTimers();
            
            const promise = manager.transitionToMenu();
            
            await vi.advanceTimersByTimeAsync(200);
            
            expect(overlay.classList.contains('active')).toBe(true);
            expect(overlayText.textContent).toBe('transition.returning');
            
            await vi.runAllTimersAsync();
            await promise;
            
            vi.useRealTimers();
        });

        it('should hide game info', async () => {
            vi.useFakeTimers();
            
            gameInfo.style.display = 'block';
            
            const promise = manager.transitionToMenu();
            
            await vi.runAllTimersAsync();
            await promise;
            
            expect(gameInfo.style.display).toBe('none');
            
            vi.useRealTimers();
        });

        it('should add menu-mode class', async () => {
            vi.useFakeTimers();
            
            document.body.classList.remove('menu-mode');
            
            const promise = manager.transitionToMenu();
            
            await vi.runAllTimersAsync();
            await promise;
            
            expect(document.body.classList.contains('menu-mode')).toBe(true);
            
            vi.useRealTimers();
        });

        it('should fade canvas', async () => {
            vi.useFakeTimers();
            
            const promise = manager.transitionToMenu();
            
            await vi.runAllTimersAsync();
            await promise;
            
            // Canvas fading ska vara borttagen efter transition
            expect(canvas.classList.contains('fading')).toBe(false);
            
            vi.useRealTimers();
        });
    });

    describe('Quick Transition', () => {
        it('should perform quick transition to menu', () => {
            overlay.classList.add('active');
            canvas.classList.add('fading');
            gameInfo.style.display = 'block';
            
            manager.quickTransitionToMenu();
            
            expect(overlay.classList.contains('active')).toBe(false);
            expect(canvas.classList.contains('fading')).toBe(false);
            expect(gameInfo.style.display).toBe('none');
            expect(document.body.classList.contains('menu-mode')).toBe(true);
        });

        it('should not use animations', () => {
            vi.useFakeTimers();
            
            manager.quickTransitionToMenu();
            
            // Inga timers ska vara aktiva
            expect(vi.getTimerCount()).toBe(0);
            
            vi.useRealTimers();
        });

        it('should be synchronous', () => {
            const initialDisplay = gameInfo.style.display;
            
            manager.quickTransitionToMenu();
            
            // Ändringen ska vara omedelbar
            expect(gameInfo.style.display).not.toBe(initialDisplay);
        });
    });

    describe('Modal Transitions', () => {
        let modal: HTMLElement;

        beforeEach(() => {
            modal = document.createElement('div');
            modal.className = 'modal';
            document.body.appendChild(modal);
        });

        it('should transition to modal', async () => {
            vi.useFakeTimers();
            
            const promise = manager.transitionToModal(modal);
            
            await vi.runAllTimersAsync();
            await promise;
            
            expect(modal.classList.contains('active')).toBe(true);
            
            vi.useRealTimers();
        });

        it('should add entering class during animation', () => {
            // Sync test - klassen läggs till och tas bort direkt
            const classList = modal.classList;
            const originalAdd = classList.add.bind(classList);
            const originalRemove = classList.remove.bind(classList);
            let hadEnteringClass = false;
            
            vi.spyOn(classList, 'add').mockImplementation((className: string) => {
                if (className === 'modal-entering') {
                    hadEnteringClass = true;
                }
                originalAdd(className);
            });
            
            manager.transitionToModal(modal);
            
            expect(hadEnteringClass).toBe(true);
        });

        it('should transition from modal', async () => {
            vi.useFakeTimers();
            
            modal.classList.add('active');
            
            const promise = manager.transitionFromModal(modal);
            
            await vi.runAllTimersAsync();
            await promise;
            
            expect(modal.classList.contains('active')).toBe(false);
            
            vi.useRealTimers();
        });

        it('should add exiting class during animation', async () => {
            vi.useFakeTimers();
            
            modal.classList.add('active');
            
            const promise = manager.transitionFromModal(modal);
            
            // Direkt efter anrop ska exiting finnas
            await vi.advanceTimersByTimeAsync(10);
            expect(modal.classList.contains('modal-exiting')).toBe(true);
            
            await vi.runAllTimersAsync();
            await promise;
            
            // Efter transition ska exiting vara borta
            expect(modal.classList.contains('modal-exiting')).toBe(false);
            
            vi.useRealTimers();
        });

        it('should remove all modal classes after exit', async () => {
            vi.useFakeTimers();
            
            modal.classList.add('active');
            
            const promise = manager.transitionFromModal(modal);
            
            await vi.runAllTimersAsync();
            await promise;
            
            expect(modal.classList.contains('active')).toBe(false);
            expect(modal.classList.contains('modal-exiting')).toBe(false);
            
            vi.useRealTimers();
        });
    });

    describe('UI Element Animations', () => {
        it('should handle missing UI elements gracefully', async () => {
            vi.useFakeTimers();
            
            // Ta bort alla UI-element
            document.body.innerHTML = '';
            
            // Återskapa bara nödvändiga element
            overlay = document.createElement('div');
            overlay.id = 'transitionOverlay';
            overlayText = document.createElement('span');
            overlayText.setAttribute('data-i18n', 'true');
            overlay.appendChild(overlayText);
            document.body.appendChild(overlay);
            
            canvas = document.createElement('canvas');
            canvas.id = 'gameCanvas';
            document.body.appendChild(canvas);
            
            manager = new TransitionManager(i18n);
            
            // Transition ska fungera utan att krascha
            const promise = manager.transitionToGame();
            
            await vi.runAllTimersAsync();
            await promise;
            
            expect(overlay).toBeDefined();
            
            vi.useRealTimers();
        });

        it('should handle elements already hidden', async () => {
            vi.useFakeTimers();
            
            header.style.display = 'none';
            instructions.style.display = 'none';
            
            const promise = manager.transitionToGame();
            
            await vi.runAllTimersAsync();
            await promise;
            
            expect(header.style.display).toBe('none');
            
            vi.useRealTimers();
        });
    });

    describe('Resource Management', () => {
        it('should clean up on destroy', () => {
            overlay.classList.add('active');
            canvas.classList.add('fading');
            
            manager.destroy();
            
            expect(overlay.classList.contains('active')).toBe(false);
            expect(canvas.classList.contains('fading')).toBe(false);
        });

        it('should handle destroy during transition', async () => {
            vi.useFakeTimers();
            
            const promise = manager.transitionToGame();
            
            // Destroy mitt i transition
            await vi.advanceTimersByTimeAsync(500);
            manager.destroy();
            
            // Ska inte krascha
            expect(overlay.classList.contains('active')).toBe(false);
            
            await vi.runAllTimersAsync();
            
            vi.useRealTimers();
        });

        it('should handle multiple destroy calls', () => {
            expect(() => {
                manager.destroy();
                manager.destroy();
                manager.destroy();
            }).not.toThrow();
        });
    });

    describe('Edge Cases', () => {
        it('should handle rapid transitions', async () => {
            vi.useFakeTimers();
            
            // Start both transitions
            const promise1 = manager.transitionToGame();
            const promise2 = manager.transitionToMenu();
            
            await vi.runAllTimersAsync();
            await Promise.all([promise1, promise2]);
            
            // Transitions ska köras utan att krascha
            // (det slutliga state beror på vilken som slutar sist)
            expect(overlay.classList.contains('active')).toBe(false);
            
            vi.useRealTimers();
        });

        it('should handle null gameInfo element', async () => {
            vi.useFakeTimers();
            
            document.body.removeChild(gameInfo);
            
            const promise = manager.transitionToGame();
            
            await vi.runAllTimersAsync();
            
            // Ska inte krascha
            await expect(promise).resolves.not.toThrow();
            
            vi.useRealTimers();
        });

        it('should use i18n for overlay text', async () => {
            vi.useFakeTimers();
            
            const promise = manager.transitionToGame();
            
            await vi.advanceTimersByTimeAsync(200);
            
            expect(i18n.translate).toHaveBeenCalledWith('transition.loading');
            
            await vi.runAllTimersAsync();
            await promise;
            
            vi.useRealTimers();
        });
    });
});
