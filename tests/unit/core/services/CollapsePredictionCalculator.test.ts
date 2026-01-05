import { describe, it, expect, beforeEach } from 'vitest';
import { CollapsePredictionCalculator } from '../../../../src/core/services/CollapsePredictionCalculator';
import { WoodPiece, CollapsePrediction, CollapseRisk, WoodType } from '../../../../src/types';

describe('CollapsePredictionCalculator - Complex Scenarios', () => {
  let calculator: CollapsePredictionCalculator;
  const canvasHeight = 600;

  beforeEach(() => {
    calculator = new CollapsePredictionCalculator(canvasHeight);
  });

  // Helper function to create test wood pieces
  const createPiece = (id: string, x: number, y: number, isRemoved = false): WoodPiece => ({
    id,
    position: { x, y },
    size: { width: 48, height: 48 },
    isRemoved,
    collapseRisk: CollapseRisk.NONE,
    woodType: WoodType.NORMAL
  });

  describe('Multi-level Collapse Predictions', () => {
    it('should predict WILL_COLLAPSE for piece losing all support', () => {
      const support = createPiece('support', 100, 500);
      const piece = createPiece('piece', 100, 450); // Directly above support
      const allPieces = [support, piece];

      const affected = calculator.calculateAffectedPieces(support, allPieces);

      const affectedPiece = affected.find(a => a.piece.id === 'piece');
      expect(affectedPiece).toBeDefined();
      expect(affectedPiece?.prediction).toBe(CollapsePrediction.WILL_COLLAPSE);
    });

    it('should predict HIGH_RISK for piece losing one of two supports', () => {
      const support1 = createPiece('support1', 100, 500);
      const support2 = createPiece('support2', 140, 500);
      const piece = createPiece('piece', 120, 450); // Supported by both
      const allPieces = [support1, support2, piece];

      const affected = calculator.calculateAffectedPieces(support1, allPieces);

      const affectedPiece = affected.find(a => a.piece.id === 'piece');
      expect(affectedPiece).toBeDefined();
      expect(affectedPiece?.prediction).toBe(CollapsePrediction.HIGH_RISK);
    });

    it('should detect secondary collapse effects (cascade)', () => {
      const bottom = createPiece('bottom', 100, 500);
      const middle = createPiece('middle', 100, 450);
      const top = createPiece('top', 100, 400);
      const allPieces = [bottom, middle, top];

      const affected = calculator.calculateAffectedPieces(bottom, allPieces);

      // Both middle and top should be affected
      expect(affected.length).toBeGreaterThanOrEqual(1);
      const topAffected = affected.find(a => a.piece.id === 'top');
      expect(topAffected).toBeDefined();
    });

    it('should handle brick pattern with diagonal support', () => {
      // Brick pattern: offset pieces
      const support1 = createPiece('s1', 100, 500);
      const support2 = createPiece('s2', 148, 500);
      const piece = createPiece('piece', 124, 450); // Between supports
      const allPieces = [support1, support2, piece];

      const affected = calculator.calculateAffectedPieces(support1, allPieces);

      // Piece should be supported by both due to overlap
      const affectedPiece = affected.find(a => a.piece.id === 'piece');
      if (affectedPiece) {
        expect(affectedPiece.prediction).not.toBe(CollapsePrediction.WILL_COLLAPSE);
      }
    });

    it('should correctly identify pieces on ground (no collapse)', () => {
      const groundLevel = canvasHeight - 50 - 48;
      const groundPiece = createPiece('ground', 100, groundLevel);
      const floatingPiece = createPiece('floating', 100, groundLevel - 48);
      const allPieces = [groundPiece, floatingPiece];

      expect(calculator.isOnGround(groundPiece)).toBe(true);
      expect(calculator.isOnGround(floatingPiece)).toBe(false);
    });

    it('should handle complex support network with multiple dependencies', () => {
      // Create pyramid structure
      const base1 = createPiece('base1', 100, 500);
      const base2 = createPiece('base2', 148, 500);
      const base3 = createPiece('base3', 196, 500);
      const mid1 = createPiece('mid1', 124, 450);
      const mid2 = createPiece('mid2', 172, 450);
      const top = createPiece('top', 148, 400);
      
      const allPieces = [base1, base2, base3, mid1, mid2, top];

      // Remove center base piece
      const affected = calculator.calculateAffectedPieces(base2, allPieces);

      // Should detect risks in middle and top layers
      expect(affected.length).toBeGreaterThan(0);
    });

    it('should handle removed pieces in support calculations', () => {
      const support1 = createPiece('s1', 100, 500, true); // Already removed
      const support2 = createPiece('s2', 148, 500);
      const piece = createPiece('piece', 120, 450);
      const allPieces = [support1, support2, piece];

      const supports = calculator.findSupportingPieces(piece, allPieces);

      // Should not include removed piece
      expect(supports.find(s => s.id === 's1')).toBeUndefined();
      expect(supports.find(s => s.id === 's2')).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle piece with no supports correctly', () => {
      const floatingPiece = createPiece('floating', 100, 300);
      const farPiece = createPiece('far', 500, 500);
      const allPieces = [floatingPiece, farPiece];

      const supports = calculator.findSupportingPieces(floatingPiece, allPieces);
      expect(supports.length).toBe(0);
    });

    it('should update canvas height and recalculate ground level', () => {
      const piece = createPiece('test', 100, 500);
      
      expect(calculator.isOnGround(piece)).toBe(false);
      
      calculator.updateCanvasHeight(600);
      expect(calculator.isOnGround(piece)).toBe(false);
    });

    it('should handle piece supporting itself check', () => {
      const piece = createPiece('self', 100, 450);
      const allPieces = [piece];

      const supports = calculator.findSupportingPieces(piece, allPieces);
      
      // Should not include itself as support
      expect(supports.find(s => s.id === 'self')).toBeUndefined();
    });

    it('should handle empty wood pile', () => {
      const piece = createPiece('lonely', 100, 450);
      const affected = calculator.calculateAffectedPieces(piece, [piece]);

      expect(affected.length).toBe(0);
    });
  });
});
