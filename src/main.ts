import { AppController } from './application/index.js';

/**
 * Main entry point för Within the Woodpile
 * Minimal bootstrap som delegerar allt till AppController
 */

// Global app controller instance
let appController: AppController;

/**
 * Initialiserar applikationen
 */
async function initializeApp(): Promise<void> {
    try {
        appController = new AppController();
        await appController.initialize();
    } catch (error) {
        console.error('Fatal error during app initialization:', error);
    }
}

/**
 * Cleanup vid window unload
 */
function cleanup(): void {
    appController?.cleanup();
}

// Event listeners
document.addEventListener('DOMContentLoaded', initializeApp);
window.addEventListener('beforeunload', cleanup);

// Exponera för debugging
(window as any).debugApp = {
    getI18n: () => appController?.getI18n(),
    getAudioManager: () => appController?.getAudioManager(),
    changeLanguage: (lang: string) => {
        const i18n = appController?.getI18n();
        i18n?.loadLanguage(lang).then(() => i18n?.updateUI());
    }
};
