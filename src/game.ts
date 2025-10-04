import { 
  WoodPiece, 
  GameState, 
  GameConfig, 
  DEFAULT_CONFIG, 
  CreatureType, 
  ActiveCreature,
  KEY_BINDINGS 
} from './types.js';
import { WoodPileGenerator } from './woodPileGenerator.js';
import { GameRenderer } from './gameRenderer.js';
import { I18n } from './i18n.js';

/**
 * Huvudklass för spellogik och state management
 */
export class Game {
  private config: GameConfig;
  private woodPileGenerator: WoodPileGenerator;
  private renderer: GameRenderer;
  private i18n: I18n;
  
  private woodPieces: WoodPiece[] = [];
  private gameState: GameState;
  private hoveredPiece?: WoodPiece;
  private canvas: HTMLCanvasElement;
  
  private animationId?: number;
  private lastUpdateTime = 0;
  
  // Event callbacks
  private onScoreUpdate?: (score: number) => void;
  private onHealthUpdate?: (health: number) => void;
  private onGameOver?: () => void;

  constructor(canvas: HTMLCanvasElement, i18n: I18n, config: GameConfig = DEFAULT_CONFIG) {
    this.canvas = canvas;
    this.config = config;
    this.i18n = i18n;
    
    this.woodPileGenerator = new WoodPileGenerator(config);
    this.renderer = new GameRenderer(canvas, i18n);
    
    this.gameState = this.createInitialGameState();
    
    this.setupEventListeners();
    this.initializeGame();
  }

  /**
   * Skapar initialt speltillstånd
   */
  private createInitialGameState(): GameState {
    return {
      score: 0,
      health: 100,
      isGameOver: false,
      isPaused: false,
      activeCreature: undefined
    };
  }

  /**
   * Initialiserar spelet
   */
  private initializeGame(): void {
    this.woodPieces = this.woodPileGenerator.generateWoodPile();
    this.startGameLoop();
  }

  /**
   * Sätter upp event listeners för användarinteraktion
   */
  private setupEventListeners(): void {
    // Musinteraktion
    this.canvas.addEventListener('click', this.handleCanvasClick.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
    
    // Tangentbordsinput för varelsereaktioner
    document.addEventListener('keydown', this.handleKeyPress.bind(this));
  }

  /**
   * Hanterar musklick på canvas
   */
  private handleCanvasClick(event: MouseEvent): void {
    if (this.gameState.isGameOver) {
      this.restartGame();
      return;
    }
    
    if (this.gameState.isPaused || this.gameState.activeCreature) {
      return;
    }
    
    const clickedPiece = this.getClickedPiece(event);
    if (clickedPiece) {
      this.removeWoodPiece(clickedPiece);
    }
  }

  /**
   * Hanterar musrörelse för hover-effekter
   */
  private handleMouseMove(event: MouseEvent): void {
    if (this.gameState.isGameOver || this.gameState.activeCreature) {
      return;
    }
    
    const hoveredPiece = this.getClickedPiece(event);
    if (hoveredPiece !== this.hoveredPiece) {
      this.hoveredPiece = hoveredPiece;
    }
  }

  /**
   * Hanterar när muspekaren lämnar canvas
   */
  private handleMouseLeave(): void {
    this.hoveredPiece = undefined;
  }

  /**
   * Hanterar tangenttryckningar för varelsereaktioner
   */
  private handleKeyPress(event: KeyboardEvent): void {
    if (!this.gameState.activeCreature) {
      return;
    }
    
    const binding = KEY_BINDINGS.find(b => 
      b.creature === this.gameState.activeCreature!.type &&
      (b.key === event.key || b.keyCode === event.code)
    );
    
    if (binding) {
      this.handleSuccessfulCreatureReaction();
      event.preventDefault();
    }
  }

  /**
   * Hittar vedpinne vid musposition
   */
  private getClickedPiece(event: MouseEvent): WoodPiece | undefined {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Kolla vedpinnar i omvänd ordning (översta först)
    for (let i = this.woodPieces.length - 1; i >= 0; i--) {
      const piece = this.woodPieces[i];
      if (piece.isRemoved) continue;
      
      if (x >= piece.position.x && 
          x <= piece.position.x + piece.size.width &&
          y >= piece.position.y && 
          y <= piece.position.y + piece.size.height) {
        return piece;
      }
    }
    
    return undefined;
  }

  /**
   * Tar bort vedpinne och hanterar konsekvenser
   */
  private removeWoodPiece(piece: WoodPiece): void {
    // Kontrollera om det finns en varelse
    if (piece.creature) {
      this.encounterCreature(piece);
      return;
    }
    
    // Ta bort vedpinnen
    piece.isRemoved = true;
    
    // Lägg till poäng
    this.addScore(this.config.pointsPerWood);
    
    // Kontrollera kollaps
    this.handlePotentialCollapse(piece);
    
    // Uppdatera rasrisker
    this.woodPieces = this.woodPileGenerator.updateCollapseRisks(this.woodPieces);
  }

  /**
   * Hanterar möte med varelse
   */
  private encounterCreature(piece: WoodPiece): void {
    if (!piece.creature) return;
    
    this.gameState.activeCreature = {
      type: piece.creature,
      timeLeft: this.config.reactionTime,
      position: { ...piece.position },
      maxTime: this.config.reactionTime
    };
    
    // Ta bort veden (varelser visas ovanpå)
    piece.isRemoved = true;
  }

  /**
   * Hanterar lyckad reaktion på varelse
   */
  private handleSuccessfulCreatureReaction(): void {
    if (!this.gameState.activeCreature) return;
    
    // Ge poäng för lyckad reaktion
    this.addScore(this.config.pointsPerWood * 2);
    
    // Ta bort aktiv varelse
    this.gameState.activeCreature = undefined;
  }

  /**
   * Hanterar misslyckad reaktion på varelse
   */
  private handleFailedCreatureReaction(): void {
    if (!this.gameState.activeCreature) return;
    
    // Minska hälsa
    this.reduceHealth(this.config.healthPenalty);
    
    // Ta bort aktiv varelse
    this.gameState.activeCreature = undefined;
  }

  /**
   * Hanterar potentiell kollaps av vedstapel
   */
  private handlePotentialCollapse(removedPiece: WoodPiece): void {
    const collapsingPieces = this.woodPileGenerator.findCollapsingPieces(
      removedPiece, 
      this.woodPieces
    );
    
    if (collapsingPieces.length > 0) {
      // Markera som borttagna
      collapsingPieces.forEach(piece => piece.isRemoved = true);
      
      // Minska hälsa baserat på antal rasande pinnar
      const damage = collapsingPieces.length * this.config.collapseDamage;
      this.reduceHealth(damage);
    }
  }

  /**
   * Lägger till poäng
   */
  private addScore(points: number): void {
    this.gameState.score += points;
    this.onScoreUpdate?.(this.gameState.score);
  }

  /**
   * Minskar hälsa
   */
  private reduceHealth(damage: number): void {
    this.gameState.health = Math.max(0, this.gameState.health - damage);
    this.onHealthUpdate?.(this.gameState.health);
    
    if (this.gameState.health <= 0) {
      this.endGame();
    }
  }

  /**
   * Avslutar spelet
   */
  private endGame(): void {
    this.gameState.isGameOver = true;
    this.gameState.activeCreature = undefined;
    this.onGameOver?.();
  }

  /**
   * Startar om spelet
   */
  private restartGame(): void {
    this.gameState = this.createInitialGameState();
    this.woodPieces = this.woodPileGenerator.generateWoodPile();
    this.hoveredPiece = undefined;
    
    // Uppdatera UI
    this.onScoreUpdate?.(0);
    this.onHealthUpdate?.(100);
  }

  /**
   * Huvudspelloop
   */
  private startGameLoop(): void {
    const gameLoop = (currentTime: number) => {
      const deltaTime = currentTime - this.lastUpdateTime;
      this.lastUpdateTime = currentTime;
      
      this.update(deltaTime);
      this.render();
      
      this.animationId = requestAnimationFrame(gameLoop);
    };
    
    this.animationId = requestAnimationFrame(gameLoop);
  }

  /**
   * Uppdaterar spellogik
   */
  private update(deltaTime: number): void {
    if (this.gameState.isGameOver || this.gameState.isPaused) {
      return;
    }
    
    // Uppdatera aktiv varelse
    if (this.gameState.activeCreature) {
      this.gameState.activeCreature.timeLeft -= deltaTime;
      
      if (this.gameState.activeCreature.timeLeft <= 0) {
        this.handleFailedCreatureReaction();
      }
    }
  }

  /**
   * Renderar spelet
   */
  private render(): void {
    this.renderer.render(this.woodPieces, this.gameState, this.hoveredPiece);
  }

  /**
   * Sätter callback för poänguppdateringar
   */
  public onScore(callback: (score: number) => void): void {
    this.onScoreUpdate = callback;
  }

  /**
   * Sätter callback för hälsouppdateringar
   */
  public onHealth(callback: (health: number) => void): void {
    this.onHealthUpdate = callback;
  }

  /**
   * Sätter callback för game over
   */
  public onGameEnd(callback: () => void): void {
    this.onGameOver = callback;
  }

  /**
   * Pausar/återupptar spelet
   */
  public togglePause(): void {
    this.gameState.isPaused = !this.gameState.isPaused;
  }

  /**
   * Stoppar spelet och rensar resurser
   */
  public destroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    // Ta bort event listeners
    this.canvas.removeEventListener('click', this.handleCanvasClick);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('mouseleave', this.handleMouseLeave);
    document.removeEventListener('keydown', this.handleKeyPress);
  }

  /**
   * Hämtar aktuellt speltillstånd
   */
  public getGameState(): GameState {
    return { ...this.gameState };
  }
}