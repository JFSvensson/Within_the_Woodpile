import { 
  WoodPiece, 
  Position, 
  Size, 
  CreatureType, 
  CollapseRisk, 
  GameConfig,
  WoodType,
  selectRandomWoodType
} from '../../types/index.js';

/**
 * Genererar vedstaplar med varelser och beräknar rasrisker
 */
export class WoodPileGenerator {
  private config: GameConfig;

  constructor(config: GameConfig) {
    this.config = config;
  }

  /**
   * Genererar en komplett vedstapel
   */
  generateWoodPile(): WoodPiece[] {
    const woodPieces: WoodPiece[] = [];
    const rows = this.calculateRows();
    const piecesPerRow = this.calculatePiecesPerRow();

    for (let row = 0; row < rows; row++) {
      const isEvenRow = row % 2 === 0;
      const rowPieces = isEvenRow ? piecesPerRow : piecesPerRow - 1; // Udda rader har en pinne mindre
      
      for (let col = 0; col < rowPieces; col++) {
        const woodPiece = this.createWoodPiece(row, col);
        woodPieces.push(woodPiece);
      }
    }

    return this.calculateCollapseRisks(woodPieces);
  }

  /**
   * Beräknar antal rader baserat på canvas-höjd
   */
  private calculateRows(): number {
    return Math.floor((this.config.canvasHeight - 100) / this.config.woodHeight);
  }

  /**
   * Beräknar antal vedpinnar per rad
   */
  private calculatePiecesPerRow(): number {
    return Math.floor((this.config.canvasWidth - 100) / this.config.woodWidth);
  }

  /**
   * Skapar en enskild vedpinne med brick pattern-positionering
   */
  private createWoodPiece(row: number, col: number): WoodPiece {
    return {
      id: this.generateId(row, col),
      position: this.calculateBrickPosition(row, col),
      size: this.createSize(),
      isRemoved: false,
      creature: this.assignCreature(),
      collapseRisk: CollapseRisk.NONE, // Beräknas senare
      woodType: selectRandomWoodType() // Slumpmässig wood type
    };
  }

  /**
   * Genererar unikt ID för vedpinne
   */
  private generateId(row: number, col: number): string {
    return `wood-${row}-${col}`;
  }

  /**
   * Beräknar position för vedpinne med brick pattern (omväxlande rader)
   */
  private calculateBrickPosition(row: number, col: number): Position {
    const isEvenRow = row % 2 === 0;
    const baseX = 50 + col * this.config.woodWidth;
    
    // Udda rader förskjuts med halva pinnbredden
    const offsetX = isEvenRow ? 0 : this.config.woodWidth / 2;
    
    return {
      x: baseX + offsetX,
      y: this.config.canvasHeight - 50 - (row + 1) * this.config.woodHeight
    };
  }

  /**
   * Skapar standardstorlek för vedpinne
   */
  private createSize(): Size {
    return {
      width: this.config.woodWidth - 2,
      height: this.config.woodHeight - 2
    };
  }

  /**
   * Tilldelar slumpmässig varelse (eller ingen)
   */
  private assignCreature(): CreatureType | undefined {
    if (Math.random() > this.config.creatureProbability) {
      return undefined;
    }
    return this.getRandomCreature();
  }

  /**
   * Väljer slumpmässig varelse
   */
  private getRandomCreature(): CreatureType {
    const creatures = Object.values(CreatureType);
    return creatures[Math.floor(Math.random() * creatures.length)];
  }

  /**
   * Beräknar rasrisker för alla vedpinnar
   */
  private calculateCollapseRisks(woodPieces: WoodPiece[]): WoodPiece[] {
    return woodPieces.map(piece => ({
      ...piece,
      collapseRisk: this.calculateRiskForPiece(piece, woodPieces)
    }));
  }

  /**
   * Beräknar rasrisk för en specifik vedpinne (uppdaterad för brick pattern)
   */
  private calculateRiskForPiece(piece: WoodPiece, allPieces: WoodPiece[]): CollapseRisk {
    // Vedpinnar på marken har ingen rasrisk
    if (this.isOnGround(piece)) {
      return CollapseRisk.NONE;
    }

    const supportingPieces = this.findSupportingPieces(piece, allPieces);
    const supportCount = supportingPieces.length;

    // Risknivå baserad på antal stödjande pinnar
    if (supportCount === 0) return CollapseRisk.HIGH;
    if (supportCount === 1) return CollapseRisk.MEDIUM;
    if (supportCount === 2) return CollapseRisk.LOW;
    return CollapseRisk.NONE;
  }

  /**
   * Kontrollerar om vedpinne är på marken
   */
  private isOnGround(piece: WoodPiece): boolean {
    const groundLevel = this.config.canvasHeight - 50 - this.config.woodHeight;
    return piece.position.y >= groundLevel;
  }

  /**
   * Hittar alla vedpinnar som stödjer given pinne (uppdaterad för brick pattern)
   */
  private findSupportingPieces(piece: WoodPiece, allPieces: WoodPiece[]): WoodPiece[] {
    return allPieces.filter(otherPiece =>
      !otherPiece.isRemoved &&
      otherPiece.id !== piece.id &&
      this.isPieceSupporting(piece, otherPiece)
    );
  }

  /**
   * Kontrollerar om en vedpinne stödjer en annan (uppdaterad för runda pinnar i brick pattern)
   */
  private isPieceSupporting(piece: WoodPiece, supportPiece: WoodPiece): boolean {
    // Stödet måste vara under den aktuella pinnen
    const isBelow = supportPiece.position.y > piece.position.y;
    
    // Beräkna centrum för runda pinnar
    const pieceCenterX = piece.position.x + piece.size.width / 2;
    const supportCenterX = supportPiece.position.x + supportPiece.size.width / 2;
    
    // För runda pinnar i brick pattern: kontrollera om de överlappar tillräckligt
    const radius = Math.min(piece.size.width, piece.size.height) / 2;
    const supportRadius = Math.min(supportPiece.size.width, supportPiece.size.height) / 2;
    
    // Horisontell distans mellan centrum
    const horizontalDistance = Math.abs(pieceCenterX - supportCenterX);
    
    // Pinnar stödjer varandra om de överlappar med minst 25% av radien
    const minOverlap = (radius + supportRadius) * 0.75;
    const hasOverlap = horizontalDistance < minOverlap;
    
    // Kontrollera vertikal närhet (direkt under)
    const verticalDistance = supportPiece.position.y - (piece.position.y + piece.size.height);
    const isDirectlyBelow = verticalDistance <= this.config.woodHeight * 0.5;
    
    return isBelow && hasOverlap && isDirectlyBelow;
  }

  /**
   * Uppdaterar rasrisker efter att ved tagits bort
   */
  updateCollapseRisks(woodPieces: WoodPiece[]): WoodPiece[] {
    return this.calculateCollapseRisks(woodPieces);
  }

  /**
   * Hittar vedpinnar som kommer att rasa när given pinne tas bort (uppdaterad för brick pattern)
   */
  findCollapsingPieces(removedPiece: WoodPiece, allPieces: WoodPiece[]): WoodPiece[] {
    const collapsingPieces: WoodPiece[] = [];
    
    // Hitta pinnar som förlorar kritiskt stöd
    for (const piece of allPieces) {
      if (piece.isRemoved || piece.id === removedPiece.id) continue;
      
      const supportingPieces = this.findSupportingPieces(piece, allPieces)
        .filter(support => support.id !== removedPiece.id);
      
      // Om pinnen förlorar allt stöd, kommer den att rasa
      if (supportingPieces.length === 0 && !this.isOnGround(piece)) {
        collapsingPieces.push(piece);
      }
    }
    
    return collapsingPieces;
  }
}