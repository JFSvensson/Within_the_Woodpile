import { 
  WoodPiece, 
  CollapsePrediction,
  AffectedPiece,
  CreatureType,
  WoodType,
  WOOD_TYPE_CONFIG
} from '../../../types/index.js';
import { BaseRenderer } from '../shared/BaseRenderer.js';

/**
 * Ansvarar för rendering av vedpinnar och relaterade visuella effekter
 */
export class WoodPieceRenderer extends BaseRenderer {

  constructor(canvas: HTMLCanvasElement) {
    super(canvas);
  }

  /**
   * Implementerar BaseRenderer render-metod
   */
  public render(woodPieces: WoodPiece[], hoveredPiece?: WoodPiece, affectedPieces: AffectedPiece[] = []): void {
    this.drawWoodPieces(woodPieces, hoveredPiece, affectedPieces);
  }

  /**
   * Rita alla vedpinnar med påverkanshighlighting
   */
  drawWoodPieces(woodPieces: WoodPiece[], hoveredPiece?: WoodPiece, affectedPieces: AffectedPiece[] = []): void {
    // Rita alla icke-påverkade pinnar först
    woodPieces
      .filter(piece => !piece.isRemoved && !piece.isCollapsing)
      .filter(piece => piece !== hoveredPiece)
      .filter(piece => !affectedPieces.some(affected => affected.piece.id === piece.id))
      .forEach(piece => this.drawWoodPiece(piece, false, undefined));
    
    // Rita påverkade pinnar med highlighting
    affectedPieces
      .filter(affected => !affected.piece.isRemoved && !affected.piece.isCollapsing)
      .forEach(affected => this.drawWoodPiece(affected.piece, false, affected.prediction));
    
    // Rita hovrad pinne sist (ovanpå allt)
    if (hoveredPiece && !hoveredPiece.isRemoved && !hoveredPiece.isCollapsing) {
      this.drawWoodPiece(hoveredPiece, true, undefined);
    }
  }

  /**
   * Rita en enskild vedpinne
   */
  drawWoodPiece(piece: WoodPiece, isHovered: boolean, prediction?: CollapsePrediction): void {
    const { position, size, woodType } = piece;
    const radius = Math.min(size.width, size.height) / 2;
    const centerX = position.x + size.width / 2;
    const centerY = position.y + size.height / 2;
    
    // Hämta wood type config
    const typeConfig = woodType && WOOD_TYPE_CONFIG[woodType as WoodType] 
      ? WOOD_TYPE_CONFIG[woodType as WoodType] 
      : WOOD_TYPE_CONFIG[WoodType.NORMAL];
    
    // Rita rund vedpinne med färg baserat på typ
    const baseColor = this.getWoodColor(woodType as WoodType);
    this.ctx.fillStyle = baseColor;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius - 1, 0, 2 * Math.PI);
    this.ctx.fill();
    
    // Rita vedtextur
    this.drawWoodTextureCircular(centerX, centerY, radius);
    
    // Rita special wood visual (emoji/icon)
    if (woodType && woodType !== WoodType.NORMAL) {
      this.drawWoodTypeIcon(centerX, centerY, typeConfig.visual);
    }
    
    // Rita ram baserat på status
    if (isHovered) {
      // Hover-ram (använd wood type färg om special)
      const hoverColor = woodType && woodType !== WoodType.NORMAL 
        ? typeConfig.highlightColor 
        : '#FFFF00';
      this.ctx.strokeStyle = hoverColor;
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
   * Hämtar färg för wood type
   */
  private getWoodColor(woodType?: WoodType): string {
    if (!woodType || woodType === WoodType.NORMAL) {
      return '#8b4513'; // Normal brun
    }
    
    switch (woodType) {
      case WoodType.GOLDEN:
        return '#DAA520'; // Guldbrun
      case WoodType.CURSED:
        return '#4A148C'; // Mörklila
      case WoodType.FRAGILE:
        return '#D84315'; // Rödaktig
      case WoodType.BONUS:
        return '#388E3C'; // Grön
      default:
        return '#8b4513';
    }
  }

  /**
   * Ritar wood type icon/emoji
   */
  private drawWoodTypeIcon(x: number, y: number, visual: string): void {
    this.ctx.save();
    this.ctx.font = '20px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(visual, x, y);
    this.ctx.restore();
  }

  /**
   * Rita ram som visar förutsägd påverkan
   */
  drawPredictionBorder(centerX: number, centerY: number, radius: number, prediction: CollapsePrediction): void {
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
   * Ritar cirkulär vedtextur
   */
  drawWoodTextureCircular(centerX: number, centerY: number, radius: number): void {
    // Mörkare kant för 3D-effekt
    this.ctx.strokeStyle = '#654321';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius - 1, 0, 2 * Math.PI);
    this.ctx.stroke();

    // Årens ringar
    for (let i = 1; i <= 3; i++) {
      const ringRadius = radius * (0.8 - i * 0.15);
      if (ringRadius > 2) {
        this.ctx.strokeStyle = `rgba(101, 67, 33, ${0.3 + i * 0.1})`;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, ringRadius, 0, 2 * Math.PI);
        this.ctx.stroke();
      }
    }

    // Träfiber (ljusa linjer)
    this.ctx.strokeStyle = 'rgba(139, 69, 19, 0.4)';
    this.ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      this.ctx.beginPath();
      this.ctx.moveTo(centerX, centerY);
      this.ctx.lineTo(
        centerX + Math.cos(angle) * radius * 0.6,
        centerY + Math.sin(angle) * radius * 0.6
      );
      this.ctx.stroke();
    }
  }

  /**
   * Rita bakgrund med trätema
   */
  drawBackground(): void {
    // Grundbakgrund
    this.ctx.fillStyle = '#3a2318';
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    
    // Rita mark
    this.ctx.fillStyle = '#2c1810';
    this.ctx.fillRect(0, this.ctx.canvas.height - 50, this.ctx.canvas.width, 50);
  }

  /**
   * Rita hint för varelse i vedpinne
   */
  private drawCreatureHint(piece: WoodPiece): void {
    if (!piece.creature) return;

    const centerX = piece.position.x + piece.size.width / 2;
    const centerY = piece.position.y + piece.size.height / 2;
    const radius = Math.min(piece.size.width, piece.size.height) / 2;

    // Rita skugga/glow effekt
    this.ctx.shadowColor = this.getCreatureColor(piece.creature);
    this.ctx.shadowBlur = 15;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;

    // Rita en subtil indikation
    this.ctx.fillStyle = this.getCreatureColor(piece.creature) + '40'; // 25% opacity
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius * 1.2, 0, 2 * Math.PI);
    this.ctx.fill();

    // Reset shadow
    this.ctx.shadowBlur = 0;
  }

  /**
   * Hämta färg för varelsehint
   */
  private getCreatureColor(creature: CreatureType): string {
    const colors: Record<CreatureType, string> = {
      [CreatureType.SPIDER]: '#8B0000',
      [CreatureType.WASP]: '#FFD700',
      [CreatureType.HEDGEHOG]: '#8B4513',
      [CreatureType.GHOST]: '#E6E6FA',
      [CreatureType.PUMPKIN]: '#FF8C00'
    };
    return colors[creature] || '#FFFFFF';
  }
}