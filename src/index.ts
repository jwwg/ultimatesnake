import { SnakeGame } from '../SnakeGame';
import { initializeHelpDialog } from './helpDialog.js';

// Initialize the game
const game = new SnakeGame();

// Initialize help dialog
initializeHelpDialog();

// All dialog functionality
document.addEventListener('DOMContentLoaded', () => {
    // Settings dialog elements
    const settingsIcon = document.getElementById('settingsIcon');
    const settingsDialog = document.getElementById('settingsDialog');
    const closeDialog = document.getElementById('closeDialog');
    const resetHighScore = document.getElementById('resetHighScore');

    // Help dialog elements
    const helpIcon = document.getElementById('helpIcon');
    const helpDialog = document.getElementById('helpDialog');
    const closeHelpDialog = document.getElementById('closeHelpDialog');

    // Check if this is the first time playing
    const hasPlayedBefore = localStorage.getItem('hasPlayedBefore');
    if (!hasPlayedBefore) {
        helpDialog?.classList.add('show');
        localStorage.setItem('hasPlayedBefore', 'true');
    }

    // Settings dialog event listeners
    settingsIcon?.addEventListener('click', () => {
        settingsDialog?.classList.add('show');
    });

    closeDialog?.addEventListener('click', () => {
        settingsDialog?.classList.remove('show');
    });

    resetHighScore?.addEventListener('click', () => {
        // Reset in game state
        if (game && 'gameState' in game) {
            game.gameState.setHighScore(0);
        }
        // Update UI
        const highScoreElement = document.getElementById('highScore');
        if (highScoreElement) {
            highScoreElement.textContent = '0';
        }
        settingsDialog?.classList.remove('show');
    });

    // Help dialog event listeners
    helpIcon?.addEventListener('click', () => {
        // Pause the game if it's running
        if (game && 'gameState' in game && !game.gameState.isPausedState()) {
            game.gameState.togglePause();
            const pauseButton = document.getElementById('pauseButton');
            if (pauseButton) {
                pauseButton.textContent = 'Resume';
            }
        }
        helpDialog?.classList.add('show');
    });

    closeHelpDialog?.addEventListener('click', () => {
        helpDialog?.classList.remove('show');
    });

    // Close dialogs when clicking outside
    settingsDialog?.addEventListener('click', (e) => {
        if (e.target === settingsDialog) {
            settingsDialog.classList.remove('show');
        }
    });

    helpDialog?.addEventListener('click', (e) => {
        if (e.target === helpDialog) {
            helpDialog.classList.remove('show');
        }
    });
}); 