import { FormField, UIButton, ModalConfig } from '../../types/ui.js';
import { I18n } from '../../infrastructure/i18n/I18n.js';
import { NewHighscoreInput } from '../../types/index.js';

/**
 * AddScoreDialog hanterar dialogruta för att lägga till nya highscore-poster
 * Följer Single Responsibility Principle - ansvarar endast för score input dialog
 */
export class AddScoreDialog {
    private ctx: CanvasRenderingContext2D;
    private canvas: HTMLCanvasElement;
    private i18n: I18n;
    private config: ModalConfig;
    private fields: FormField[] = [];
    private buttons: UIButton[] = [];
    private animationTime: number = 0;
    private isVisible: boolean = false;
    private score: number = 0;
    private level: number = 1;
    private playDuration: number = 0;
    private onSubmit?: (input: NewHighscoreInput) => void;
    private onCancel?: () => void;

    constructor(
        ctx: CanvasRenderingContext2D,
        canvas: HTMLCanvasElement,
        i18n: I18n,
        config: ModalConfig
    ) {
        this.ctx = ctx;
        this.canvas = canvas;
        this.i18n = i18n;
        this.config = config;
        this.initializeFields();
        this.initializeButtons();
    }

    /**
     * Initialiserar formulärfält
     */
    private initializeFields(): void {
        this.fields = [
            {
                id: 'playerName',
                type: 'text',
                label: this.i18n.translate('highscore.form.playerName'),
                placeholder: this.i18n.translate('highscore.form.playerNamePlaceholder'),
                value: '',
                isValid: true
            }
        ];
    }

    /**
     * Initialiserar knappar
     */
    private initializeButtons(): void {
        const buttonY = this.getModalY() + this.config.height - 80;
        const buttonWidth = 120;
        const buttonHeight = 40;
        const buttonSpacing = 20;
        const centerX = this.canvas.width / 2;

        this.buttons = [
            {
                id: 'submit',
                label: this.i18n.translate('highscore.actions.add'),
                x: centerX - buttonWidth - buttonSpacing / 2,
                y: buttonY,
                width: buttonWidth,
                height: buttonHeight,
                isEnabled: true,
                isHovered: false,
                onClick: () => this.handleSubmit()
            },
            {
                id: 'cancel',
                label: this.i18n.translate('highscore.actions.cancel'),
                x: centerX + buttonSpacing / 2,
                y: buttonY,
                width: buttonWidth,
                height: buttonHeight,
                isEnabled: true,
                isHovered: false,
                onClick: () => this.handleCancel()
            }
        ];
    }

    /**
     * Visar dialogen med score-data
     */
    public show(score: number, level: number, playDuration: number): void {
        this.score = score;
        this.level = level;
        this.playDuration = playDuration;
        this.isVisible = true;
        this.resetForm();
    }

    /**
     * Döljer dialogen
     */
    public hide(): void {
        this.isVisible = false;
    }

    /**
     * Kontrollerar om dialogen är synlig
     */
    public getIsVisible(): boolean {
        return this.isVisible;
    }

    /**
     * Sätter callback för submit
     */
    public setOnSubmit(callback: (input: NewHighscoreInput) => void): void {
        this.onSubmit = callback;
    }

    /**
     * Sätter callback för cancel
     */
    public setOnCancel(callback: () => void): void {
        this.onCancel = callback;
    }

    /**
     * Renderar hela dialogen
     */
    public render(animationTime: number): void {
        if (!this.isVisible) return;

        this.animationTime = animationTime;

        // Rendera overlay
        this.renderOverlay();

        // Rendera modal
        this.renderModal();

        // Rendera innehåll
        this.renderContent();
    }

    /**
     * Renderar mörk overlay bakom modalen
     */
    private renderOverlay(): void {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();
    }

    /**
     * Renderar modal-boxen
     */
    private renderModal(): void {
        const x = this.getModalX();
        const y = this.getModalY();

        this.ctx.save();

        // Modal bakgrund
        const gradient = this.ctx.createLinearGradient(x, y, x, y + this.config.height);
        gradient.addColorStop(0, '#8B4513');
        gradient.addColorStop(1, '#5D2E0A');

        this.ctx.fillStyle = gradient;
        this.drawRoundedRect(x, y, this.config.width, this.config.height, this.config.borderRadius);
        this.ctx.fill();

        // Modal border
        this.ctx.strokeStyle = '#CD853F';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();

        this.ctx.restore();
    }

    /**
     * Renderar dialog-innehåll
     */
    private renderContent(): void {
        const x = this.getModalX() + this.config.padding;
        const y = this.getModalY() + this.config.padding;

        // Titel
        this.renderTitle(x, y);

        // Score info
        this.renderScoreInfo(x, y + 60);

        // Formulärfält
        this.renderFields(x, y + 140);

        // Knappar
        this.renderButtons();
    }

    /**
     * Renderar titel
     */
    private renderTitle(x: number, y: number): void {
        this.ctx.save();
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 24px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
            this.i18n.translate('highscore.title.newRecord'),
            x + (this.config.width - this.config.padding * 2) / 2,
            y + 30
        );
        this.ctx.restore();
    }

    /**
     * Renderar score-information
     */
    private renderScoreInfo(x: number, y: number): void {
        this.ctx.save();
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = '18px sans-serif';
        this.ctx.textAlign = 'center';

        const centerX = x + (this.config.width - this.config.padding * 2) / 2;
        
        this.ctx.fillText(
            `${this.i18n.translate('highscore.statistics.finalScore')}: ${this.score}`,
            centerX,
            y
        );

        this.ctx.fillText(
            `${this.i18n.translate('highscore.statistics.level')}: ${this.level}`,
            centerX,
            y + 25
        );

        const durationMinutes = Math.floor(this.playDuration / 60);
        const durationSeconds = this.playDuration % 60;
        this.ctx.fillText(
            `${this.i18n.translate('highscore.statistics.duration')}: ${durationMinutes}:${durationSeconds.toString().padStart(2, '0')}`,
            centerX,
            y + 50
        );

        this.ctx.restore();
    }

    /**
     * Renderar formulärfält
     */
    private renderFields(x: number, y: number): void {
        this.fields.forEach((field, index) => {
            this.renderField(field, x, y + index * 80);
        });
    }

    /**
     * Renderar ett enskilt formulärfält
     */
    private renderField(field: FormField, x: number, y: number): void {
        this.ctx.save();

        // Label
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '16px sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(field.label, x, y);

        // Input-ruta
        const inputY = y + 25;
        const inputHeight = 35;
        const inputWidth = this.config.width - this.config.padding * 2;

        // Input bakgrund
        this.ctx.fillStyle = field.isValid ? '#FFFFFF' : '#FFE4E1';
        this.drawRoundedRect(x, inputY, inputWidth, inputHeight, 5);
        this.ctx.fill();

        // Input border
        this.ctx.strokeStyle = field.isValid ? '#8B4513' : '#DC143C';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Input text
        this.ctx.fillStyle = '#000000';
        this.ctx.font = '14px sans-serif';
        this.ctx.textAlign = 'left';
        const displayText = field.value || field.placeholder;
        const textColor = field.value ? '#000000' : '#999999';
        this.ctx.fillStyle = textColor;
        this.ctx.fillText(displayText, x + 10, inputY + inputHeight / 2 + 5);

        // Felmeddelande
        if (!field.isValid && field.errorMessage) {
            this.ctx.fillStyle = '#DC143C';
            this.ctx.font = '12px sans-serif';
            this.ctx.fillText(field.errorMessage, x, inputY + inputHeight + 15);
        }

        this.ctx.restore();
    }

    /**
     * Renderar knappar
     */
    private renderButtons(): void {
        this.buttons.forEach(button => {
            this.renderButton(button);
        });
    }

    /**
     * Renderar en enskild knapp
     */
    private renderButton(button: UIButton): void {
        this.ctx.save();

        const hoverScale = button.isHovered ? 1.05 : 1;
        
        this.ctx.translate(button.x + button.width / 2, button.y + button.height / 2);
        this.ctx.scale(hoverScale, hoverScale);

        // Knapp bakgrund
        const gradient = this.ctx.createLinearGradient(
            -button.width / 2, -button.height / 2,
            button.width / 2, button.height / 2
        );
        
        if (button.id === 'submit') {
            gradient.addColorStop(0, button.isEnabled ? '#228B22' : '#696969');
            gradient.addColorStop(1, button.isEnabled ? '#006400' : '#556B2F');
        } else {
            gradient.addColorStop(0, '#DC143C');
            gradient.addColorStop(1, '#8B0000');
        }

        this.ctx.fillStyle = gradient;
        this.drawRoundedRect(-button.width / 2, -button.height / 2, button.width, button.height, 8);
        this.ctx.fill();

        // Knapp border
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Knapp text
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 16px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(button.label, 0, 0);

        this.ctx.restore();
    }

    /**
     * Hanterar musklick
     */
    public handleClick(x: number, y: number): boolean {
        if (!this.isVisible) return false;

        // Kontrollera knappar
        for (const button of this.buttons) {
            if (this.isPointInButton(x, y, button)) {
                button.onClick();
                return true;
            }
        }

        return false;
    }

    /**
     * Hanterar tangentbordsinput för formulär
     */
    public handleKeyInput(key: string): void {
        if (!this.isVisible) return;

        const nameField = this.fields.find(f => f.id === 'playerName');
        if (!nameField) return;

        if (key === 'Backspace') {
            nameField.value = nameField.value.slice(0, -1);
        } else if (key === 'Enter') {
            this.handleSubmit();
        } else if (key.length === 1 && nameField.value.length < 20) {
            nameField.value += key;
        }

        this.validateFields();
    }

    /**
     * Validerar formulärfält
     */
    private validateFields(): void {
        const nameField = this.fields.find(f => f.id === 'playerName');
        if (nameField) {
            nameField.isValid = nameField.value.trim().length >= 2;
            nameField.errorMessage = nameField.isValid 
                ? undefined 
                : this.i18n.translate('highscore.validation.nameRequired');
        }

        // Uppdatera submit-knapp status
        const submitButton = this.buttons.find(b => b.id === 'submit');
        if (submitButton) {
            submitButton.isEnabled = this.fields.every(f => f.isValid);
        }
    }

    /**
     * Hanterar submit
     */
    private handleSubmit(): void {
        this.validateFields();
        
        const nameField = this.fields.find(f => f.id === 'playerName');
        if (!nameField || !nameField.isValid || !this.onSubmit) return;

        const input: NewHighscoreInput = {
            playerName: nameField.value.trim(),
            score: this.score,
            level: this.level,
            playDuration: this.playDuration
        };

        this.onSubmit(input);
        this.hide();
    }

    /**
     * Hanterar cancel
     */
    private handleCancel(): void {
        if (this.onCancel) {
            this.onCancel();
        }
        this.hide();
    }

    /**
     * Återställer formulär
     */
    private resetForm(): void {
        this.fields.forEach(field => {
            field.value = '';
            field.isValid = true;
            field.errorMessage = undefined;
        });
        this.validateFields();
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
        return (this.canvas.width - this.config.width) / 2;
    }

    /**
     * Beräknar modal Y-position
     */
    private getModalY(): number {
        return (this.canvas.height - this.config.height) / 2;
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
        this.fields = [];
        this.buttons = [];
        this.isVisible = false;
    }
}