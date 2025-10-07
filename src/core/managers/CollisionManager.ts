import { WoodPiece, GameConfig, CollapseRisk } from '../../types/index.js';
import { WoodPileGenerator } from '../services/WoodPileGenerator.js';

/**
 * Hanterar kollisioner och kollaps av vedstapel
 * Följer Single Responsibility Principle genom att fokusera enbart på fysik och kollisioner
 */
export class CollisionManager {
    private config: GameConfig;
    private woodPileGenerator: WoodPileGenerator;

    // Callbacks för kollaps events
    private onCollapseDetected?: (damage: number, collapsingPieces: WoodPiece[]) => void;

    constructor(config: GameConfig, woodPileGenerator: WoodPileGenerator) {
        this.config = config;
        this.woodPileGenerator = woodPileGenerator;
    }

    /**
     * Hanterar potentiell kollaps när en vedpinne tas bort
     * @param removedPiece Den vedpinne som togs bort
     * @param woodPieces Alla vedpinnar i stapeln
     * @returns Uppdaterad array med vedpinnar (med uppdaterade kollapsrisker)
     */
    public handlePotentialCollapse(removedPiece: WoodPiece, woodPieces: WoodPiece[]): WoodPiece[] {
        // Hitta vilka pinnar som kommer att kollapsa
        const collapsingPieces = this.woodPileGenerator.findCollapsingPieces(
            removedPiece, 
            woodPieces
        );
        
        if (collapsingPieces.length > 0) {
            // Markera som borttagna
            collapsingPieces.forEach(piece => piece.isRemoved = true);
            
            // Beräkna skada baserat på antal rasande pinnar
            const damage = collapsingPieces.length * this.config.collapseDamage;
            
            // Trigga kollaps-event
            this.onCollapseDetected?.(damage, collapsingPieces);
        }
        
        // Uppdatera rasrisker för kvarvarande pinnar
        return this.woodPileGenerator.updateCollapseRisks(woodPieces);
    }

    /**
     * Uppdaterar kollapsrisker för alla vedpinnar
     * @param woodPieces Alla vedpinnar i stapeln
     * @returns Uppdaterad array med vedpinnar
     */
    public updateCollapseRisks(woodPieces: WoodPiece[]): WoodPiece[] {
        return this.woodPileGenerator.updateCollapseRisks(woodPieces);
    }

    /**
     * Kontrollerar om en vedpinne kommer att orsaka kollaps
     * @param piece Vedpinnen att kontrollera
     * @param woodPieces Alla vedpinnar i stapeln
     * @returns True om kollaps kommer att inträffa
     */
    public willCauseCollapse(piece: WoodPiece, woodPieces: WoodPiece[]): boolean {
        const collapsingPieces = this.woodPileGenerator.findCollapsingPieces(piece, woodPieces);
        return collapsingPieces.length > 0;
    }

    /**
     * Hämtar alla pinnar som skulle kollapsa om en specifik pinne tas bort
     * @param piece Vedpinnen att simulera borttagning av
     * @param woodPieces Alla vedpinnar i stapeln
     * @returns Array med pinnar som skulle kollapsa
     */
    public getCollapsingPieces(piece: WoodPiece, woodPieces: WoodPiece[]): WoodPiece[] {
        return this.woodPileGenerator.findCollapsingPieces(piece, woodPieces);
    }

    /**
     * Beräknar potentiell skada för en kollaps
     * @param collapsingPieces Pinnar som kommer att kollapsa
     * @returns Skada som skulle orsakas
     */
    public calculateCollapseDamage(collapsingPieces: WoodPiece[]): number {
        return collapsingPieces.length * this.config.collapseDamage;
    }

    /**
     * Kontrollerar stabiliteten för hela vedstapeln
     * @param woodPieces Alla vedpinnar i stapeln
     * @returns Stabilitetsinformation
     */
    public checkStability(woodPieces: WoodPiece[]): {
        stablePieces: number;
        unstablePieces: number;
        totalPieces: number;
        stabilityPercentage: number;
    } {
        const activePieces = woodPieces.filter(piece => !piece.isRemoved);
        const unstablePieces = activePieces.filter(piece => 
            piece.collapseRisk && piece.collapseRisk !== CollapseRisk.NONE
        );
        
        return {
            stablePieces: activePieces.length - unstablePieces.length,
            unstablePieces: unstablePieces.length,
            totalPieces: activePieces.length,
            stabilityPercentage: activePieces.length > 0 
                ? ((activePieces.length - unstablePieces.length) / activePieces.length) * 100 
                : 100
        };
    }

    /**
     * Callback-setters för att koppla kollaps events till spellogik
     */
    public setOnCollapseDetected(callback: (damage: number, collapsingPieces: WoodPiece[]) => void): void {
        this.onCollapseDetected = callback;
    }

    /**
     * Rensa resurser (för närvarande inga att rensa)
     */
    public destroy(): void {
        // Ingen specifik cleanup behövs för närvarande
    }
}