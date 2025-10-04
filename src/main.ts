import { I18n } from './i18n.js';
import { Game } from './game.js';
import { DEFAULT_CONFIG } from './types.js';

// Globala variabler
let game: Game;
let i18n: I18n;

/**
 * Uppdaterar poäng och hälsa på skärmen
 */
function updateGameStats(score?: number, health?: number): void {
    if (score !== undefined) {
        const scoreElement = document.getElementById('score');
        if (scoreElement) scoreElement.textContent = score.toString();
    }
    
    if (health !== undefined) {
        const healthElement = document.getElementById('health');
        if (healthElement) healthElement.textContent = health.toString();
    }
}

/**
 * Hanterar när spelet tar slut
 */
function handleGameOver(): void {
    console.log('Game Over!');
    // Spelet visar redan game over-skärm via renderer
    // Användaren kan klicka för att starta om
}

/**
 * Initialiserar spelet
 */
async function initializeGame(): Promise<void> {
    console.log('Initialiserar Within the Woodpile...');
    
    try {
        // Initiera språksystemet
        i18n = new I18n();
        await i18n.initialize();
        
        // Hämta canvas-element
        const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
        if (!canvas) {
            throw new Error('Kunde inte hitta canvas-element');
        }
        
        // Skapa spelobjekt
        game = new Game(canvas, i18n, DEFAULT_CONFIG);
        
        // Sätt upp callbacks för UI-uppdateringar
        game.onScore((score) => updateGameStats(score, undefined));
        game.onHealth((health) => updateGameStats(undefined, health));
        game.onGameEnd(handleGameOver);
        
        // Initiera UI
        updateGameStats(0, 100);
        
    } catch (error) {
        console.error('Fel vid initialisering av spelet:', error);
        
        // Visa felmeddelande på sidan
        const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.fillStyle = '#FF0000';
                ctx.font = '24px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(
                    'Fel vid laddning av spelet', 
                    canvas.width / 2, 
                    canvas.height / 2
                );
                ctx.fillText(
                    'Se konsolen för mer information', 
                    canvas.width / 2, 
                    canvas.height / 2 + 30
                );
            }
        }
    }
}

/**
 * Rensar resurser
 */
function cleanup(): void {
    if (game) {
        game.destroy();
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', initializeGame);
window.addEventListener('beforeunload', cleanup);

// Exponera globala funktioner för debugging
(window as any).debugGame = {
    togglePause: () => game?.togglePause(),
    getGameState: () => game?.getGameState(),
    changeLanguage: (lang: string) => i18n?.loadLanguage(lang).then(() => i18n?.updateUI()),
};
