import { WoodPiece, GameState, CreatureType, CollapseRisk } from './types.js';
import { I18n } from './i18n.js';

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
    this.drawWoodPieces(woodPieces, hoveredPiece);
    
    if (gameState.activeCreature) {
      this.drawActiveCreature(gameState.activeCreature);
    }
  }
  
  private clearCanvas(): void {
    this.ctx.fillStyle = '#3a2318';
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
  }
  
  private drawWoodPieces(woodPieces: WoodPiece[], hoveredPiece?: WoodPiece): void {
    woodPieces
      .filter(piece => !piece.isRemoved)
      .forEach(piece => {
        this.drawWoodPiece(piece, piece === hoveredPiece);
      });
  }
  
  private drawWoodPiece(piece: WoodPiece, isHovered: boolean): void {
    const { position, size } = piece;
    
    // Grundfärg för ved
    this.ctx.fillStyle = '#8b4513';
    this.ctx.fillRect(position.x, position.y, size.width, size.height);
    
    // Rita ram baserat på rasrisk (vid hover)
    if (isHovered) {
      this.drawCollapseRiskBorder(piece);
    }
    
    // Rita vedstruktur
    this.drawWoodTexture(piece);
  }
  
  private drawCollapseRiskBorder(piece: WoodPiece): void {
    const colors = {
      [CollapseRisk.NONE]: '#90EE90',
      [CollapseRisk.LOW]: '#FFFF00',
      [CollapseRisk.MEDIUM]: '#FFA500', 
      [CollapseRisk.HIGH]: '#FF0000'
    };
    
    this.ctx.strokeStyle = colors[piece.collapseRisk];
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(
      piece.position.x - 1, 
      piece.position.y - 1, 
      piece.size.width + 2, 
      piece.size.height + 2
    );
  }
  
  private drawWoodTexture(piece: WoodPiece): void {
    // Enkel vedstruktur med linjer
    this.ctx.strokeStyle = '#654321';
    this.ctx.lineWidth = 1;
    
    // Horisontella linjer
    for (let i = 1; i < 3; i++) {
      const y = piece.position.y + (piece.size.height / 3) * i;
      this.ctx.beginPath();
      this.ctx.moveTo(piece.position.x, y);
      this.ctx.lineTo(piece.position.x + piece.size.width, y);
      this.ctx.stroke();
    }
  }
  
  private drawActiveCreature(activeCreature: GameState['activeCreature']): void {
    if (!activeCreature) return;
    
    const emoji = this.getCreatureEmoji(activeCreature.type);
    const timeBar = activeCreature.timeLeft / 2000; // Antag 2 sekunder reaktionstid
    
    // Rita varelse
    this.ctx.font = '32px Arial';
    this.ctx.fillStyle = '#FF0000';
    this.ctx.fillText(
      emoji, 
      activeCreature.position.x, 
      activeCreature.position.y
    );
    
    // Rita tidslinje
    this.drawReactionTimer(timeBar, activeCreature.position);
    
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
    const barWidth = 60;
    const barHeight = 8;
    const x = position.x;
    const y = position.y - 15;
    
    // Bakgrund
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(x, y, barWidth, barHeight);
    
    // Progress
    this.ctx.fillStyle = progress > 0.3 ? '#00FF00' : '#FF0000';
    this.ctx.fillRect(x, y, barWidth * progress, barHeight);
  }
  
  private drawCreatureInstruction(type: CreatureType): void {
    const instructions = {
      [CreatureType.SPIDER]: 'SPACE',
      [CreatureType.WASP]: 'ESC',
      [CreatureType.HEDGEHOG]: 'S',
      [CreatureType.GHOST]: 'L',
      [CreatureType.PUMPKIN]: 'R'
    };
    
    this.ctx.font = '24px Arial';
    this.ctx.fillStyle = '#FFFF00';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      `Press ${instructions[type]}!`,
      this.ctx.canvas.width / 2,
      50
    );
    this.ctx.textAlign = 'left'; // Reset
  }
}