import { AchievementManager, Achievement } from '../achievements.js';

export class AchievementsUI {
    private achievementManager: AchievementManager;
    private achievementsDialog: HTMLElement;
    private achievementsContent: HTMLElement;
    private achievementsIcon: HTMLElement;
    private closeButton: HTMLElement;

    constructor(achievementManager: AchievementManager) {
        this.achievementManager = achievementManager;
        this.achievementsDialog = document.getElementById('achievementsDialog')!;
        this.achievementsContent = this.achievementsDialog.querySelector('.achievements-content')!;
        this.achievementsIcon = document.getElementById('achievementsIcon')!;
        this.closeButton = document.getElementById('closeAchievementsDialog')!;

        this.setupEventListeners();
        this.updateAchievementsDisplay();
    }

    private setupEventListeners(): void {
        this.achievementsIcon.addEventListener('click', () => {
            this.achievementsDialog.classList.add('show');
            this.updateAchievementsDisplay();
        });

        this.closeButton.addEventListener('click', () => {
            this.achievementsDialog.classList.remove('show');
        });
    }

    private updateAchievementsDisplay(): void {
        const achievements = this.achievementManager.getAllAchievements();
        this.achievementsContent.innerHTML = achievements.map(achievement => this.createAchievementElement(achievement)).join('');
    }

    private createAchievementElement(achievement: Achievement): string {
        const unlocked = achievement.unlockedAt ? 'unlocked' : '';
        const date = achievement.unlockedAt 
            ? new Date(achievement.unlockedAt).toLocaleDateString() 
            : 'Not achieved';

        return `
            <div class="achievement-item ${unlocked}">
                <div class="achievement-header">
                    <i class="fas fa-trophy"></i>
                    <h3>${achievement.title}</h3>
                    <span class="achievement-date">${date}</span>
                </div>
                <p>${achievement.description}</p>
            </div>
        `;
    }

    public showAchievementNotification(achievement: Achievement): void {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <i class="fas fa-trophy"></i>
            <div>
                <h4>Achievement Unlocked!</h4>
                <p>${achievement.title}</p>
            </div>
        `;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    public checkNewAchievements(): void {
        const newlyUnlocked = this.achievementManager.getNewlyUnlocked();
        newlyUnlocked.forEach(achievement => {
            this.showAchievementNotification(achievement);
        });
    }
} 