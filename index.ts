import { SnakeGame } from './SnakeGame.js';
import { initializeHelpDialog } from './src/helpDialog.js';
import { achievementManager } from './achievements.js';
import { initializeAchievementsDialog } from './src/achievementsDialog.js';

// Initialize the game
const game = new SnakeGame();

// Initialize dialogs
document.addEventListener('DOMContentLoaded', () => {
    initializeHelpDialog();
    initializeAchievementsDialog();
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
        // Clear all achievements
        achievementManager.clearAllAchievements();
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
                                                                                                                                                                       const playPauseIcon = document.getElementById('playPauseIcon') as HTMLElement;
               if (playPauseIcon) {
                   playPauseIcon.textContent = 'PAUSE';
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

let touchStartX = 0;
let touchStartY = 0;

document.addEventListener('touchstart', function (e) {
    if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }
});

document.addEventListener('touchend', function (e) {
    if (e.changedTouches.length === 1) {
        const dx = e.changedTouches[0].clientX - touchStartX;
        const dy = e.changedTouches[0].clientY - touchStartY;
        if (Math.abs(dx) > Math.abs(dy)) {
            if (dx > 30) {
                game.turn('right');
            } else if (dx < -30) {
                game.turn('left');
            }
        } else {
            if (dy > 30) {
                game.turn('down');
            } else if (dy < -30) {
                game.turn('up');
            }
        }
    }
}); 