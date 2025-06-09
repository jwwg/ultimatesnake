import { achievementManager, ACHIEVEMENTS, COMPLETION_ACHIEVEMENT_ID } from '../achievements.js';

export function initializeAchievementsDialog(): void {
    const achievementsDialog = document.getElementById('achievementsDialog');
    const achievementsIcon = document.getElementById('achievementsIcon');
    const closeAchievementsDialog = document.getElementById('closeAchievementsDialog');
    const achievementsContent = document.querySelector('.achievements-content');

    if (!achievementsDialog || !achievementsIcon || !closeAchievementsDialog || !achievementsContent) {
        console.error('Achievements dialog elements not found');
        return;
    }

    function updateAchievementsDisplay(): void {
        if (!achievementsContent) return;
        
        const allAchievements = achievementManager.getAllAchievements();
        achievementsContent.innerHTML = allAchievements.map(achievement => {
            const isUnlocked = !!achievement.unlockedAt;
            const isSpecial = achievement.isSpecial;
            return `
                <div class="achievement-item ${isUnlocked ? 'unlocked' : 'locked'} ${isSpecial ? 'special' : ''}">
                    <div class="achievement-header">
                        <i class="fas ${isSpecial ? 'fa-crown' : 'fa-trophy'}"></i>
                        <h3>${achievement.title}</h3>
                    </div>
                    <p>${achievement.description}</p>
                    ${isUnlocked ? 
                        `<div class="achievement-date">Unlocked: ${new Date(achievement.unlockedAt!).toLocaleDateString()}</div>` 
                        : ''}
                </div>
            `;
        }).join('');
    }

    // Initial population
    updateAchievementsDisplay();

    // Event listeners
    achievementsIcon.addEventListener('click', () => {
        updateAchievementsDisplay();
        achievementsDialog.classList.add('show');
    });

    closeAchievementsDialog.addEventListener('click', () => {
        achievementsDialog.classList.remove('show');
    });

    achievementsDialog.addEventListener('click', (e) => {
        if (e.target === achievementsDialog) {
            achievementsDialog.classList.remove('show');
        }
    });
} 