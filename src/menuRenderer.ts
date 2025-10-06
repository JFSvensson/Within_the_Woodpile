import { I18n } from './i18n.js';
import { MenuButton, Position } from './types.js';

/**
 * MenuRenderer ansvarar för att rendera startmenyn med skogsglänta-tema
 * Följer Single Responsibility Principle - hanterar endast meny-rendering
 */
export class MenuRenderer {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private i18n: I18n;
    private buttons: MenuButton[] = [];
    private animationTime: number = 0;
    private particles: Particle[] = [];

    constructor(canvas: HTMLCanvasElement, i18n: I18n) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.i18n = i18n;
        this.initializeButtons();
        this.initializeParticles();
    }

    /**
     * Initialiserar menyknapparna med träliknande design
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
     * Initialiserar fallande löv-partiklar för atmosfär
     */
    private initializeParticles(): void {
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                velocity: {
                    x: (Math.random() - 0.5) * 0.5,
                    y: Math.random() * 1 + 0.5
                },
                size: Math.random() * 8 + 4,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.02,
                type: Math.random() > 0.5 ? '🍂' : '🍃'
            });
        }
    }

    /**
     * Renderar hela startmenyn
     */
    public render(): void {
        this.animationTime += 0.016; // ~60fps
        
        this.clearCanvas();
        this.renderBackground();
        this.renderParticles();
        this.renderLogo();
        this.renderButtons();
        this.renderFooter();
    }

    /**
     * Rensa canvas med gradient bakgrund
     */
    private clearCanvas(): void {
        // Skapa skogsgradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB'); // Himmelblå
        gradient.addColorStop(0.3, '#90EE90'); // Ljusgrön
        gradient.addColorStop(1, '#228B22'); // Skogsgrön
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Renderar animerad skogsbakgrund
     */
    private renderBackground(): void {
        // Rita stiliserade träd i bakgrunden
        this.ctx.fillStyle = '#8B4513'; // Brun stam
        
        for (let i = 0; i < 8; i++) {
            const x = (i * this.canvas.width / 7) + Math.sin(this.animationTime + i) * 2;
            const treeHeight = 150 + Math.sin(this.animationTime * 0.5 + i) * 10;
            
            // Stam
            this.ctx.fillRect(x - 10, this.canvas.height - treeHeight, 20, treeHeight);
            
            // Krona
            this.ctx.fillStyle = '#228B22';
            this.ctx.beginPath();
            this.ctx.arc(x, this.canvas.height - treeHeight + 20, 40, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.fillStyle = '#8B4513';
        }
    }

    /**
     * Renderar fallande löv-partiklar
     */
    private renderParticles(): void {
        this.particles.forEach(particle => {
            particle.x += particle.velocity.x;
            particle.y += particle.velocity.y;
            particle.rotation += particle.rotationSpeed;

            // Återställ partikel om den faller ut ur skärmen
            if (particle.y > this.canvas.height + 10) {
                particle.y = -10;
                particle.x = Math.random() * this.canvas.width;
            }

            this.ctx.save();
            this.ctx.translate(particle.x, particle.y);
            this.ctx.rotate(particle.rotation);
            this.ctx.font = `${particle.size}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(particle.type, 0, 0);
            this.ctx.restore();
        });
    }

    /**
     * Renderar game logotyp med "andande" vedstapel
     */
    private renderLogo(): void {
        const centerX = this.canvas.width / 2;
        const logoY = 120;
        
        // Titel
        this.ctx.fillStyle = '#8B4513';
        this.ctx.font = 'bold 48px serif';
        this.ctx.textAlign = 'center';
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 3;
        this.ctx.strokeText('Within the Woodpile', centerX, logoY);
        this.ctx.fillText('Within the Woodpile', centerX, logoY);
        
        // Animerad vedstapel
        const breathingScale = 1 + Math.sin(this.animationTime * 2) * 0.02;
        this.ctx.save();
        this.ctx.translate(centerX, logoY + 60);
        this.ctx.scale(breathingScale, breathingScale);
        
        // Rita mini vedstapel med brick-pattern (4-3-2-1 pyramid)
        const rows = [4, 3, 2, 1]; // Antal vedstockar per rad (botten till topp)
        const woodRadius = 8;
        const woodSpacing = 18; // Avstånd mellan vedstockar
        
        for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
            const woodCount = rows[rowIndex];
            // Räkna Y-position från botten av pyramiden
            const rowY = (rows.length - 1 - rowIndex) * 16; // Inverterad Y för pyramid
            // Centrera raden och lägg till offset för brick-pattern
            const totalWidth = (woodCount - 1) * woodSpacing;
            const startX = -totalWidth / 2;
            // Förskjutning för att skapa brick-pattern (halva avståndet mellan stockar)
            const brickPatternOffset = woodSpacing / 2;

            for (let col = 0; col < woodCount; col++) {
                const x = startX + col * woodSpacing - brickPatternOffset;
                const y = rowY;
                // Rita vedstock
                this.ctx.fillStyle = '#D2691E';
                this.ctx.beginPath();
                this.ctx.arc(x, y, woodRadius, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Rita bark-kontur
                this.ctx.strokeStyle = '#8B4513';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
                
                // Lägg till trästruktur (små linjer)
                this.ctx.strokeStyle = '#A0522D';
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.moveTo(x - woodRadius * 0.6, y - 2);
                this.ctx.lineTo(x + woodRadius * 0.6, y - 2);
                this.ctx.moveTo(x - woodRadius * 0.4, y + 2);
                this.ctx.lineTo(x + woodRadius * 0.4, y + 2);
                this.ctx.stroke();
            }
        }
        this.ctx.restore();
        
        // Emoji
        this.ctx.font = '40px Arial';
        this.ctx.fillText('🌲', centerX + 150, logoY + 10);
    }

    /**
     * Renderar menyknapparna med träliknande design
     */
    private renderButtons(): void {
        this.buttons.forEach(button => {
            this.renderWoodButton(button);
        });
    }

    /**
     * Renderar en enskild träknapp
     */
    private renderWoodButton(button: MenuButton): void {
        const hoverScale = button.isHovered ? 1.05 : 1;
        const hoverRotation = button.isHovered ? Math.sin(this.animationTime * 4) * 0.02 : 0;
        
        this.ctx.save();
        this.ctx.translate(button.x + button.width / 2, button.y + button.height / 2);
        this.ctx.scale(hoverScale, hoverScale);
        this.ctx.rotate(hoverRotation);
        
        // Knappbakgrund (träliknande)
        const gradient = this.ctx.createLinearGradient(-button.width/2, -button.height/2, button.width/2, button.height/2);
        gradient.addColorStop(0, '#DEB887');
        gradient.addColorStop(1, '#D2691E');
        
        this.ctx.fillStyle = gradient;
        this.drawRoundedRect(-button.width/2, -button.height/2, button.width, button.height, 15);
        this.ctx.fill();
        
        // Bark-textur
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        
        // Knapptext
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 20px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = '#000000';
        this.ctx.shadowBlur = 2;
        this.ctx.fillText(this.i18n.translate(button.textKey), 0, 5);
        
        this.ctx.restore();
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
     * Kontrollerar om en punkt är inom en knapp
     */
    private isPointInButton(x: number, y: number, button: MenuButton): boolean {
        return x >= button.x && x <= button.x + button.width &&
               y >= button.y && y <= button.y + button.height;
    }

    // Event callbacks - kommer att bindas till huvudapplikationen
    private onPlayClick: () => void = () => console.log('Play callback not set');
    private onInstructionsClick: () => void = () => console.log('Instructions callback not set');
    private onSettingsClick: () => void = () => console.log('Settings callback not set');

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
     * Rensa resurser
     */
    public destroy(): void {
        this.buttons = [];
        this.particles = [];
    }
}

/**
 * Interface för partiklar (fallande löv)
 */
interface Particle {
    x: number;
    y: number;
    velocity: {
        x: number;
        y: number;
    };
    size: number;
    rotation: number;
    rotationSpeed: number;
    type: string;
}