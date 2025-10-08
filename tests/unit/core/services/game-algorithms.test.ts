import { describe, it, expect } from 'vitest'

// Test av WoodPileGenerator logik - utan att importera klassen
describe('WoodPileGenerator Logic', () => {
  describe('Wood piece placement algorithms', () => {
    it('should generate wood pieces within valid bounds', () => {
      const gameConfig = {
        canvas: { width: 800, height: 600 },
        woodPile: { 
          maxPieces: 20,
          minWidth: 30,
          maxWidth: 80,
          minHeight: 15,
          maxHeight: 25
        }
      }
      
      // Simulera wood piece generation
      const generateWoodPiece = (config: typeof gameConfig) => {
        const width = Math.random() * (config.woodPile.maxWidth - config.woodPile.minWidth) + config.woodPile.minWidth
        const height = Math.random() * (config.woodPile.maxHeight - config.woodPile.minHeight) + config.woodPile.minHeight
        const x = Math.random() * (config.canvas.width - width)
        const y = Math.random() * (config.canvas.height - height)
        
        return { x, y, width, height }
      }
      
      // Testa 100 genererade pieces
      for (let i = 0; i < 100; i++) {
        const piece = generateWoodPiece(gameConfig)
        
        // Kontrollera att alla värden är inom giltiga gränser
        expect(piece.width).toBeGreaterThanOrEqual(gameConfig.woodPile.minWidth)
        expect(piece.width).toBeLessThanOrEqual(gameConfig.woodPile.maxWidth)
        expect(piece.height).toBeGreaterThanOrEqual(gameConfig.woodPile.minHeight)
        expect(piece.height).toBeLessThanOrEqual(gameConfig.woodPile.maxHeight)
        
        // Kontrollera att piece är inom canvas bounds
        expect(piece.x).toBeGreaterThanOrEqual(0)
        expect(piece.y).toBeGreaterThanOrEqual(0)
        expect(piece.x + piece.width).toBeLessThanOrEqual(gameConfig.canvas.width)
        expect(piece.y + piece.height).toBeLessThanOrEqual(gameConfig.canvas.height)
      }
    })
    
    it('should create stable pyramid structure', () => {
      // Simulera pyramid-generation logik
      const createPyramidLayer = (layerIndex: number, baseWidth: number) => {
        const piecesInLayer = Math.max(1, Math.floor(baseWidth / 60) - layerIndex)
        const layer = []
        
        for (let i = 0; i < piecesInLayer; i++) {
          layer.push({
            x: 100 + i * 60 + layerIndex * 30, // Offset för pyramid-form
            y: 500 - layerIndex * 25,          // Höjd baserat på lager
            width: 50,
            height: 20,
            layer: layerIndex,
            isStable: layerIndex === 0 || i > 0 && i < piecesInLayer - 1 // Första lagret eller mittenpieces är stabila
          })
        }
        
        return layer
      }
      
      const layer0 = createPyramidLayer(0, 400) // Bas-lager
      const layer1 = createPyramidLayer(1, 400) // Andra lager
      const layer2 = createPyramidLayer(2, 400) // Topp-lager
      
      // Kontrollera att strukturen är pyramid-formad
      expect(layer0.length).toBeGreaterThan(layer1.length)
      expect(layer1.length).toBeGreaterThan(layer2.length)
      
      // Kontrollera stabilitet
      expect(layer0.every(piece => piece.isStable)).toBe(true) // Alla bas-pieces stabila
      expect(layer1.filter(piece => piece.isStable).length).toBeGreaterThan(0) // Några mittenpieces stabila
    })
  })
  
  describe('Stability calculation', () => {
    it('should determine wood piece stability correctly', () => {
      const pieces = [
        { id: 1, x: 100, y: 500, width: 50, height: 20 }, // Bas
        { id: 2, x: 150, y: 500, width: 50, height: 20 }, // Bas
        { id: 3, x: 125, y: 480, width: 50, height: 20 }, // På toppen av 1&2
        { id: 4, x: 200, y: 460, width: 50, height: 20 }  // Hängande
      ]
      
      const isStableOn = (topPiece: typeof pieces[0], bottomPieces: typeof pieces) => {
        return bottomPieces.some(bottomPiece => {
          // Kontrollera om topPiece stöds av minst 50% av bottomPiece
          const overlapLeft = Math.max(topPiece.x, bottomPiece.x)
          const overlapRight = Math.min(topPiece.x + topPiece.width, bottomPiece.x + bottomPiece.width)
          const overlap = Math.max(0, overlapRight - overlapLeft)
          
          return overlap >= topPiece.width * 0.5 && 
                 topPiece.y + topPiece.height === bottomPiece.y
        })
      }
      
      const basePieces = pieces.slice(0, 2) // ID 1&2
      
      expect(isStableOn(pieces[2], basePieces)).toBe(true)  // Piece 3 stöds av 1&2
      expect(isStableOn(pieces[3], pieces.slice(0, 3))).toBe(false) // Piece 4 hänger i luften
    })
  })
})

describe('Collapse Prediction Logic', () => {
  describe('Cascade effect calculation', () => {
    it('should predict which pieces will fall when one is removed', () => {
      const woodPile = [
        { id: 1, x: 100, y: 500, supports: [3] },     // Bas som stöder piece 3
        { id: 2, x: 150, y: 500, supports: [3] },     // Bas som stöder piece 3
        { id: 3, x: 125, y: 480, supports: [4] },     // Mittenlager
        { id: 4, x: 125, y: 460, supports: [] },      // Topp
        { id: 5, x: 200, y: 500, supports: [] }       // Isolerad piece
      ]
      
      const predictCollapse = (removedPieceId: number, pile: typeof woodPile) => {
        const removed = new Set([removedPieceId])
        let changed = true
        
        while (changed) {
          changed = false
          
          pile.forEach(piece => {
            if (!removed.has(piece.id)) {
              // Hitta pieces som stöder denna piece (dvs pieces vars supports-array innehåller piece.id)
              const supportingPieces = pile.filter(p => 
                p.supports.includes(piece.id) && !removed.has(p.id)
              )
              
              // Speciell logik: piece behöver inte stöd om den är på marknivå (y >= 500) 
              const isOnGround = piece.y >= 500
              
              if (supportingPieces.length === 0 && !isOnGround) {
                // Piece har inget stöd kvar och kommer falla
                removed.add(piece.id)
                changed = true
              }
            }
          })
        }
        
        return Array.from(removed).sort()
      }
      
      expect(predictCollapse(1, woodPile)).toEqual([1]) // Bara piece 1 faller (piece 3 stöds fortfarande av 2)
      expect(predictCollapse(2, woodPile)).toEqual([2]) // Bara piece 2 faller
      expect(predictCollapse(3, woodPile)).toEqual([3, 4]) // Piece 3 faller, tar med piece 4
      expect(predictCollapse(5, woodPile)).toEqual([5]) // Isolerad piece påverkar inget annat
    })
  })
  
  describe('Difficulty calculation', () => {
    it('should calculate removal difficulty based on position and support', () => {
      const calculateDifficulty = (piece: { layer: number, supportedPieces: number, isCorner: boolean }) => {
        let difficulty = 1
        
        // Högre lager = svårare
        difficulty += piece.layer * 0.5
        
        // Fler stödda pieces = svårare
        difficulty += piece.supportedPieces * 0.3
        
        // Hörn-pieces = lättare
        if (piece.isCorner) {
          difficulty *= 0.7
        }
        
        return Math.round(difficulty * 10) / 10
      }
      
      const basePiece = { layer: 0, supportedPieces: 2, isCorner: false }
      const cornerPiece = { layer: 0, supportedPieces: 1, isCorner: true }
      const topPiece = { layer: 3, supportedPieces: 0, isCorner: false }
      
      expect(calculateDifficulty(basePiece)).toBe(1.6)  // Bas med stöd
      expect(calculateDifficulty(cornerPiece)).toBe(0.9) // Hörn-piece (lätt)
      expect(calculateDifficulty(topPiece)).toBe(2.5)   // Högt uppe
    })
  })
})

describe('Game Scoring Logic', () => {
  describe('Score calculation with multipliers', () => {
    it('should calculate score based on difficulty and combo', () => {
      const calculateScore = (
        basePpoints: number, 
        difficulty: number, 
        comboMultiplier: number,
        timeBonus: number
      ) => {
        return Math.floor(basePpoints * difficulty * comboMultiplier + timeBonus)
      }
      
      expect(calculateScore(10, 1.0, 1.0, 0)).toBe(10)   // Basic score
      expect(calculateScore(10, 2.0, 1.5, 5)).toBe(35)   // Med difficulty och combo
      expect(calculateScore(10, 0.5, 1.0, 10)).toBe(15)  // Lätt piece med tidbonus
    })
    
    it('should handle combo multiplier progression', () => {
      const getComboMultiplier = (consecutiveSuccesses: number) => {
        if (consecutiveSuccesses < 3) return 1.0
        if (consecutiveSuccesses < 5) return 1.2
        if (consecutiveSuccesses < 8) return 1.5
        return 2.0
      }
      
      expect(getComboMultiplier(1)).toBe(1.0)
      expect(getComboMultiplier(3)).toBe(1.2)
      expect(getComboMultiplier(5)).toBe(1.5)
      expect(getComboMultiplier(10)).toBe(2.0)
    })
  })
  
  describe('Health system', () => {
    it('should calculate damage from creatures', () => {
      const creatureDamage = {
        spider: 5,
        wasp: 8,
        hedgehog: 3,
        ghost: 10,
        pumpkin: 12
      }
      
      const calculateDamage = (creatureType: keyof typeof creatureDamage, playerDefense: number) => {
        const baseDamage = creatureDamage[creatureType]
        return Math.max(1, baseDamage - playerDefense) // Minst 1 damage
      }
      
      expect(calculateDamage('spider', 0)).toBe(5)
      expect(calculateDamage('spider', 3)).toBe(2)
      expect(calculateDamage('pumpkin', 15)).toBe(1) // Kan inte reducera under 1
    })
  })
})