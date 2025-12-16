import { 
  WoodPiece, 
  GameState, 
  GameConfig,
  DifficultyLevel,
  WoodType,
  WOOD_TYPE_CONFIG
} from '../../types/index.js';
import { DEFAULT_CONFIG } from '../../shared/constants/index.js';
import { visualSettings } from '../../shared/VisualSettings.js';
import { WoodPileGenerator } from '../services/WoodPileGenerator.js';
import { GameRenderer } from '../../presentation/renderers/game/GameRenderer.js';
import { WoodCollapseAnimator } from '../../presentation/renderers/WoodCollapseAnimator.js';
import { ScreenShakeManager } from '../../presentation/renderers/ScreenShakeManager.js';
import { CollapseParticleSystem } from '../../particles/CollapseParticleSystem.js';
import { I18n } from '../../infrastructure/i18n/I18n.js';
import { GameInputHandler } from '../../infrastructure/input/GameInputHandler.js';
import { CreatureManager } from '../managers/CreatureManager.js';
import { CollisionManager } from '../managers/CollisionManager.js';
import { GameStateManager } from '../managers/GameStateManager.js';
import { LevelManager } from '../managers/LevelManager.js';
import { GameLoop } from './GameLoop.js';

/**
 * Huvudklass för spellogik och state management
 */
export class Game {
  private config: GameConfig;
  private woodPileGenerator: WoodPileGenerator;
  private renderer: GameRenderer;
  private collapseAnimator: WoodCollapseAnimator;
  private particleSystem: CollapseParticleSystem;
  private screenShake: ScreenShakeManager;
  private i18n: I18n;
  private inputHandler: GameInputHandler;
  private creatureManager: CreatureManager;
  private collisionManager: CollisionManager;
  private stateManager: GameStateManager;
  private levelManager: LevelManager;
  private gameLoop: GameLoop;
  
  private woodPieces: WoodPiece[] = [];
  private canvas: HTMLCanvasElement;
  private onLevelComplete?: (levelData: any) => void;

  constructor(
    canvas: HTMLCanvasElement, 
    i18n: I18n, 
    config: GameConfig = DEFAULT_CONFIG,
    difficulty: DifficultyLevel = DifficultyLevel.NORMAL,
    startingLevel: number = 1
  ) {
    this.canvas = canvas;
    this.i18n = i18n;
    
    // Skapa LevelManager först
    this.levelManager = new LevelManager(difficulty, startingLevel);
    
    // Applicera difficulty modifiers på config
    this.config = this.levelManager.applyDifficultyToConfig(config);
    
    this.woodPileGenerator = new WoodPileGenerator(this.config);
    this.renderer = new GameRenderer(canvas, i18n);
    this.collapseAnimator = new WoodCollapseAnimator();
    this.particleSystem = new CollapseParticleSystem();
    this.screenShake = new ScreenShakeManager();
    
    // Skapa state manager med level-aware starting health
    const startingHealth = this.levelManager.getStartingHealth();
    this.stateManager = new GameStateManager({ ...config, healthPenalty: startingHealth });
    
    // Skapa GameLoop manager
    this.gameLoop = new GameLoop();
    
    // Skapa managers med state-referens
    this.inputHandler = new GameInputHandler(canvas, this.woodPieces, this.stateManager.getGameStateReference());
    this.creatureManager = new CreatureManager(this.config, this.stateManager.getGameStateReference());
    this.collisionManager = new CollisionManager(this.config, this.woodPileGenerator);
    
    // Sätt upp callbacks
    this.setupInputCallbacks();
    this.setupCreatureCallbacks();
    this.setupCollisionCallbacks();
    this.setupStateCallbacks();
    this.setupGameLoopCallbacks();
    this.setupLevelCallbacks();
    
    this.initializeGame();
  }

  /**
   * Initialiserar spelet
   */
  private initializeGame(): void {
    // Generera vedstapel baserat på current level info
    const levelInfo = this.levelManager.getCurrentLevelInfo();
    this.woodPieces = this.woodPileGenerator.generateWoodPile();
    
    // Starta level tracking
    this.levelManager.startLevel();
    
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
      
      // Starta kollaps-animationer för de rasande pinnarna (om animationer är aktiverade)
      if (visualSettings.areAnimationsEnabled()) {
        this.collapseAnimator.startCollapse(collapsingPieces);
        
        // Starta screen shake baserat på antal rasande pinnar
        this.screenShake.startShake(collapsingPieces.length);
      }
      
      // Skapa partiklar för varje rasande pinne (om partiklar är aktiverade)
      if (visualSettings.areParticlesEnabled()) {
        collapsingPieces.forEach(piece => {
          const centerX = piece.position.x + piece.size.width / 2;
          const centerY = piece.position.y + piece.size.height / 2;
          this.particleSystem.createCollapseParticles(centerX, centerY, collapsingPieces.length);
        });
      }
      
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
   * Sätter upp callbacks för level manager
   */
  private setupLevelCallbacks(): void {
    this.levelManager.on('LEVEL_COMPLETE', (event) => {
      console.log('Level complete!', event);
      
      // Pausa spelet
      this.gameLoop.pause();
      
      // Notifiera main.ts via callback
      if (this.onLevelComplete) {
        this.onLevelComplete(event.data);
      }
    });
    
    this.levelManager.on('LEVEL_START', (event) => {
      console.log('Level started:', event);
    });
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
    
    // Hämta wood type config
    const woodType = (piece.woodType as WoodType) || WoodType.NORMAL;
    const typeConfig = WOOD_TYPE_CONFIG[woodType];
    
    // Ta bort vedpinnen
    piece.isRemoved = true;
    
    // Lägg till poäng med wood type multiplier
    const basePoints = this.config.pointsPerWood;
    const pointsWithDifficulty = this.levelManager.calculateScoreWithDifficulty(basePoints);
    const finalPoints = Math.floor(pointsWithDifficulty * typeConfig.scoreMultiplier);
    this.stateManager.addScore(finalPoints);
    
    // Applicera health effect (om någon)
    if (typeConfig.healthEffect !== 0) {
      if (typeConfig.healthEffect > 0) {
        // Bonus wood - öka hälsa (använd negativ damage)
        this.stateManager.reduceHealth(-typeConfig.healthEffect);
      } else {
        // Cursed wood - ta skada
        this.stateManager.reduceHealth(Math.abs(typeConfig.healthEffect));
      }
    }
    
    // Registrera ved-plockning med level manager
    this.levelManager.onWoodCollected(finalPoints);
    
    // Hantera kollaps med wood type multiplier
    this.woodPieces = this.collisionManager.handlePotentialCollapse(
      piece, 
      this.woodPieces,
      typeConfig.collapseRiskMultiplier
    );
    
    // Kontrollera om nivån är klar
    if (this.levelManager.isLevelComplete()) {
      this.handleLevelComplete();
    }
  }

  /**
   * Startar om spelet
   */
  private restartGame(): void {
    this.stateManager.restartGame();
    this.levelManager.reset();
    this.woodPieces = this.woodPileGenerator.generateWoodPile();
    this.creatureManager.clearActiveCreature();
    this.levelManager.startLevel();
  }

  /**
   * Hanterar level complete
   */
  private handleLevelComplete(): void {
    const result = this.levelManager.completeLevel();
    console.log('Level completed!', result);
    
    // Level complete-eventet triggas automatiskt via levelManager callback
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
    
    // Uppdatera kollaps-animationer och partiklar
    this.collapseAnimator.update(deltaTime);
    this.particleSystem.update(deltaTime);
  }

  /**
   * Renderar spelet
   */
  private render(): void {
    const currentHoveredPiece = this.inputHandler.getCurrentHoveredPiece();
    const currentState = this.stateManager.getGameStateReference();
    const ctx = this.canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Spara canvas state
    ctx.save();
    
    // Applicera screen shake om aktiv och animationer aktiverade
    if (visualSettings.areAnimationsEnabled() && this.screenShake.isActive()) {
      this.screenShake.applyShake(ctx);
    }
    
    // Rendera normal spel-state
    this.renderer.render(this.woodPieces, currentState, currentHoveredPiece);
    
    // Rendera kollapsande pinnar och partiklar ovanpå (om aktiverade)
    if (visualSettings.areAnimationsEnabled()) {
      // Rita kollapsande pinnar
      this.woodPieces
        .filter(piece => piece.isCollapsing)
        .forEach(piece => this.collapseAnimator.render(ctx, piece));
    }
    
    // Rita partiklar om aktiverade
    if (visualSettings.areParticlesEnabled()) {
      this.particleSystem.render(ctx);
    }
    
    // Återställ canvas state
    ctx.restore();
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
    this.collapseAnimator.destroy();
    this.particleSystem.destroy();
    this.screenShake.destroy();
  }

  /**
   * Hämtar aktuellt speltillstånd
   */
  public getGameState(): GameState {
    return this.stateManager.getGameState();
  }

  /**
   * Hämtar level manager för level information
   */
  public getLevelManager(): LevelManager {
    return this.levelManager;
  }

  /**
   * Hämtar level progress information
   */
  public getLevelProgress(): { woodRemaining: number; totalWood: number; progress: number } {
    const totalWood = this.levelManager.getCurrentLevelInfo().woodPieceCount;
    const woodRemaining = this.woodPieces.length;
    const progress = totalWood > 0 ? (totalWood - woodRemaining) / totalWood : 0;
    
    return { woodRemaining, totalWood, progress };
  }

  /**
   * Sätter callback för level complete
   */
  public setOnLevelComplete(callback: (levelData: any) => void): void {
    this.onLevelComplete = callback;
  }

  /**
   * Startar nästa nivå
   */
  public startNextLevel(): void {
    if (this.levelManager.hasNextLevel()) {
      // Generera ny vedstapel för nästa nivå
      const levelInfo = this.levelManager.getCurrentLevelInfo();
      this.woodPieces = this.woodPileGenerator.generateWoodPile();
      
      // Starta level tracking
      this.levelManager.startLevel();
      
      // Återuppta game loop
      this.gameLoop.resume();
      
      console.log(`Starting level ${levelInfo.levelNumber}`);
    }
  }
}