import { BaseRenderer } from '../shared/BaseRenderer.js';

/**
 * BackgroundRenderer ansvarar för att rendera den animerade skogsglänta-bakgrunden
 * Hanterar gradient-bakgrund och animerade träd
 */
export class BackgroundRenderer extends BaseRenderer {
    constructor(canvas: HTMLCanvasElement) {
        super(canvas);
    }

    /**
     * Implementerar BaseRenderer render-metod
     */
    public render(animationTime: number): void {
        this.renderGradientBackground();
        this.renderAnimatedTrees(animationTime);
    }

    /**
     * Renderar gradient-bakgrund från himmel till skog
     */
    private renderGradientBackground(): void {
        // Skapa skogsgradient från himmel till mark
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');   // Himmelblå (topp)
        gradient.addColorStop(0.3, '#90EE90'); // Ljusgrön (horisont)
        gradient.addColorStop(1, '#228B22');   // Skogsgrön (mark)
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Renderar animerade träd som svajar i vinden
     */
    private renderAnimatedTrees(animationTime: number): void {
        const treeCount = 8;
        const treeSpacing = this.canvas.width / (treeCount - 1);

        for (let i = 0; i < treeCount; i++) {
            this.renderSingleTree(i, treeSpacing, animationTime);
        }
    }

    /**
     * Renderar ett enskilt träd med animerad svajning
     */
    private renderSingleTree(index: number, spacing: number, animationTime: number): void {
        // Beräkna position med lätt svajning
        const baseX = index * spacing;
        const swayAmount = Math.sin(animationTime + index) * 2; // Lätt svajning i vinden
        const x = baseX + swayAmount;
        
        // Varierad trädhöjd med andande effekt
        const baseHeight = 150;
        const heightVariation = Math.sin(animationTime * 0.5 + index) * 10;
        const treeHeight = baseHeight + heightVariation;
        
        this.renderTreeTrunk(x, treeHeight);
        this.renderTreeCrown(x, treeHeight);
    }

    /**
     * Renderar trädstam
     */
    private renderTreeTrunk(x: number, treeHeight: number): void {
        const trunkWidth = 20;
        const trunkHeight = treeHeight;
        const trunkY = this.canvas.height - trunkHeight;
        
        this.ctx.fillStyle = '#8B4513'; // Brun bark
        this.ctx.fillRect(x - trunkWidth/2, trunkY, trunkWidth, trunkHeight);
        
        // Lägg till bark-textur med vertikala linjer
        this.addBarkTexture(x, trunkY, trunkWidth, trunkHeight);
    }

    /**
     * Renderar trädkrona
     */
    private renderTreeCrown(x: number, treeHeight: number): void {
        const crownRadius = 40;
        const crownY = this.canvas.height - treeHeight + 20; // Lite ovanför stammen
        
        // Rita huvudkrona
        this.ctx.fillStyle = '#228B22'; // Skogsgrön
        this.ctx.beginPath();
        this.ctx.arc(x, crownY, crownRadius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Lägg till djup med mörkare inner-cirkel
        this.ctx.fillStyle = '#1F5F1F'; // Mörkare grön
        this.ctx.beginPath();
        this.ctx.arc(x - 8, crownY + 8, crownRadius * 0.6, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Ljusare highlights på toppen
        this.ctx.fillStyle = '#32CD32'; // Ljusare grön
        this.ctx.beginPath();
        this.ctx.arc(x + 5, crownY - 5, crownRadius * 0.4, 0, Math.PI * 2);
        this.ctx.fill();
    }

    /**
     * Lägger till bark-textur på trädstammen
     */
    private addBarkTexture(x: number, y: number, width: number, height: number): void {
        this.ctx.strokeStyle = '#654321'; // Mörkare brun
        this.ctx.lineWidth = 1;
        
        // Rita vertikala bark-linjer
        const lineCount = 3;
        for (let i = 0; i < lineCount; i++) {
            const lineX = x - width/2 + (width / (lineCount + 1)) * (i + 1);
            
            this.ctx.beginPath();
            this.ctx.moveTo(lineX, y);
            this.ctx.lineTo(lineX, y + height);
            this.ctx.stroke();
        }
        
        // Rita några horisontella bark-markeringar
        const markCount = Math.floor(height / 30);
        for (let i = 0; i < markCount; i++) {
            const markY = y + (height / markCount) * i + 10;
            
            this.ctx.beginPath();
            this.ctx.moveTo(x - width/2 + 2, markY);
            this.ctx.lineTo(x + width/2 - 2, markY);
            this.ctx.stroke();
        }
    }

    /**
     * Ändrar antalet träd (för prestanda-justering)
     */
    public setTreeCount(count: number): void {
        // Implementeras genom att ändra loop-gränsen i renderAnimatedTrees
        // För framtida användning
    }

    /**
     * Ändrar animationshastighet för träden
     */
    public setAnimationSpeed(speed: number): void {
        // För framtida användning - multiplicera animationTime med speed
    }
}