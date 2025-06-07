import { SnakeGame } from './SnakeGame.js';
import { initializeHelpDialog } from './src/helpDialog.js';

// Initialize the game
const game = new SnakeGame();

// Initialize help dialog
document.addEventListener('DOMContentLoaded', () => {
    initializeHelpDialog();
});

// All dialog functionality
const settingsDialog = document.getElementById('settingsDialog');
const settingsIcon = document.getElementById('settingsIcon');
const closeDialog = document.getElementById('closeDialog');
const resetGame = document.getElementById('resetGame');

if (settingsDialog && settingsIcon && closeDialog && resetGame) {
    settingsIcon.addEventListener('click', () => {
        settingsDialog.classList.add('show');
    });

    closeDialog.addEventListener('click', () => {
        settingsDialog.classList.remove('show');
    });

    resetGame.addEventListener('click', () => {
        if (game && 'gameState' in game) {
            game.gameState.setHighScore(0);
            const highScoreElement = document.getElementById('highScore');
            if (highScoreElement) {
                highScoreElement.textContent = '0';
            }
        }
        settingsDialog.classList.remove('show');
    });
}

// Help dialog elements
const helpIcon = document.getElementById('helpIcon');
const helpDialog = document.getElementById('helpDialog');
const closeHelpDialog = document.getElementById('closeHelpDialog');

console.log('Help Icon:', helpIcon);
console.log('Help Dialog:', helpDialog);

// Check if this is the first time playing
const hasPlayedBefore = localStorage.getItem('hasPlayedBefore');
if (!hasPlayedBefore) {
    console.log('First time playing, showing help dialog');
    helpDialog?.classList.add('show');
    localStorage.setItem('hasPlayedBefore', 'true');
}

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
    console.log('Close help dialog clicked');
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