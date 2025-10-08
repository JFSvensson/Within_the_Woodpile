import { HighscoreEntry } from '../../types/index.js';
import { HighscoreUIConfig, TableColumn } from '../../types/ui.js';
import { I18n } from '../../infrastructure/i18n/I18n.js';

/**
 * HighscoreTable renderar en formaterad tabell med highscore-poster
 * Följer Single Responsibility Principle - ansvarar endast för tabellrendering
 */
export class HighscoreTable {
    private ctx: CanvasRenderingContext2D;
    private canvas: HTMLCanvasElement;
    private i18n: I18n;
    private config: HighscoreUIConfig;
    private columns: TableColumn[] = [];
    private animationTime: number = 0;
    private visibleEntries: HighscoreEntry[] = [];
    private scrollOffset: number = 0;

    constructor(
        ctx: CanvasRenderingContext2D, 
        canvas: HTMLCanvasElement, 
        i18n: I18n,
        config: HighscoreUIConfig
    ) {
        this.ctx = ctx;
        this.canvas = canvas;
        this.i18n = i18n;
        this.config = config;
        this.initializeColumns();
    }

    /**
     * Initialiserar tabellkolumner med lokaliserade rubriker
     */
    private initializeColumns(): void {
        this.columns = [
            {
                key: 'position',
                label: this.i18n.translate('highscore.ranking.position'),
                width: 80,
                align: 'center'
            },
            {
                key: 'playerName',
                label: this.i18n.translate('highscore.ranking.player'),
                width: 200,
                align: 'left'
            },
            {
                key: 'score',
                label: this.i18n.translate('highscore.ranking.score'),
                width: 120,
                align: 'right'
            },
            {
                key: 'duration',
                label: this.i18n.translate('highscore.ranking.duration'),
                width: 100,
                align: 'center'
            },
            {
                key: 'date',
                label: this.i18n.translate('highscore.ranking.date'),
                width: 120,
                align: 'center'
            }
        ];
    }

    /**
     * Uppdaterar tabelldata med nya highscore-poster
     */
    public updateData(entries: HighscoreEntry[]): void {
        this.visibleEntries = entries.slice(0, this.config.maxVisible);
    }

    /**
     * Renderar hela tabellen med header och rader
     */
    public render(x: number, y: number, animationTime: number): void {
        this.animationTime = animationTime;
        
        // Rensa område
        this.ctx.clearRect(x, y, this.getTableWidth(), this.getTableHeight());
        
        // Rendera header
        this.renderHeader(x, y);
        
        // Rendera rader
        const headerHeight = this.config.rowHeight + 10;
        this.renderRows(x, y + headerHeight);
        
        // Rendera border
        this.renderBorder(x, y);
    }

    /**
     * Renderar tabellheader med kolumnrubriker
     */
    private renderHeader(x: number, y: number): void {
        this.ctx.save();
        
        // Header bakgrund
        const gradient = this.ctx.createLinearGradient(x, y, x, y + this.config.rowHeight);
        gradient.addColorStop(0, '#8B4513');
        gradient.addColorStop(1, '#5D2E0A');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x, y, this.getTableWidth(), this.config.rowHeight);
        
        // Header text
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = `bold ${this.config.fontSize}px sans-serif`;
        this.ctx.textBaseline = 'middle';
        
        let currentX = x + this.config.padding;
        
        this.columns.forEach(column => {
            this.ctx.textAlign = column.align;
            
            let textX = currentX;
            if (column.align === 'center') {
                textX = currentX + column.width / 2;
            } else if (column.align === 'right') {
                textX = currentX + column.width - this.config.padding;
            } else {
                textX = currentX + this.config.padding;
            }
            
            this.ctx.fillText(
                column.label,
                textX,
                y + this.config.rowHeight / 2
            );
            
            currentX += column.width;
        });
        
        this.ctx.restore();
    }

    /**
     * Renderar tabellrader med data
     */
    private renderRows(x: number, y: number): void {
        this.visibleEntries.forEach((entry, index) => {
            const rowY = y + index * this.config.rowHeight;
            this.renderRow(entry, x, rowY, index);
        });
    }

    /**
     * Renderar en enskild tabellrad
     */
    private renderRow(entry: HighscoreEntry, x: number, y: number, index: number): void {
        this.ctx.save();
        
        // Alternerande radfärger
        if (index % 2 === 0) {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            this.ctx.fillRect(x, y, this.getTableWidth(), this.config.rowHeight);
        }
        
        // Hover-effekt (kan utökas senare)
        const hoverScale = 1 + Math.sin(this.animationTime * 2 + index) * 0.01;
        
        this.ctx.font = `${this.config.fontSize}px sans-serif`;
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.textBaseline = 'middle';
        
        let currentX = x + this.config.padding;
        
        this.columns.forEach(column => {
            this.ctx.textAlign = column.align;
            
            let textX = currentX;
            if (column.align === 'center') {
                textX = currentX + column.width / 2;
            } else if (column.align === 'right') {
                textX = currentX + column.width - this.config.padding;
            } else {
                textX = currentX + this.config.padding;
            }
            
            let value = '';
            switch (column.key) {
                case 'position':
                    value = `${index + 1}`;
                    break;
                case 'playerName':
                    value = entry.playerName;
                    break;
                case 'score':
                    value = entry.score.toString();
                    break;
                case 'duration':
                    value = this.formatDuration(entry.playDuration * 1000); // Konvertera från sekunder till ms
                    break;
                case 'date':
                    value = this.formatDate(entry.timestamp.getTime());
                    break;
            }
            
            this.ctx.save();
            this.ctx.scale(hoverScale, hoverScale);
            this.ctx.fillText(value, textX / hoverScale, (y + this.config.rowHeight / 2) / hoverScale);
            this.ctx.restore();
            
            currentX += column.width;
        });
        
        this.ctx.restore();
    }

    /**
     * Renderar tabellborder
     */
    private renderBorder(x: number, y: number): void {
        this.ctx.save();
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, this.getTableWidth(), this.getTableHeight());
        
        // Vertikala linjer mellan kolumner
        let currentX = x;
        this.columns.forEach((column, index) => {
            if (index > 0) {
                this.ctx.beginPath();
                this.ctx.moveTo(currentX, y);
                this.ctx.lineTo(currentX, y + this.getTableHeight());
                this.ctx.stroke();
            }
            currentX += column.width;
        });
        
        // Horisontell linje under header
        this.ctx.beginPath();
        this.ctx.moveTo(x, y + this.config.rowHeight);
        this.ctx.lineTo(x + this.getTableWidth(), y + this.config.rowHeight);
        this.ctx.stroke();
        
        this.ctx.restore();
    }

    /**
     * Formaterar varaktighet till läsbar form
     */
    private formatDuration(durationMs: number): string {
        const minutes = Math.floor(durationMs / 60000);
        const seconds = Math.floor((durationMs % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    /**
     * Formaterar datum till läsbar form
     */
    private formatDate(timestamp: number): string {
        const date = new Date(timestamp);
        return date.toLocaleDateString(this.i18n.getCurrentLanguage().startsWith('sv') ? 'sv-SE' : 'en-US', {
            month: 'short',
            day: 'numeric'
        });
    }

    /**
     * Beräknar total tabellbredd
     */
    public getTableWidth(): number {
        return this.columns.reduce((sum, column) => sum + column.width, 0) + this.config.padding * 2;
    }

    /**
     * Beräknar total tabellhöjd
     */
    public getTableHeight(): number {
        const headerHeight = this.config.rowHeight + 10;
        const rowsHeight = this.visibleEntries.length * this.config.rowHeight;
        return headerHeight + rowsHeight;
    }

    /**
     * Uppdaterar konfiguration
     */
    public updateConfig(config: Partial<HighscoreUIConfig>): void {
        this.config = { ...this.config, ...config };
        this.initializeColumns(); // Uppdatera kolumnrubriker om språk ändras
    }

    /**
     * Rensa resurser
     */
    public destroy(): void {
        this.visibleEntries = [];
        this.columns = [];
    }
}