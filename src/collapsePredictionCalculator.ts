import { 
  WoodPiece, 
  AffectedPiece, 
  CollapsePrediction,
  DEFAULT_CONFIG
} from './types.js';

/**
 * Beräknar kollapsrisker och påverkade pinnar i vedstapeln
 */
export class CollapsePredictionCalculator {
  private canvasHeight: number;

  constructor(canvasHeight: number) {
    this.canvasHeight = canvasHeight;
  }

  /**
   * Beräknar vilka pinnar som påverkas om given pinne tas bort
   */
  calculateAffectedPieces(hoveredPiece: WoodPiece, allPieces: WoodPiece[]): AffectedPiece[] {
    const affectedPieces: AffectedPiece[] = [];
    
    // Hitta pinnar som direkt stöds av den hovrade pinnen
    const directlySupported = allPieces.filter(piece => 
      !piece.isRemoved && 
      piece.id !== hoveredPiece.id &&
      this.isPieceSupporting(piece, hoveredPiece)
    );
    
    // Analysera påverkan för varje direkt stödd pinne
    for (const piece of directlySupported) {
      // Beräkna hur många stöd denna pinne har totalt
      const allSupports = this.findSupportingPieces(piece, allPieces);
      const remainingSupports = allSupports.filter(support => support.id !== hoveredPiece.id);
      
      let impact: CollapsePrediction;
      
      if (remainingSupports.length === 0 && !this.isOnGround(piece)) {
        impact = CollapsePrediction.WILL_COLLAPSE;
      } else if (remainingSupports.length === 1 && !this.isOnGround(piece)) {
        impact = CollapsePrediction.HIGH_RISK;
      } else if (remainingSupports.length === 2) {
        impact = CollapsePrediction.MEDIUM_RISK;
      } else if (allSupports.length > remainingSupports.length) {
        impact = CollapsePrediction.LOW_RISK;
      } else {
        continue; // Ingen påverkan
      }
      
      affectedPieces.push({
        piece,
        prediction: impact
      });
    }
    
    // Hitta sekundära effekter (pinnar som stöds av de direkt påverkade)
    const secondaryAffected = this.findSecondaryEffects(directlySupported, allPieces, hoveredPiece);
    affectedPieces.push(...secondaryAffected);
    
    return affectedPieces;
  }

  /**
   * Hitta sekundära effekter från pinnar som kan komma att rasa
   */
  private findSecondaryEffects(primaryAffected: WoodPiece[], allPieces: WoodPiece[], excludePiece: WoodPiece): AffectedPiece[] {
    const secondaryEffects: AffectedPiece[] = [];
    
    // Bara kontrollera pinnar som kommer att rasa helt
    const willCollapse = primaryAffected.filter(piece => {
      const supports = this.findSupportingPieces(piece, allPieces)
        .filter(support => support.id !== excludePiece.id);
      return supports.length === 0 && !this.isOnGround(piece);
    });
    
    for (const collapsingPiece of willCollapse) {
      // Hitta pinnar som stöds av denna rasande pinne
      const supportedByCollapsing = allPieces.filter(piece =>
        !piece.isRemoved &&
        piece.id !== excludePiece.id &&
        piece.id !== collapsingPiece.id &&
        this.isPieceSupporting(piece, collapsingPiece)
      );
      
      for (const affectedPiece of supportedByCollapsing) {
        const remainingSupports = this.findSupportingPieces(affectedPiece, allPieces)
          .filter(support => support.id !== excludePiece.id && support.id !== collapsingPiece.id);
        
        if (remainingSupports.length === 0 && !this.isOnGround(affectedPiece)) {
          secondaryEffects.push({
            piece: affectedPiece,
            prediction: CollapsePrediction.WILL_COLLAPSE
          });
        } else if (remainingSupports.length === 1) {
          secondaryEffects.push({
            piece: affectedPiece,
            prediction: CollapsePrediction.HIGH_RISK
          });
        }
      }
    }
    
    return secondaryEffects;
  }

  /**
   * Hitta alla pinnar som stödjer given pinne
   */
  findSupportingPieces(piece: WoodPiece, allPieces: WoodPiece[]): WoodPiece[] {
    return allPieces.filter(otherPiece =>
      !otherPiece.isRemoved &&
      otherPiece.id !== piece.id &&
      this.isPieceSupporting(piece, otherPiece)
    );
  }

  /**
   * Kontrollerar om en vedpinne stödjer en annan (för runda pinnar i brick pattern)
   */
  isPieceSupporting(piece: WoodPiece, supportPiece: WoodPiece): boolean {
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
    
    // Kontrollera vertikal närhet (direkt under) - använd config-värdet
    const verticalDistance = supportPiece.position.y - (piece.position.y + piece.size.height);
    const isDirectlyBelow = verticalDistance <= DEFAULT_CONFIG.woodHeight * 0.5;
    
    return isBelow && hasOverlap && isDirectlyBelow;
  }

  /**
   * Kontrollerar om en pinne vilar på marken
   */
  isOnGround(piece: WoodPiece): boolean {
    // Använd samma grundnivå som generatorn
    const groundLevel = this.canvasHeight - 50;
    return piece.position.y + piece.size.height >= groundLevel;
  }

  /**
   * Uppdatera canvas-höjd om den ändras
   */
  updateCanvasHeight(newHeight: number): void {
    this.canvasHeight = newHeight;
  }
}