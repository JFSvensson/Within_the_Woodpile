import { I18n } from './i18n.js';

let score = 0;
let health = 100;
let i18n: I18n;

/**
 * Uppdaterar poäng och hälsa på skärmen
 */
function updateGameStats(): void {
    const scoreElement = document.getElementById('score');
    const healthElement = document.getElementById('health');
    
    if (scoreElement) scoreElement.textContent = score.toString();
    if (healthElement) healthElement.textContent = health.toString();
}

/**
 * Initialiserar spelet
 */
async function initializeGame(): Promise<void> {
    console.log('Initialiserar Within the Woodpile...');
    
    // Initiera språksystemet
    i18n = new I18n();
    await i18n.initialize();
    
    // Uppdatera spelstatistik
    updateGameStats();
    
    // Hämta canvas för framtida spellogik
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
            // Rita en enkel placeholder
            ctx.fillStyle = '#8b4513';
            ctx.fillRect(50, 50, 100, 60);
            ctx.fillStyle = '#f4f4f4';
            ctx.font = '16px Arial';
            ctx.fillText('Ved kommer här...', 60, 85);
        }
    }
    
    console.log('Spel initialiserat!');
}

// Starta spelet när sidan laddats
document.addEventListener('DOMContentLoaded', initializeGame);
