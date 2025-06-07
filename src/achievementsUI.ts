import { AchievementManager, Achievement } from '../achievements.js';

// Add styles for achievement notifications
const style = document.createElement('style');
style.textContent = `
    .achievement-notification {
        position: fixed;
        right: 20px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 15px;
        border-radius: 5px;
        display: flex;
        align-items: center;
        gap: 10px;
        transform: translateX(120%);
        transition: transform 0.3s ease-in-out;
        z-index: 1000;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    }

    .achievement-notification.show {
        transform: translateX(0);
    }

    .achievement-notification i {
        color: gold;
        font-size: 24px;
    }

    .achievement-notification h4 {
        margin: 0;
        font-size: 16px;
    }

    .achievement-notification p {
        margin: 5px 0 0;
        font-size: 14px;
    }
`;
document.head.appendChild(style);

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
        
        // Get existing notifications to calculate position
        const existingNotifications = document.querySelectorAll('.achievement-notification');
        const notificationHeight = 80; // Approximate height of each notification
        const spacing = 10; // Space between notifications
        
        // Calculate vertical position based on number of existing notifications
        const topPosition = existingNotifications.length * (notificationHeight + spacing);
        notification.style.top = `${topPosition}px`;
        
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
                // Reposition remaining notifications
                const remainingNotifications = document.querySelectorAll('.achievement-notification');
                remainingNotifications.forEach((notif, index) => {
                    (notif as HTMLElement).style.top = `${index * (notificationHeight + spacing)}px`;
                });
            }, 300);
        }, 3000);
    }

    public checkNewAchievements(): void {
        const newlyUnlocked = this.achievementManager.getNewlyUnlocked();
        newlyUnlocked.forEach(achievement => {
            this.showAchievementNotification(achievement);
        });
        this.achievementManager.clearNewlyUnlocked();
    }
} 