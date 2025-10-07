import { BaseRenderer } from '../shared/BaseRenderer.js';

/**
 * LogoRenderer ansvarar för att rendera spelets logotyp med animerad vedstapel
 * Följer Single Responsibility Principle - hanterar endast logo-rendering
 */
export class LogoRenderer extends BaseRenderer {
    constructor(canvas: HTMLCanvasElement) {
        super(canvas);
    }

    /**
     * Implementerar BaseRenderer render-metod
     */
    public render(animationTime: number): void {
        const centerX = this.canvas.width / 2;
        const logoY = 120;

        this.renderTitle(centerX, logoY);
        this.renderAnimatedWoodPile(centerX, logoY, animationTime);
        this.renderEmoji(centerX, logoY);
    }

    /**
     * Renderar speltiteln med outline-effekt
     */
    private renderTitle(centerX: number, logoY: number): void {
        this.ctx.fillStyle = '#8B4513';
        this.ctx.font = 'bold 48px serif';
        this.ctx.textAlign = 'center';
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 3;
        this.ctx.strokeText('Within the Woodpile', centerX, logoY);
        this.ctx.fillText('Within the Woodpile', centerX, logoY);
    }

    /**
     * Renderar den animerade vedstapeln med "andning" och brick-pattern
     */
    private renderAnimatedWoodPile(centerX: number, logoY: number, animationTime: number): void {
        // Animerad "andning" effekt
        const breathingScale = 1 + Math.sin(animationTime * 2) * 0.02;
        
        this.ctx.save();
        this.ctx.translate(centerX, logoY + 60);
        this.ctx.scale(breathingScale, breathingScale);
        
        this.renderWoodPilePyramid();
        
        this.ctx.restore();
    }

    /**
     * Renderar vedstapel-pyramiden med brick-pattern (4-3-2-1)
     */
    private renderWoodPilePyramid(): void {
        const rows = [4, 3, 2, 1]; // Antal vedstockar per rad (botten till topp)
        const woodRadius = 8;
        const woodSpacing = 18; // Avstånd mellan vedstockar
        
        for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
            const woodCount = rows[rowIndex];
            // Räkna Y-position från botten av pyramiden
            const rowY = (rows.length - 1 - rowIndex) * 16; // Inverterad Y för pyramid
            
            this.renderWoodRow(woodCount, rowY, woodSpacing, woodRadius);
        }
    }

    /**
     * Renderar en rad med vedstockar
     */
    private renderWoodRow(woodCount: number, rowY: number, woodSpacing: number, woodRadius: number): void {
        // Centrera raden och lägg till offset för brick-pattern
        const totalWidth = (woodCount - 1) * woodSpacing;
        const startX = -totalWidth / 2;
        // Förskjutning för att skapa brick-pattern (halva avståndet mellan stockar)
        const brickPatternOffset = woodSpacing / 2;

        for (let col = 0; col < woodCount; col++) {
            const x = startX + col * woodSpacing - brickPatternOffset;
            const y = rowY;
            
            this.renderSingleWoodPiece(x, y, woodRadius);
        }
    }

    /**
     * Renderar en enskild vedstock med bark och trästruktur
     */
    private renderSingleWoodPiece(x: number, y: number, radius: number): void {
        // Rita vedstock
        this.ctx.fillStyle = '#D2691E';
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Rita bark-kontur
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Lägg till trästruktur (små linjer för realism)
        this.renderWoodGrain(x, y, radius);
    }

    /**
     * Renderar trästruktur-detaljer på vedstocken
     */
    private renderWoodGrain(x: number, y: number, radius: number): void {
        this.ctx.strokeStyle = '#A0522D';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        
        // Övre trästruktur-linje
        this.ctx.moveTo(x - radius * 0.6, y - 2);
        this.ctx.lineTo(x + radius * 0.6, y - 2);
        
        // Nedre trästruktur-linje
        this.ctx.moveTo(x - radius * 0.4, y + 2);
        this.ctx.lineTo(x + radius * 0.4, y + 2);
        
        this.ctx.stroke();
    }

    /**
     * Renderar träd-emoji som accent
     */
    private renderEmoji(centerX: number, logoY: number): void {
        this.ctx.font = '40px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🌲', centerX + 150, logoY + 10);
    }
}