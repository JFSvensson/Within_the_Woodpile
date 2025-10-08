import { MenuButton } from '../types/index.js';
import { I18n } from '../infrastructure/i18n/I18n.js';

/**
 * Hanterar alla knappar i startmenyn - rendering, interaktion och events
 * Följer Single Responsibility Principle genom att fokusera enbart på knapphantering
 */
export class MenuButtonManager {
    private buttons: MenuButton[] = [];
    private ctx: CanvasRenderingContext2D;
    private canvas: HTMLCanvasElement;
    private i18n: I18n;
    private animationTime: number = 0;

    // Event callbacks
    private onPlayClick: () => void = () => console.log('Play callback not set');
    private onInstructionsClick: () => void = () => console.log('Instructions callback not set');
    private onSettingsClick: () => void = () => console.log('Settings callback not set');

    constructor(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, i18n: I18n) {
        this.ctx = ctx;
        this.canvas = canvas;
        this.i18n = i18n;
        this.initializeButtons();
    }

    /**
     * Initialiserar alla menyknappar med rätt positioner och callbacks
     */
    private initializeButtons(): void {
        const centerX = this.canvas.width / 2;
        const startY = this.canvas.height / 2 + 50;
        const buttonSpacing = 80;

        this.buttons = [
            {
                id: 'play',
                textKey: 'menu.play',
                x: centerX - 100,
                y: startY,
                width: 200,
                height: 60,
                onClick: () => this.onPlayClick(),
                isHovered: false
            },
            {
                id: 'instructions',
                textKey: 'menu.instructions',
                x: centerX - 100,
                y: startY + buttonSpacing,
                width: 200,
                height: 60,
                onClick: () => this.onInstructionsClick(),
                isHovered: false
            },
            {
                id: 'settings',
                textKey: 'menu.settings',
                x: centerX - 100,
                y: startY + buttonSpacing * 2,
                width: 200,
                height: 60,
                onClick: () => this.onSettingsClick(),
                isHovered: false
            }
        ];
    }

    /**
     * Renderar alla menyknappar med träliknande design
     */
    public render(animationTime: number): void {
        this.animationTime = animationTime;
        this.buttons.forEach(button => {
            this.renderWoodButton(button);
        });
    }

    /**
     * Renderar en enskild träknapp med hover-effekter
     */
    private renderWoodButton(button: MenuButton): void {
        const hoverScale = button.isHovered ? 1.05 : 1;
        const hoverRotation = button.isHovered ? Math.sin(this.animationTime * 4) * 0.02 : 0;
        
        this.ctx.save();
        this.ctx.translate(button.x + button.width / 2, button.y + button.height / 2);
        this.ctx.scale(hoverScale, hoverScale);
        this.ctx.rotate(hoverRotation);
        
        // Knappbakgrund (träliknande gradient)
        const gradient = this.ctx.createLinearGradient(-button.width/2, -button.height/2, button.width/2, button.height/2);
        gradient.addColorStop(0, '#DEB887');
        gradient.addColorStop(1, '#D2691E');
        
        this.ctx.fillStyle = gradient;
        this.drawRoundedRect(-button.width/2, -button.height/2, button.width, button.height, 15);
        this.ctx.fill();
        
        // Bark-textur (kantlinje)
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        
        // Knapptext med skugga för djup
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 20px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = '#000000';
        this.ctx.shadowBlur = 2;
        this.ctx.fillText(this.i18n.translate(button.textKey), 0, 5);
        
        this.ctx.restore();
    }

    /**
     * Ritar en rundad rektangel (kompatibel med alla webbläsare)
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
     * Hanterar musklick på knappar
     */
    public handleClick(x: number, y: number): boolean {
        for (const button of this.buttons) {
            if (this.isPointInButton(x, y, button)) {
                button.onClick();
                return true;
            }
        }
        return false;
    }

    /**
     * Hanterar mushover för knappar
     */
    public handleMouseMove(x: number, y: number): void {
        this.buttons.forEach(button => {
            button.isHovered = this.isPointInButton(x, y, button);
        });
    }

    /**
     * Kontrollerar om en punkt är inom en knapp
     */
    private isPointInButton(x: number, y: number, button: MenuButton): boolean {
        return x >= button.x && x <= button.x + button.width &&
               y >= button.y && y <= button.y + button.height;
    }

    /**
     * Sätter callback för när "Spela"-knappen klickas
     */
    public setOnPlayClick(callback: () => void): void {
        this.onPlayClick = callback;
    }

    /**
     * Sätter callback för när "Instruktioner"-knappen klickas
     */
    public setOnInstructionsClick(callback: () => void): void {
        this.onInstructionsClick = callback;
    }

    /**
     * Sätter callback för när "Inställningar"-knappen klickas
     */
    public setOnSettingsClick(callback: () => void): void {
        this.onSettingsClick = callback;
    }

    /**
     * Sätter hover-status för en specifik knapp (för tangentbordsnavigation)
     */
    public setButtonHover(buttonId: string, isHovered: boolean): void {
        const button = this.buttons.find(b => b.id === buttonId);
        if (button) {
            button.isHovered = isHovered;
        }
    }

    /**
     * Aktiverar en specifik knapp baserat på ID
     */
    public activateButton(buttonId: string): boolean {
        const button = this.buttons.find(b => b.id === buttonId);
        if (button) {
            button.onClick();
            return true;
        }
        return false;
    }

    /**
     * Uppdaterar knapppositioner vid canvas-storleksändring
     */
    public updateButtonPositions(): void {
        this.initializeButtons();
    }

    /**
     * Rensa resurser
     */
    public destroy(): void {
        this.buttons = [];
    }
}