import { 
  WoodPiece, 
  GameState, 
  GameConfig
} from '../../types/index.js';
import { DEFAULT_CONFIG } from '../../shared/constants/index.js';
import { WoodPileGenerator } from '../services/WoodPileGenerator.js';
import { GameRenderer } from '../../presentation/renderers/game/GameRenderer.js';
import { I18n } from '../../infrastructure/i18n/I18n.js';
import { GameInputHandler } from '../../infrastructure/input/GameInputHandler.js';
import { CreatureManager } from '../managers/CreatureManager.js';
import { CollisionManager } from '../managers/CollisionManager.js';
import { GameStateManager } from '../managers/GameStateManager.js';
import { GameLoop } from './GameLoop.js';

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
  private collisionManager: CollisionManager;
  private stateManager: GameStateManager;
  private gameLoop: GameLoop;
  
  private woodPieces: WoodPiece[] = [];
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement, i18n: I18n, config: GameConfig = DEFAULT_CONFIG) {
    this.canvas = canvas;
    this.config = config;
    this.i18n = i18n;
    
    this.woodPileGenerator = new WoodPileGenerator(config);
    this.renderer = new GameRenderer(canvas, i18n);
    
    // Skapa state manager först
    this.stateManager = new GameStateManager(config);
    
    // Skapa GameLoop manager
    this.gameLoop = new GameLoop();
    
    // Skapa managers med state-referens
    this.inputHandler = new GameInputHandler(canvas, this.woodPieces, this.stateManager.getGameStateReference());
    this.creatureManager = new CreatureManager(config, this.stateManager.getGameStateReference());
    this.collisionManager = new CollisionManager(config, this.woodPileGenerator);
    
    // Sätt upp callbacks
    this.setupInputCallbacks();
    this.setupCreatureCallbacks();
    this.setupCollisionCallbacks();
    this.setupStateCallbacks();
    this.setupGameLoopCallbacks();
    
    this.initializeGame();
  }

  /**
   * Initialiserar spelet
   */
  private initializeGame(): void {
    this.woodPieces = this.woodPileGenerator.generateWoodPile();
    this.gameLoop.start();
  }

  /**
   * Sätter upp callbacks för input handler
   */
  private setupInputCallbacks(): void {
    this.inputHandler.setOnWoodPieceClick((piece: WoodPiece) => this.removeWoodPiece(piece));
    this.inputHandler.setOnSuccessfulCreatureReaction(() => this.creatureManager.handleSuccessfulReaction());
    this.inputHandler.setOnGameRestart(() => this.restartGame());
  }

  /**
   * Sätter upp callbacks för creature manager
   */
  private setupCreatureCallbacks(): void {
    this.creatureManager.setOnScoreUpdate((points) => this.stateManager.addScore(points));
    this.creatureManager.setOnHealthUpdate((damage) => this.stateManager.reduceHealth(damage));
  }

  /**
   * Sätter upp callbacks för collision manager
   */
  private setupCollisionCallbacks(): void {
    this.collisionManager.setOnCollapseDetected((damage, collapsingPieces) => {
      this.stateManager.reduceHealth(damage);
      // Eventuellt logga kollaps-information för debugging
      console.log(`Kollaps! ${collapsingPieces.length} pinnar rasade, ${damage} skada`);
    });
  }

  /**
   * Sätter upp callbacks för state manager
   */
  private setupStateCallbacks(): void {
    // StateManager hanterar nu alla UI-callbacks direkt
    // Inga callbacks behöver sättas upp här för närvarande
  }

  /**
   * Sätter upp callbacks för game loop manager
   */
  private setupGameLoopCallbacks(): void {
    this.gameLoop.setOnUpdate((deltaTime) => this.update(deltaTime));
    this.gameLoop.setOnRender(() => this.render());
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
    
    // Lägg till poäng via state manager
    this.stateManager.addScore(this.config.pointsPerWood);
    
    // Hantera kollaps och uppdatera rasrisker
    this.woodPieces = this.collisionManager.handlePotentialCollapse(piece, this.woodPieces);
  }

  /**
   * Startar om spelet
   */
  private restartGame(): void {
    this.stateManager.restartGame();
    this.woodPieces = this.woodPileGenerator.generateWoodPile();
    this.creatureManager.clearActiveCreature();
  }

  /**
   * Uppdaterar spellogik
   */
  private update(deltaTime: number): void {
    if (!this.stateManager.canContinueGame()) {
      return;
    }
    
    // Uppdatera managers med aktuell state
    const currentState = this.stateManager.getGameStateReference();
    this.inputHandler.updateReferences(this.woodPieces, currentState);
    this.creatureManager.updateGameState(currentState);
    
    // Uppdatera aktiv varelse
    this.creatureManager.updateActiveCreature(deltaTime);
  }

  /**
   * Renderar spelet
   */
  private render(): void {
    const currentHoveredPiece = this.inputHandler.getCurrentHoveredPiece();
    const currentState = this.stateManager.getGameStateReference();
    this.renderer.render(this.woodPieces, currentState, currentHoveredPiece);
  }

  /**
   * Sätter callback för poänguppdateringar
   */
  public onScore(callback: (score: number) => void): void {
    this.stateManager.setOnScoreUpdate(callback);
  }

  /**
   * Sätter callback för hälsouppdateringar
   */
  public onHealth(callback: (health: number) => void): void {
    this.stateManager.setOnHealthUpdate(callback);
  }

  /**
   * Sätter callback för game over
   */
  public onGameEnd(callback: () => void): void {
    this.stateManager.setOnGameOver(callback);
  }

  /**
   * Pausar/återupptar spelet
   */
  public togglePause(): void {
    this.stateManager.togglePause();
    
    // Synkronisera GameLoop med pause state
    if (this.stateManager.getGameState().isPaused) {
      this.gameLoop.pause();
    } else {
      this.gameLoop.resume();
    }
  }

  /**
   * Stoppar spelet och rensar resurser
   */
  public destroy(): void {
    this.gameLoop.destroy();
    
    // Rensa managers
    this.inputHandler.destroy();
    this.creatureManager.destroy();
    this.collisionManager.destroy();
    this.stateManager.destroy();
  }

  /**
   * Hämtar aktuellt speltillstånd
   */
  public getGameState(): GameState {
    return this.stateManager.getGameState();
  }
}