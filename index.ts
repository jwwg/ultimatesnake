import { SnakeGame } from './SnakeGame.js';

// Initialize the game
const game = new SnakeGame();

// Settings dialog functionality
document.addEventListener('DOMContentLoaded', () => {
    const settingsIcon = document.getElementById('settingsIcon');
    const settingsDialog = document.getElementById('settingsDialog');
    const closeDialog = document.getElementById('closeDialog');
    const resetHighScore = document.getElementById('resetHighScore');

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

    // Close dialog when clicking outside
    settingsDialog?.addEventListener('click', (e) => {
        if (e.target === settingsDialog) {
            settingsDialog.classList.remove('show');
        }
    });
}); 