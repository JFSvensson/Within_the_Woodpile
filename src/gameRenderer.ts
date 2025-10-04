import { WoodPiece, GameState, CreatureType, CollapseRisk, ActiveCreature } from './types.js';
import { I18n } from './i18n.js';

/**
 * Ansvarar för all visuell rendering av spelet
 */
export class GameRenderer {
  private ctx: CanvasRenderingContext2D;
  private i18n: I18n;
  
  constructor(canvas: HTMLCanvasElement, i18n: I18n) {
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Cannot get 2D context from canvas');
    }
    this.ctx = context;
    this.i18n = i18n;
  }
  
  /**
   * Ritar hela spelscenen
   */
  render(woodPieces: WoodPiece[], gameState: GameState, hoveredPiece?: WoodPiece): void {
    this.clearCanvas();
    this.drawBackground();
    this.drawWoodPieces(woodPieces, hoveredPiece);
    
    if (gameState.activeCreature) {
      this.drawActiveCreature(gameState.activeCreature);
    }
    
    if (gameState.isGameOver) {
      this.drawGameOverOverlay();
    }
  }
  
  /**
   * Ritar bakgrund med trätema
   */
  private drawBackground(): void {
    // Grundbakgrund
    this.ctx.fillStyle = '#3a2318';
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    
    // Rita mark
    this.ctx.fillStyle = '#2c1810';
    this.ctx.fillRect(0, this.ctx.canvas.height - 50, this.ctx.canvas.width, 50);
  }
  
  private clearCanvas(): void {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
  }
  
  private drawWoodPieces(woodPieces: WoodPiece[], hoveredPiece?: WoodPiece): void {
    // Rita icke-hover pieces först
    woodPieces
      .filter(piece => !piece.isRemoved && piece !== hoveredPiece)
      .forEach(piece => this.drawWoodPiece(piece, false));
    
    // Rita hover piece sist (ovanpå)
    if (hoveredPiece && !hoveredPiece.isRemoved) {
      this.drawWoodPiece(hoveredPiece, true);
    }
  }
  
  private drawWoodPiece(piece: WoodPiece, isHovered: boolean): void {
    const { position, size } = piece;
    const radius = Math.min(size.width, size.height) / 2;
    const centerX = position.x + size.width / 2;
    const centerY = position.y + size.height / 2;
    
    // Rita rund vedpinne
    this.ctx.fillStyle = '#8b4513';
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius - 1, 0, 2 * Math.PI);
    this.ctx.fill();
    
    // Rita vedtextur (radiell)
    this.drawWoodTextureCircular(centerX, centerY, radius);
    
    // Rita ram vid hover (runt)
    if (isHovered) {
      this.drawCollapseRiskBorderCircular(centerX, centerY, radius, piece.collapseRisk);
      
      // Rita varelsehint om det finns någon
      if (piece.creature) {
        this.drawCreatureHint(piece);
      }
    }
  }
  
  /**
   * Ritar cirkulär vedtextur
   */
  private drawWoodTextureCircular(centerX: number, centerY: number, radius: number): void {
    // Mörkare kant för 3D-effekt
    this.ctx.strokeStyle = '#654321';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius - 1, 0, 2 * Math.PI);
    this.ctx.stroke();
    
    // Trälinjer (koncentriska cirklar)
    this.ctx.strokeStyle = '#654321';
    this.ctx.lineWidth = 0.5;
    
    for (let i = 1; i < 4; i++) {
      const ringRadius = (radius / 4) * i;
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, ringRadius, 0, 2 * Math.PI);
      this.ctx.stroke();
    }
    
    // Träådringsmönster (radiella linjer)
    this.ctx.strokeStyle = 'rgba(101, 67, 33, 0.3)';
    this.ctx.lineWidth = 0.5;
    
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * 2 * Math.PI;
      this.ctx.beginPath();
      this.ctx.moveTo(centerX, centerY);
      this.ctx.lineTo(
        centerX + Math.cos(angle) * (radius - 2),
        centerY + Math.sin(angle) * (radius - 2)
      );
      this.ctx.stroke();
    }
  }
  
  /**
   * Ritar hint om varelse finns bakom ved
   */
  private drawCreatureHint(piece: WoodPiece): void {
    if (!piece.creature) return;
    
    // Subtilt skugga-tecken
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    this.ctx.font = '14px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      '?',
      piece.position.x + piece.size.width / 2,
      piece.position.y + piece.size.height / 2 + 5
    );
    this.ctx.textAlign = 'left'; // Reset
  }
  
  /**
   * Ritar cirkulär ram som visar rasrisk
   */
  private drawCollapseRiskBorderCircular(centerX: number, centerY: number, radius: number, collapseRisk: CollapseRisk): void {
    const colors = {
      [CollapseRisk.NONE]: '#90EE90',
      [CollapseRisk.LOW]: '#FFFF00',
      [CollapseRisk.MEDIUM]: '#FFA500', 
      [CollapseRisk.HIGH]: '#FF0000'
    };
    
    this.ctx.strokeStyle = colors[collapseRisk];
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius + 2, 0, 2 * Math.PI);
    this.ctx.stroke();
  }
  
  /**
   * Ritar aktiv varelse som kräver reaktion
   */
  private drawActiveCreature(activeCreature: ActiveCreature): void {
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
  
  private getCreatureEmoji(type: CreatureType): string {
    const emojis = {
      [CreatureType.SPIDER]: '🕷️',
      [CreatureType.WASP]: '🐝',
      [CreatureType.HEDGEHOG]: '🦔',
      [CreatureType.GHOST]: '👻',
      [CreatureType.PUMPKIN]: '🎃'
    };
    return emojis[type];
  }
  
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
  
  private drawCreatureInstruction(type: CreatureType): void {
    const instructions = {
      [CreatureType.SPIDER]: 'SPACE',
      [CreatureType.WASP]: 'ESC',
      [CreatureType.HEDGEHOG]: 'S',
      [CreatureType.GHOST]: 'L',
      [CreatureType.PUMPKIN]: 'R'
    };
    
    const actions = {
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
   * Ritar game over-skärm
   */
  private drawGameOverOverlay(): void {
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
}