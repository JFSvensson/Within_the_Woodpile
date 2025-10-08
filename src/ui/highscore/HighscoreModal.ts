import { HighscoreTable } from './HighscoreTable.js';
import { AddScoreDialog } from './AddScoreDialog.js';
import { StatisticsPanel } from './StatisticsPanel.js';
import { HighscoreManager } from '../../core/managers/HighscoreManager.js';
import { I18n } from '../../infrastructure/i18n/I18n.js';
import { 
    HighscoreEntry, 
    HighscoreStats, 
    Achievement, 
    NewHighscoreInput,
    HighscoreViewType,
    HighscoreUIConfig,
    ModalConfig,
    UIButton
} from '../../types/index.js';

/**
 * HighscoreModal är huvudkomponenten för highscore UI-systemet
 * Koordinerar alla sub-komponenter och hanterar navigation mellan vyer
 */
export class HighscoreModal {
    private ctx: CanvasRenderingContext2D;
    private canvas: HTMLCanvasElement;
    private i18n: I18n;
    private highscoreManager: HighscoreManager;
    
    private highscoreTable: HighscoreTable;
    private addScoreDialog: AddScoreDialog;
    private statisticsPanel: StatisticsPanel;
    
    private isVisible: boolean = false;
    private currentView: HighscoreViewType = HighscoreViewType.TABLE;
    private animationTime: number = 0;
    
    private entries: HighscoreEntry[] = [];
    private statistics?: HighscoreStats;
    private achievements: Achievement[] = [];
    
    private navigationButtons: UIButton[] = [];
    private modalConfig: ModalConfig;
    private tableConfig: HighscoreUIConfig;

    constructor(
        ctx: CanvasRenderingContext2D,
        canvas: HTMLCanvasElement,
        i18n: I18n,
        highscoreManager: HighscoreManager
    ) {
        this.ctx = ctx;
        this.canvas = canvas;
        this.i18n = i18n;
        this.highscoreManager = highscoreManager;
        
        this.modalConfig = this.createModalConfig();
        this.tableConfig = this.createTableConfig();
        
        // Initialisera komponenter först innan övriga operationer
        this.highscoreTable = new HighscoreTable(
            this.ctx,
            this.canvas,
            this.i18n,
            this.tableConfig
        );

        this.addScoreDialog = new AddScoreDialog(
            this.ctx,
            this.canvas,
            this.i18n,
            {
                width: 400,
                height: 350,
                backgroundColor: '#8B4513',
                borderRadius: 10,
                padding: 20,
                showCloseButton: true
            }
        );

        this.statisticsPanel = new StatisticsPanel(
            this.ctx,
            this.canvas,
            this.i18n
        );
        
        this.initializeNavigationButtons();
        this.setupEventListeners();
    }

    /**
     * Skapar modal-konfiguration
     */
    private createModalConfig(): ModalConfig {
        return {
            width: Math.min(800, this.canvas.width - 100),
            height: Math.min(600, this.canvas.height - 100),
            backgroundColor: '#8B4513',
            borderRadius: 15,
            padding: 20,
            showCloseButton: true
        };
    }

    /**
     * Skapar tabell-konfiguration
     */
    private createTableConfig(): HighscoreUIConfig {
        return {
            maxVisible: 10,
            rowHeight: 40,
            fontSize: 14,
            padding: 10,
            animationDuration: 300
        };
    }

    /**
     * Uppdaterar data från HighscoreManager
     */
    private async refreshData(): Promise<void> {
        try {
            // Hämta highscore-data
            const formattedData = await this.highscoreManager.getAllHighscores();
            this.entries = formattedData.entries.map(item => item.entry);
            
            // Hämta statistik (mockad för nu)
            this.statistics = {
                totalGames: this.entries.length,
                averageScore: this.entries.length > 0 
                    ? this.entries.reduce((sum, e) => sum + e.score, 0) / this.entries.length 
                    : 0,
                highestScore: this.entries.length > 0 
                    ? Math.max(...this.entries.map(e => e.score)) 
                    : 0,
                mostFrequentPlayer: this.getMostFrequentPlayer(),
                averagePlayDuration: this.entries.length > 0
                    ? this.entries.reduce((sum, e) => sum + e.playDuration, 0) / this.entries.length
                    : 0
            };

            // Hämta prestationer (mockad för nu)
            this.achievements = this.generateMockAchievements();

            // Uppdatera komponenter
            this.highscoreTable.updateData(this.entries);
            this.statisticsPanel.updateStatistics(this.statistics);
            this.statisticsPanel.updateAchievements(this.achievements);

        } catch (error) {
            console.error('Failed to refresh highscore data:', error);
        }
    }

    /**
     * Initialiserar navigeringsknappar
     */
    private initializeNavigationButtons(): void {
        const buttonWidth = 120;
        const buttonHeight = 35;
        const buttonSpacing = 10;
        const totalWidth = buttonWidth * 3 + buttonSpacing * 2;
        const startX = (this.canvas.width - totalWidth) / 2;
        const buttonY = this.getModalY() + 60;

        this.navigationButtons = [
            {
                id: 'table',
                label: this.i18n.translate('highscore.views.table'),
                x: startX,
                y: buttonY,
                width: buttonWidth,
                height: buttonHeight,
                isEnabled: true,
                isHovered: false,
                onClick: () => this.setCurrentView(HighscoreViewType.TABLE)
            },
            {
                id: 'statistics',
                label: this.i18n.translate('highscore.views.statistics'),
                x: startX + buttonWidth + buttonSpacing,
                y: buttonY,
                width: buttonWidth,
                height: buttonHeight,
                isEnabled: true,
                isHovered: false,
                onClick: () => this.setCurrentView(HighscoreViewType.STATISTICS)
            },
            {
                id: 'close',
                label: this.i18n.translate('highscore.actions.close'),
                x: startX + (buttonWidth + buttonSpacing) * 2,
                y: buttonY,
                width: buttonWidth,
                height: buttonHeight,
                isEnabled: true,
                isHovered: false,
                onClick: () => this.hide()
            }
        ];
    }

    /**
     * Sätter upp event listeners
     */
    private setupEventListeners(): void {
        this.addScoreDialog.setOnSubmit(async (input: NewHighscoreInput) => {
            try {
                await this.highscoreManager.addHighscore(input);
                await this.refreshData();
                this.setCurrentView(HighscoreViewType.TABLE);
            } catch (error) {
                console.error('Failed to add highscore:', error);
            }
        });

        this.addScoreDialog.setOnCancel(() => {
            this.setCurrentView(HighscoreViewType.TABLE);
        });
    }

    /**
     * Visar highscore-modalen
     */
    public async show(): Promise<void> {
        this.isVisible = true;
        await this.refreshData();
    }

    /**
     * Döljer highscore-modalen
     */
    public hide(): void {
        this.isVisible = false;
        this.addScoreDialog.hide();
    }

    /**
     * Kontrollerar om modalen är synlig
     */
    public getIsVisible(): boolean {
        return this.isVisible;
    }

    /**
     * Visar dialog för att lägga till ny poäng
     */
    public async showAddScoreDialog(score: number, level: number, playDuration: number): Promise<void> {
        await this.show();
        this.addScoreDialog.show(score, level, playDuration);
        this.setCurrentView(HighscoreViewType.ADD_SCORE);
    }

    /**
     * Sätter aktuell vy
     */
    private setCurrentView(view: HighscoreViewType): void {
        this.currentView = view;
        
        // Uppdatera knapp-status
        this.navigationButtons.forEach(button => {
            if (button.id === 'table') {
                button.isEnabled = view !== HighscoreViewType.TABLE;
            } else if (button.id === 'statistics') {
                button.isEnabled = view !== HighscoreViewType.STATISTICS;
            }
        });
    }

    /**
     * Hämtar mest frekventa spelare
     */
    private getMostFrequentPlayer(): string {
        if (this.entries.length === 0) return 'N/A';
        
        const playerCounts: Record<string, number> = {};
        this.entries.forEach(entry => {
            playerCounts[entry.playerName] = (playerCounts[entry.playerName] || 0) + 1;
        });

        return Object.entries(playerCounts)
            .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';
    }

    /**
     * Genererar mock-prestationer (kan utökas senare)
     */
    private generateMockAchievements(): Achievement[] {
        const achievements: Achievement[] = [];

        if (this.entries.length > 0) {
            achievements.push({
                id: 'first_score',
                type: 'first_score',
                title: this.i18n.translate('highscore.achievements.firstScore'),
                description: this.i18n.translate('highscore.achievements.firstScoreDesc'),
                unlockedAt: this.entries[0].timestamp,
                requirements: {}
            });
        }

        if (this.statistics && this.statistics.highestScore >= 1000) {
            achievements.push({
                id: 'high_score',
                type: 'high_score',
                title: this.i18n.translate('highscore.achievements.highScore'),
                description: this.i18n.translate('highscore.achievements.highScoreDesc'),
                unlockedAt: new Date(),
                requirements: { minScore: 1000 }
            });
        }

        return achievements;
    }

    /**
     * Renderar hela modalen
     */
    public render(animationTime: number): void {
        if (!this.isVisible) return;

        this.animationTime = animationTime;

        // Rendera overlay
        this.renderOverlay();

        // Rendera modal
        this.renderModal();

        // Rendera navigering
        this.renderNavigation();

        // Rendera aktuell vy
        this.renderCurrentView();

        // Rendera add score dialog om den är aktiv
        if (this.addScoreDialog.getIsVisible()) {
            this.addScoreDialog.render(animationTime);
        }
    }

    /**
     * Renderar mörk overlay
     */
    private renderOverlay(): void {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();
    }

    /**
     * Renderar modal-ramen
     */
    private renderModal(): void {
        const x = this.getModalX();
        const y = this.getModalY();

        this.ctx.save();

        // Modal bakgrund
        const gradient = this.ctx.createLinearGradient(x, y, x, y + this.modalConfig.height);
        gradient.addColorStop(0, '#8B4513');
        gradient.addColorStop(1, '#5D2E0A');

        this.ctx.fillStyle = gradient;
        this.drawRoundedRect(x, y, this.modalConfig.width, this.modalConfig.height, this.modalConfig.borderRadius);
        this.ctx.fill();

        // Modal border
        this.ctx.strokeStyle = '#CD853F';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();

        // Titel
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 24px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
            this.i18n.translate('highscore.title.main'),
            x + this.modalConfig.width / 2,
            y + 35
        );

        this.ctx.restore();
    }

    /**
     * Renderar navigeringsknappar
     */
    private renderNavigation(): void {
        this.navigationButtons.forEach(button => {
            this.renderNavigationButton(button);
        });
    }

    /**
     * Renderar en navigeringsknapp
     */
    private renderNavigationButton(button: UIButton): void {
        this.ctx.save();

        const isActive = (button.id === 'table' && this.currentView === HighscoreViewType.TABLE) ||
                        (button.id === 'statistics' && this.currentView === HighscoreViewType.STATISTICS);
        
        const hoverScale = button.isHovered ? 1.05 : 1;
        
        this.ctx.translate(button.x + button.width / 2, button.y + button.height / 2);
        this.ctx.scale(hoverScale, hoverScale);

        // Knapp bakgrund
        const gradient = this.ctx.createLinearGradient(
            -button.width / 2, -button.height / 2,
            button.width / 2, button.height / 2
        );
        
        if (isActive) {
            gradient.addColorStop(0, '#FFD700');
            gradient.addColorStop(1, '#FFA500');
        } else if (button.id === 'close') {
            gradient.addColorStop(0, '#DC143C');
            gradient.addColorStop(1, '#8B0000');
        } else {
            gradient.addColorStop(0, '#DEB887');
            gradient.addColorStop(1, '#D2691E');
        }

        this.ctx.fillStyle = gradient;
        this.drawRoundedRect(-button.width / 2, -button.height / 2, button.width, button.height, 8);
        this.ctx.fill();

        // Knapp border
        this.ctx.strokeStyle = isActive ? '#FFFFFF' : '#8B4513';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Knapp text
        this.ctx.fillStyle = isActive ? '#000000' : '#FFFFFF';
        this.ctx.font = `${isActive ? 'bold ' : ''}14px sans-serif`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(button.label, 0, 0);

        this.ctx.restore();
    }

    /**
     * Renderar aktuell vy
     */
    private renderCurrentView(): void {
        const contentX = this.getModalX() + this.modalConfig.padding;
        const contentY = this.getModalY() + 110; // Efter titel och navigering
        const contentWidth = this.modalConfig.width - this.modalConfig.padding * 2;
        const contentHeight = this.modalConfig.height - 130; // Minus titel och navigering

        switch (this.currentView) {
            case HighscoreViewType.TABLE:
                this.highscoreTable.render(contentX, contentY, this.animationTime);
                break;
            case HighscoreViewType.STATISTICS:
                this.statisticsPanel.render(contentX, contentY, contentWidth, contentHeight, this.animationTime);
                break;
        }
    }

    /**
     * Hanterar musklick
     */
    public handleClick(x: number, y: number): boolean {
        if (!this.isVisible) return false;

        // Kontrollera add score dialog först
        if (this.addScoreDialog.getIsVisible()) {
            return this.addScoreDialog.handleClick(x, y);
        }

        // Kontrollera navigeringsknappar
        for (const button of this.navigationButtons) {
            if (this.isPointInButton(x, y, button)) {
                button.onClick();
                return true;
            }
        }

        return false;
    }

    /**
     * Hanterar tangentbordsinput
     */
    public handleKeyInput(key: string): void {
        if (!this.isVisible) return;

        if (this.addScoreDialog.getIsVisible()) {
            this.addScoreDialog.handleKeyInput(key);
        } else if (key === 'Escape') {
            this.hide();
        }
    }

    /**
     * Hanterar mushover
     */
    public handleMouseMove(x: number, y: number): void {
        if (!this.isVisible) return;

        this.navigationButtons.forEach(button => {
            button.isHovered = this.isPointInButton(x, y, button);
        });
    }

    /**
     * Kontrollerar om punkt är inom knapp
     */
    private isPointInButton(x: number, y: number, button: UIButton): boolean {
        return x >= button.x && x <= button.x + button.width &&
               y >= button.y && y <= button.y + button.height;
    }

    /**
     * Beräknar modal X-position
     */
    private getModalX(): number {
        return (this.canvas.width - this.modalConfig.width) / 2;
    }

    /**
     * Beräknar modal Y-position
     */
    private getModalY(): number {
        return (this.canvas.height - this.modalConfig.height) / 2;
    }

    /**
     * Ritar rundad rektangel
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
     * Rensa resurser
     */
    public destroy(): void {
        this.highscoreTable.destroy();
        this.addScoreDialog.destroy();
        this.statisticsPanel.destroy();
        this.navigationButtons = [];
        this.entries = [];
        this.achievements = [];
        this.isVisible = false;
    }
}