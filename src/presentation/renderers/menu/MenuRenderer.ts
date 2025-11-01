import { I18n } from '../../../infrastructure/i18n/I18n.js';
import { Position, DifficultyLevel } from '../../../types/index.js';
import { LogoRenderer } from './LogoRenderer.js';
import { MenuParticleSystem } from '../../../particles/MenuParticleSystem.js';
import { BackgroundRenderer } from './BackgroundRenderer.js';
import { MenuButtonManager } from '../../../ui/MenuButtonManager.js';
import { DifficultySelector } from '../../../ui/DifficultySelector.js';
import { BaseRenderer } from '../shared/BaseRenderer.js';

/**
 * MenuRenderer ansvarar för att rendera startmenyn med skogsglänta-tema
 * Följer Single Responsibility Principle - hanterar endast meny-rendering
 */
export class MenuRenderer extends BaseRenderer {
    private i18n: I18n;
    private logoRenderer: LogoRenderer;
    private particleSystem: MenuParticleSystem;
    private backgroundRenderer: BackgroundRenderer;
    private buttonManager: MenuButtonManager;
    private difficultySelector: DifficultySelector;
    private animationTime: number = 0;

    constructor(canvas: HTMLCanvasElement, i18n: I18n) {
        super(canvas);
        this.i18n = i18n;
        this.logoRenderer = new LogoRenderer(canvas);
        this.particleSystem = new MenuParticleSystem(canvas);
        this.backgroundRenderer = new BackgroundRenderer(canvas);
        this.buttonManager = new MenuButtonManager(this.ctx, canvas, i18n);
        this.difficultySelector = new DifficultySelector(this.ctx, canvas, i18n);
    }

    /**
     * Implementerar BaseRenderer render-metod
     */
    public render(): void {
        this.animationTime += 0.016; // ~60fps
        
        this.backgroundRenderer.render(this.animationTime);
        this.particleSystem.update();
        this.particleSystem.render();
        this.logoRenderer.render(this.animationTime);
        this.difficultySelector.render();
        this.buttonManager.render(this.animationTime);
        this.renderFooter();
    }

    /**
     * Renderar footer med controls info
     */
    private renderFooter(): void {
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '14px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = '#000000';
        this.ctx.shadowBlur = 1;
        this.ctx.fillText(
            this.i18n.translate('menu.footer') || 'Made with GitHub Copilot for Alla kodares buggiga natt 2025',
            this.canvas.width / 2,
            this.canvas.height - 10
        );
    }

    /**
     * Hanterar musklick på knappar
     */
    public handleClick(x: number, y: number): boolean {
        // Kolla difficulty selector först
        if (this.difficultySelector.handleClick(x, y)) {
            return true;
        }
        
        // Annars kolla knappar
        return this.buttonManager.handleClick(x, y);
    }

    /**
     * Hanterar mushover för knappar
     */
    public handleMouseMove(x: number, y: number): void {
        this.difficultySelector.handleMouseMove(x, y);
        this.buttonManager.handleMouseMove(x, y);
    }

    // Event callbacks - kommer att bindas till huvudapplikationen
    private onPlayClick: () => void = () => console.log('Play callback not set');
    private onInstructionsClick: () => void = () => console.log('Instructions callback not set');
    private onSettingsClick: () => void = () => console.log('Settings callback not set');
    private onHighscoreClick: () => void = () => console.log('Highscore callback not set');

    /**
     * Sätter callback för när "Spela"-knappen klickas
     */
    public setOnPlayClick(callback: () => void): void {
        this.onPlayClick = callback;
        this.buttonManager.setOnPlayClick(callback);
    }

    /**
     * Sätter callback för när "Instruktioner"-knappen klickas
     */
    public setOnInstructionsClick(callback: () => void): void {
        this.onInstructionsClick = callback;
        this.buttonManager.setOnInstructionsClick(callback);
    }

    /**
     * Sätter callback för när "Inställningar"-knappen klickas
     */
    public setOnSettingsClick(callback: () => void): void {
        this.onSettingsClick = callback;
        this.buttonManager.setOnSettingsClick(callback);
    }

    /**
     * Sätter callback för när "Highscore"-knappen klickas
     */
    public setOnHighscoreClick(callback: () => void): void {
        this.onHighscoreClick = callback;
        this.buttonManager.setOnHighscoreClick(callback);
    }

    /**
     * Sätter hover-status för tangentbordsnavigation
     */
    public setButtonHover(buttonId: string, isHovered: boolean): void {
        this.buttonManager.setButtonHover(buttonId, isHovered);
    }

    /**
     * Aktiverar en knapp baserat på ID (för tangentbordsnavigation)
     */
    public activateButton(buttonId: string): boolean {
        return this.buttonManager.activateButton(buttonId);
    }

    /**
     * Hämtar vald difficulty
     */
    public getSelectedDifficulty(): DifficultyLevel {
        return this.difficultySelector.getSelectedDifficulty();
    }

    /**
     * Sätter difficulty
     */
    public setDifficulty(difficulty: DifficultyLevel): void {
        this.difficultySelector.setDifficulty(difficulty);
    }

    /**
     * Sätter callback för när difficulty ändras
     */
    public setOnDifficultyChange(callback: (difficulty: DifficultyLevel) => void): void {
        this.difficultySelector.setOnDifficultyChange(callback);
    }

    /**
     * Rensa resurser
     */
    public destroy(): void {
        this.buttonManager.destroy();
        this.particleSystem.destroy();
        this.difficultySelector.destroy();
    }
}