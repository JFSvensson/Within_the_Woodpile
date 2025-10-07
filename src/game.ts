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
import { GameInputHandler } from './game/GameInputHandler.js';
import { CreatureManager } from './game/CreatureManager.js';

/**
 * Huvudklass för spellogik och state management
 */
export class Game {
  private config: GameConfig;
  private woodPileGenerator: WoodPileGenerator;
  private renderer: GameRenderer;
  private i18n: I18n;
  private inputHandler: GameInputHandler;
  private creatureManager: CreatureManager;
  
  private woodPieces: WoodPiece[] = [];
  private gameState: GameState;
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
    
    // Skapa managers
    this.inputHandler = new GameInputHandler(canvas, this.woodPieces, this.gameState);
    this.creatureManager = new CreatureManager(config, this.gameState);
    
    // Sätt upp callbacks
    this.setupInputCallbacks();
    this.setupCreatureCallbacks();
    
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
   * Sätter upp callbacks för input handler
   */
  private setupInputCallbacks(): void {
    this.inputHandler.setOnWoodPieceClick((piece) => this.removeWoodPiece(piece));
    this.inputHandler.setOnSuccessfulCreatureReaction(() => this.creatureManager.handleSuccessfulReaction());
    this.inputHandler.setOnGameRestart(() => this.restartGame());
  }

  /**
   * Sätter upp callbacks för creature manager
   */
  private setupCreatureCallbacks(): void {
    this.creatureManager.setOnScoreUpdate((points) => this.addScore(points));
    this.creatureManager.setOnHealthUpdate((damage) => this.reduceHealth(damage));
  }

  /**
   * Tar bort vedpinne och hanterar konsekvenser
   */
  private removeWoodPiece(piece: WoodPiece): void {
    // Kontrollera om det finns en varelse
    if (this.creatureManager.hasCreature(piece)) {
      this.creatureManager.encounterCreature(piece);
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
    this.creatureManager.clearActiveCreature();
    this.onGameOver?.();
  }

  /**
   * Startar om spelet
   */
  private restartGame(): void {
    this.gameState = this.createInitialGameState();
    this.woodPieces = this.woodPileGenerator.generateWoodPile();
    this.creatureManager.clearActiveCreature();
    
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
    
    // Uppdatera managers med aktuell state
    this.inputHandler.updateReferences(this.woodPieces, this.gameState);
    this.creatureManager.updateGameState(this.gameState);
    
    // Uppdatera aktiv varelse
    this.creatureManager.updateActiveCreature(deltaTime);
  }

  /**
   * Renderar spelet
   */
  private render(): void {
    const currentHoveredPiece = this.inputHandler.getCurrentHoveredPiece();
    this.renderer.render(this.woodPieces, this.gameState, currentHoveredPiece);
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
    
    // Rensa managers
    this.inputHandler.destroy();
    this.creatureManager.destroy();
  }

  /**
   * Hämtar aktuellt speltillstånd
   */
  public getGameState(): GameState {
    return { ...this.gameState };
  }
}