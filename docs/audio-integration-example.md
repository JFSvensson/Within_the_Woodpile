/**
 * Exempel på hur AudioManager kan integreras i Game-klassen
 * 
 * Lägg till dessa ändringar i src/core/game/Game.ts
 */

// I imports:
import { AudioManager, SoundEvent } from '../../infrastructure/audio/index.js';

// I Game-klassen, lägg till som privat member:
private audioManager?: AudioManager;

// I konstruktorn, lägg till parameter:
constructor(
    canvas: HTMLCanvasElement, 
    i18n: I18n, 
    config: GameConfig = DEFAULT_CONFIG,
    audioManager?: AudioManager  // Ny parameter
) {
    // ... befintlig kod ...
    this.audioManager = audioManager;
}

// I removeWoodPiece metoden:
private removeWoodPiece(piece: WoodPiece): void {
    // Kontrollera om det finns en varelse
    if (piece.creature) {
        this.audioManager?.playCreatureAppear();
        this.encounterCreature(piece);
        return;
    }
    
    // Ta bort vedpinnen
    piece.isRemoved = true;
    
    // Spela pickup-ljud
    this.audioManager?.playWoodPickup();
    
    // Lägg till poäng
    this.addScore(this.config.pointsPerWood);
    
    // Kontrollera kollaps
    this.handlePotentialCollapse(piece);
    
    // Uppdatera rasrisker
    this.woodPieces = this.woodPileGenerator.updateCollapseRisks(this.woodPieces);
}

// I handlePotentialCollapse metoden:
private handlePotentialCollapse(removedPiece: WoodPiece): void {
    const collapsingPieces = this.woodPileGenerator.findCollapsingPieces(
        removedPiece, 
        this.woodPieces
    );
    
    if (collapsingPieces.length > 0) {
        // Spela kollaps-ljud
        this.audioManager?.playWoodCollapse();
        
        // Markera som borttagna
        collapsingPieces.forEach(piece => piece.isRemoved = true);
        
        // Minska hälsa baserat på antal rasande pinnar
        const damage = collapsingPieces.length * this.config.collapseDamage;
        this.reduceHealth(damage);
    }
}

// I handleSuccessfulCreatureReaction metoden:
private handleSuccessfulCreatureReaction(): void {
    if (!this.gameState.activeCreature) return;
    
    // Spela success-ljud
    this.audioManager?.playCreatureSuccess();
    
    // Ge poäng för lyckad reaktion
    this.addScore(this.config.pointsPerWood * 2);
    
    // Ta bort aktiv varelse
    this.gameState.activeCreature = undefined;
}

// I handleFailedCreatureReaction metoden:
private handleFailedCreatureReaction(): void {
    if (!this.gameState.activeCreature) return;
    
    // Spela fail-ljud
    this.audioManager?.playCreatureFail();
    
    // Minska hälsa
    this.reduceHealth(this.config.healthPenalty);
    
    // Ta bort aktiv varelse
    this.gameState.activeCreature = undefined;
}

// I reduceHealth metoden:
private reduceHealth(damage: number): void {
    this.gameState.health = Math.max(0, this.gameState.health - damage);
    this.onHealthUpdate?.(this.gameState.health);
    
    // Spela varning om hälsa blir låg
    if (this.gameState.health <= 25 && this.gameState.health > 0) {
        this.audioManager?.playSound(SoundEvent.HEALTH_LOW);
    }
    
    if (this.gameState.health <= 0) {
        this.endGame();
    }
}

// I endGame metoden:
private endGame(): void {
    this.gameState.isGameOver = true;
    this.gameState.activeCreature = undefined;
    
    // Spela game over-musik
    this.audioManager?.playBackgroundMusic(SoundEvent.GAME_OVER_MUSIC);
    
    this.onGameOver?.();
}

// Lägg också till en metod för att sätta audioManager efter konstruktion:
public setAudioManager(audioManager: AudioManager): void {
    this.audioManager = audioManager;
}

/**
 * Sedan i main.ts, uppdatera startGameFromMenu funktionen:
 */
async function startGameFromMenu(): Promise<void> {
    try {
        audioManager?.playUIClick();
        
        // ... befintlig kod för övergång ...
        
        // Skapa nytt spelobjekt med audioManager
        game = new Game(canvas, i18n, DEFAULT_CONFIG, audioManager);
        
        // ... resten av koden ...
    } catch (error) {
        // ... error handling ...
    }
}