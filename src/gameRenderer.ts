import { 
  WoodPiece, 
  GameState, 
  CreatureType, 
  CollapseRisk, 
  AffectedPiece, 
  CollapsePrediction,
  ActiveCreature 
} from './types.js';
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
    
    // Beräkna vilka pinnar som påverkas av hover
    const affectedPieces = hoveredPiece ? 
      this.calculateAffectedPieces(hoveredPiece, woodPieces) : [];
    
    this.drawWoodPieces(woodPieces, hoveredPiece, affectedPieces);
    
    if (gameState.activeCreature) {
      this.drawActiveCreature(gameState.activeCreature);
    }
    
    if (gameState.isGameOver) {
      this.drawGameOverOverlay();
    }
  }
  
  /**
   * Beräknar vilka pinnar som påverkas om given pinne tas bort
   */
  private calculateAffectedPieces(hoveredPiece: WoodPiece, allPieces: WoodPiece[]): AffectedPiece[] {
    const affectedPieces: AffectedPiece[] = [];
    
    // Simulera borttagning av hovrad pinne
    const simulatedPieces = allPieces.map(piece => 
      piece.id === hoveredPiece.id ? { ...piece, isRemoved: true } : piece
    );
    
    // Hitta pinnar som förlorar stöd
    for (const piece of allPieces) {
      if (piece.isRemoved || piece.id === hoveredPiece.id) continue;
      
      // Beräkna nytt stöd utan den hovrade pinnen
      const supportingPieces = this.findSupportingPieces(piece, simulatedPieces);
      const currentSupport = this.findSupportingPieces(piece, allPieces);
      
      // Klassificera påverkan
      let impact: CollapsePrediction;
      
      if (supportingPieces.length === 0 && !this.isOnGround(piece)) {
        impact = CollapsePrediction.WILL_COLLAPSE;
      } else if (supportingPieces.length < currentSupport.length) {
        if (supportingPieces.length === 1) {
          impact = CollapsePrediction.HIGH_RISK;
        } else if (supportingPieces.length === 2) {
          impact = CollapsePrediction.MEDIUM_RISK;
        } else {
          impact = CollapsePrediction.LOW_RISK;
        }
      } else {
        continue; // Ingen påverkan
      }
      
      affectedPieces.push({
        piece,
        prediction: impact
      });
    }
    
    return affectedPieces;
  }
  
  // Hjälpmetoder från WoodPileGenerator (duplicerat för rendering)
  private findSupportingPieces(piece: WoodPiece, allPieces: WoodPiece[]): WoodPiece[] {
    return allPieces.filter(otherPiece =>
      !otherPiece.isRemoved &&
      otherPiece.id !== piece.id &&
      this.isPieceSupporting(piece, otherPiece)
    );
  }
  
  private isPieceSupporting(piece: WoodPiece, supportPiece: WoodPiece): boolean {
    const isBelow = supportPiece.position.y > piece.position.y;
    const pieceCenterX = piece.position.x + piece.size.width / 2;
    const supportCenterX = supportPiece.position.x + supportPiece.size.width / 2;
    const radius = Math.min(piece.size.width, piece.size.height) / 2;
    const supportRadius = Math.min(supportPiece.size.width, supportPiece.size.height) / 2;
    const horizontalDistance = Math.abs(pieceCenterX - supportCenterX);
    const minOverlap = (radius + supportRadius) * 0.75;
    const hasOverlap = horizontalDistance < minOverlap;
    const verticalDistance = supportPiece.position.y - (piece.position.y + piece.size.height);
    const isDirectlyBelow = verticalDistance <= piece.size.height * 0.5;
    
    return isBelow && hasOverlap && isDirectlyBelow;
  }
  
  private isOnGround(piece: WoodPiece): boolean {
    // Approximation - behöver config för exakt beräkning
    const groundLevel = this.ctx.canvas.height - 50 - piece.size.height;
    return piece.position.y >= groundLevel;
  }
  
  /**
   * Rita alla vedpinnar med påverkanshighlighting
   */
  private drawWoodPieces(woodPieces: WoodPiece[], hoveredPiece?: WoodPiece, affectedPieces: AffectedPiece[] = []): void {
    // Rita alla icke-påverkade pinnar först
    woodPieces
      .filter(piece => !piece.isRemoved)
      .filter(piece => piece !== hoveredPiece)
      .filter(piece => !affectedPieces.some(affected => affected.piece.id === piece.id))
      .forEach(piece => this.drawWoodPiece(piece, false, undefined));
    
    // Rita påverkade pinnar med highlighting
    affectedPieces
      .filter(affected => !affected.piece.isRemoved)
      .forEach(affected => this.drawWoodPiece(affected.piece, false, affected.prediction));
    
    // Rita hovrad pinne sist (ovanpå allt)
    if (hoveredPiece && !hoveredPiece.isRemoved) {
      this.drawWoodPiece(hoveredPiece, true, undefined);
    }
  }
  
  private drawWoodPiece(piece: WoodPiece, isHovered: boolean, prediction?: CollapsePrediction): void {
    const { position, size } = piece;
    const radius = Math.min(size.width, size.height) / 2;
    const centerX = position.x + size.width / 2;
    const centerY = position.y + size.height / 2;
    
    // Rita rund vedpinne
    this.ctx.fillStyle = '#8b4513';
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius - 1, 0, 2 * Math.PI);
    this.ctx.fill();
    
    // Rita vedtextur
    this.drawWoodTextureCircular(centerX, centerY, radius);
    
    // Rita ram baserat på status
    if (isHovered) {
      // Hover-ram (vit/gul)
      this.ctx.strokeStyle = '#FFFF00';
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, radius + 2, 0, 2 * Math.PI);
      this.ctx.stroke();
      
      // Rita varelsehint
      if (piece.creature) {
        this.drawCreatureHint(piece);
      }
    } else if (prediction) {
      // Påverkan-ram med färgkodning
      this.drawPredictionBorder(centerX, centerY, radius, prediction);
    }
  }
  
  /**
   * Rita ram som visar förutsägd påverkan
   */
  private drawPredictionBorder(centerX: number, centerY: number, radius: number, prediction: CollapsePrediction): void {
    const styles = {
      [CollapsePrediction.WILL_COLLAPSE]: { color: '#FF0000', width: 4, style: 'solid' },
      [CollapsePrediction.HIGH_RISK]: { color: '#FF6600', width: 3, style: 'dashed' },
      [CollapsePrediction.MEDIUM_RISK]: { color: '#FFAA00', width: 2, style: 'dashed' },
      [CollapsePrediction.LOW_RISK]: { color: '#FFDD00', width: 2, style: 'dotted' }
    };
    
    const style = styles[prediction];
    
    this.ctx.strokeStyle = style.color;
    this.ctx.lineWidth = style.width;
    
    if (style.style === 'dashed') {
      this.ctx.setLineDash([5, 5]);
    } else if (style.style === 'dotted') {
      this.ctx.setLineDash([2, 3]);
    } else {
      this.ctx.setLineDash([]);
    }
    
    // Rita cirkulär ram
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius + 3, 0, 2 * Math.PI);
    this.ctx.stroke();
    
    // Rita extra effekt för WILL_COLLAPSE
    if (prediction === CollapsePrediction.WILL_COLLAPSE) {
      // Pulsande effekt
      const pulseAlpha = 0.3 + 0.3 * Math.sin(Date.now() / 200);
      this.ctx.fillStyle = `rgba(255, 0, 0, ${pulseAlpha})`;
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, radius + 6, 0, 2 * Math.PI);
      this.ctx.fill();
    }
    
    // Reset dash pattern
    this.ctx.setLineDash([]);
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
