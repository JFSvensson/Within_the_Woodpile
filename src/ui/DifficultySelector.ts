import { I18n } from '../infrastructure/i18n/I18n.js';
import { DifficultyLevel } from '../types/difficulty.js';

/**
 * DifficultySelector - visar och hanterar val av svårighetsgrad i menyn
 */
export class DifficultySelector {
    private ctx: CanvasRenderingContext2D;
    private canvas: HTMLCanvasElement;
    private i18n: I18n;
    private selectedDifficulty: DifficultyLevel = DifficultyLevel.NORMAL;
    private onDifficultyChange?: (difficulty: DifficultyLevel) => void;

    // UI-positioner
    private x: number;
    private y: number;
    private width: number = 500;
    private buttonWidth: number = 90;
    private buttonHeight: number = 40;
    private buttonSpacing: number = 10;

    // Hover state
    private hoveredButton: DifficultyLevel | null = null;

    // Difficulty färger (från LevelManager)
    private readonly difficultyColors: Record<DifficultyLevel, string> = {
        [DifficultyLevel.EASY]: '#4CAF50',      // Grön
        [DifficultyLevel.NORMAL]: '#2196F3',    // Blå
        [DifficultyLevel.HARD]: '#FF9800',      // Orange
        [DifficultyLevel.EXPERT]: '#F44336',    // Röd
        [DifficultyLevel.NIGHTMARE]: '#9C27B0'  // Lila
    };

    constructor(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, i18n: I18n) {
        this.ctx = ctx;
        this.canvas = canvas;
        this.i18n = i18n;
        
        // Placera under logon, ovanför knapparna
        this.x = canvas.width / 2;
        this.y = canvas.height / 2 - 50;
    }

    /**
     * Renderar difficulty selector
     */
    public render(): void {
        this.ctx.save();

        // Rita titel
        this.renderTitle();

        // Rita difficulty knappar
        this.renderDifficultyButtons();

        // Rita beskrivning av vald difficulty
        this.renderDescription();

        this.ctx.restore();
    }

    /**
     * Renderar titel
     */
    private renderTitle(): void {
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 18px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = '#000000';
        this.ctx.shadowBlur = 3;
        this.ctx.fillText(
            this.i18n.translate('difficulty.select'),
            this.x,
            this.y - 30
        );
    }

    /**
     * Renderar difficulty knappar
     */
    private renderDifficultyButtons(): void {
        const difficulties = [
            DifficultyLevel.EASY,
            DifficultyLevel.NORMAL,
            DifficultyLevel.HARD,
            DifficultyLevel.EXPERT,
            DifficultyLevel.NIGHTMARE
        ];

        const totalWidth = (this.buttonWidth * difficulties.length) + 
                          (this.buttonSpacing * (difficulties.length - 1));
        const startX = this.x - totalWidth / 2;

        difficulties.forEach((difficulty, index) => {
            const buttonX = startX + (this.buttonWidth + this.buttonSpacing) * index;
            this.renderDifficultyButton(difficulty, buttonX, this.y);
        });
    }

    /**
     * Renderar en enskild difficulty knapp
     */
    private renderDifficultyButton(difficulty: DifficultyLevel, x: number, y: number): void {
        const isSelected = difficulty === this.selectedDifficulty;
        const isHovered = difficulty === this.hoveredButton;
        
        this.ctx.save();

        // Skala upp lite om hover eller selected
        if (isHovered && !isSelected) {
            this.ctx.translate(x + this.buttonWidth / 2, y + this.buttonHeight / 2);
            this.ctx.scale(1.05, 1.05);
            this.ctx.translate(-(x + this.buttonWidth / 2), -(y + this.buttonHeight / 2));
        }

        // Rita knappbakgrund
        const color = this.difficultyColors[difficulty];
        
        if (isSelected) {
            // Selected: solid färg
            this.ctx.fillStyle = color;
            this.ctx.globalAlpha = 1.0;
        } else {
            // Not selected: semi-transparent
            this.ctx.fillStyle = color;
            this.ctx.globalAlpha = 0.4;
        }

        // Rundad rektangel
        this.drawRoundedRect(x, y, this.buttonWidth, this.buttonHeight, 8);
        this.ctx.fill();

        // Kantlinje (vit för selected, färgad för andra)
        this.ctx.strokeStyle = isSelected ? '#FFFFFF' : color;
        this.ctx.lineWidth = isSelected ? 3 : 2;
        this.ctx.globalAlpha = 1.0;
        this.ctx.stroke();

        // Rita text
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = isSelected ? 'bold 12px sans-serif' : '11px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = '#000000';
        this.ctx.shadowBlur = 2;
        this.ctx.fillText(
            this.i18n.translate(`difficulty.${difficulty}.name`),
            x + this.buttonWidth / 2,
            y + this.buttonHeight / 2 + 4
        );

        this.ctx.restore();
    }

    /**
     * Renderar beskrivning av vald difficulty
     */
    private renderDescription(): void {
        const descriptionY = this.y + this.buttonHeight + 25;
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '14px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = '#000000';
        this.ctx.shadowBlur = 2;
        
        const description = this.i18n.translate(`difficulty.${this.selectedDifficulty}.description`);
        
        // Word wrap för beskrivning
        this.wrapText(description, this.x, descriptionY, this.width - 40, 18);
    }

    /**
     * Ritar en rundad rektangel
     */
    private drawRoundedRect(x: number, y: number, width: number, height: number, radius: number): void {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
    }

    /**
     * Word wrap för text
     */
    private wrapText(text: string, x: number, y: number, maxWidth: number, lineHeight: number): void {
        const words = text.split(' ');
        let line = '';
        let currentY = y;

        for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i] + ' ';
            const metrics = this.ctx.measureText(testLine);
            const testWidth = metrics.width;
            
            if (testWidth > maxWidth && i > 0) {
                this.ctx.fillText(line, x, currentY);
                line = words[i] + ' ';
                currentY += lineHeight;
            } else {
                line = testLine;
            }
        }
        this.ctx.fillText(line, x, currentY);
    }

    /**
     * Hanterar musklick
     */
    public handleClick(x: number, y: number): boolean {
        const difficulties = [
            DifficultyLevel.EASY,
            DifficultyLevel.NORMAL,
            DifficultyLevel.HARD,
            DifficultyLevel.EXPERT,
            DifficultyLevel.NIGHTMARE
        ];

        const totalWidth = (this.buttonWidth * difficulties.length) + 
                          (this.buttonSpacing * (difficulties.length - 1));
        const startX = this.x - totalWidth / 2;

        for (let i = 0; i < difficulties.length; i++) {
            const buttonX = startX + (this.buttonWidth + this.buttonSpacing) * i;
            
            if (this.isPointInButton(x, y, buttonX, this.y)) {
                this.setDifficulty(difficulties[i]);
                return true;
            }
        }

        return false;
    }

    /**
     * Hanterar mushover
     */
    public handleMouseMove(x: number, y: number): void {
        const difficulties = [
            DifficultyLevel.EASY,
            DifficultyLevel.NORMAL,
            DifficultyLevel.HARD,
            DifficultyLevel.EXPERT,
            DifficultyLevel.NIGHTMARE
        ];

        const totalWidth = (this.buttonWidth * difficulties.length) + 
                          (this.buttonSpacing * (difficulties.length - 1));
        const startX = this.x - totalWidth / 2;

        let newHovered: DifficultyLevel | null = null;

        for (let i = 0; i < difficulties.length; i++) {
            const buttonX = startX + (this.buttonWidth + this.buttonSpacing) * i;
            
            if (this.isPointInButton(x, y, buttonX, this.y)) {
                newHovered = difficulties[i];
                break;
            }
        }

        this.hoveredButton = newHovered;
    }

    /**
     * Kontrollerar om en punkt är inuti en knapp
     */
    private isPointInButton(x: number, y: number, buttonX: number, buttonY: number): boolean {
        return x >= buttonX && 
               x <= buttonX + this.buttonWidth && 
               y >= buttonY && 
               y <= buttonY + this.buttonHeight;
    }

    /**
     * Sätter vald difficulty
     */
    public setDifficulty(difficulty: DifficultyLevel): void {
        if (this.selectedDifficulty !== difficulty) {
            this.selectedDifficulty = difficulty;
            this.onDifficultyChange?.(difficulty);
        }
    }

    /**
     * Hämtar vald difficulty
     */
    public getSelectedDifficulty(): DifficultyLevel {
        return this.selectedDifficulty;
    }

    /**
     * Sätter callback för när difficulty ändras
     */
    public setOnDifficultyChange(callback: (difficulty: DifficultyLevel) => void): void {
        this.onDifficultyChange = callback;
    }

    /**
     * Rensa resurser
     */
    public destroy(): void {
        this.onDifficultyChange = undefined;
    }
}
