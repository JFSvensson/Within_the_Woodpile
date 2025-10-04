import { 
  GameState,
  CreatureType,
  ActiveCreature
} from './types.js';
import { I18n } from './i18n.js';

/**
 * Ansvarar för rendering av användargränssnitt och UI-element
 */
export class UIRenderer {
  private ctx: CanvasRenderingContext2D;
  private i18n: I18n;

  constructor(ctx: CanvasRenderingContext2D, i18n: I18n) {
    this.ctx = ctx;
    this.i18n = i18n;
  }

  /**
   * Rita spelstatus (poäng, hälsa, etc.)
   */
  drawGameStatus(gameState: GameState): void {
    // Rensa gamla UI-element först
    this.ctx.save();
    
    // Bakgrund för status
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(10, 10, 200, 80);
    
    // Poäng
    this.ctx.font = 'bold 20px Arial';
    this.ctx.fillStyle = '#FFD700';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(
      `${this.i18n.translate('score')}: ${gameState.score}`,
      20, 35
    );
    
    // Hälsa
    this.ctx.fillStyle = gameState.health > 50 ? '#00FF00' : '#FF6600';
    if (gameState.health <= 25) {
      this.ctx.fillStyle = '#FF0000';
    }
    this.ctx.fillText(
      `${this.i18n.translate('health')}: ${gameState.health}%`,
      20, 60
    );
    
    // Fortsättningstext (ta bort accuracy för nu)
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = '14px Arial';
    this.ctx.fillText(
      this.i18n.translate('clickToRemove'),
      20, 80
    );
    
    this.ctx.restore();
  }

  /**
   * Rita aktiv varelse som kräver reaktion
   */
  drawActiveCreature(activeCreature: ActiveCreature): void {
    const emoji = this.getCreatureEmoji(activeCreature.type);
    const timeProgress = activeCreature.timeLeft / activeCreature.maxTime;
    
    // Rita varelse med pulsande effekt
    const scale = 1 + Math.sin(Date.now() / 100) * 0.1;
    
    this.ctx.save();
    this.ctx.translate(
      activeCreature.position.x + 20,
      activeCreature.position.y + 20
    );
    this.ctx.scale(scale, scale);
    
    this.ctx.font = '32px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = '#FF4444';
    this.ctx.fillText(emoji, 0, 0);
    
    this.ctx.restore();
    
    // Rita tidslinje
    this.drawReactionTimer(timeProgress, activeCreature.position);
    
    // Rita instruktion
    this.drawCreatureInstruction(activeCreature.type);
  }

  /**
   * Rita game over-skärm
   */
  drawGameOverOverlay(): void {
    // Halvtransparent overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    
    // Game Over text
    this.ctx.font = 'bold 48px Arial';
    this.ctx.fillStyle = '#FF0000';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      this.i18n.translate('gameOver'),
      this.ctx.canvas.width / 2,
      this.ctx.canvas.height / 2 - 20
    );
    
    // Restart instruction
    this.ctx.font = '24px Arial';
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.fillText(
      'Click to restart',
      this.ctx.canvas.width / 2,
      this.ctx.canvas.height / 2 + 40
    );
    
    this.ctx.textAlign = 'left'; // Reset
  }

  /**
   * Rita hjälptext och instruktioner
   */
  drawInstructions(): void {
    const instructions = [
      this.i18n.translate('instructions'),
      this.i18n.translate('hoverHint'),
      this.i18n.translate('reactionHint')
    ];

    // Bakgrund
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    this.ctx.fillRect(this.ctx.canvas.width - 250, 10, 240, instructions.length * 25 + 20);

    // Text
    this.ctx.font = '14px Arial';
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.textAlign = 'left';
    
    instructions.forEach((instruction, index) => {
      this.ctx.fillText(
        instruction,
        this.ctx.canvas.width - 240,
        35 + index * 25
      );
    });
  }

  /**
   * Hämta emoji för varelsehint
   */
  private getCreatureEmoji(type: CreatureType): string {
    const emojis: Record<CreatureType, string> = {
      [CreatureType.SPIDER]: '🕷️',
      [CreatureType.WASP]: '🐝',
      [CreatureType.HEDGEHOG]: '🦔',
      [CreatureType.GHOST]: '👻',
      [CreatureType.PUMPKIN]: '🎃'
    };
    return emojis[type] || '❓';
  }

  /**
   * Rita reaktionstimer
   */
  private drawReactionTimer(progress: number, position: { x: number; y: number }): void {
    const barWidth = 80;
    const barHeight = 10;
    const x = position.x - 10;
    const y = position.y - 20;
    
    // Bakgrund
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(x, y, barWidth, barHeight);
    
    // Progress
    const progressColor = progress > 0.5 ? '#00FF00' : 
                         progress > 0.25 ? '#FFFF00' : '#FF0000';
    this.ctx.fillStyle = progressColor;
    this.ctx.fillRect(x + 2, y + 2, (barWidth - 4) * progress, barHeight - 4);
    
    // Ram
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x, y, barWidth, barHeight);
  }

  /**
   * Rita varelseinstruktion
   */
  private drawCreatureInstruction(type: CreatureType): void {
    const instructions: Record<CreatureType, string> = {
      [CreatureType.SPIDER]: 'SPACE',
      [CreatureType.WASP]: 'ESC',
      [CreatureType.HEDGEHOG]: 'S',
      [CreatureType.GHOST]: 'L',
      [CreatureType.PUMPKIN]: 'R'
    };
    
    const actions: Record<CreatureType, string> = {
      [CreatureType.SPIDER]: this.i18n.translate('spider'),
      [CreatureType.WASP]: this.i18n.translate('wasp'),
      [CreatureType.HEDGEHOG]: this.i18n.translate('hedgehog'),
      [CreatureType.GHOST]: this.i18n.translate('ghost'),
      [CreatureType.PUMPKIN]: this.i18n.translate('pumpkin')
    };
    
    // Bakgrund för instruktion
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(this.ctx.canvas.width / 2 - 150, 20, 300, 60);
    
    // Text
    this.ctx.font = 'bold 24px Arial';
    this.ctx.fillStyle = '#FFFF00';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      `${actions[type]}!`,
      this.ctx.canvas.width / 2,
      45
    );
    
    this.ctx.font = '18px Arial';
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.fillText(
      `Press ${instructions[type]}`,
      this.ctx.canvas.width / 2,
      65
    );
    
    this.ctx.textAlign = 'left'; // Reset
  }

  /**
   * Uppdatera i18n-referens om språk ändras
   */
  updateI18n(newI18n: I18n): void {
    this.i18n = newI18n;
  }
}