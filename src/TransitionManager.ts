import { I18n } from './infrastructure/i18n/I18n.js';

/**
 * Hanterar smooth övergångar mellan olika applikationstillstånd
 */
export class TransitionManager {
  private overlay: HTMLElement;
  private overlayText: HTMLElement;
  private canvas: HTMLCanvasElement;
  private i18n: I18n;

  constructor(i18n: I18n) {
    this.i18n = i18n;
    this.overlay = document.getElementById('transitionOverlay')!;
    this.overlayText = this.overlay.querySelector('[data-i18n]')!;
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
  }

  /**
   * Visar transition overlay med meddelande
   */
  private showOverlay(message: string): Promise<void> {
    return new Promise((resolve) => {
      this.overlayText.textContent = message;
      this.overlay.classList.add('active');
      
      // Vänta på CSS transition
      setTimeout(resolve, 200);
    });
  }

  /**
   * Döljer transition overlay
   */
  private hideOverlay(): Promise<void> {
    return new Promise((resolve) => {
      this.overlay.classList.remove('active');
      
      // Vänta på CSS transition
      setTimeout(resolve, 800);
    });
  }

  /**
   * Animerar UI-element ut från skärmen
   */
  private hideUIElements(): Promise<void> {
    return new Promise((resolve) => {
      const elements = [
        document.querySelector('.game-info'),
        document.querySelector('.header'),
        document.querySelector('.instructions')
      ].filter(el => el) as HTMLElement[];

      elements.forEach(el => el.classList.add('hiding'));
      
      // Vänta på CSS transition
      setTimeout(() => {
        elements.forEach(el => {
          el.style.display = 'none';
          el.classList.remove('hiding');
        });
        resolve();
      }, 600);
    });
  }

  /**
   * Animerar UI-element in på skärmen
   */
  private showUIElements(): Promise<void> {
    return new Promise((resolve) => {
      const elements = [
        document.querySelector('.game-info'),
        document.querySelector('.header'),
        document.querySelector('.instructions')
      ].filter(el => el) as HTMLElement[];

      elements.forEach(el => {
        (el as HTMLElement).style.display = '';
        el.classList.add('hiding');
      });

      // Trigger reflow och ta bort hiding-klass för animation
      requestAnimationFrame(() => {
        elements.forEach(el => el.classList.remove('hiding'));
        setTimeout(resolve, 600);
      });
    });
  }

  /**
   * Smooth övergång från meny till spel
   */
  async transitionToGame(): Promise<void> {
    // 1. Visa loading overlay
    await this.showOverlay(this.i18n.translate('transition.loading'));
    
    // 2. Fade canvas
    this.canvas.classList.add('fading');
    
    // 3. Vänta lite för visuell effekt
    await new Promise(resolve => setTimeout(resolve, 400));
    
    // 4. Dölj meny UI
    await this.hideUIElements();
    
    // 5. Ta bort CSS-klasser
    document.body.classList.remove('menu-mode');
    this.canvas.classList.remove('fading');
    
    // 6. Visa spel UI
    const gameInfo = document.querySelector('.game-info') as HTMLElement;
    if (gameInfo) {
      gameInfo.style.display = 'block';
    }
    
    // 7. Dölj overlay
    await this.hideOverlay();
  }

  /**
   * Smooth övergång från spel tillbaka till meny
   */
  async transitionToMenu(): Promise<void> {
    // 1. Visa returning overlay
    await this.showOverlay(this.i18n.translate('transition.returning'));
    
    // 2. Fade canvas
    this.canvas.classList.add('fading');
    
    // 3. Dölj spel UI
    const gameInfo = document.querySelector('.game-info') as HTMLElement;
    if (gameInfo) {
      gameInfo.style.display = 'none';
    }
    
    // 4. Lägg till meny-läge
    document.body.classList.add('menu-mode');
    
    // 5. Vänta lite
    await new Promise(resolve => setTimeout(resolve, 400));
    
    // 6. Ta bort canvas fade
    this.canvas.classList.remove('fading');
    
    // 7. Dölj overlay
    await this.hideOverlay();
  }

  /**
   * Snabb övergång utan animation (för fel-situationer)
   */
  quickTransitionToMenu(): void {
    this.overlay.classList.remove('active');
    this.canvas.classList.remove('fading');
    
    const gameInfo = document.querySelector('.game-info') as HTMLElement;
    if (gameInfo) {
      gameInfo.style.display = 'none';
    }
    
    document.body.classList.add('menu-mode');
  }
}