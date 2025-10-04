import { WoodPiece, Position, Size, CreatureType, CollapseRisk } from './types.js';

export class WoodPileGenerator {
  private readonly WOOD_WIDTH = 20;
  private readonly WOOD_HEIGHT = 20;
  private readonly CREATURE_PROBABILITY = 0.3;
  
  /**
   * Genererar en vedstapel med given storlek
   */
  generateWoodPile(canvasWidth: number, canvasHeight: number): WoodPiece[] {
    const woodPieces: WoodPiece[] = [];
    const rows = Math.floor(canvasHeight / this.WOOD_HEIGHT) - 2;
    const piecesPerRow = Math.floor(canvasWidth / this.WOOD_WIDTH) - 1;
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < piecesPerRow; col++) {
        const woodPiece = this.createWoodPiece(row, col, rows);
        woodPieces.push(woodPiece);
      }
    }
    
    return this.calculateCollapseRisks(woodPieces);
  }
  
  private createWoodPiece(row: number, col: number, totalRows: number): WoodPiece {
    return {
      id: `wood-${row}-${col}`,
      position: {
        x: 50 + col * this.WOOD_WIDTH,
        y: 50 + row * this.WOOD_HEIGHT
      },
      size: {
        width: this.WOOD_WIDTH - 2,
        height: this.WOOD_HEIGHT - 2
      },
      isRemoved: false,
      creature: this.shouldHaveCreature() ? this.getRandomCreature() : undefined,
      collapseRisk: CollapseRisk.NONE
    };
  }
  
  private shouldHaveCreature(): boolean {
    return Math.random() < this.CREATURE_PROBABILITY;
  }
  
  private getRandomCreature(): CreatureType {
    const creatures = Object.values(CreatureType);
    return creatures[Math.floor(Math.random() * creatures.length)];
  }
  
  private calculateCollapseRisks(woodPieces: WoodPiece[]): WoodPiece[] {
    // Implementera logik för att beräkna rasrisk baserat på omgivande ved
    return woodPieces.map(piece => ({
      ...piece,
      collapseRisk: this.calculateRiskForPiece(piece, woodPieces)
    }));
  }
  
  private calculateRiskForPiece(piece: WoodPiece, allPieces: WoodPiece[]): CollapseRisk {
    // Enkla regler för rasrisk - kan utökas senare
    const supportingPieces = this.findSupportingPieces(piece, allPieces);
    
    if (supportingPieces.length === 0) return CollapseRisk.HIGH;
    if (supportingPieces.length === 1) return CollapseRisk.MEDIUM;
    if (supportingPieces.length === 2) return CollapseRisk.LOW;
    return CollapseRisk.NONE;
  }
  
  private findSupportingPieces(piece: WoodPiece, allPieces: WoodPiece[]): WoodPiece[] {
    return allPieces.filter(otherPiece => 
      !otherPiece.isRemoved &&
      otherPiece.id !== piece.id &&
      this.isPieceSupporting(piece, otherPiece)
    );
  }
  
  private isPieceSupporting(piece: WoodPiece, supportPiece: WoodPiece): boolean {
    // Kontrollera om supportPiece stödjer piece (är under och överlappar)
    return supportPiece.position.y > piece.position.y &&
           supportPiece.position.x < piece.position.x + piece.size.width &&
           supportPiece.position.x + supportPiece.size.width > piece.position.x;
  }
}