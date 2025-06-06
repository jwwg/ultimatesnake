// Settings dialog functionality
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
    localStorage.removeItem('highScore');
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