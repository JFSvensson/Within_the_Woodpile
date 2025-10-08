import { HighscoreStats, Achievement } from '../../types/index.js';
import { I18n } from '../../infrastructure/i18n/I18n.js';

/**
 * StatisticsPanel visar statistik och prestationer för highscore-systemet
 * Följer Single Responsibility Principle - ansvarar endast för statistikrendering
 */
export class StatisticsPanel {
    private ctx: CanvasRenderingContext2D;
    private canvas: HTMLCanvasElement;
    private i18n: I18n;
    private statistics?: HighscoreStats;
    private achievements: Achievement[] = [];
    private animationTime: number = 0;
    private scrollOffset: number = 0;

    constructor(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, i18n: I18n) {
        this.ctx = ctx;
        this.canvas = canvas;
        this.i18n = i18n;
    }

    /**
     * Uppdaterar statistikdata
     */
    public updateStatistics(statistics: HighscoreStats): void {
        this.statistics = statistics;
    }

    /**
     * Uppdaterar prestationer
     */
    public updateAchievements(achievements: Achievement[]): void {
        this.achievements = achievements;
    }

    /**
     * Renderar hela statistikpanelen
     */
    public render(x: number, y: number, width: number, height: number, animationTime: number): void {
        this.animationTime = animationTime;

        // Rensa område
        this.ctx.clearRect(x, y, width, height);

        // Rendera bakgrund
        this.renderBackground(x, y, width, height);

        // Rendera innehåll
        const contentY = y + 20;
        const contentHeight = height - 40;

        this.renderTitle(x, contentY, width);
        this.renderStatistics(x, contentY + 60, width, contentHeight / 2 - 60);
        this.renderAchievements(x, contentY + contentHeight / 2, width, contentHeight / 2 - 20);
    }

    /**
     * Renderar bakgrund
     */
    private renderBackground(x: number, y: number, width: number, height: number): void {
        this.ctx.save();

        // Gradient bakgrund
        const gradient = this.ctx.createLinearGradient(x, y, x, y + height);
        gradient.addColorStop(0, 'rgba(139, 69, 19, 0.9)');
        gradient.addColorStop(1, 'rgba(93, 46, 10, 0.9)');

        this.ctx.fillStyle = gradient;
        this.drawRoundedRect(x, y, width, height, 15);
        this.ctx.fill();

        // Border
        this.ctx.strokeStyle = '#CD853F';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        this.ctx.restore();
    }

    /**
     * Renderar titel
     */
    private renderTitle(x: number, y: number, width: number): void {
        this.ctx.save();
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 20px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
            this.i18n.translate('highscore.statistics.title'),
            x + width / 2,
            y + 25
        );
        this.ctx.restore();
    }

    /**
     * Renderar statistik-sektion
     */
    private renderStatistics(x: number, y: number, width: number, height: number): void {
        if (!this.statistics) return;

        this.ctx.save();

        // Sektion titel
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 16px sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(
            this.i18n.translate('highscore.statistics.overview'),
            x + 20,
            y + 20
        );

        // Statistik-data
        const stats = [
            {
                label: this.i18n.translate('highscore.statistics.totalGames'),
                value: this.statistics.totalGames.toString()
            },
            {
                label: this.i18n.translate('highscore.statistics.averageScore'),
                value: Math.round(this.statistics.averageScore).toString()
            },
            {
                label: this.i18n.translate('highscore.statistics.bestScore'),
                value: this.statistics.highestScore.toString()
            },
            {
                label: this.i18n.translate('highscore.statistics.totalPlayTime'),
                value: this.formatDuration(this.statistics.averagePlayDuration * 1000)
            }
        ];

        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '14px sans-serif';

        stats.forEach((stat, index) => {
            const itemY = y + 50 + index * 25;
            
            // Label
            this.ctx.textAlign = 'left';
            this.ctx.fillText(stat.label + ':', x + 40, itemY);
            
            // Value
            this.ctx.textAlign = 'right';
            this.ctx.fillStyle = '#FFD700';
            this.ctx.fillText(stat.value, x + width - 40, itemY);
            this.ctx.fillStyle = '#FFFFFF';
        });

        this.ctx.restore();
    }

    /**
     * Renderar prestationer-sektion
     */
    private renderAchievements(x: number, y: number, width: number, height: number): void {
        this.ctx.save();

        // Sektion titel
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 16px sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(
            this.i18n.translate('highscore.achievements.title'),
            x + 20,
            y + 20
        );

        // Prestationer
        if (this.achievements.length === 0) {
            this.ctx.fillStyle = '#CCCCCC';
            this.ctx.font = '14px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                this.i18n.translate('highscore.achievements.none'),
                x + width / 2,
                y + height / 2
            );
        } else {
            this.renderAchievementsList(x, y + 40, width, height - 60);
        }

        this.ctx.restore();
    }

    /**
     * Renderar listan av prestationer
     */
    private renderAchievementsList(x: number, y: number, width: number, height: number): void {
        const itemHeight = 40;
        const maxVisible = Math.floor(height / itemHeight);
        const visibleAchievements = this.achievements.slice(0, maxVisible);

        visibleAchievements.forEach((achievement, index) => {
            this.renderAchievement(achievement, x, y + index * itemHeight, width, itemHeight);
        });
    }

    /**
     * Renderar en enskild prestation
     */
    private renderAchievement(achievement: Achievement, x: number, y: number, width: number, height: number): void {
        this.ctx.save();

        // Prestation bakgrund
        const alpha = 0.3 + 0.1 * Math.sin(this.animationTime * 2);
        this.ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
        this.drawRoundedRect(x + 20, y, width - 40, height - 5, 8);
        this.ctx.fill();

        // Ikon (emoji eller symbol)
        this.ctx.font = '20px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(this.getAchievementIcon(achievement.type), x + 45, y + height / 2 + 7);

        // Titel
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 14px sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(achievement.title, x + 70, y + height / 2 - 5);

        // Beskrivning
        this.ctx.fillStyle = '#CCCCCC';
        this.ctx.font = '12px sans-serif';
        this.ctx.fillText(achievement.description, x + 70, y + height / 2 + 12);

        this.ctx.restore();
    }

    /**
     * Hämtar ikon för prestationstyp
     */
    private getAchievementIcon(type: string): string {
        const icons: Record<string, string> = {
            'first_score': '🎯',
            'high_score': '👑',
            'fast_time': '⚡',
            'endurance': '🔥',
            'perfect_game': '✨',
            'milestone': '🏆'
        };
        return icons[type] || '🎖️';
    }

    /**
     * Formaterar varaktighet till läsbar form
     */
    private formatDuration(durationMs: number): string {
        const hours = Math.floor(durationMs / 3600000);
        const minutes = Math.floor((durationMs % 3600000) / 60000);
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
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
        this.statistics = undefined;
        this.achievements = [];
    }
}