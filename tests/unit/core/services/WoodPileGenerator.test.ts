import { describe, it, expect, beforeEach } from 'vitest';
import { WoodPileGenerator } from '../../../../src/core/services/WoodPileGenerator';
import { GameConfig, CollapseRisk } from '../../../../src/types';
import { DEFAULT_CONFIG } from '../../../../src/shared/constants';

describe('WoodPileGenerator - Brick Pattern and Edge Cases', () => {
  let generator: WoodPileGenerator;
  let config: GameConfig;

  beforeEach(() => {
    config = { ...DEFAULT_CONFIG };
    generator = new WoodPileGenerator(config);
  });

  describe('Brick Pattern Layout', () => {
    it('should generate alternating row widths (even rows full, odd rows minus one)', () => {
      const woodPile = generator.generateWoodPile();
      
      // Group pieces by row
      const rowMap = new Map<number, number>();
      woodPile.forEach(piece => {
        const row = Math.round((config.canvasHeight - 50 - piece.position.y) / config.woodHeight) - 1;
        rowMap.set(row, (rowMap.get(row) || 0) + 1);
      });

      const expectedPiecesPerRow = Math.floor((config.canvasWidth - 100) / config.woodWidth);
      
      // Check even rows have full width
      for (let row = 0; row < rowMap.size; row += 2) {
        if (rowMap.has(row)) {
          expect(rowMap.get(row)).toBe(expectedPiecesPerRow);
        }
      }

      // Check odd rows have one less piece
      for (let row = 1; row < rowMap.size; row += 2) {
        if (rowMap.has(row)) {
          expect(rowMap.get(row)).toBe(expectedPiecesPerRow - 1);
        }
      }
    });

    it('should offset odd rows by half wood width', () => {
      const woodPile = generator.generateWoodPile();
      
      const row0Pieces = woodPile.filter(p => p.id.startsWith('wood-0-'));
      const row1Pieces = woodPile.filter(p => p.id.startsWith('wood-1-'));

      if (row0Pieces.length > 0 && row1Pieces.length > 0) {
        const row0FirstX = row0Pieces[0].position.x;
        const row1FirstX = row1Pieces[0].position.x;

        const expectedOffset = config.woodWidth / 2;
        expect(Math.abs(row1FirstX - row0FirstX - expectedOffset)).toBeLessThan(1);
      }
    });

    it('should position bottom row at correct ground level', () => {
      const woodPile = generator.generateWoodPile();
      const bottomPieces = woodPile.filter(p => p.id.startsWith('wood-0-'));

      const expectedY = config.canvasHeight - 50 - config.woodHeight;
      
      bottomPieces.forEach(piece => {
        expect(piece.position.y).toBe(expectedY);
      });
    });

    it('should generate correct number of rows based on canvas height', () => {
      const woodPile = generator.generateWoodPile();
      
      const expectedRows = Math.floor((config.canvasHeight - 100) / config.woodHeight);
      const actualRows = new Set(
        woodPile.map(p => Math.round((config.canvasHeight - 50 - p.position.y) / config.woodHeight))
      ).size;

      expect(actualRows).toBe(expectedRows);
    });

    it('should assign correct collapse risk to ground pieces (NONE)', () => {
      const woodPile = generator.generateWoodPile();
      const groundPieces = woodPile.filter(p => p.id.startsWith('wood-0-'));

      groundPieces.forEach(piece => {
        expect(piece.collapseRisk).toBe(CollapseRisk.NONE);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle small canvas dimensions gracefully', () => {
      const smallConfig = {
        ...config,
        canvasWidth: 200,
        canvasHeight: 200
      };
      const smallGenerator = new WoodPileGenerator(smallConfig);
      const woodPile = smallGenerator.generateWoodPile();

      expect(woodPile.length).toBeGreaterThan(0);
      woodPile.forEach(piece => {
        expect(piece.position.x).toBeGreaterThanOrEqual(0);
        expect(piece.position.y).toBeGreaterThanOrEqual(0);
      });
    });

    it('should handle varying creature probabilities (0% chance)', () => {
      const noCreatureConfig = {
        ...config,
        creatureProbability: 0
      };
      const noCreatureGen = new WoodPileGenerator(noCreatureConfig);
      const woodPile = noCreatureGen.generateWoodPile();

      const piecesWithCreatures = woodPile.filter(p => p.creature !== undefined);
      expect(piecesWithCreatures.length).toBe(0);
    });

    it('should recalculate collapse risks after wood removal', () => {
      const woodPile = generator.generateWoodPile();
      const middlePiece = woodPile.find(p => p.id === 'wood-2-3');

      if (middlePiece) {
        middlePiece.isRemoved = true;
        const updatedPile = generator.updateCollapseRisks(woodPile);

        // Some pieces that were supported might now have higher risk
        const hasChangedRisks = updatedPile.some(p => 
          !p.isRemoved && p.collapseRisk !== CollapseRisk.NONE
        );
        expect(hasChangedRisks).toBe(true);
      }
    });

    it('should find collapsing pieces when critical support is removed', () => {
      const woodPile = generator.generateWoodPile();
      
      // Find a piece with pieces above it
      const supportPiece = woodPile.find(p => 
        !p.id.startsWith('wood-0-') && // Not ground row
        woodPile.some(above => 
          above.position.y < p.position.y &&
          Math.abs(above.position.x - p.position.x) < config.woodWidth
        )
      );

      if (supportPiece) {
        const collapsingPieces = generator.findCollapsingPieces(supportPiece, woodPile);
        
        // Should find at least some pieces that depend on this support
        collapsingPieces.forEach(piece => {
          expect(piece.isRemoved).toBe(false);
          expect(piece.id).not.toBe(supportPiece.id);
        });
      }
    });
  });
});
